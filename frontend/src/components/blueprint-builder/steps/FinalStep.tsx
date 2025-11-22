"use client"

import React from 'react'
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, Share2 } from "lucide-react"

interface FinalStepProps {
  objects: any[];
  categories: string[];
  matrix: any;
}

export default function FinalStep({ objects, categories, matrix }: FinalStepProps) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">✅ Blueprint Successfully Created!</h2>
          <p className="text-muted-foreground">
            Below is the master reference grid for your objects. This blueprint will be used to train the anomaly detection models.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Share2 className="mr-2 h-4 w-4" /> Share Link
          </Button>
          <Button>
            <Download className="mr-2 h-4 w-4" /> Export PDF
          </Button>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden shadow-sm">
        <div className="bg-muted/50 p-4 border-b">
          <h3 className="font-bold text-sm tracking-wider text-muted-foreground">BLUEPRINT MATRIX V1.0</h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Object Reference</TableHead>
              {categories.map(cat => (
                <TableHead key={cat} className="min-w-[200px] uppercase">{cat}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {objects.map(obj => (
              <TableRow key={obj.id}>
                <TableCell className="font-medium bg-muted/10">
                  <div className="flex flex-col gap-2">
                    <img src={obj.url} alt={obj.name} className="w-24 h-24 rounded object-cover border" />
                    <span className="text-xs">{obj.name}</span>
                  </div>
                </TableCell>
                {categories.map(cat => {
                  const cell = matrix[obj.id]?.[cat];
                  if (!cell || cell.status === 'impossible') {
                    return (
                      <TableCell key={cat} className="bg-muted/5">
                        <div className="h-24 flex items-center justify-center text-muted-foreground text-xs italic border-2 border-dashed rounded">
                          N/A (Impossible)
                        </div>
                      </TableCell>
                    );
                  }
                  
                  return (
                    <TableCell key={cat}>
                      <div className="space-y-1">
                        <div className="h-24 rounded overflow-hidden border">
                          <img src={cell.imageUrl} alt={`${cat} on ${obj.name}`} className="w-full h-full object-cover" />
                        </div>
                        <div className="text-xs text-center font-medium text-muted-foreground">Final Image</div>
                      </div>
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
