export const schema = {
    "type": "object",
    "properties": {
        "scene": {
            "type": "string",
            "description": "Overall scene setting or location"
        },
        "subjects": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "type": {
                        "type": "string",
                        "description": "Type of subject (e.g., desert nomad, blacksmith, DJ, falcon)"
                    },
                    "description": {
                        "type": "string",
                        "description": "Physical attributes, clothing, accessories"
                    },
                    "pose": {
                        "type": "string",
                        "description": "Action or stance"
                    },
                    "position": {
                        "type": "string",
                        "enum": ["foreground", "midground", "background"],
                        "description": "Depth placement in scene"
                    }
                },
                "required": ["type", "description", "pose", "position"]
            }
        },
        "style": {
            "type": "string",
            "description": "Artistic rendering style (e.g., digital painting, photorealistic, pixel art, noir sci-fi, lifestyle photo, wabi-sabi photo)"
        },
        "color_palette": {
            "type": "array",
            "items": { "type": "string" },
            "minItems": 3,
            "maxItems": 3,
            "description": "Exactly 3 main colors for the scene (e.g., ['navy', 'neon yellow', 'magenta'])"
        },
        "lighting": {
            "type": "string",
            "description": "Lighting condition and direction (e.g., fog-filtered sun, moonlight with star glints, dappled sunlight)"
        },
        "mood": {
            "type": "string",
            "description": "Emotional atmosphere (e.g., harsh and determined, playful and modern, peaceful and dreamy)"
        },
        "background": {
            "type": "string",
            "description": "Background environment details"
        },
        "composition": {
            "type": "string",
            "enum": [
                "rule of thirds",
                "circular arrangement",
                "framed by foreground",
                "minimalist negative space",
                "S-curve",
                "vanishing point center",
                "dynamic off-center",
                "leading leads",
                "golden spiral",
                "diagonal energy",
                "strong verticals",
                "triangular arrangement"
            ],
            "description": "Compositional technique"
        },
        "camera": {
            "type": "object",
            "properties": {
                "angle": {
                    "type": "string",
                    "enum": ["eye level", "low angle", "slightly low", "bird's-eye", "worm's-eye", "over-the-shoulder", "isometric"],
                    "description": "Camera perspective"
                },
                "distance": {
                    "type": "string",
                    "enum": ["close-up", "medium close-up", "medium shot", "medium wide", "wide shot", "extreme wide"],
                    "description": "Framing distance"
                },
                "focus": {
                    "type": "string",
                    "enum": ["deep focus", "macro focus", "selective focus", "sharp on subject", "soft background"],
                    "description": "Focus type"
                },
                "lens": {
                    "type": "string",
                    "enum": ["14mm", "24mm", "35mm", "50mm", "70mm", "85mm"],
                    "description": "Focal length (wide to telephoto)"
                },
                "f-number": {
                    "type": "string",
                    "description": "Aperture (e.g., f/2.8, the smaller the number the more blurry the background)"
                },
                "ISO": {
                    "type": "number",
                    "description": "Light sensitivity value (comfortable range between 100 & 6400, lower = less sensitivity)"
                }
            }
        },
        "effects": {
            "type": "array",
            "items": { "type": "string" },
            "description": "Post-processing effects (e.g., 'lens flare small', 'subtle film grain', 'soft bloom', 'god rays', 'chromatic aberration mild')"
        }
    },
    "required": ["scene", "subjects"]
};

// ============================================================================
// Blueprint Generation Types
// ============================================================================

/**
 * Status of a blueprint throughout its lifecycle
 */
export type BlueprintStatus =
    | 'draft'                    // Initial state, image uploaded
    | 'analyzing'                // Claude is analyzing the image
    | 'ready_for_generation'     // Defects selected, ready to generate
    | 'generating'               // Generating defect images
    | 'ready_for_review'         // Images generated, awaiting approval
    | 'completed';               // All images approved

/**
 * A defect definition with name and rationale
 */
export interface DefectDefinition {
    name: string;
    rationale: string;
    selected: boolean;           // Whether this defect is selected for generation
    isCustom?: boolean;          // True if user-added, false if Claude-suggested
}

/**
 * Status of a single image generation job
 */
export interface GenerationJob {
    defectName: string;
    status: 'pending' | 'generating' | 'completed' | 'failed';
    imageUrl?: string;           // URL to generated image (if completed)
    error?: string;              // Error message (if failed)
    prompt?: string;             // Prompt used for generation
    createdAt: string;
    completedAt?: string;
}

/**
 * Uploaded image metadata
 */
export interface UploadedImage {
    id: string;                  // UUID
    name: string;                // Original filename
    url: string;                 // URL to image (local or cloud)
    uploadedAt: string;
}

/**
 * Complete blueprint structure
 */
export interface Blueprint {
    id: string;                  // UUID
    status: BlueprintStatus;

    // Image
    image?: UploadedImage;       // Single image (enforced by UI)

    // Product info from Claude
    productType?: string;        // e.g., "phone battery", "ceramic tile"

    // Defects
    suggestedDefects: DefectDefinition[];  // From Claude analysis
    customDefects: DefectDefinition[];     // User-added

    // Generation jobs
    jobs: GenerationJob[];

    // Timestamps
    createdAt: string;
    updatedAt: string;
    analyzedAt?: string;         // When Claude analysis completed
    generationStartedAt?: string;
    generationCompletedAt?: string;
}

/**
 * Helper to get all selected defects (suggested + custom)
 */
export function getSelectedDefects(blueprint: Blueprint): DefectDefinition[] {
    return [
        ...blueprint.suggestedDefects.filter(d => d.selected),
        ...blueprint.customDefects.filter(d => d.selected)
    ];
}

/**
 * Helper to calculate overall progress
 */
export function getGenerationProgress(blueprint: Blueprint): { completed: number; total: number; percentage: number } {
    const total = blueprint.jobs.length;
    const completed = blueprint.jobs.filter(j => j.status === 'completed' || j.status === 'failed').length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { completed, total, percentage };
}

/**
 * Validate blueprint structure
 */
export function validateBlueprint(data: any): data is Blueprint {
    return (
        typeof data === 'object' &&
        typeof data.id === 'string' &&
        typeof data.status === 'string' &&
        Array.isArray(data.suggestedDefects) &&
        Array.isArray(data.customDefects) &&
        Array.isArray(data.jobs)
    );
}
