import { GoogleGenerativeAI } from "@google/generative-ai"
import { BOOMKIT_SYSTEM_INSTRUCTION } from "./boomkit-knowledge"

/**
 * Utility to handle Gemini AI generations
 */
export async function generateGeminiResponse(prompt: string): Promise<string> {
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY

    if (!apiKey) {
        console.error("[GEMINI] GOOGLE_GEMINI_API_KEY is not defined in environment variables.")
        return "I'm sorry, I cannot respond right now. (AI Service is not configured: Missing API Key)"
    }

    const genAI = new GoogleGenerativeAI(apiKey)

    // Use multiple models for robustness, same as in generate-set/route.ts
    const modelsToTry = ["gemini-2.5-flash-lite", "gemini-3.1-flash-lite", "gemini-2.0-flash", "gemini-1.5-flash", "gemini-pro-latest"]
    let lastError: any = null

    for (const modelName of modelsToTry) {
        try {
            console.log(`[GEMINI] Attempting chat response with model: ${modelName}`)
            const model = genAI.getGenerativeModel({ 
                model: modelName,
                systemInstruction: BOOMKIT_SYSTEM_INSTRUCTION
            })
            const result = await model.generateContent(prompt)
            const response = await result.response
            const text = response.text()

            if (text) {
                console.log(`[GEMINI] Successfully responded using model: ${modelName}`)
                return text
            }
        } catch (error: any) {
            console.error(`[GEMINI] Model ${modelName} failed:`, error.message || error)
            lastError = error
        }
    }

    // If we reach here, all models failed
    const errorMsg = lastError?.message || "Unknown error"
    if (errorMsg.includes("403") || errorMsg.includes("leaked")) {
        return "I'm sorry, my API key has been disabled for security reasons. Please ask the administrator to update it in the settings."
    }

    return "I'm sorry, I encountered an error while thinking about that. (All models failed)"
}
