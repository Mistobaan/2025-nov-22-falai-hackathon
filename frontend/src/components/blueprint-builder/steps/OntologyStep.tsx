"use client"

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trash2, Plus, Sparkles, Loader2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/hooks/useToast"

interface OntologyStepProps {
  categories: string[];
  setCategories: (categories: string[]) => void;
  selectedDefects: string[];
  setSelectedDefects: (defects: string[]) => void;
  productType: string;
  setProductType: (type: string) => void;
  onBack: () => void;
  onNext: () => void;
  objects?: any[]; // Added objects prop to access uploaded images
}

export default function OntologyStep({ 
  categories, 
  setCategories, 
  selectedDefects,
  setSelectedDefects,
  productType,
  setProductType,
  onBack, 
  onNext, 
  objects = [],
  blueprintId
}: OntologyStepProps & { blueprintId?: string }) {
  const [newCategory, setNewCategory] = useState("");
  const [newRationale, setNewRationale] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState<string>('idle');
  const { showError, showSuccess } = useToast();

  // Poll for analysis results
  useEffect(() => {
    if (!blueprintId) return;

    let pollInterval: NodeJS.Timeout;
    let attempts = 0;
    const maxAttempts = 60; // 2 minutes (assuming 2s interval)

    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/blueprints/${blueprintId}/poll`);
        if (!res.ok) return;
        
        const data = await res.json();
        
        if (data.status === 'analyzing') {
          setLoadingSuggestions(true);
          setAnalysisStatus('analyzing');
        } else if (data.status === 'ready_for_generation' || data.suggestedDefects.length > 0) {
          setLoadingSuggestions(false);
          setAnalysisStatus('completed');
          
          if (data.suggestedDefects) {
            setSuggestions(data.suggestedDefects);
            // Update categories list if empty
            if (categories.length === 0) {
              setCategories(data.suggestedDefects.map((d: any) => d.name));
            }
          }
          
          if (data.productType) {
            setProductType(data.productType);
          }
          
          clearInterval(pollInterval);
        } else if (data.status === 'draft' && attempts > 5) {
            // If still draft after a few attempts, maybe analysis failed or wasn't triggered
            // But we rely on the backend to set status.
        }
        
        attempts++;
        if (attempts >= maxAttempts) {
            clearInterval(pollInterval);
            if (loadingSuggestions) {
                setLoadingSuggestions(false);
                showError("Analysis timed out. Please try adding categories manually.");
            }
        }
      } catch (error) {
        console.error("Polling error:", error);
      }
    };

    // Trigger analysis if needed (by updating the blueprint)
    const triggerAnalysis = async () => {
        if (objects.length > 0 && suggestions.length === 0 && !loadingSuggestions) {
            try {
                // Just touching the blueprint endpoint triggers the auto-analysis logic
                // if conditions are met (image present, no defects)
                await fetch(`/api/blueprints/${blueprintId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({}) // Empty update to trigger check
                });
            } catch (e) {
                console.error("Failed to trigger analysis", e);
            }
        }
    };

    triggerAnalysis();
    pollInterval = setInterval(checkStatus, 2000);

    return () => clearInterval(pollInterval);
  }, [blueprintId, objects]);

  const addCategory = async (name: string = newCategory, rationale: string = newRationale) => {
    if (name.trim() && !categories.includes(name.trim())) {
      const newCats = [...categories, name.trim()];
      setCategories(newCats);
      setNewCategory("");
      setNewRationale("");
      
      // If we have a blueprintId, we should update the custom defects there too
      if (blueprintId) {
          try {
              // We need to fetch current blueprint first to get existing custom defects
              // Or we can just append to the list we maintain locally if we trust it syncs
              // For now, let's just update the local state which will be used for generation
              // Ideally, we should sync custom defects to the backend here.
              
              // TODO: Sync custom defects to backend
          } catch (e) {
              console.error("Failed to save custom defect", e);
          }
      }
    }
  };

  const removeCategory = (index: number) => {
    setCategories(categories.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addCategory();
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">What can go wrong?</h2>
        <p className="text-muted-foreground">
          Now, list the abstract categories of defects that apply to these objects. Don't worry about what they look like yet, just name them.
        </p>
      </div>

      <div className="bg-card border rounded-lg p-6 space-y-6">
        
        {/* AI Suggestions Section */}
        <div className="bg-muted/30 p-4 rounded-lg border border-dashed">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-purple-500" />
            <h3 className="font-semibold text-sm">AI-Powered Defect Suggestions</h3>
            {loadingSuggestions && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
          </div>
          
          {loadingSuggestions ? (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Analyzing your product image with Claude AI...</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-pulse"></div>
                <span>Identifying product type</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-pulse delay-100"></div>
                <span>Analyzing potential defects</span>
              </div>
            </div>
          ) : suggestions.length > 0 ? (
            <div className="space-y-3">
              {productType && (
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-md p-2">
                  <p className="text-xs">
                    <span className="font-semibold text-purple-700 dark:text-purple-300">Detected Product:</span>{' '}
                    <span className="text-muted-foreground">{productType}</span>
                  </p>
                </div>
              )}
              
              <p className="text-xs text-muted-foreground">
                Click to add suggested defect categories (sorted by relevance):
              </p>
              
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {suggestions.map((s, i) => (
                  <div
                    key={i}
                    className={`group relative border rounded-lg p-3 transition-all ${
                      categories.includes(s.name)
                        ? 'bg-muted/50 border-muted cursor-default opacity-60'
                        : 'bg-background hover:bg-primary/5 hover:border-primary/50 cursor-pointer hover:shadow-sm'
                    }`}
                    onClick={() => !categories.includes(s.name) && addCategory(s.name, s.rationale)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {!categories.includes(s.name) && (
                            <Plus className="h-3 w-3 text-primary flex-shrink-0" />
                          )}
                          <span className="font-medium text-sm">{s.name}</span>
                        </div>
                        {s.rationale && (
                          <p className="text-[11px] text-muted-foreground/80 italic">
                            💡 {s.rationale}
                          </p>
                        )}
                      </div>
                      {categories.includes(s.name) && (
                        <span className="text-xs text-muted-foreground flex-shrink-0">✓ Added</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">No AI suggestions available. Upload an image in the previous step or add categories manually below.</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
             <Input 
                placeholder="Type defect name (e.g., 'Crack')" 
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1"
              />
          </div>
          <div className="flex gap-2">
              <Input 
                placeholder="Rationale (optional)" 
                value={newRationale}
                onChange={(e) => setNewRationale(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 text-sm"
              />
              <Button onClick={() => addCategory()} disabled={!newCategory.trim()}>
                <Plus className="h-4 w-4 mr-2" /> Add Category
              </Button>
          </div>
        </div>

        <div className="space-y-2">
          {categories.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground italic">
              No categories defined yet. Add one above.
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-sm">Defect Categories ({categories.length})</h3>
                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setSelectedDefects(categories)}
                    className="text-xs h-7"
                  >
                    Select All
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setSelectedDefects([])}
                    className="text-xs h-7"
                  >
                    Select None
                  </Button>
                </div>
              </div>
              
              {categories.map((cat, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-md border">
                  <div className="flex items-center gap-3 flex-1">
                    <input
                      type="checkbox"
                      id={`defect-${index}`}
                      checked={selectedDefects.includes(cat)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedDefects([...selectedDefects, cat]);
                        } else {
                          setSelectedDefects(selectedDefects.filter(d => d !== cat));
                        }
                      }}
                      className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <label htmlFor={`defect-${index}`} className="font-medium cursor-pointer flex-1">
                      {index + 1}. {cat}
                    </label>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => removeCategory(index)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              
              <div className="bg-purple-500/10 border border-purple-500/20 text-purple-700 dark:text-purple-300 p-3 rounded-md text-sm">
                <strong>Selected for generation:</strong> {selectedDefects.length} of {categories.length} defects
              </div>
            </>
          )}
        </div>

        <div className="bg-blue-500/10 text-blue-500 p-4 rounded-md text-sm">
          <strong>Tip:</strong> Try to keep categories distinct. A "scratch" is different from a "crack". Select the defects you want to generate images for.
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <Button 
          onClick={onNext} 
          disabled={categories.length === 0 || selectedDefects.length === 0} 
          size="lg"
        >
          Next: Generate {selectedDefects.length} Defect{selectedDefects.length !== 1 ? 's' : ''}
        </Button>
      </div>
    </div>
  )
}
