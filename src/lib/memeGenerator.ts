import axios from 'axios';

const MEMEGEN_API = 'https://api.memegen.link';
const DELAY_BETWEEN_REQUESTS = 1000; // 1 second delay

export type ImageFormat = 'png' | 'jpg' | 'gif' | 'webp';

interface Template {
    id: string;
    name: string;
    lines: number;
    blank: string;
    example?: {
        text: string[];
        url: string;
    };
}

export async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function getTemplates(): Promise<Template[]> {
    const response = await axios.get(`${MEMEGEN_API}/templates`);
    return response.data;
}

async function processImage(imageBuffer: ArrayBuffer, format: ImageFormat): Promise<ArrayBuffer> {
    try {
        const response = await fetch('/api/process-image', {
            method: 'POST',
            body: imageBuffer,
            headers: {
                'x-image-format': format
            }
        });

        if (!response.ok) {
            throw new Error('Failed to process image');
        }

        return await response.arrayBuffer();
    } catch (error) {
        console.error('Error processing image:', error);
        return imageBuffer; // Return original image if processing fails
    }
}

export async function generateMeme(
    templateId: string,
    topText: string,
    bottomText: string,
    format: ImageFormat = 'png'
): Promise<ArrayBuffer> {
    // Create URL-safe text
    const safeTopText = encodeURIComponent(topText.replace(/ /g, '_'));
    const safeBottomText = encodeURIComponent(bottomText.replace(/ /g, '_'));
    
    // Request a 1080x1080 image for social media
    const url = `${MEMEGEN_API}/images/${templateId}/${safeTopText}/${safeBottomText}.${format}?width=1080&height=1080`;
    
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    
    // Process the image to remove watermark
    return processImage(response.data, format);
}

export async function generateMemeBatch(
    prompts: { top: string; bottom: string }[],
    format: ImageFormat,
    onProgress?: (current: number) => void
): Promise<ArrayBuffer[]> {
    const templates = await getTemplates();
    const memes: ArrayBuffer[] = [];
    
    // Use templates based on the number of prompts
    const shuffledTemplates = templates
        .sort(() => Math.random() - 0.5)
        .slice(0, prompts.length); // Remove the 15 limit
    
    for (let i = 0; i < prompts.length; i++) {
        const template = shuffledTemplates[i];
        const prompt = prompts[i];
        
        try {
            const memeData = await generateMeme(
                template.id,
                prompt.top,
                prompt.bottom,
                format
            );
            memes.push(memeData);
            
            // Update progress
            onProgress?.(i + 1);
            
            // Add delay to avoid overwhelming the API
            if (i < prompts.length - 1) { // Don't delay after the last item
                await sleep(DELAY_BETWEEN_REQUESTS);
            }
        } catch (error) {
            console.error(`Failed to generate meme with template ${template.id}:`, error);
        }
    }
    
    return memes;
}

// Example prompt suggestions for AI chatbots
export const CHATBOT_PROMPT_TEMPLATE = `
Please generate meme ideas, each with a top and bottom text. Format them as a JSON array like this:
[
    {
        "top": "When someone asks if I'm productive today",
        "bottom": "Define productive"
    },
    // ... add as many memes as you want
]

Make them diverse, funny, and relatable. Topics can include:
- Technology and programming
- Work life
- Social media
- Current trends
- Daily life situations
- Pop culture references

Each meme should be unique and have different energy/tone from the others.
`;
