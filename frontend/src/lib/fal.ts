import * as fal from "@fal-ai/serverless-client";

export async function generateImage(prompt: any) {
    const constructPrompt = (data: any) => {
        let parts: string[] = [];
        if (data.scene) parts.push(`Scene: ${data.scene}`);

        if (data.subjects && data.subjects.length > 0) {
            const subjects = data.subjects.map((s: any) => {
                return `${s.type} (${s.description}, ${s.pose}, ${s.position})`;
            }).join(" and ");
            parts.push(`Subjects: ${subjects}`);
        }

        if (data.style) parts.push(`Style: ${data.style}`);
        if (data.color_palette && data.color_palette.length > 0) parts.push(`Colors: ${data.color_palette.join(", ")}`);
        if (data.lighting) parts.push(`Lighting: ${data.lighting}`);
        if (data.mood) parts.push(`Mood: ${data.mood}`);
        if (data.background) parts.push(`Background: ${data.background}`);
        if (data.composition) parts.push(`Composition: ${data.composition}`);

        if (data.camera) {
            const cam = Object.entries(data.camera)
                .filter(([_, v]) => v)
                .map(([k, v]) => `${k}: ${v}`)
                .join(", ");
            if (cam) parts.push(`Camera: ${cam}`);
        }

        if (data.effects && data.effects.length > 0) parts.push(`Effects: ${data.effects.join(", ")}`);

        return parts.join(". ");
    };

    const fullPrompt = constructPrompt(prompt);
    console.log("Generated Prompt:", fullPrompt);

    const result = await fal.subscribe("fal-ai/flux-pro/v1.1", {
        input: {
            prompt: fullPrompt,
            image_size: "landscape_4_3",
            num_inference_steps: 28,
            guidance_scale: 3.5,
            enable_safety_checker: true
        },
        logs: true,
        onQueueUpdate: (update: any) => {
            if (update.status === "IN_PROGRESS") {
                update.logs.map((log: any) => log.message).forEach(console.log);
            }
        },
    }) as { data: any };

    return result.data;
}
