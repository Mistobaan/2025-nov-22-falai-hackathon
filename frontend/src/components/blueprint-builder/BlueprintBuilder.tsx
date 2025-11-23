"use client"

import React, { useState } from 'react'
import { Progress } from "@/components/ui/progress"
import UploadStep from './steps/UploadStep'
import OntologyStep from './steps/OntologyStep'
import ReviewStep from './steps/ReviewStep'
import FinalStep from './steps/FinalStep'

interface BlueprintBuilderProps {
  projectId?: string
  blueprintId?: string
}

export default function BlueprintBuilder({ projectId, blueprintId }: BlueprintBuilderProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [objects, setObjects] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedDefects, setSelectedDefects] = useState<string[]>([]); // Defects selected for generation
  const [productType, setProductType] = useState<string>(''); // Product type from Claude
  const [matrix, setMatrix] = useState<any>({});
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const nextStep = () => {
    // Don't allow progression if there's an analysis error
    if (analysisError && currentStep === 1) {
      return;
    }
    setCurrentStep(prev => Math.min(prev + 1, 4));
  };
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
        return (
          <UploadStep 
            objects={objects} 
            setObjects={setObjects} 
            onNext={nextStep}
            analysisError={analysisError}
            setAnalysisError={setAnalysisError}
            isAnalyzing={isAnalyzing}
            setIsAnalyzing={setIsAnalyzing}
          />
        );
      case 2:
        return (
          <OntologyStep 
            categories={categories} 
            setCategories={setCategories} 
            selectedDefects={selectedDefects}
            setSelectedDefects={setSelectedDefects}
            productType={productType}
            setProductType={setProductType}
            onBack={prevStep} 
            onNext={nextStep} 
            objects={objects} 
          />
        );
      case 3:
        return (
          <ReviewStep 
            objects={objects} 
            categories={categories}
            selectedDefects={selectedDefects}
            productType={productType}
            matrix={matrix} 
            setMatrix={setMatrix} 
            onBack={prevStep} 
            onNext={nextStep} 
          />
        );
      case 4:
        return <FinalStep objects={objects} categories={categories} matrix={matrix} />;
      default:
        return null;
    }
  };

  return (
    <>
      {currentStep === 3 ? (
        // Full-page layout for ReviewStep
        <div className="h-screen flex flex-col">
          {renderStep()}
        </div>
      ) : (
        // Container layout for other steps
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
            
            {/* Error Alert */}
            {analysisError && (
              <div className="bg-destructive/10 border border-destructive/50 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-destructive/20 flex items-center justify-center mt-0.5">
                    <span className="text-destructive text-sm font-bold">!</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-destructive mb-1">AI Analysis Failed</h3>
                    <p className="text-sm text-destructive/90">{analysisError}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Please check your API configuration and try uploading the image again.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Analyzing Status */}
            {isAnalyzing && (
              <div className="bg-blue-500/10 border border-blue-500/50 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                      Analyzing image with Claude AI...
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      This may take up to 2 minutes
                    </p>
                  </div>
                </div>
              </div>
            )}
          </header>

          <main className="flex-1 bg-background border rounded-xl shadow-sm p-8">
            {renderStep()}
          </main>
        </div>
      )}
    </>
  )
}
