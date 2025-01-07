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

        // Calculate dimensions for the watermark area (bottom left corner)
        const watermarkWidth = Math.floor(metadata.width * 0.15); // 15% of width
        const watermarkHeight = Math.floor(metadata.height * 0.04); // 4% of height

        // Extract and blur just the logo area
        const watermarkArea = await sharp(buffer)
            .extract({
                left: 0,
                top: metadata.height - watermarkHeight,
                width: watermarkWidth,
                height: watermarkHeight
            })
            .blur(10) // Reduced blur for more subtle effect
            .toBuffer();

        // Composite the blurred logo area back onto the original image
        let processedImage = sharp(buffer)
            .composite([{
                input: watermarkArea,
                top: metadata.height - watermarkHeight,
                left: 0
            }]);

        let outputBuffer: Buffer;
        
        // Convert to the appropriate format with high quality
        switch (format) {
            case 'jpg':
                outputBuffer = await processedImage.jpeg({ 
                    quality: 100,
                    mozjpeg: true // Better compression
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
