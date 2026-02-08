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
        questions: getFallbackQuestions(grade, subject, count, prompt),
        fallback: true
      })
    }

    const genAI = new GoogleGenerativeAI(apiKey)

    // Model retry list for robustness - Updated with verified available models
    const modelsToTry = ["gemini-2.0-flash", "gemini-flash-latest", "gemini-pro-latest", "gemini-2.5-flash-lite", "gemini-exp-1206"]
    let lastError = null
    let generationSuccessful = false
    let finalData = null

    const systemPrompt = `
      You are a world-class educational content creator for a game called Boomkit.
      Generate a set of EXACTLY ${count} multiple-choice questions for the following:
      Grade: ${grade}
      Subject: ${subject}
      Topic: ${prompt}

      CRITICAL TOPIC RELEVANCE RULE:
      - EVERY single question MUST be directly related to the Topic: "${prompt}".
      - DO NOT generate generic educational questions like "What is 3+3?" or "How many legs does an insect have?" unless it is EXACTLY what the topic asks for.
      - DO NOT use placeholder questions or generic math if the topic is NOT about that specific math.
      - If the topic is specific (e.g., "Counting to 100", "State Capitals", "Photosynthesis"), every question MUST stay within that narrow scope.
      - Topic adherence is the HIGHEST priority. Failure to follow the topic will result in a system error.
      - If the topic is "Counting by 10s", DO NOT ask about "3x3". Ask about "10, 20, 30, _?" or "What comes after 80 when counting by 10s?".

      CRITICAL QUESTION COUNT RULE:
      - You MUST generate EXACTLY ${count} questions. No more, no less.
      - If the user prompt mentions a different number of questions, IGNORE IT and use EXACTLY ${count} as requested by the system.

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
      - TOPIC VARIETY: Mix different aspects of the TOPIC specifically.
      - PROGRESSION: Questions MUST get progressively harder within the set. Start with foundation and move to challenge.
      - ANSWER RANDOMIZATION: The "correctIndex" MUST be randomly distributed across 0, 1, 2, and 3. DO NOT always put the correct answer in the same position.

      Return the response ONLY as a valid JSON object in this format:
      {
        "title": "${prompt} Quiz",
        "description": "Educational questions about ${prompt}",
        "grade": ${grade},
        "subject": "${subject}",
        "questions": [
          {
            "id": "q_RANDOM",
            "question": "The question text",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correctIndex": 0
          }
        ]
      }
      
      Only return the JSON, no other text.
    `

    for (const modelName of modelsToTry) {
      if (generationSuccessful) break

      try {
        console.log(`[AI API] Attempting generation with model: ${modelName}`)
        const model = genAI.getGenerativeModel({ model: modelName })
        const result = await model.generateContent(systemPrompt)
        const res = await result.response
        const text = res.text()

        let jsonStr = text
        const jsonMatch = text.match(/\{[\s\S]*\}/)
        if (jsonMatch) jsonStr = jsonMatch[0]

        const data = JSON.parse(jsonStr)
        if (data.questions && data.questions.length > 0) {
          finalData = data
          generationSuccessful = true
          console.log(`[AI API] Successfully generated with ${modelName}`)
        }
      } catch (err: any) {
        console.error(`[AI API] Model ${modelName} failed:`, err.message || err)
        if (err.stack) console.log(err.stack)
        lastError = err
      }
    }

    if (generationSuccessful && finalData) {
      return NextResponse.json(finalData)
    } else {
      throw lastError || new Error("All AI models failed to generate content")
    }
  } catch (error: any) {
    console.error("Critical AI Error:", error)
    const errorMsg = error.message || "Unknown AI error"

    // Check if it's a 429 and try to extract retry time
    let isQuotaError = false
    let retryAfter = 60 // Default 60s
    if (error.status === 429 || errorMsg.includes("429") || errorMsg.includes("quota")) {
      isQuotaError = true
      const delayMatch = errorMsg.match(/retry in ([\d.]+)s/i)
      if (delayMatch) retryAfter = Math.ceil(parseFloat(delayMatch[1]))
    }

    return NextResponse.json({
      title: `${subject} Quiz`,
      description: isQuotaError
        ? `API Rate Limit hit. Please wait ${retryAfter}s. Using relevant fallback questions.`
        : `Error: ${errorMsg}. Using fallback questions.`,
      grade,
      subject,
      questions: getFallbackQuestions(grade, subject, count, prompt),
      fallback: true,
      error: errorMsg,
      isQuotaError,
      retryAfter
    })
  }
}
