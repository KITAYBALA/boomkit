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
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

    const systemPrompt = `
      You are a world-class educational content creator for a game called Boomkit.
      Generate a set of EXACTLY ${count} multiple-choice questions for the following:
      Grade: ${grade}
      Subject: ${subject}
      Topic/Instructions: ${prompt}

      CRITICAL DIFFICULTY & DIVERSITY RULES:
      - EVERY question MUST have EXACTLY 4 options. Never 2 or 3.
      - AVOID REPETITIVE QUESTIONS. Every single question in the set must be unique and different in structure and content.
      - For Grade 1 Math: Focus on a wide variety of topics: addition, subtraction, basic shapes, counting objects, telling time, and simple word problems. AVOID repeating simple "X+Y" patterns.
      - For Grade 1 Reading: Use diverse vocabulary, sentence completion, identifying main ideas, and phonics. Every reading question should look and feel different.
      - For Grade 2-5: Use intermediate arithmetic (multiplication/division), basic science, descriptive grammar, and reading comprehension.
      - For Grade 6-12: Increase complexity naturally (Algebra, Biology, Physics, etc.) but MAINTAIN the 4-option requirement and high diversity.
      - AVOID extremely simple or repetitive math like "5+5" unless it's a very small part of a larger, more complex set for Grade 1.
      - Questions MUST get progressively slightly harder within the set.

      Return the response ONLY as a valid JSON object in this format:
      {
        "title": "Set Title",
        "description": "Short description",
        "grade": ${grade},
        "subject": "${subject}",
        "questions": [
          {
            "id": "unique_id_1",
            "question": "The question text",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correctIndex": 0
          }
        ]
      }
      
      Only return the JSON, no other text.
    `

    console.log(`[AI API] Generating ${count} questions for Grade ${grade}, Subject: ${subject}`)
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
      if (!data.questions || data.questions.length === 0) {
        throw new Error("AI returned empty question set");
      }
      console.log("[AI API] Successfully generated", data.questions.length, "questions");
      return NextResponse.json(data)
    } catch (parseError) {
      console.error("[AI API] Logic/Parsing failed:", parseError, "Response:", text)
      return NextResponse.json({ error: "The AI failed to generate a valid question set. Please try a more specific prompt." }, { status: 500 })
    }
  } catch (error: any) {
    console.error("Error generating set:", error)
    return NextResponse.json({ error: `AI Error: ${error.message || "Unknown error"}` }, { status: 500 })
  }
}
