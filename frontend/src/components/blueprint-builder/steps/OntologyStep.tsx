"use client"

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trash2, Plus, Sparkles, Loader2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface OntologyStepProps {
  categories: string[];
  setCategories: (categories: string[]) => void;
  onBack: () => void;
  onNext: () => void;
  objects?: any[]; // Added objects prop to access uploaded images
}

export default function OntologyStep({ categories, setCategories, onBack, onNext, objects = [] }: OntologyStepProps) {
  const [newCategory, setNewCategory] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (objects.length === 0 || suggestions.length > 0) return;

      setLoadingSuggestions(true);
      try {
        // Use the first image for analysis
        const imageToAnalyze = objects[0].url;
        
        // Since we are using object URLs (blobs) in the client, we need to convert to base64 to send to API
        // However, for this demo/hackathon context, if the user uploaded a file, we have the File object.
        // Let's read the file to base64.
        const file = objects[0].file;
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64String = reader.result as string;
          
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Analysis timed out")), 120000)
          );

          try {
            const res: any = await Promise.race([
              fetch('/api/analyze-defects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: base64String })
              }),
              timeoutPromise
            ]);
            
            if (res.ok) {
              const data = await res.json();
              if (data.suggestions) {
                setSuggestions(data.suggestions);
              }
            }
          } catch (err) {
             console.error("Analysis failed or timed out", err);
          }
        };
        reader.readAsDataURL(file);
        
      } catch (error) {
        console.error("Failed to fetch suggestions", error);
      } finally {
        setLoadingSuggestions(false);
      }
    };

    fetchSuggestions();
  }, [objects]); // Run once when objects are available

  const addCategory = (cat: string = newCategory) => {
    if (cat.trim() && !categories.includes(cat.trim())) {
      setCategories([...categories, cat.trim()]);
      setNewCategory("");
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
            <h3 className="font-semibold text-sm">AI Suggestions</h3>
            {loadingSuggestions && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
          </div>
          
          {loadingSuggestions ? (
            <p className="text-xs text-muted-foreground">Analyzing your object to suggest defects...</p>
          ) : suggestions.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground mb-2">Based on the uploaded image, we detected these potential defects:</p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => addCategory(s.name)}
                    disabled={categories.includes(s.name)}
                    className={`text-xs flex items-center gap-1 px-2 py-1 rounded-full border transition-colors ${
                      categories.includes(s.name) 
                        ? 'bg-muted text-muted-foreground cursor-default' 
                        : 'bg-background hover:bg-primary/10 hover:border-primary cursor-pointer'
                    }`}
                  >
                    <Plus className="h-3 w-3" />
                    {s.name}
                    <span className={`ml-1 w-1.5 h-1.5 rounded-full ${
                      s.confidence === 'High' ? 'bg-green-500' : 
                      s.confidence === 'Medium' ? 'bg-yellow-500' : 'bg-gray-300'
                    }`} />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">No specific suggestions found. Try adding some manually.</p>
          )}
        </div>

        <div className="flex gap-2">
          <Input 
            placeholder="Type defect name (e.g., 'Crack')" 
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <Button onClick={() => addCategory()} disabled={!newCategory.trim()}>
            <Plus className="h-4 w-4 mr-2" /> Add Category
          </Button>
        </div>

        <div className="space-y-2">
          {categories.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground italic">
              No categories defined yet. Add one above.
            </div>
          ) : (
            categories.map((cat, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-md border">
                <span className="font-medium">{index + 1}. {cat}</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => removeCategory(index)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>

        <div className="bg-blue-500/10 text-blue-500 p-4 rounded-md text-sm">
          <strong>Tip:</strong> Try to keep categories distinct. A "scratch" is different from a "crack".
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <Button onClick={onNext} disabled={categories.length === 0} size="lg">
          Next: Generate Examples
        </Button>
      </div>
    </div>
  )
}
