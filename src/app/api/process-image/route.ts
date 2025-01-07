import { NextResponse } from 'next/server';
import sharp from 'sharp';

export async function POST(request: Request) {
    const format = request.headers.get('x-image-format') || 'png';
    
    try {
        const data = await request.arrayBuffer();
        const buffer = Buffer.from(data);

        // Get image metadata
        const metadata = await sharp(buffer).metadata();
        
        if (!metadata.height || !metadata.width) {
            throw new Error('Could not get image dimensions');
        }

        // Create a white rectangle to cover the watermark area
        const watermarkWidth = Math.floor(metadata.width * 0.15); // 15% of width
        const watermarkHeight = Math.floor(metadata.height * 0.04); // 4% of height
        
        const overlay = Buffer.from(`<svg>
            <rect 
                x="0" 
                y="0" 
                width="${watermarkWidth}" 
                height="${watermarkHeight}" 
                fill="white" 
                fill-opacity="0.7"
            />
        </svg>`);

        // Process the image
        let processedImage = sharp(buffer)
            .composite([{
                input: overlay,
                top: metadata.height - watermarkHeight,
                left: 0,
                blend: 'over'
            }]);

        // Ensure output format matches input
        let outputBuffer: Buffer;
        switch (format.toLowerCase()) {
            case 'jpg':
            case 'jpeg':
                outputBuffer = await processedImage.jpeg({ quality: 100 }).toBuffer();
                break;
            case 'webp':
                outputBuffer = await processedImage.webp({ quality: 100 }).toBuffer();
                break;
            case 'gif':
                outputBuffer = await processedImage.gif().toBuffer();
                break;
            default:
                outputBuffer = await processedImage.png().toBuffer();
        }

        return new NextResponse(outputBuffer, {
            headers: {
                'Content-Type': `image/${format}`,
                'Cache-Control': 'public, max-age=31536000',
            },
        });
    } catch (error) {
        console.error('Image processing error:', error);
        // If processing fails, return the original buffer
        const originalBuffer = Buffer.from(await request.arrayBuffer());
        return new NextResponse(originalBuffer, {
            headers: {
                'Content-Type': `image/${format}`,
                'Cache-Control': 'public, max-age=31536000',
            },
        });
    }
}
