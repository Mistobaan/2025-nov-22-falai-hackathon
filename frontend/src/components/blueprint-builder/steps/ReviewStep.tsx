"use client"

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CheckCircle2, AlertCircle, RefreshCw, XCircle } from "lucide-react"

// Wait, I didn't check for Dialog. I'll implement a simple inline editor or overlay to avoid installing more deps if possible, 
// OR I'll just use a simple state-based overlay. The spec says "Side Panel", so I'll use a side sheet or just a conditional render.

interface ReviewStepProps {
  objects: any[];
  categories: string[];
  matrix: any;
  setMatrix: (matrix: any) => void;
  onBack: () => void;
  onNext: () => void;
}

export default function ReviewStep({ objects, categories, matrix, setMatrix, onBack, onNext }: ReviewStepProps) {
  const [selectedCell, setSelectedCell] = useState<{objId: string, cat: string} | null>(null);

  // Initialize matrix if empty
  React.useEffect(() => {
    if (Object.keys(matrix).length === 0) {
      const newMatrix: any = {};
      objects.forEach(obj => {
        newMatrix[obj.id] = {};
        categories.forEach(cat => {
          newMatrix[obj.id][cat] = {
            status: 'pending', // pending, approved, impossible, needs_work
            imageUrl: `https://placehold.co/150x150?text=${cat}+on+${obj.name.split('.')[0]}`, // Mock image
            notes: ''
          };
        });
      });
      setMatrix(newMatrix);
    }
  }, [objects, categories, matrix, setMatrix]);

  const handleCellClick = (objId: string, cat: string) => {
    setSelectedCell({ objId, cat });
  };

  const updateStatus = (status: string) => {
    if (!selectedCell) return;
    const { objId, cat } = selectedCell;
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
    if (status === 'approved' || status === 'impossible') {
        setSelectedCell(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'impossible': return <XCircle className="h-5 w-5 text-gray-400" />;
      case 'needs_work': return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      default: return <div className="h-5 w-5 rounded-full border-2 border-muted" />;
    }
  };

  const isComplete = () => {
    if (Object.keys(matrix).length === 0) return false;
    return objects.every(obj => 
      categories.every(cat => {
        const status = matrix[obj.id]?.[cat]?.status;
        return status === 'approved' || status === 'impossible';
      })
    );
  };

  const approvedCount = () => {
    let count = 0;
    let total = objects.length * categories.length;
    if (total === 0) return 0;
    
    objects.forEach(obj => {
      categories.forEach(cat => {
        const status = matrix[obj.id]?.[cat]?.status;
        if (status === 'approved' || status === 'impossible') count++;
      });
    });
    return count;
  };

  return (
    <div className="flex gap-6 h-[calc(100vh-250px)]">
      <div className="flex-1 flex flex-col gap-4 overflow-hidden">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Reviewing the Blueprint Draft</h2>
          <p className="text-muted-foreground">
            Action: Review the grid below. If an image accurately represents the defect, mark it as "Approved". If not, click it to regenerate or refine.
          </p>
          <div className="text-sm font-medium text-primary">
            Progress: {approvedCount()} of {objects.length * categories.length} combinations approved.
          </div>
        </div>

        <div className="border rounded-lg overflow-auto flex-1">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Object Baseline</TableHead>
                {categories.map(cat => (
                  <TableHead key={cat} className="min-w-[200px]">{cat}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {objects.map(obj => (
                <TableRow key={obj.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <img src={obj.url} alt={obj.name} className="w-10 h-10 rounded object-cover" />
                      {obj.name}
                    </div>
                  </TableCell>
                  {categories.map(cat => {
                    const cell = matrix[obj.id]?.[cat];
                    if (!cell) return <TableCell key={cat}>Loading...</TableCell>;
                    
                    return (
                      <TableCell 
                        key={cat} 
                        className={`cursor-pointer transition-colors hover:bg-muted/50 ${selectedCell?.objId === obj.id && selectedCell?.cat === cat ? 'bg-muted ring-2 ring-primary inset-0' : ''}`}
                        onClick={() => handleCellClick(obj.id, cat)}
                      >
                        <div className="space-y-2">
                          <div className={`aspect-video rounded-md overflow-hidden border ${cell.status === 'impossible' ? 'opacity-50 grayscale' : ''}`}>
                            {cell.status === 'impossible' ? (
                                <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground text-xs">N/A</div>
                            ) : (
                                <img src={cell.imageUrl} alt={`${cat} on ${obj.name}`} className="w-full h-full object-cover" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs font-medium">
                            {getStatusIcon(cell.status)}
                            <span className="capitalize">{cell.status.replace('_', ' ')}</span>
                          </div>
                        </div>
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={onBack}>Back</Button>
          <Button onClick={onNext} disabled={!isComplete()} size="lg">
            Finish: Finalize Blueprint
          </Button>
        </div>
      </div>

      {/* Side Panel */}
      {selectedCell && (
        <div className="w-[350px] border-l pl-6 flex flex-col gap-6 overflow-y-auto">
          <div>
            <h3 className="text-lg font-bold mb-1">Refining Cell</h3>
            <p className="text-sm text-muted-foreground">
              {objects.find(o => o.id === selectedCell.objId)?.name} / {selectedCell.cat}
            </p>
          </div>

          <div className="aspect-video rounded-lg overflow-hidden border bg-muted">
             <img 
                src={matrix[selectedCell.objId]?.[selectedCell.cat]?.imageUrl} 
                className="w-full h-full object-cover" 
                alt="Preview"
             />
          </div>

          <div className="space-y-4">
            <p className="text-sm">Does this image accurately represent a <strong>{selectedCell.cat}</strong> on this object?</p>
            
            <div className="space-y-2">
                <Button 
                    className="w-full justify-start" 
                    variant={matrix[selectedCell.objId]?.[selectedCell.cat]?.status === 'approved' ? 'default' : 'outline'}
                    onClick={() => updateStatus('approved')}
                >
                    <CheckCircle2 className="mr-2 h-4 w-4" /> Approved
                </Button>
                
                <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => updateStatus('needs_work')}
                >
                    <RefreshCw className="mr-2 h-4 w-4" /> Regenerate
                </Button>

                <Button 
                    className="w-full justify-start text-destructive hover:text-destructive" 
                    variant={matrix[selectedCell.objId]?.[selectedCell.cat]?.status === 'impossible' ? 'destructive' : 'outline'}
                    onClick={() => updateStatus('impossible')}
                >
                    <XCircle className="mr-2 h-4 w-4" /> Mark as Impossible
                </Button>
            </div>
          </div>
          
          <div className="mt-auto">
             <Button variant="ghost" className="w-full" onClick={() => setSelectedCell(null)}>Close Panel</Button>
          </div>
        </div>
      )}
    </div>
  )
}
