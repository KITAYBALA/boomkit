import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { getFallbackQuestions } from "@/lib/fallback-questions"

// Fallback questions are now centralized in @/lib/fallback-questions.ts

export async function POST(req: Request) {
  const { prompt, grade, subject, count = 25 } = await req.json()

  try {
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY || "AIzaSyBJcKB1BFqEIlcL8VGJ-q6BKFvBLB8jXmc"

    if (!apiKey) {
      console.log("[AI API] No API key, using fallback questions")
      return NextResponse.json({
        title: `${subject} Questions`,
        description: `Pre-generated ${subject} questions for Grade ${grade}`,
        grade,
        subject,
        questions: getFallbackQuestions(grade, subject, count),
        fallback: true
      })
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    const systemPrompt = `
      You are a world-class educational content creator for a game called Boomkit.
      Generate a set of EXACTLY ${count} multiple-choice questions for the following:
      Grade: ${grade}
      Subject: ${subject}
      Topic/Instructions: ${prompt}

      CRITICAL DIFFICULTY & DIVERSITY RULES:
      - EVERY question MUST have EXACTLY 4 options. Never 2 or 3.
      - AVOID REPETITIVE QUESTIONS. Every single question in the set must be unique and different in structure and content.
      - EACH QUESTION MUST HAVE A TRULY UNIQUE ID format like: "topic_grade_randomstring"
      - GRADED CURRICULUM CONSTRAINTS:
        * Grade 1: Focus on basic foundations. Math: Addition/subtraction within 20, telling time to the hour, basic shapes (circles, squares), counting by 2s/5s/10s. Reading: Phonics, high-frequency words, basic sentence structure.
        * Grade 2: Math: Double-digit addition/subtraction, measuring length, money, telling time to 5 mins. Reading: Context clues, main idea, character traits.
        * Grade 3: Math: Introduction to multiplication/division, fractions, area/perimeter. Reading: Informational text analysis, prefixes/suffixes, complex sentences.
        * Grade 4: Math: Multi-digit multiplication, long division, adding/subtracting fractions, decimals. Reading: Figurative language (similes, metaphors), summarizing, inference.
        * Grade 5: Math: Multiplying/dividing fractions, volume, coordinate planes. Reading: Analyzing themes, point of view, advanced vocabulary.
        * Grade 6-8 (Middle): Focus on pre-algebra, ratios, Earth/Life science, world history, literary analysis, and argumentative writing.
        * Grade 9-12 (High): Focus on Algebra I/II, Geometry, Calculus, Biology/Chemistry/Physics, American/European History, and advanced literature/poetry analysis.
      
      - RANDOMIZATION SEED: ${Date.now()}_${Math.random()}
      - TOPIC VARIETY: Do not just stick to one sub-topic. If it's Math, mix arithmetic with word problems, geometry, and measurements.
      - AVOID PATTERNS: Do not use the same formula repeatedly. Ensure questions vary in phrasing and complexity.
      - AVOID "5+5" CLICHÉS: Do not use extremely simple or repetitive math like "5+5" unless it's a very specific context for Grade 1.
      - PROGRESSION: Questions MUST get progressively harder within the set. Start with foundation and move to challenge.

      Return the response ONLY as a valid JSON object in this format:
      {
        "title": "Set Title",
        "description": "Short description",
        "grade": ${grade},
        "subject": "${subject}",
        "questions": [
          {
            "id": "q_${Math.random().toString(36).substring(7)}",
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
      console.error("[AI API] Logic/Parsing failed:", parseError)
      console.log("[AI API] Using fallback questions due to parse error")
      return NextResponse.json({
        title: `${subject} Questions`,
        description: `Pre-generated ${subject} questions for Grade ${grade}`,
        grade,
        subject,
        questions: getFallbackQuestions(grade, subject, count),
        fallback: true
      })
    }
  } catch (error: any) {
    console.error("Critical AI Error:", error)
    const errorMsg = error.message || "Unknown AI error"
    return NextResponse.json({
      title: `${subject} Questions`,
      description: `Error: ${errorMsg}. Using fallback questions.`,
      grade,
      subject,
      questions: getFallbackQuestions(grade, subject, count),
      fallback: true,
      error: errorMsg
    })
  }
}
