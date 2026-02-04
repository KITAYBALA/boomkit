const { GoogleGenerativeAI } = require("@google/generative-ai");

async function listModels() {
    const apiKey = "AIzaSyBJcKB1BFqEIlcL8VGJ-q6BKFvBLB8jXmc";
    const genAI = new GoogleGenerativeAI(apiKey);

    try {
        // There isn't a direct listModels in the main export of the v1 SDK sometimes 
        // but we can try to hit the endpoint or just try common names.
        // Actually, let's just try to test a few common ones programmatically.
        const models = ["gemini-flash-latest", "gemini-2.0-flash", "gemini-2.0-flash-lite", "gemini-pro-latest", "gemini-2.5-flash"];

        for (const modelName of models) {
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent("test");
                console.log(`SUCCESS: ${modelName}`);
                process.exit(0);
            } catch (e) {
                console.log(`FAILED: ${modelName} - ${e.message}`);
            }
        }
    } catch (error) {
        console.error("General error:", error);
    }
}

listModels();
