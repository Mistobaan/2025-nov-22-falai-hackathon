import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Upload, X, AlertCircle, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/useToast"

interface UploadStepProps {
  objects: any[];
  setObjects: (objects: any[]) => void;
  onNext: () => void;
  analysisError: string | null;
  setAnalysisError: (error: string | null) => void;
  isAnalyzing: boolean;
  setIsAnalyzing: (analyzing: boolean) => void;
  blueprintId?: string;
}

export default function UploadStep({ 
  objects, 
  setObjects, 
  onNext,
  analysisError,
  setAnalysisError,
  isAnalyzing,
  setIsAnalyzing,
  blueprintId
}: UploadStepProps) {
  const [isUploading, setIsUploading] = useState(false);
  const { showError, showSuccess } = useToast();
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // Enforce single image limit
      if (objects.length > 0) {
        showError("Only one image is allowed per blueprint.");
        return;
      }

      const file = e.target.files[0];
      
      // Validate file type and size (client-side check)
      if (!file.type.startsWith('image/')) {
        showError("Please upload an image file (JPG, PNG, WEBP).");
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) {
        showError("File size exceeds 10MB limit.");
        return;
      }

      setIsUploading(true);

      try {
        // 1. Upload to storage via /api/upload
        const formData = new FormData();
        formData.append('file', file);

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });

        if (!uploadRes.ok) {
          const error = await uploadRes.json();
          throw new Error(error.error || "Upload failed");
        }

        const uploadData = await uploadRes.json();

        // 2. Create object representation
        const newObject = {
          id: uploadData.id,
          name: file.name,
          url: uploadData.url,
          file: file // Keep file reference for now if needed, but URL is preferred
        };

        // 3. Update Blueprint via API
        if (blueprintId) {
            const blueprintRes = await fetch(`/api/blueprints/${blueprintId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    objects: [newObject], // Overwrite with single object
                    status: 'draft' // Reset status to draft on new upload
                })
            });
            
            if (!blueprintRes.ok) {
                throw new Error("Failed to update blueprint");
            }
        }

        setObjects([newObject]);
        showSuccess("Image uploaded successfully");

      } catch (error: any) {
        console.error("Upload failed:", error);
        showError(error.message || "Failed to upload image");
      } finally {
        setIsUploading(false);
        // Reset file input
        e.target.value = '';
      }
    }
  };

  const removeObject = async (id: string) => {
    setObjects([]);
    // Also update blueprint to remove object
    if (blueprintId) {
        try {
            await fetch(`/api/blueprints/${blueprintId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    objects: [],
                    status: 'draft'
                })
            });
        } catch (e) {
            console.error("Failed to update blueprint", e);
        }
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">👋 Welcome to the Blueprint Builder.</h2>
        <p className="text-muted-foreground">
          To teach the AI about defects, we first need to show it what your objects look like when they are perfectly normal.
        </p>
        <p className="font-medium">Action: Upload 1 "Golden State" image representing the object.</p>
      </div>

      {objects.length === 0 ? (
        <div className="border-2 border-dashed rounded-lg p-12 text-center hover:bg-muted/50 transition-colors cursor-pointer relative">
          <input 
            type="file" 
            accept="image/jpeg,image/png,image/webp"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={handleFileChange}
            disabled={isUploading}
          />
          <div className="flex flex-col items-center gap-4">
            {isUploading ? (
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
            ) : (
                <div className="p-4 bg-primary/10 rounded-full">
                  <Upload className="h-8 w-8 text-primary" />
                </div>
            )}
            <div>
              <p className="font-semibold">{isUploading ? "Uploading..." : "Drag and drop image file here"}</p>
              <p className="text-sm text-muted-foreground">{!isUploading && "or click to browse files"}</p>
            </div>
            <p className="text-xs text-muted-foreground">(supports JPG, PNG, WEBP. Max 10MB)</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="font-semibold">Uploaded Object:</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 justify-center">
            {objects.map((obj) => (
              <Card key={obj.id} className="relative group overflow-hidden">
                <CardContent className="p-2">
                  <div className="aspect-square rounded-md overflow-hidden bg-muted mb-2">
                    <img src={obj.url} alt={obj.name} className="w-full h-full object-cover" />
                  </div>
                  <p className="text-sm truncate font-medium">{obj.name}</p>
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                    onClick={() => removeObject(obj.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end pt-4">
        <Button 
          onClick={onNext} 
          disabled={objects.length === 0 || isUploading} 
          size="lg"
        >
          Next: Define Categories
        </Button>
      </div>
    </div>
  )
}
