const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env.local
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = dotenv.parse(fs.readFileSync(envPath));
  for (const k in envConfig) {
    process.env[k] = envConfig[k];
  }
}

const apiKey = process.env.GOOGLE_GEMINI_API_KEY;

if (!apiKey) {
  console.error('Error: GOOGLE_GEMINI_API_KEY is not defined in .env.local');
  process.exit(1);
}

console.log('Using API Key ending in:', apiKey.substring(apiKey.length - 6));

async function run() {
  const genAI = new GoogleGenerativeAI(apiKey);
  const models = [
    'gemini-2.0-flash',
    'gemini-2.5-flash',
    'gemini-2.5-pro',
    'gemini-2.0-flash-lite',
    'gemini-2.5-flash-lite',
    'gemini-3.1-flash-lite',
    'gemini-3.5-flash'
  ];
  
  for (const modelName of models) {
    try {
      console.log(`\nAttempting with model: ${modelName}...`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent('Say hello and tell me what model you are.');
      const response = await result.response;
      console.log('Response Success!');
      console.log('Output:', response.text());
      return; // Stop on first success
    } catch (err) {
      console.error(`Model ${modelName} failed:`, err.message || err);
    }
  }
  console.error('\nAll models failed.');
}

run();
