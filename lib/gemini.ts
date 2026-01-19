import { GoogleGenerativeAI } from "@google/generative-ai"
import { BOOMKIT_SYSTEM_INSTRUCTION } from "./boomkit-knowledge"

/**
 * Utility to handle Gemini AI generations
 */
export async function generateGeminiResponse(prompt: string): Promise<string> {
    // Use env var first, fallback to the key provided by user to avoid restart issues
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY || "AIzaSyBJcKB1BFqEIlcL8VGJ-q6BKFvBLB8jXmc"

    if (!apiKey) {
        console.error("GOOGLE_GEMINI_API_KEY is not defined in environment variables.")
        return "I'm sorry, I cannot respond right now. (API Key missing)"
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        systemInstruction: BOOMKIT_SYSTEM_INSTRUCTION
    })

    try {
        const result = await model.generateContent(prompt)
        const response = await result.response
        return response.text()
    } catch (error) {
        console.error("Error generating Gemini response:", error)
        return "I'm sorry, I encountered an error while thinking about that."
    }
}
