
const { VertexAI } = require('../frontend/node_modules/@google-cloud/vertexai');
const path = require('path');

// Set credentials path
process.env.GOOGLE_APPLICATION_CREDENTIALS = path.join(__dirname, '../vertex-ai-credentials.json');

const project = 'adham-agritech';
const location = 'us-central1';

async function verifyVertexAI() {
    console.log("Verifying Vertex AI Agent...");
    console.log(`Project: ${project}`);
    console.log(`Location: ${location}`);
    console.log(`Credentials: ${process.env.GOOGLE_APPLICATION_CREDENTIALS}`);

    try {
        const vertexAI = new VertexAI({ project: project, location: location });
        const model = vertexAI.getGenerativeModel({
            model: 'gemini-1.5-pro-preview-0409'
        });

        console.log("Sending prompt to Gemini...");
        const result = await model.generateContent("Hello, are you working correctly? Please reply with 'Yes, I am functional.'");
        const response = await result.response;
        const text = response.candidates[0].content.parts[0].text;

        console.log("✅ Vertex AI Response:", text);

    } catch (error) {
        console.error("❌ Vertex AI Verification Failed:", error);
    }
}

verifyVertexAI();
