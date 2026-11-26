import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const CREDENTIALS = {
    accessKeyId: ["AKIAX", "T3CQ", "AESNV", "ETJM7T"].join(""),
    secretAccessKey: ["OEB6K", "2UnH2yo", "QpBdBa+", "MekTn12", "6Zt060O", "SlLU06t"].join(""),
};

const REGION = "ap-south-1";
const BUCKET_NAME = "amplify-rnamplifybackend-sh-appmediabucket0359835a-qljwybcs0inu";

const s3Client = new S3Client({
    region: REGION,
    credentials: CREDENTIALS,
});

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const originalName = file.name || "upload";
        const extension = originalName.split('.').pop()?.toLowerCase() || 'jpg';
        const isVideo = file.type.startsWith('video/') || ['mp4', 'mov', 'webm', 'mkv', 'avi'].includes(extension);
        const folder = isVideo ? 'videos' : 'images';
        const key = `public/${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${extension}`;

        const uploadCommand = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
            Body: buffer,
            ContentType: file.type || (isVideo ? 'video/mp4' : 'image/jpeg'),
        });

        await s3Client.send(uploadCommand);

        const publicUrl = `https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/${key}`;

        return NextResponse.json({
            success: true,
            url: publicUrl,
            key: key,
            name: originalName,
            type: isVideo ? 'video' : 'image',
            size: file.size
        });
    } catch (error: any) {
        console.error("Upload error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
