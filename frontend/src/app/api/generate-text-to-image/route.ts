import { NextRequest, NextResponse } from 'next/server';
import * as fal from "@fal-ai/serverless-client";
import { loadBlueprint, saveBlueprint } from '@/lib/blueprintStorage';
import { getStorageService } from '@/lib/storage';
import { GenerationJob } from '@/lib/schema';

// Configure fal client
fal.config({
    credentials: process.env.FAL_API_KEY
});

interface GenerationRequest {
    blueprintId: string;
    requests: {
        defectName: string;
        defectDescription?: string;
        baseImageUrl: string;
        productType?: string;
    }[];
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { blueprintId, requests } = body as GenerationRequest;

        if (!blueprintId) {
            return NextResponse.json({ error: "No blueprint ID provided" }, { status: 400 });
        }

        if (!requests || !Array.isArray(requests) || requests.length === 0) {
            return NextResponse.json({ error: "No generation requests provided" }, { status: 400 });
        }

        // Load blueprint
        const blueprint = await loadBlueprint(blueprintId);
        if (!blueprint) {
            return NextResponse.json({ error: "Blueprint not found" }, { status: 404 });
        }

        // Update blueprint status
        blueprint.status = 'generating';
        blueprint.generationStartedAt = new Date().toISOString();

        // Initialize jobs in blueprint
        blueprint.jobs = requests.map(req => ({
            defectName: req.defectName,
            status: 'pending',
            createdAt: new Date().toISOString()
        }));

        await saveBlueprint(blueprint);

        // Get storage service
        const storage = getStorageService();

        // Process all requests in parallel
        // Note: This is still blocking the HTTP request until all are done.
        // In a real production app, this should be offloaded to a background worker.
        const generationPromises = requests.map(async (request, index) => {
            const jobIndex = blueprint.jobs.findIndex(j => j.defectName === request.defectName);
            if (jobIndex === -1) return; // Should not happen

            try {
                // Update job status to generating
                blueprint.jobs[jobIndex].status = 'generating';
                // We don't save blueprint here to avoid race conditions on the file lock
                // In a DB this would be fine. For file-based, we'll save at the end.

                // Construct prompt
                const prompt = constructDefectPrompt(request.productType || "product", request.defectName, request.defectDescription);
                blueprint.jobs[jobIndex].prompt = prompt;

                console.log(`Generating defect: ${request.defectName}`);

                // Call fal.ai
                const result = await fal.subscribe("fal-ai/flux-pro/v1.1", {
                    input: {
                        prompt: prompt,
                        image_url: request.baseImageUrl,
                        image_size: "landscape_4_3",
                        num_inference_steps: 28,
                        guidance_scale: 3.5,
                        strength: 0.75,
                        enable_safety_checker: true
                    },
                    logs: true,
                }) as { data: any };

                const imageUrl = result.data.images[0].url;

                // Download image from fal.ai and save to our storage
                // This ensures we have a permanent copy even if fal.ai link expires
                const imageRes = await fetch(imageUrl);
                const imageBlob = await imageRes.blob();
                const file = new File([imageBlob], `${blueprintId}-${request.defectName.replace(/\s+/g, '-')}.jpg`, { type: 'image/jpeg' });

                const uploadResult = await storage.uploadImage(file, file.name, file.type);

                // Update job success
                blueprint.jobs[jobIndex].status = 'completed';
                blueprint.jobs[jobIndex].imageUrl = uploadResult.url;
                blueprint.jobs[jobIndex].completedAt = new Date().toISOString();

            } catch (error: any) {
                console.error(`Error generating image for ${request.defectName}:`, error);

                // Update job failure
                blueprint.jobs[jobIndex].status = 'failed';
                blueprint.jobs[jobIndex].error = error.message || 'Generation failed';
                blueprint.jobs[jobIndex].completedAt = new Date().toISOString();
            }
        });

        // Wait for all jobs to complete
        await Promise.all(generationPromises);

        // Update final blueprint status
        blueprint.status = 'ready_for_review';
        blueprint.generationCompletedAt = new Date().toISOString();

        await saveBlueprint(blueprint);

        return NextResponse.json({
            success: true,
            blueprint
        });

    } catch (error: any) {
        console.error("Error in generate-text-to-image:", error);
        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}

function constructDefectPrompt(productType: string, defectName: string, defectDescription?: string): string {
    let prompt = `A high-quality product photograph of a ${productType} with a visible manufacturing defect: ${defectName}.`;

    if (defectDescription) {
        prompt += ` The defect appears as: ${defectDescription}.`;
    }

    prompt += ` The defect should be clearly visible but realistic. Maintain the original lighting, angle, and composition of the product. Professional product photography style, sharp focus, high detail.`;

    return prompt;
}
