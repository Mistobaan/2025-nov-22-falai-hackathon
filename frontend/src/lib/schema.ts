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
