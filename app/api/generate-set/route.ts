import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

export async function POST(req: Request) {
  try {
    const { prompt, grade, subject, count = 25 } = await req.json()
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY || "AIzaSyBJcKB1BFqEIlcL8VGJ-q6BKFvBLB8jXmc"

    if (!apiKey) {
      return NextResponse.json({ error: "Gemini API key missing" }, { status: 500 })
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    const systemPrompt = `
      You are an educational content creator for a game called Boomkit.
      Generate a set of EXACTLY ${count} multiple-choice questions for the following:
      Grade: ${grade}
      Subject: ${subject}
      Topic/Instructions: ${prompt}

      Return the response ONLY as a valid JSON object in this format:
      {
        "title": "Set Title",
        "description": "Short description",
        "grade": ${grade},
        "subject": "${subject}",
        "questions": [
          {
            "id": "1",
            "question": "The question text",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correctIndex": 0
          }
        ]
      }
      
      Ensure the questions are age-appropriate for the specified grade.
      Only return the JSON, no other text.
    `

    console.log(`[AI API] Generating set for Grade ${grade}, Subject: ${subject}`)
    const result = await model.generateContent(systemPrompt)
    const response = await result.response
    const text = response.text()

    console.log("[AI API] Raw response length:", text.length)

    // Attempt to extract JSON if there's markdown formatting
    let jsonStr = text
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      jsonStr = jsonMatch[0]
    }

    try {
      const data = JSON.parse(jsonStr)
      console.log("[AI API] Successfully parsed JSON")
      return NextResponse.json(data)
    } catch (parseError) {
      console.error("[AI API] JSON parsing failed. Text:", text, "Error:", parseError)
      return NextResponse.json({ error: "The AI returned an invalid response format. Please try again." }, { status: 500 })
    }
  } catch (error: any) {
    console.error("Error generating set:", error)
    return NextResponse.json({ error: `AI Generation Error: ${error.message || "Unknown error"}` }, { status: 500 })
  }
}
