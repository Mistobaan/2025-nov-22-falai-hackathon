import { NextRequest, NextResponse } from 'next/server';

// In-memory storage for blueprints (in production, use a database)
const blueprints = new Map<string, any>();

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ blueprintId: string }> }
) {
    try {
        const { blueprintId } = await params;

        const blueprint = blueprints.get(blueprintId);

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

        blueprints.set(blueprintId, {
            ...data,
            id: blueprintId,
            updatedAt: new Date().toISOString()
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Error updating blueprint:", error);
        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}
