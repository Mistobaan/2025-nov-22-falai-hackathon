import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

const DEFECT_LIST = [
    "Misaligned label or printing (text rotated, crooked, or off-center)",
    "Incorrect or missing caution text",
    "Smudged, faded, or incomplete printing",
    "Scratches or abrasions on the plastic casing",
    "Cracks in the battery housing",
    "Loose, bent, or misaligned metal contacts",
    "Contaminants on contacts (dust, oxidation, fingerprints)",
    "Poorly attached top cover or sealing seam",
    "Warped or deformed casing",
    "Incorrect contact plating or discoloration",
    "Foreign objects trapped in adhesive or seams",
    "Improper glue or resin overflow",
    "Internal swelling of the battery cell",
    "Loose internal components detected during assembly checks",
    "Incorrect polarity marking",
    "Wrong or mismatched connector layout",
    "Missing regulatory marks or icons",
    "Non-uniform thickness of casing or plastic panels",
    "Damage from heat during assembly (melt marks)",
    "Incorrect dimensions (too long, short, or thick)"
];

export async function analyzeImageForDefects(imageBase64: string) {
    // Remove data URL prefix if present
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    const prompt = `
    You are an expert in manufacturing quality control and defect detection. 
    Analyze this image of a manufactured product carefully.
    
    Your task:
    1. Identify what type of product/component this is (e.g., battery, circuit board, metal part, plastic component, etc.)
    2. Based on the product type, material, and manufacturing process, suggest the MOST RELEVANT defect categories that could occur
    3. Consider both visual defects (scratches, cracks, discoloration) and functional defects (misalignment, missing parts, dimensional issues)
    
    Common defect categories to consider (but feel free to suggest others):
    ${DEFECT_LIST.map(d => `- ${d}`).join('\n')}
    
    Return a JSON object with:
    {
      "productType": "Brief description of what the product is",
      "suggestions": [
        {
          "name": "Short defect category name (2-4 words, e.g., 'Surface Scratches', 'Label Misalignment')",
          "description": "Detailed description of this defect type and how it manifests",
          "confidence": "High" | "Medium" | "Low",
          "reasoning": "Brief explanation of why this defect is relevant to this product"
        }
      ]
    }
    
    Provide 5-10 most relevant defect categories, prioritized by likelihood and impact.
    Focus on defects that are:
    - Visually detectable in images
    - Common for this type of product
    - Important for quality control
    
    Only return valid JSON. No markdown, no additional text.
  `;

    const message = await anthropic.messages.create({
        model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        messages: [
            {
                role: 'user',
                content: [
                    {
                        type: 'image',
                        source: {
                            type: 'base64',
                            media_type: 'image/jpeg', // Assuming JPEG for simplicity, or detect from header
                            data: base64Data,
                        },
                    },
                    {
                        type: 'text',
                        text: prompt,
                    },
                ],
            },
        ],
    });

    // Extract JSON from the response
    const textBlock = message.content[0];
    if (textBlock.type !== 'text') {
        throw new Error("Unexpected response format from Claude");
    }

    try {
        // Simple heuristic to find JSON block if wrapped in markdown
        const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? jsonMatch[0] : textBlock.text;
        return JSON.parse(jsonStr);
    } catch (e) {
        console.error("Failed to parse Claude response:", textBlock.text);
        throw new Error("Failed to parse defect suggestions");
    }
}
