import { NextRequest, NextResponse } from 'next/server';
import * as fal from "@fal-ai/serverless-client";

// Configure fal client
fal.config({
    credentials: process.env.FAL_API_KEY
});

interface GenerationRequest {
    baseImageUrl: string;
    defectCategory: string;
    defectDescription?: string;
    objectName: string;
    productType?: string;
}

interface GenerationJob {
    id: string;
    baseImageUrl: string;
    defectCategory: string;
    objectName: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    imageUrl?: string;
    error?: string;
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { requests } = body as { requests: GenerationRequest[] };

        if (!requests || !Array.isArray(requests) || requests.length === 0) {
            return NextResponse.json({ error: "No generation requests provided" }, { status: 400 });
        }

        // Process all requests in parallel
        const jobs: GenerationJob[] = requests.map(req => ({
            id: crypto.randomUUID(),
            baseImageUrl: req.baseImageUrl,
            defectCategory: req.defectCategory,
            objectName: req.objectName,
            status: 'pending' as const
        }));

        // Start all generation jobs
        const generationPromises = requests.map(async (request, index) => {
            const job = jobs[index];

            try {
                job.status = 'processing';

                // Construct prompt for defect generation
                const prompt = constructDefectPrompt(request);

                console.log(`Generating defect image for: ${request.objectName} - ${request.defectCategory}`);
                console.log(`Prompt: ${prompt}`);

                // Use fal.ai FLUX model with image-to-image
                const result = await fal.subscribe("fal-ai/flux-pro/v1.1", {
                    input: {
                        prompt: prompt,
                        image_url: request.baseImageUrl,
                        image_size: "landscape_4_3",
                        num_inference_steps: 28,
                        guidance_scale: 3.5,
                        strength: 0.75, // How much to transform the image
                        enable_safety_checker: true
                    },
                    logs: true,
                    onQueueUpdate: (update: any) => {
                        if (update.status === "IN_PROGRESS") {
                            console.log(`Job ${job.id}: ${update.status}`);
                        }
                    },
                }) as { data: any };

                job.status = 'completed';
                job.imageUrl = result.data.images[0].url;

                return job;
            } catch (error: any) {
                console.error(`Error generating image for job ${job.id}:`, error);
                job.status = 'failed';
                job.error = error.message || 'Generation failed';
                return job;
            }
        });

        // Wait for all jobs to complete
        const results = await Promise.all(generationPromises);

        return NextResponse.json({
            jobs: results,
            summary: {
                total: results.length,
                completed: results.filter(j => j.status === 'completed').length,
                failed: results.filter(j => j.status === 'failed').length
            }
        });
    } catch (error: any) {
        console.error("Error in generate-text-to-image:", error);
        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}

function constructDefectPrompt(request: GenerationRequest): string {
    const { defectCategory, defectDescription, objectName, productType } = request;

    let prompt = `A high-quality product photograph of a ${productType || objectName} with a visible manufacturing defect: ${defectCategory}.`;

    if (defectDescription) {
        prompt += ` The defect appears as: ${defectDescription}.`;
    }

    prompt += ` The defect should be clearly visible but realistic. Maintain the original lighting, angle, and composition of the product. Professional product photography style, sharp focus, high detail.`;

    return prompt;
}
