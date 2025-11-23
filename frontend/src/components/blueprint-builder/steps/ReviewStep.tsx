"use client"

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle, RefreshCw, Edit2, Loader2 } from "lucide-react"
import DefectEditor from '../DefectEditor'
import { useToast } from "@/hooks/useToast"

interface ReviewStepProps {
  objects: any[];
  categories: string[];
  selectedDefects: string[];
  productType: string;
  matrix: any;
  setMatrix: (matrix: any) => void;
  onBack: () => void;
  onNext: () => void;
}

export default function ReviewStep({ 
  objects, 
  categories, 
  selectedDefects,
  productType,
  matrix, 
  setMatrix, 
  onBack, 
  onNext,
  blueprintId
}: ReviewStepProps & { blueprintId?: string }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState({ current: 0, total: 0 });
  const [editingCell, setEditingCell] = useState<{objId: string, cat: string} | null>(null);
  const { showError, showSuccess } = useToast();

  // Initialize matrix and trigger generation
  useEffect(() => {
    const initializeAndGenerate = async () => {
      if (!blueprintId) return;

      // Check if we need to initialize the matrix locally
      if (Object.keys(matrix).length === 0) {
        const newMatrix: any = {};
        objects.forEach(obj => {
          newMatrix[obj.id] = {};
          categories.forEach(cat => {
            newMatrix[obj.id][cat] = {
              status: selectedDefects.includes(cat) ? 'pending' : 'skipped',
              imageUrl: null,
              notes: ''
            };
          });
        });
        setMatrix(newMatrix);

        // Trigger generation if needed
        if (selectedDefects.length > 0) {
            // Check if generation already started/completed
            try {
                const res = await fetch(`/api/blueprints/${blueprintId}/poll`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.status === 'ready_for_generation' || data.status === 'draft') {
                        await triggerGeneration();
                    }
                }
            } catch (e) {
                console.error("Failed to check status", e);
            }
        }
      }
    };

    initializeAndGenerate();
  }, [blueprintId]);

  // Poll for updates
  useEffect(() => {
      if (!blueprintId) return;

      let pollInterval: NodeJS.Timeout;

      const checkStatus = async () => {
          try {
              const res = await fetch(`/api/blueprints/${blueprintId}/poll`);
              if (!res.ok) return;

              const data = await res.json();
              
              if (data.status === 'generating') {
                  setIsGenerating(true);
                  if (data.progress) {
                      setGenerationProgress({ 
                          current: data.progress.completed, 
                          total: data.progress.total 
                      });
                  }
              } else if (data.status === 'ready_for_review') {
                  setIsGenerating(false);
                  if (data.progress) {
                      setGenerationProgress({ 
                          current: data.progress.completed, 
                          total: data.progress.total 
                      });
                  }
              }

              // Update matrix from jobs
              if (data.jobs && Array.isArray(data.jobs)) {
                  setMatrix((prev: any) => {
                      const newMatrix = { ...prev };
                      data.jobs.forEach((job: any) => {
                          // Find which object/defect this job belongs to
                          // Currently we only support 1 object, so we use objects[0]
                          if (objects.length > 0) {
                              const objId = objects[0].id;
                              const defectName = job.defectName;
                              
                              if (!newMatrix[objId]) newMatrix[objId] = {};
                              
                              // Only update if changed to avoid flicker/loops if we were editing
                              // But here we just overwrite with server state
                              newMatrix[objId][defectName] = {
                                  status: job.status === 'completed' ? 'pending' : (job.status === 'failed' ? 'failed' : 'generating'),
                                  imageUrl: job.imageUrl,
                                  notes: job.error || ''
                              };
                          }
                      });
                      return newMatrix;
                  });
              }

          } catch (error) {
              console.error("Polling error:", error);
          }
      };

      pollInterval = setInterval(checkStatus, 2000);
      return () => clearInterval(pollInterval);
  }, [blueprintId, objects]);

  const triggerGeneration = async () => {
    if (!blueprintId) return;
    
    setIsGenerating(true);
    
    // Build generation requests for selected defects only
    const requests = [];
    for (const obj of objects) {
      for (const defect of selectedDefects) {
        requests.push({
          defectName: defect,
          baseImageUrl: obj.url,
          productType: productType
        });
      }
    }

    setGenerationProgress({ current: 0, total: requests.length });

    try {
      const response = await fetch('/api/generate-text-to-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            blueprintId,
            requests 
        })
      });

      if (!response.ok) {
        throw new Error('Generation failed to start');
      }
      
    } catch (error) {
      console.error('Generation error:', error);
      showError("Failed to start generation");
      setIsGenerating(false);
    }
  };

  const updateStatus = (objId: string, cat: string, status: string) => {
    setMatrix((prev: any) => ({
      ...prev,
      [objId]: {
        ...prev[objId],
        [cat]: {
          ...prev[objId][cat],
          status
        }
      }
    }));
  };

  const handleSaveEdited = (objId: string, cat: string, imageUrl: string) => {
    setMatrix((prev: any) => ({
      ...prev,
      [objId]: {
        ...prev[objId],
        [cat]: {
          ...prev[objId][cat],
          imageUrl,
          status: 'pending'
        }
      }
    }));
    setEditingCell(null);
    showSuccess("Image updated successfully");
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'failed': return <XCircle className="h-5 w-5 text-red-500" />;
      case 'generating': return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'skipped': return <div className="h-5 w-5 rounded-full bg-gray-300" />;
      default: return <div className="h-5 w-5 rounded-full border-2 border-muted" />;
    }
  };

  const isComplete = () => {
    if (Object.keys(matrix).length === 0) return false;
    return objects.every(obj => 
      selectedDefects.every(cat => {
        const status = matrix[obj.id]?.[cat]?.status;
        return status === 'approved' || status === 'impossible' || status === 'failed'; // Allow proceeding even if some failed
      })
    );
  };

  const approvedCount = () => {
    let count = 0;
    objects.forEach(obj => {
      selectedDefects.forEach(cat => {
        const status = matrix[obj.id]?.[cat]?.status;
        if (status === 'approved' || status === 'impossible') count++;
      });
    });
    return count;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-background border-b p-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold mb-2">Reviewing the Blueprint Draft</h2>
          <p className="text-muted-foreground mb-4">
            Review generated defect images. Click "Edit" to refine any image, or approve/reject them.
          </p>
          
          {isGenerating ? (
            <div className="bg-blue-500/10 border border-blue-500/50 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    Generating defect images... {generationProgress.current} of {generationProgress.total}
                  </p>
                </div>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: generationProgress.total > 0 ? `${(generationProgress.current / generationProgress.total) * 100}%` : '0%' }}
                ></div>
              </div>
            </div>
          ) : (
            <div className="text-sm font-medium text-primary">
              Progress: {approvedCount()} of {selectedDefects.length * objects.length} combinations approved.
            </div>
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid gap-6" style={{ gridTemplateColumns: `repeat(${selectedDefects.length + 1}, minmax(250px, 1fr))` }}>
            {/* Header Row */}
            <div className="font-semibold text-sm text-muted-foreground">Object</div>
            {selectedDefects.map(cat => (
              <div key={cat} className="font-semibold text-sm text-muted-foreground">
                {cat}
              </div>
            ))}

            {/* Data Rows */}
            {objects.map(obj => (
              <React.Fragment key={obj.id}>
                {/* Object Cell */}
                <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg">
                  <img src={obj.url} alt={obj.name} className="w-16 h-16 rounded object-cover" />
                  <span className="text-sm font-medium truncate">{obj.name}</span>
                </div>

                {/* Defect Cells */}
                {selectedDefects.map(cat => {
                  const cell = matrix[obj.id]?.[cat];
                  if (!cell) return <div key={cat} className="p-4 bg-muted/10 rounded-lg">Loading...</div>;
                  
                  return (
                    <div 
                      key={cat}
                      className="p-4 bg-card border rounded-lg hover:shadow-md transition-shadow"
                    >
                      {/* Image */}
                      <div className="aspect-video rounded-md overflow-hidden border mb-3 bg-muted">
                        {cell.status === 'generating' ? (
                          <div className="w-full h-full flex items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                          </div>
                        ) : cell.status === 'skipped' ? (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                            Not Selected
                          </div>
                        ) : cell.status === 'failed' ? (
                          <div className="w-full h-full flex flex-col items-center justify-center text-destructive text-xs p-2 text-center">
                            <XCircle className="h-6 w-6 mb-1" />
                            <span>Generation Failed</span>
                            <span className="text-[10px] opacity-70 mt-1">{cell.notes}</span>
                          </div>
                        ) : cell.imageUrl ? (
                          <img src={cell.imageUrl} alt={`${cat} on ${obj.name}`} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                            Pending
                          </div>
                        )}
                      </div>

                      {/* Status */}
                      <div className="flex items-center gap-2 mb-3 text-xs">
                        {getStatusIcon(cell.status)}
                        <span className="capitalize">{cell.status.replace('_', ' ')}</span>
                      </div>

                      {/* Actions */}
                      {cell.status !== 'skipped' && cell.status !== 'generating' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant={cell.status === 'approved' ? 'default' : 'outline'}
                            className="flex-1 text-xs"
                            onClick={() => updateStatus(obj.id, cat, 'approved')}
                          >
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 text-xs"
                            onClick={() => setEditingCell({ objId: obj.id, cat })}
                          >
                            <Edit2 className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-background border-t p-6">
        <div className="max-w-7xl mx-auto flex justify-between">
          <Button variant="outline" onClick={onBack}>Back</Button>
          <Button onClick={onNext} disabled={!isComplete() || isGenerating} size="lg">
            Finish: Finalize Blueprint
          </Button>
        </div>
      </div>

      {/* Defect Editor Modal */}
      {editingCell && (
        <DefectEditor
          defectCategory={editingCell.cat}
          objectName={objects.find(o => o.id === editingCell.objId)?.name || ''}
          productType={productType}
          baseImageUrl={objects.find(o => o.id === editingCell.objId)?.url || ''}
          currentImageUrl={matrix[editingCell.objId]?.[editingCell.cat]?.imageUrl}
          onSave={(imageUrl) => handleSaveEdited(editingCell.objId, editingCell.cat, imageUrl)}
          onCancel={() => setEditingCell(null)}
          blueprintId={blueprintId}
        />
      )}
    </div>
  )
}
