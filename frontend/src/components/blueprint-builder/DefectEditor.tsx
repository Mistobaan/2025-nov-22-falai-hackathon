"use client"

import React, { useState, useEffect, useRef } from 'react'
import SchemaForm from '../fal-generator/SchemaForm'
import { schema, DefectDefinition } from '@/lib/schema'
import { generateImage } from '@/lib/fal'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Loader2, AlertCircle, Save, CheckCircle2, Plus, Sparkles } from "lucide-react"
import { useToast } from "@/hooks/useToast"

interface DefectEditorProps {
  defectCategory: string;
  objectName: string;
  productType: string;
  baseImageUrl: string;
  currentImageUrl?: string;
  onSave: (imageUrl: string) => void;
  onCancel: () => void;
  blueprintId?: string;
}

export default function DefectEditor({
  defectCategory,
  objectName,
  productType,
  baseImageUrl,
  currentImageUrl,
  onSave,
  onCancel,
  blueprintId
}: DefectEditorProps) {
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(false)
  const [isPreloading, setIsPreloading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [generatedImages, setGeneratedImages] = useState<string[]>(currentImageUrl ? [currentImageUrl] : [])
  const [selectedImage, setSelectedImage] = useState<string | null>(currentImageUrl || null)
  const [activeDefect, setActiveDefect] = useState<string>(defectCategory || '')
  const [suggestedDefects, setSuggestedDefects] = useState<DefectDefinition[]>([])
  const [customDefects, setCustomDefects] = useState<DefectDefinition[]>([])
  const [newDefectName, setNewDefectName] = useState('')
  const [newDefectRationale, setNewDefectRationale] = useState('')
  const [isBlueprintLoading, setIsBlueprintLoading] = useState<boolean>(!!blueprintId)
  const [blueprintStatus, setBlueprintStatus] = useState<string>('pending')
  const [blueprintError, setBlueprintError] = useState<string | null>(null)
  const [savingCustom, setSavingCustom] = useState(false)
  const [isWaiting, setIsWaiting] = useState<boolean>(!!blueprintId)
  const { showError, showSuccess } = useToast()

  const hasPreloaded = useRef(false);
  const pollTimeout = useRef<NodeJS.Timeout | null>(null)

  // Initialize with defect-specific prompt
  useEffect(() => {
    const defectLabel = activeDefect || defectCategory
    if (!defectLabel) return

    const initialPrompt = `A high-quality product photograph of a ${productType || objectName} with a visible manufacturing defect: ${defectLabel}. The defect should be clearly visible but realistic. Maintain professional product photography style, sharp focus, high detail.`
    
    setFormData(prev => ({
      ...prev,
      scene: initialPrompt,
      style: prev.style || "photorealistic",
      color_palette: prev.color_palette || ["natural", "realistic", "neutral"],
      lighting: prev.lighting || "professional product lighting",
      camera: prev.camera || { angle: "eye level", distance: "medium shot" }
    }));
  }, [activeDefect, defectCategory, objectName, productType]);

  // Wait for blueprint API to finish populating defects before showing UI
  useEffect(() => {
    if (!blueprintId) {
      setIsBlueprintLoading(false);
      setIsWaiting(false);
      return;
    }

    let attempts = 0;
    const maxAttempts = 30; // ~60s with 2s interval

    const pollBlueprint = async () => {
      try {
        const res = await fetch(`/api/blueprints/${blueprintId}/poll`);
        attempts++;

        if (!res.ok) {
          throw new Error('Failed to fetch blueprint state');
        }

        const data = await res.json();
        setBlueprintStatus(data.status);

        const incomingSuggested = Array.isArray(data.suggestedDefects) ? data.suggestedDefects : [];
        const incomingCustom = Array.isArray(data.customDefects) ? data.customDefects : [];
        const hasDefects = incomingSuggested.length > 0 || incomingCustom.length > 0;

        if (hasDefects || attempts >= maxAttempts || data.status === 'ready_for_generation' || data.status === 'ready_for_review') {
          setSuggestedDefects(incomingSuggested);
          setCustomDefects(incomingCustom);
          setIsBlueprintLoading(false);
          setIsWaiting(false);

          if (!activeDefect) {
            const fallback = defectCategory || incomingSuggested[0]?.name || incomingCustom[0]?.name || '';
            setActiveDefect(fallback);
          }
          return;
        }
      } catch (err: any) {
        console.error("Blueprint poll failed", err);
        setBlueprintError(err.message || 'Blueprint fetch failed');
        setIsBlueprintLoading(false);
        setIsWaiting(false);
        return;
      }

      pollTimeout.current = setTimeout(pollBlueprint, 2000);
    };

    pollBlueprint();

    return () => {
      if (pollTimeout.current) {
        clearTimeout(pollTimeout.current);
      }
    };
  }, [blueprintId, defectCategory]);

  // Pre-load phase: Check for existing defects or generate new ones
  useEffect(() => {
    const checkAndGenerate = async () => {
      // Wait for formData to be initialized
      if (Object.keys(formData).length === 0) return;

      // Wait until blueprint has populated defects so we don't race UI render
      if (isWaiting) return;
      
      // Prevent double execution
      if (hasPreloaded.current) return;
      
      // If we already have images (e.g. from props), don't auto-generate
      if (generatedImages.length > 0) {
        hasPreloaded.current = true;
        return;
      }

      hasPreloaded.current = true;
      setIsPreloading(true);
      setLoading(true);

      try {
        // Mock check for Blueprint API / Claude API status
        // In a real implementation, this might call an endpoint
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Auto-trigger generation
        await handleGenerate(true);
      } catch (err) {
        console.error("Pre-load failed:", err);
        showError("Failed to initialize defect generation");
      } finally {
        setIsPreloading(false);
        setLoading(false);
      }
    };

    checkAndGenerate();
  }, [formData, generatedImages.length, isWaiting]); // Run when formData is ready and blueprint ready

  const handleGenerate = async (isAuto = false) => {
    setLoading(true)
    setError(null)
    
    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Operation timed out after 120 seconds")), 120000)
      );
      
      const res: any = await Promise.race([
        generateImage(formData),
        timeoutPromise
      ]);
      
      setResult(res)
      if (res?.images?.[0]?.url) {
        const newUrl = res.images[0].url;
        setGeneratedImages(prev => [newUrl, ...prev])
        // Auto-select the first generated image if it's an auto-generation or no selection exists
        if (isAuto || !selectedImage) {
          setSelectedImage(newUrl);
        }
      }
    } catch (err: any) {
      console.error(err)
      setError(err.message)
      if (isAuto) {
        showError("Failed to generate initial defects");
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSelectImage = (imageUrl: string) => {
    if (selectedImage === imageUrl) {
      setSelectedImage(null); // Deselect
    } else {
      setSelectedImage(imageUrl);
    }
  }

  const persistCustomDefects = async (nextCustom: DefectDefinition[]) => {
    if (!blueprintId) return;
    try {
      setSavingCustom(true);
      await fetch(`/api/blueprints/${blueprintId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customDefects: nextCustom })
      });
    } catch (err) {
      console.error("Failed to persist custom defects", err);
      showError("Could not save custom defect to blueprint");
    } finally {
      setSavingCustom(false);
    }
  }

  const handleAddCustomDefect = async () => {
    const trimmedName = newDefectName.trim();
    if (!trimmedName) {
      showError("Add a defect name before saving");
      return;
    }
    const exists = [...suggestedDefects, ...customDefects].some(
      (d) => d.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (exists) {
      showError("That defect already exists in the list");
      return;
    }

    const newDefect: DefectDefinition = {
      name: trimmedName,
      rationale: newDefectRationale.trim(),
      selected: true,
      isCustom: true,
    };
    const nextCustom = [newDefect, ...customDefects];
    setCustomDefects(nextCustom);
    setActiveDefect(trimmedName);
    setNewDefectName('');
    setNewDefectRationale('');
    await persistCustomDefects(nextCustom);
    showSuccess("Defect added and selected");
  };

  const handleSelectDefect = (name: string) => {
    setActiveDefect(name);
    setSuggestedDefects(prev => prev.map(d => d.name === name ? { ...d, selected: true } : d));
    setCustomDefects(prev => prev.map(d => d.name === name ? { ...d, selected: true } : d));
  };

  const handleConfirm = () => {
    if (selectedImage) {
      onSave(selectedImage);
    } else {
      // If nothing selected, maybe we want to allow saving "no image" or just close?
      // For now, let's assume we need an image, or we just close if they want to cancel
      onCancel();
    }
  }

  const renderLoading = () => (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
      <div className="bg-background border rounded-lg p-6 flex items-start gap-3 shadow-2xl">
        <Loader2 className="h-5 w-5 animate-spin text-primary mt-0.5" />
        <div>
          <p className="font-semibold">Waiting for blueprint</p>
          <p className="text-sm text-muted-foreground">Fetching suggested defects before loading the editor...</p>
          {blueprintStatus && (
            <p className="text-xs text-muted-foreground mt-1">Current status: {blueprintStatus}</p>
          )}
        </div>
      </div>
    </div>
  );

  const combinedDefects = [...suggestedDefects, ...customDefects];

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold">Refining Cell</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {objectName} / {activeDefect || defectCategory}
            </p>
          </div>
          <div className="flex gap-2">
             <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button onClick={handleConfirm} disabled={!selectedImage}>
              <Save className="h-4 w-4 mr-2" />
              Confirm Selection
            </Button>
          </div>
        </div>

        {isBlueprintLoading ? (
          renderLoading()
        ) : (
          <div className="flex-1 overflow-hidden p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
              {/* Left column: create and generate */}
              <Card className="flex flex-col h-full overflow-hidden">
                <CardHeader className="pb-3">
                  <CardTitle>Create or refine defects</CardTitle>
                  <CardDescription>Use blueprint suggestions as a base, then generate fresh variations.</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto space-y-4">
                  <div className="space-y-3 rounded-md border p-3 bg-muted/30">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Sparkles className="h-4 w-4 text-primary" />
                      Add a custom defect (auto-selected)
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      <Input
                        placeholder="Defect name (e.g., micro-scratch near port)"
                        value={newDefectName}
                        onChange={(e) => setNewDefectName(e.target.value)}
                      />
                      <textarea
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                        rows={2}
                        placeholder="Why it matters / where it appears (optional)"
                        value={newDefectRationale}
                        onChange={(e) => setNewDefectRationale(e.target.value)}
                      />
                      <Button
                        className="w-full"
                        onClick={handleAddCustomDefect}
                        disabled={savingCustom}
                      >
                        {savingCustom ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Saving to blueprint...
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4 mr-2" />
                            Add & Select
                          </>
                        )}
                      </Button>
                      {blueprintError && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>Blueprint error</AlertTitle>
                          <AlertDescription>{blueprintError}</AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </div>

                  <div className="rounded-md border p-3 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold">Active defect</span>
                      <span className="text-muted-foreground">{activeDefect || 'None selected'}</span>
                    </div>
                    <SchemaForm 
                      schema={schema} 
                      onChange={setFormData}
                      initialData={formData}
                    />
                    <Button 
                      className="w-full" 
                      onClick={() => handleGenerate(false)}
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {isPreloading ? "Initializing & Generating..." : "Generating..."}
                        </>
                      ) : (
                        "Generate Variation"
                      )}
                    </Button>
                    {error && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                  </div>

                  <div className="rounded-md border p-3">
                    <div className="flex items-center justify-between mb-3">
                      <p className="font-semibold">Generated variations</p>
                      {isPreloading && (
                        <span className="text-xs text-muted-foreground">Auto-generating...</span>
                      )}
                    </div>
                    {loading && !result && generatedImages.length === 0 ? (
                      <div className="flex items-center justify-center border-2 border-dashed rounded-lg text-muted-foreground h-56">
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="h-6 w-6 animate-spin" />
                          <p className="text-sm">{isPreloading ? "Generating initial defects..." : "Creating variation..."}</p>
                        </div>
                      </div>
                    ) : generatedImages.length > 0 ? (
                      <div className="grid grid-cols-2 gap-3">
                        {generatedImages.map((imageUrl, index) => (
                          <div 
                            key={index}
                            className={`relative group cursor-pointer border-2 rounded-lg overflow-hidden transition-all ${
                              selectedImage === imageUrl ? 'border-primary ring-2 ring-primary/30' : 'border-transparent hover:border-primary/50'
                            }`}
                            onClick={() => handleSelectImage(imageUrl)}
                          >
                            <img 
                              src={imageUrl} 
                              alt={`Variation ${index + 1}`}
                              className="w-full h-auto object-cover"
                            />
                            <div className={`absolute inset-0 transition-all flex items-center justify-center ${
                              selectedImage === imageUrl ? 'bg-black/20' : 'bg-black/0 group-hover:bg-black/40'
                            }`}>
                              {selectedImage === imageUrl && (
                                <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded flex items-center shadow-sm">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Selected
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center border-2 border-dashed rounded-lg text-muted-foreground h-56">
                        <p className="text-sm">Generate variations to see them here</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Right column: blueprint defects */}
              <Card className="flex flex-col h-full overflow-hidden">
                <CardHeader className="pb-3">
                  <CardTitle>Blueprint defects</CardTitle>
                  <CardDescription>
                    Loaded from the blueprint API. Click to select one to work on.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto space-y-4">
                  {combinedDefects.length === 0 ? (
                    <div className="border border-dashed rounded-lg p-6 text-center text-sm text-muted-foreground">
                      {blueprintError ? blueprintError : "No defects returned yet. Try running analysis again or add a custom defect."}
                    </div>
                  ) : (
                    <>
                      {suggestedDefects.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Proposed by blueprint API</p>
                          {suggestedDefects.map((defect) => {
                            const isSelected = activeDefect === defect.name;
                            return (
                              <div
                                key={defect.name}
                                className={`rounded-lg border p-3 flex items-start gap-3 justify-between hover:border-primary/50 transition-colors ${isSelected ? 'border-primary bg-primary/5' : ''}`}
                                onClick={() => handleSelectDefect(defect.name)}
                              >
                                <div className="space-y-1">
                                  <p className="font-semibold text-sm">{defect.name}</p>
                                  {defect.rationale && (
                                    <p className="text-xs text-muted-foreground">{defect.rationale}</p>
                                  )}
                                </div>
                                {isSelected && (
                                  <div className="text-xs text-primary font-semibold flex items-center gap-1">
                                    <CheckCircle2 className="h-4 w-4" />
                                    Selected
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}

                      {customDefects.length > 0 && (
                        <div className="space-y-2 pt-3 border-t">
                          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Custom defects</p>
                          {customDefects.map((defect) => {
                            const isSelected = activeDefect === defect.name;
                            return (
                              <div
                                key={defect.name}
                                className={`rounded-lg border p-3 flex items-start gap-3 justify-between hover:border-primary/50 transition-colors ${isSelected ? 'border-primary bg-primary/5' : ''}`}
                                onClick={() => handleSelectDefect(defect.name)}
                              >
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 border border-amber-500/30">Custom</span>
                                    <p className="font-semibold text-sm">{defect.name}</p>
                                  </div>
                                  {defect.rationale && (
                                    <p className="text-xs text-muted-foreground">{defect.rationale}</p>
                                  )}
                                </div>
                                {isSelected && (
                                  <div className="text-xs text-primary font-semibold flex items-center gap-1">
                                    <CheckCircle2 className="h-4 w-4" />
                                    Selected
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
