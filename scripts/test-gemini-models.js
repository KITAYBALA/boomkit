const { GoogleGenerativeAI } = require("@google/generative-ai");

async function testKey(apiKey, keyName) {
    console.log(`\n--- Testing Key: ${keyName} (${apiKey.substring(0, 10)}...) ---`);
    const genAI = new GoogleGenerativeAI(apiKey);
    const models = ["gemini-flash-latest", "gemini-2.0-flash", "gemini-2.0-flash-lite", "gemini-pro-latest", "gemini-1.5-flash"];

    for (const modelName of models) {
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("test");
            const response = await result.response;
            console.log(`  SUCCESS: [${keyName}] ${modelName}`);
            return true;
        } catch (e) {
            console.log(`  FAILED: [${keyName}] ${modelName} - ${e.message}`);
        }
    }
    return false;
}

async function runTests() {
    const key1 = "AIzaSyBJcKB1BFqEIlcL8VGJ-q6BKFvBLB8jXmc";
    const key2 = "AIzaSyCv9OwGnmGHPysSYqxw9H55rmmStGtR9Zw";
    const key3 = "AIzaSyAKbRCF1FOfIo7HY622NwIa-8PpCI2KAVc"; // New key

    await testKey(key1, "Key from generate-set");
    await testKey(key2, "Key from gemini.ts");
    await testKey(key3, "New Key provided by user");
}

runTests();
