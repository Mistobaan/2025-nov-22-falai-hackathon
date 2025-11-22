"use client"

import React, { useState } from 'react'
import SchemaForm from './SchemaForm'
import { schema } from '@/lib/schema'
import { generateImage } from '@/lib/fal'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, AlertCircle } from "lucide-react"

export default function FalGenerator() {
  const [formData, setFormData] = useState({})
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    setLoading(true)
    setError(null)
    setResult(null)
    
    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Operation timed out after 120 seconds")), 120000)
      );
      
      const res = await Promise.race([
        generateImage(formData),
        timeoutPromise
      ]);
      
      setResult(res)
    } catch (err: any) {
      console.error(err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <header className="flex justify-between items-center mb-8 border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Fal.ai Image Generator
          </h1>
          <p className="text-muted-foreground">Create stunning images with Flux Pro</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-200px)]">
        {/* Form Panel */}
        <Card className="flex flex-col h-full overflow-hidden">
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
            <CardDescription>Customize your image generation parameters</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto pr-2">
            <SchemaForm 
              schema={schema} 
              onChange={setFormData}
              initialData={{
                scene: "A futuristic city",
                subjects: [{ type: "robot", description: "shiny metal", pose: "standing", position: "foreground" }],
                style: "photorealistic",
                color_palette: ["cyan", "magenta", "black"],
                camera: { angle: "eye level", distance: "medium shot" }
              }}
            />
          </CardContent>
          <div className="p-6 border-t bg-background z-10">
            <Button 
              className="w-full text-lg py-6" 
              onClick={handleGenerate}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate Image"
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
            <CardTitle>Preview</CardTitle>
            <CardDescription>Generated results will appear here</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto flex flex-col gap-4">
            {result && result.images && result.images.length > 0 ? (
              <div className="space-y-4">
                <div className="relative rounded-lg overflow-hidden shadow-2xl">
                  <img 
                    src={result.images[0].url} 
                    alt="Generated" 
                    className="w-full h-auto object-cover"
                  />
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm font-mono">Seed: {result.seed}</p>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center border-2 border-dashed rounded-lg text-muted-foreground">
                {loading ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <p>Creating masterpiece...</p>
                  </div>
                ) : (
                  <p>Generated image will appear here</p>
                )}
              </div>
            )}
            
            <div className="mt-auto pt-4">
              <h3 className="text-sm font-semibold mb-2">Current Configuration</h3>
              <pre className="bg-black text-green-400 p-4 rounded-lg text-xs overflow-x-auto max-h-48">
                {JSON.stringify(formData, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
