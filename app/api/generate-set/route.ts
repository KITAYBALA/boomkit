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

    const result = await model.generateContent(systemPrompt)
    const response = await result.response
    const text = response.text()

    // Attempt to extract JSON if there's markdown formatting
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    const jsonStr = jsonMatch ? jsonMatch[0] : text
    const data = JSON.parse(jsonStr)

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error generating set:", error)
    return NextResponse.json({ error: "Failed to generate set" }, { status: 500 })
  }
}
