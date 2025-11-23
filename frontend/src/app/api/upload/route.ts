import { NextRequest, NextResponse } from 'next/server';
import { getStorageService } from '@/lib/storage';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        // Get storage service
        const storage = getStorageService();

        // Validate file
        const validation = storage.validateFile(file, 10); // 10MB limit
        if (!validation.valid) {
            return NextResponse.json({ error: validation.error }, { status: 400 });
        }

        // Upload file
        const result = await storage.uploadImage(file, file.name, file.type);

        return NextResponse.json(result);
    } catch (error: any) {
        console.error("Error uploading file:", error);
        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}
