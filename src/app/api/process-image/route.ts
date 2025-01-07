import { NextResponse } from 'next/server';
import sharp from 'sharp';

export async function POST(request: Request) {
    try {
        const data = await request.arrayBuffer();
        const buffer = Buffer.from(data);
        const format = request.headers.get('x-image-format') || 'png';

        // Get image metadata
        const metadata = await sharp(buffer).metadata();
        
        if (!metadata.height || !metadata.width) {
            throw new Error('Could not get image dimensions');
        }

        // Create a semi-transparent white rectangle for the watermark area
        const watermarkWidth = Math.floor(metadata.width * 0.15); // 15% of width
        const watermarkHeight = Math.floor(metadata.height * 0.04); // 4% of height
        
        const overlay = await sharp({
            create: {
                width: watermarkWidth,
                height: watermarkHeight,
                channels: 4,
                background: { r: 255, g: 255, b: 255, alpha: 0.7 } // Semi-transparent white
            }
        }).toBuffer();

        // Composite the overlay onto the original image
        let processedImage = sharp(buffer)
            .composite([{
                input: overlay,
                top: metadata.height - watermarkHeight,
                left: 0,
                blend: 'over'
            }]);

        let outputBuffer: Buffer;
        
        // Convert to the appropriate format with high quality
        switch (format) {
            case 'jpg':
                outputBuffer = await processedImage.jpeg({ 
                    quality: 100,
                    mozjpeg: true
                }).toBuffer();
                break;
            case 'webp':
                outputBuffer = await processedImage.webp({ 
                    quality: 100,
                    lossless: true
                }).toBuffer();
                break;
            case 'gif':
                if (metadata.format === 'gif') {
                    outputBuffer = await processedImage.gif().toBuffer();
                } else {
                    outputBuffer = await processedImage.png().toBuffer();
                }
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
        return NextResponse.json(
            { error: 'Failed to process image' },
            { status: 500 }
        );
    }
}
