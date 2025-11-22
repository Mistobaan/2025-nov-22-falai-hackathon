import { NextRequest, NextResponse } from 'next/server';
import { analyzeImageForDefects } from '@/lib/claude';

export async function POST(req: NextRequest) {
    try {
        const { image } = await req.json();

        if (!image) {
            return NextResponse.json({ error: "Image data is required" }, { status: 400 });
        }

        // In a real app, we might want to limit this or use a queue.
        // For now, we'll process directly.
        const result = await analyzeImageForDefects(image);

        return NextResponse.json(result);
    } catch (error: any) {
        console.error("Error analyzing defects:", error);
        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}
