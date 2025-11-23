"use client"

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Upload, X, AlertCircle } from "lucide-react"

interface UploadStepProps {
  objects: any[];
  setObjects: (objects: any[]) => void;
  onNext: () => void;
  analysisError: string | null;
  setAnalysisError: (error: string | null) => void;
  isAnalyzing: boolean;
  setIsAnalyzing: (analyzing: boolean) => void;
}

export default function UploadStep({ 
  objects, 
  setObjects, 
  onNext,
  analysisError,
  setAnalysisError,
  isAnalyzing,
  setIsAnalyzing
}: UploadStepProps) {
  
  const analyzeImage = async (file: File) => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    
    try {
      const reader = new FileReader();
      
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      
      const base64String = await base64Promise;
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Analysis timed out after 120 seconds")), 120000)
      );
      
      const response: any = await Promise.race([
        fetch('/api/analyze-defects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64String })
        }),
        timeoutPromise
      ]);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `API request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      
      // Analysis succeeded
      setAnalysisError(null);
      
    } catch (error: any) {
      console.error("Claude analysis failed:", error);
      setAnalysisError(
        error.message || "Failed to analyze image with Claude AI. Please check your API key and try again."
      );
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).map(file => ({
        id: crypto.randomUUID(), // Use UUID instead of random string
        name: file.name,
        url: URL.createObjectURL(file),
        file: file
      }));
      setObjects([...objects, ...newFiles]);
      
      // Trigger Claude analysis on the first uploaded file
      if (newFiles.length > 0) {
        await analyzeImage(newFiles[0].file);
      }
    }
  };

  const removeObject = (id: string) => {
    setObjects(objects.filter(obj => obj.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">👋 Welcome to the Blueprint Builder.</h2>
        <p className="text-muted-foreground">
          To teach the AI about defects, we first need to show it what your objects look like when they are perfectly normal.
        </p>
        <p className="font-medium">Action: Upload 1 or more "Golden State" images representing different objects or viewpoints.</p>
      </div>

      <div className="border-2 border-dashed rounded-lg p-12 text-center hover:bg-muted/50 transition-colors cursor-pointer relative">
        <input 
          type="file" 
          multiple 
          accept="image/*"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={handleFileChange}
        />
        <div className="flex flex-col items-center gap-4">
          <div className="p-4 bg-primary/10 rounded-full">
            <Upload className="h-8 w-8 text-primary" />
          </div>
          <div>
            <p className="font-semibold">Drag and drop image files here</p>
            <p className="text-sm text-muted-foreground">or click to browse files</p>
          </div>
          <p className="text-xs text-muted-foreground">(supports JPG, PNG. Recommended high resolution)</p>
        </div>
      </div>

      {objects.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold">Uploaded Objects ({objects.length}):</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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

      {/* Retry Analysis Button */}
      {analysisError && objects.length > 0 && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => analyzeImage(objects[0].file)}
            disabled={isAnalyzing}
            className="border-destructive/50 text-destructive hover:bg-destructive/10"
          >
            <AlertCircle className="h-4 w-4 mr-2" />
            Retry AI Analysis
          </Button>
        </div>
      )}

      <div className="flex justify-end pt-4">
        <Button 
          onClick={onNext} 
          disabled={objects.length === 0 || isAnalyzing || analysisError !== null} 
          size="lg"
        >
          {isAnalyzing ? 'Analyzing...' : 'Next: Define Categories'}
        </Button>
      </div>
    </div>
  )
}
