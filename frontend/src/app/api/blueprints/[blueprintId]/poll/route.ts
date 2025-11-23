import { NextRequest, NextResponse } from 'next/server';
import { loadBlueprint } from '@/lib/blueprintStorage';
import { getGenerationProgress } from '@/lib/schema';

/**
 * Poll endpoint for blueprint status
 * Returns current blueprint state with job statuses
 */
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

        // Calculate progress
        const progress = getGenerationProgress(blueprint);

        return NextResponse.json({
            status: blueprint.status,
            progress,
            jobs: blueprint.jobs,
            suggestedDefects: blueprint.suggestedDefects,
            customDefects: blueprint.customDefects,
            productType: blueprint.productType,
            analyzedAt: blueprint.analyzedAt,
            updatedAt: blueprint.updatedAt
        });
    } catch (error: any) {
        console.error("Error polling blueprint:", error);
        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}
