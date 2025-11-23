import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        // Generate UUID for the file
        const fileId = crypto.randomUUID();
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Create uploads directory if it doesn't exist
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
        try {
            await mkdir(uploadsDir, { recursive: true });
        } catch (err) {
            // Directory might already exist
        }

        // Get file extension
        const ext = file.name.split('.').pop() || 'jpg';
        const filename = `${fileId}.${ext}`;
        const filepath = path.join(uploadsDir, filename);

        // Write file to disk
        await writeFile(filepath, buffer);

        // Return the URL and file ID
        return NextResponse.json({
            id: fileId,
            url: `/uploads/${filename}`,
            filename: file.name,
            size: file.size,
            type: file.type
        });
    } catch (error: any) {
        console.error("Error uploading file:", error);
        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}
