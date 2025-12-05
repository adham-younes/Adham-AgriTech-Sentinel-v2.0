const { generateText } = require('../frontend/src/lib/ai/groq-client');
const { analyzeImage } = require('../frontend/src/lib/ai/gemini-client');

async function testHydra() {
    console.log('🧪 Testing Hydra System...');

    // 1. Test Groq Rotation
    console.log('\n🧠 Testing Groq (Logic Swarm)...');
    try {
        const text = await generateText('Hello, are you operational? Identify yourself.');
        console.log('✅ Groq Response:', text.substring(0, 100) + '...');
    } catch (e) {
        console.error('❌ Groq Failed:', e.message);
    }

    // 2. Test Gemini Vision
    console.log('\n👁️ Testing Gemini (Vision)...');
    try {
        // Use a sample image URL (e.g., a placeholder or a known public image)
        const sampleImage = 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Gfp-wisconsin-madison-the-nature-boardwalk.jpg/2560px-Gfp-wisconsin-madison-the-nature-boardwalk.jpg';
        const analysis = await analyzeImage(sampleImage, 'Describe this image in detail. Is it a farm?');
        console.log('✅ Gemini Analysis:', analysis.substring(0, 100) + '...');
    } catch (e) {
        console.error('❌ Gemini Failed:', e.message);
    }
}

// Mocking imports for the test script since it's running in Node directly and ts-node might not be set up for path aliases
// We might need to run this with ts-node or compile it. 
// For simplicity, let's just rely on the fact that we wrote the files and they compile.
// Actually, running TS files directly is better.
