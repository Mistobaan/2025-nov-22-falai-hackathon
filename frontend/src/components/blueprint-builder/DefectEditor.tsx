"use client"

import React, { useState, useEffect } from 'react'
import SchemaForm from '../fal-generator/SchemaForm'
import { schema } from '@/lib/schema'
import { generateImage } from '@/lib/fal'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, AlertCircle, X, Save } from "lucide-react"

interface DefectEditorProps {
  defectCategory: string;
  objectName: string;
  productType: string;
  baseImageUrl: string;
  currentImageUrl?: string;
  onSave: (imageUrl: string) => void;
  onCancel: () => void;
}

export default function DefectEditor({
  defectCategory,
  objectName,
  productType,
  baseImageUrl,
  currentImageUrl,
  onSave,
  onCancel
}: DefectEditorProps) {
  const [formData, setFormData] = useState({})
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [generatedImages, setGeneratedImages] = useState<string[]>(currentImageUrl ? [currentImageUrl] : [])

  // Initialize with defect-specific prompt
  useEffect(() => {
    const initialPrompt = `A high-quality product photograph of a ${productType || objectName} with a visible manufacturing defect: ${defectCategory}. The defect should be clearly visible but realistic. Maintain professional product photography style, sharp focus, high detail.`;
    
    setFormData({
      scene: initialPrompt,
      style: "photorealistic",
      color_palette: ["natural", "realistic"],
      lighting: "professional product lighting",
      camera: { angle: "eye level", distance: "medium shot" }
    });
  }, [defectCategory, objectName, productType]);

  const handleGenerate = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Operation timed out after 120 seconds")), 120000)
      );
      
      const res = await Promise.race([
        generateImage(formData),
        timeoutPromise
      ]);
      
      setResult(res)
      if (res?.images?.[0]?.url) {
        setGeneratedImages(prev => [res.images[0].url, ...prev])
      }
    } catch (err: any) {
      console.error(err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveImage = (imageUrl: string) => {
    onSave(imageUrl);
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold">Refining Cell</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {objectName} / {defectCategory}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
          {/* Form Panel */}
          <Card className="flex flex-col h-full overflow-hidden">
            <CardHeader>
              <CardTitle>Generation Parameters</CardTitle>
              <CardDescription>Customize the defect appearance</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto pr-2">
              <SchemaForm 
                schema={schema} 
                onChange={setFormData}
                initialData={formData}
              />
            </CardContent>
            <div className="p-4 border-t bg-background">
              <Button 
                className="w-full" 
                onClick={handleGenerate}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate Variation"
                )}
              </Button>
              {error && (
                <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>
          </Card>

          {/* Preview Panel */}
          <Card className="flex flex-col h-full overflow-hidden">
            <CardHeader>
              <CardTitle>Generated Variations</CardTitle>
              <CardDescription>Click an image to select it</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
              {loading && !result ? (
                <div className="flex-1 flex items-center justify-center border-2 border-dashed rounded-lg text-muted-foreground h-64">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <p>Creating variation...</p>
                  </div>
                </div>
              ) : generatedImages.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  {generatedImages.map((imageUrl, index) => (
                    <div 
                      key={index}
                      className="relative group cursor-pointer border-2 border-transparent hover:border-primary rounded-lg overflow-hidden transition-all"
                      onClick={() => handleSaveImage(imageUrl)}
                    >
                      <img 
                        src={imageUrl} 
                        alt={`Variation ${index + 1}`}
                        className="w-full h-auto object-cover"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-center justify-center">
                        <Button 
                          variant="secondary"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Select This
                        </Button>
                      </div>
                      {index === 0 && currentImageUrl === imageUrl && (
                        <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                          Current
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center border-2 border-dashed rounded-lg text-muted-foreground h-64">
                  <p>Generate variations to see them here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
