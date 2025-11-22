"use client"

import React, { useState, useEffect } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Plus, X } from "lucide-react"

interface SchemaFormProps {
  schema: any;
  onChange: (data: any) => void;
  initialData?: any;
}

const SchemaForm: React.FC<SchemaFormProps> = ({ schema, onChange, initialData = {} }) => {
  const [formData, setFormData] = useState(initialData);

  useEffect(() => {
    onChange(formData);
  }, [formData, onChange]);

  const handleChange = (path: (string | number)[], value: any) => {
    setFormData((prev: any) => {
      const newData = { ...prev };
      let current = newData;
      for (let i = 0; i < path.length - 1; i++) {
        if (!current[path[i]]) current[path[i]] = {};
        current = current[path[i]];
      }
      current[path[path.length - 1]] = value;
      return newData;
    });
  };

  const extractOptions = (description?: string) => {
    if (!description) return [];
    const match = description.match(/\(e\.g\.,?\s*(.*?)\)/);
    if (match && match[1]) {
      return match[1].split(',').map(s => s.trim());
    }
    return [];
  };

  const handleOptionClick = (path: (string | number)[], currentVal: string, option: string) => {
    const newValue = currentVal ? `${currentVal}, ${option}` : option;
    handleChange(path, newValue);
  };

  const renderField = (key: string, fieldSchema: any, path: (string | number)[]) => {
    const value = path.reduce((obj, k) => (obj || {})[k], formData) || "";
    const fieldId = path.join("-");

    if (fieldSchema.type === 'string') {
      const options = extractOptions(fieldSchema.description);
      const isLongText = key === 'scene' || key === 'description' || key === 'background';

      if (fieldSchema.enum) {
        return (
          <div key={key} className="grid w-full items-center gap-1.5 mb-4">
            <Label htmlFor={fieldId}>{key}</Label>
            <Select 
              value={value} 
              onValueChange={(val) => handleChange(path, val)}
            >
              <SelectTrigger id={fieldId}>
                <SelectValue placeholder={`Select ${key}`} />
              </SelectTrigger>
              <SelectContent>
                {fieldSchema.enum.map((opt: string) => (
                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldSchema.description && <p className="text-xs text-muted-foreground">{fieldSchema.description}</p>}
          </div>
        );
      }

      return (
        <div key={key} className="grid w-full items-center gap-1.5 mb-4">
          <Label htmlFor={fieldId}>{key}</Label>
          {isLongText ? (
            <Textarea
              id={fieldId}
              value={value}
              onChange={(e) => handleChange(path, e.target.value)}
              placeholder={fieldSchema.description}
              className="min-h-[80px]"
            />
          ) : (
            <Input 
              type="text" 
              id={fieldId}
              value={value} 
              onChange={(e) => handleChange(path, e.target.value)} 
              placeholder={fieldSchema.description}
            />
          )}
          {fieldSchema.description && <p className="text-xs text-muted-foreground">{fieldSchema.description}</p>}
          {options.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {options.map((opt) => (
                <Badge 
                  key={opt} 
                  variant="secondary" 
                  className="cursor-pointer hover:bg-secondary/80"
                  onClick={() => handleOptionClick(path, value, opt)}
                >
                  + {opt}
                </Badge>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (fieldSchema.type === 'number') {
      return (
        <div key={key} className="grid w-full items-center gap-1.5 mb-4">
          <Label htmlFor={fieldId}>{key}</Label>
          <Input 
            type="number" 
            id={fieldId}
            value={value} 
            onChange={(e) => handleChange(path, Number(e.target.value))} 
          />
          {fieldSchema.description && <p className="text-xs text-muted-foreground">{fieldSchema.description}</p>}
        </div>
      );
    }

    if (fieldSchema.type === 'object') {
      return (
        <Accordion type="single" collapsible className="w-full mb-4" key={key}>
          <AccordionItem value={key}>
            <AccordionTrigger className="text-lg font-semibold">{key}</AccordionTrigger>
            <AccordionContent className="p-4 border rounded-md mt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(fieldSchema.properties).map(([subKey, subSchema]) => 
                  renderField(subKey, subSchema, [...path, subKey])
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      );
    }

    if (fieldSchema.type === 'array') {
      const items = path.reduce((obj, k) => (obj || {})[k], formData) || [];
      
      const addItem = () => {
        const newItem = fieldSchema.items.type === 'object' ? {} : "";
        if (fieldSchema.maxItems && items.length >= fieldSchema.maxItems) return;
        
        setFormData((prev: any) => {
          const newData = { ...prev };
          let current = newData;
          for (let i = 0; i < path.length - 1; i++) {
            if (!current[path[i]]) current[path[i]] = {};
            current = current[path[i]];
          }
          const arr = current[path[path.length - 1]] || [];
          current[path[path.length - 1]] = [...arr, newItem];
          return newData;
        });
      };

      const removeItem = (index: number) => {
        setFormData((prev: any) => {
          const newData = { ...prev };
          let current = newData;
          for (let i = 0; i < path.length - 1; i++) {
            current = current[path[i]];
          }
          const arr = current[path[path.length - 1]];
          current[path[path.length - 1]] = arr.filter((_: any, i: number) => i !== index);
          return newData;
        });
      };

      // Simplified UI for arrays of primitives
      if (fieldSchema.items.type !== 'object') {
        const options = extractOptions(fieldSchema.description);
        return (
          <div key={key} className="w-full mb-4 space-y-2">
             <div className="flex items-center justify-between">
                <Label>{key}</Label>
                <Button type="button" onClick={addItem} size="sm" variant="outline" className="h-8">
                  <Plus className="h-3 w-3 mr-1" /> Add
                </Button>
             </div>
             {fieldSchema.description && <p className="text-xs text-muted-foreground">{fieldSchema.description}</p>}
             
             <div className="space-y-2">
                {items.map((item: any, index: number) => (
                  <div key={index} className="flex gap-2">
                    <Input 
                      value={item} 
                      onChange={(e) => handleChange([...path, index], e.target.value)}
                      placeholder={`Item ${index + 1}`}
                    />
                    <Button 
                      type="button" 
                      onClick={() => removeItem(index)} 
                      variant="ghost" 
                      size="icon"
                      className="shrink-0 text-destructive hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {items.length === 0 && (
                  <div className="text-sm text-muted-foreground italic p-2 border border-dashed rounded">
                    No items added
                  </div>
                )}
             </div>
             {options.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {options.map((opt) => (
                    <Badge 
                      key={opt} 
                      variant="secondary" 
                      className="cursor-pointer hover:bg-secondary/80"
                      onClick={() => {
                         // For arrays, we probably want to add a new item with this value
                         // Check if we can add more items
                         if (fieldSchema.maxItems && items.length >= fieldSchema.maxItems) return;
                         
                         setFormData((prev: any) => {
                            const newData = { ...prev };
                            let current = newData;
                            for (let i = 0; i < path.length - 1; i++) {
                              if (!current[path[i]]) current[path[i]] = {};
                              current = current[path[i]];
                            }
                            const arr = current[path[path.length - 1]] || [];
                            current[path[path.length - 1]] = [...arr, opt];
                            return newData;
                          });
                      }}
                    >
                      + {opt}
                    </Badge>
                  ))}
                </div>
              )}
          </div>
        );
      }

      return (
        <Accordion type="single" collapsible className="w-full mb-4" key={key}>
          <AccordionItem value={key}>
            <AccordionTrigger className="text-lg font-semibold">
              <div className="flex items-center justify-between w-full pr-4">
                <span>{key} <span className="text-sm font-normal text-muted-foreground ml-2">{fieldSchema.description}</span></span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="p-4 border rounded-md mt-2">
               <div className="flex justify-end mb-4">
                  <Button type="button" onClick={addItem} size="sm" variant="outline" className="gap-2">
                    <Plus className="h-4 w-4" /> Add Item
                  </Button>
               </div>
              <div className="flex flex-col gap-4">
                {items.map((item: any, index: number) => (
                  <div key={index} className="relative p-4 border rounded-md bg-muted/20">
                    <Button 
                      type="button" 
                      onClick={() => removeItem(index)} 
                      variant="ghost" 
                      size="icon" 
                      className="absolute top-2 right-2 h-6 w-6 text-destructive hover:text-destructive z-10"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                      {Object.entries(fieldSchema.items.properties).map(([subKey, subSchema]) => 
                        renderField(subKey, subSchema, [...path, index, subKey])
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      );
    }
    return null;
  };

  return (
    <form className="w-full space-y-6" onSubmit={(e) => e.preventDefault()}>
      {Object.entries(schema.properties).map(([key, fieldSchema]) => 
        renderField(key, fieldSchema, [key])
      )}
    </form>
  );
};

export default SchemaForm;
