"use client"

import React, { useState } from 'react'
import { Progress } from "@/components/ui/progress"
import UploadStep from './steps/UploadStep'
import OntologyStep from './steps/OntologyStep'
import ReviewStep from './steps/ReviewStep'
import FinalStep from './steps/FinalStep'

export default function BlueprintBuilder() {
  const [currentStep, setCurrentStep] = useState(1);
  const [objects, setObjects] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [matrix, setMatrix] = useState<any>({});

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 4));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const getProgress = () => {
    switch (currentStep) {
      case 1: return 25;
      case 2: return 50;
      case 3: return 75;
      case 4: return 100;
      default: return 0;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <UploadStep objects={objects} setObjects={setObjects} onNext={nextStep} />;
      case 2:
        return <OntologyStep categories={categories} setCategories={setCategories} onBack={prevStep} onNext={nextStep} objects={objects} />;
      case 3:
        return <ReviewStep objects={objects} categories={categories} matrix={matrix} setMatrix={setMatrix} onBack={prevStep} onNext={nextStep} />;
      case 4:
        return <FinalStep objects={objects} categories={categories} matrix={matrix} />;
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl min-h-screen flex flex-col">
      <header className="mb-8 space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold text-muted-foreground">Create Defect Blueprint</h1>
          <div className="text-sm font-medium">Step {currentStep} of 4</div>
        </div>
        <Progress value={getProgress()} className="h-2" />
        <div className="flex justify-between text-xs text-muted-foreground px-1">
          <span className={currentStep >= 1 ? "text-primary font-medium" : ""}>Upload</span>
          <span className={currentStep >= 2 ? "text-primary font-medium" : ""}>Define Categories</span>
          <span className={currentStep >= 3 ? "text-primary font-medium" : ""}>Generate & Review</span>
          <span className={currentStep >= 4 ? "text-primary font-medium" : ""}>Final Blueprint</span>
        </div>
      </header>

      <main className="flex-1 bg-background border rounded-xl shadow-sm p-8">
        {renderStep()}
      </main>
    </div>
  )
}
