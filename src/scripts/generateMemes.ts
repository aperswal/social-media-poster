import { generateMemeBatch, CHATBOT_PROMPT_TEMPLATE } from '../lib/memeGenerator';

// Example meme prompts - in real usage, these would come from AI or user input
const examplePrompts = [
    {
        top: "When the code works",
        bottom: "But you don't know why"
    },
    {
        top: "One more coffee",
        bottom: "What could go wrong?"
    },
    {
        top: "Debugging for hours",
        bottom: "It was a typo"
    },
    // Add more prompts to make 15 total...
];

async function main() {
    console.log("Starting meme generation...");
    console.log("\nHere's the prompt template for AI chatbots:");
    console.log(CHATBOT_PROMPT_TEMPLATE);
    
    console.log("\nGenerating memes...");
    const outputPaths = await generateMemeBatch(examplePrompts);
    
    console.log("\nGenerated memes saved to:");
    outputPaths.forEach(path => console.log(path));
}

main().catch(console.error);
