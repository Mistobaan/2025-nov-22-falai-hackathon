import { NextRequest, NextResponse } from 'next/server';
import { loadBlueprint, saveBlueprint, createBlueprint, needsDefectAnalysis } from '@/lib/blueprintStorage';
import { analyzeImageForDefects } from '@/lib/claude';
import { Blueprint } from '@/lib/schema';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ blueprintId: string }> }
) {
    try {
        const { blueprintId } = await params;

        const blueprint = await loadBlueprint(blueprintId);

        if (!blueprint) {
            return NextResponse.json({ error: "Blueprint not found" }, { status: 404 });
        }

        return NextResponse.json(blueprint);
    } catch (error: any) {
        console.error("Error fetching blueprint:", error);
        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ blueprintId: string }> }
) {
    try {
        const { blueprintId } = await params;
        const data = await req.json();

        // Load existing blueprint or create new one
        let blueprint = await loadBlueprint(blueprintId);
        if (!blueprint) {
            blueprint = await createBlueprint(blueprintId);
        }

        // Update blueprint with provided data
        const updatedBlueprint: Blueprint = {
            ...blueprint,
            ...data,
            id: blueprintId, // Ensure ID doesn't change
            updatedAt: new Date().toISOString()
        };

        // Check if we need to trigger defect analysis
        if (needsDefectAnalysis(updatedBlueprint) && updatedBlueprint.image) {
            console.log(`Auto-triggering defect analysis for blueprint ${blueprintId}`);

            // Set status to analyzing
            updatedBlueprint.status = 'analyzing';
            await saveBlueprint(updatedBlueprint);

            try {
                // Trigger Claude analysis
                const result = await analyzeImageForDefects(updatedBlueprint.image.url);

                // Update blueprint with suggested defects
                updatedBlueprint.suggestedDefects = result.defects.map(d => ({
                    name: d.name,
                    rationale: d.rationale,
                    selected: false,
                    isCustom: false
                }));
                updatedBlueprint.productType = result.productType;
                updatedBlueprint.status = 'ready_for_generation';
                updatedBlueprint.analyzedAt = new Date().toISOString();

                await saveBlueprint(updatedBlueprint);

                return NextResponse.json({
                    success: true,
                    blueprint: updatedBlueprint,
                    analyzed: true
                });
            } catch (error: any) {
                console.error("defect analysis failed:", error);

                // Revert status on failure
                updatedBlueprint.status = 'draft';
                await saveBlueprint(updatedBlueprint);

                return NextResponse.json(
                    { error: `Analysis failed: ${error.message}` },
                    { status: 500 }
                );
            }
        } else {
            // Just save the updated blueprint
            await saveBlueprint(updatedBlueprint);
            return NextResponse.json({ success: true, blueprint: updatedBlueprint });
        }
    } catch (error: any) {
        console.error("Error updating blueprint:", error);
        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ blueprintId: string }> }
) {
    try {
        const { blueprintId } = await params;
        const { deleteBlueprint } = await import('@/lib/blueprintStorage');

        await deleteBlueprint(blueprintId);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Error deleting blueprint:", error);
        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}
