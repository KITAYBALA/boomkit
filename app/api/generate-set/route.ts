import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { getFallbackQuestions } from "@/lib/fallback-questions"

// Fallback questions are now centralized in @/lib/fallback-questions.ts

export async function POST(req: Request) {
  const { prompt, grade, subject, count = 25 } = await req.json()

  try {
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY

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
    const modelsToTry = ["gemini-2.5-flash-lite", "gemini-3.1-flash-lite", "gemini-2.0-flash", "gemini-1.5-flash", "gemini-pro-latest"]
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
        * Grade 7:
          - English Language Arts: Narrative and argumentative writing, character development, analyzing central themes, introductory research skills, and active vocabulary building.
          - Mathematics (Pre-Algebra): Ratios and proportions, operations with rational numbers (fractions and decimals), expressions and multi-step linear equations, basic geometry (surface area and volume), and introductory probability.
          - Science (Integrated/Life Science): Cellular structure and function, genetics and heredity, ecosystems and energy flow, earth systems (the rock cycle, plate tectonics), and weather/climate patterns.
          - Social Studies (World Geography & Ancient Civilizations): Global geography and map skills, ancient civilizations (Mesopotamia, Egypt, Greece, Rome), cultural geography, and human-environment interaction.
        * Grade 8:
          - English Language Arts: Literary analysis essays, persuasive writing, identifying author bias and tone, advanced grammar (verb tenses, active/passive voice), and public speaking.
          - Mathematics (8th Grade Math / Algebra I): Linear equations and inequalities, functions and graphing, systems of equations, exponents and scientific notation, the Pythagorean theorem, and geometric transformations.
          - Science (Physical Science): Structure of atoms, states of matter, the periodic table, basic chemical reactions, Newton’s laws of motion, forces, and forms of energy (waves, electricity, magnetism).
          - Social Studies (Early National History & Civics): Early history of the nation (colonization, the Revolution, founding documents), the structure of the three branches of government, and the Civil War era.
        * Grade 9:
          - English Language Arts (Intro to Literature): Analyzing diverse literary genres (epic poetry, drama, novels), the formal five-paragraph essay structure, research papers with citations (MLA/APA), and advanced context clues.
          - Mathematics (Algebra I or Geometry): Algebra I (Quadratic functions, polynomials, factoring, radical expressions, and data analysis) or Geometry (Points, lines, planes, geometric proofs, triangle congruence/similarity, and basic trigonometry).
          - Science (Biology or Earth Science): Biochemistry, cell division (mitosis and meiosis), DNA structure and protein synthesis, evolution and natural selection, and ecology.
          - Social Studies (World History I / Human Geography): Pre-modern world history, global trade routes, the Renaissance, the Scientific Revolution, the Enlightenment, and global demographic patterns.
        * Grade 10:
          - English Language Arts (World Literature): Literature from diverse global cultures, analyzing archetypes and motifs, advanced expository writing, and rhetorical devices (ethos, pathos, logos).
          - Mathematics (Geometry or Algebra II): Geometry (Circles, coordinate geometry, and the area/volume of complex geometric solids) or Algebra II (Complex numbers, rational and radical functions, exponential and logarithmic functions, and sequences/series).
          - Science (Chemistry or Biology): Atomic structure and bonding, chemical nomenclature, stoichiometry (mole calculations), chemical reactions, gas laws, solutions, and acids/bases.
          - Social Studies (Modern World History): The Industrial Revolution, Imperialism, World War I and World War II, the Cold War, and modern global conflicts or independence movements.
        * Grade 11:
          - English Language Arts (National Literature): Historical literary movements (e.g., Romanticism, Realism, Modernism), analyzing foundational historical and political texts, synthesis essays, and advanced research methodology.
          - Mathematics (Algebra II, Pre-Calculus, or Statistics): Pre-Calculus (Trigonometric functions and identities, conic sections, matrices, and an introduction to limits) or Statistics (Data collection methods, probability distributions, hypothesis testing, and regression analysis).
          - Science (Physics, Chemistry, or Environmental Science): Kinematics (motion), dynamics (forces), work, energy, momentum, thermodynamics, electricity, and wave optics.
          - Social Studies (National History): In-depth national history, the Civil Rights movement, economic developments (the Great Depression), foreign policy, and domestic social changes of the 20th century.
        * Grade 12:
          - English Language Arts (British/Senior Lit & Composition): Masterworks of classic literature (e.g., Shakespeare, Chaucer), critical literary theory, college-level research writing, personal statements, and professional communication.
          - Mathematics (Calculus, Statistics, or Financial Algebra): Calculus (Limits, continuity, derivatives and their applications, integrals, and the Fundamental Theorem of Calculus) or Financial Algebra (Personal finance math, logic, banking, taxes, and credit math).
          - Science (Advanced/AP Sciences or Anatomy): Human anatomy and body systems, advanced laboratory techniques, environmental systems, or specialized topics like organic chemistry or astrophysics.
          - Social Studies (Civics, Government, & Economics): Structure of national, state, and local governments; civil liberties and constitutional law; macroeconomics (GDP, inflation); microeconomics (supply and demand); and personal finance.
      
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
        const model = genAI.getGenerativeModel({ 
          model: modelName,
          systemInstruction: systemPrompt
        })
        const userPrompt = `
          Generate a set of EXACTLY ${count} multiple-choice questions for the following:
          Grade: ${grade}
          Subject: ${subject}
          Topic: ${prompt}
          RANDOMIZATION SEED: ${Date.now()}_${Math.random()}
        `
        const result = await model.generateContent(userPrompt)
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
