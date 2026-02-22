const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const path = require('path');
const fs = require('fs');
const STATIC_QUESTIONS = require('./curriculum_data');

// Custom .env loader since dotenv might not be installed
function loadEnv() {
    try {
        const envPath = path.resolve(__dirname, '../.env.local');
        if (fs.existsSync(envPath)) {
            const envFile = fs.readFileSync(envPath, 'utf8');
            const lines = envFile.split('\n');
            for (const line of lines) {
                // simple key=value parser
                const match = line.match(/^\s*([\w_]+)\s*=\s*(.*)?\s*$/);
                if (match) {
                    const key = match[1];
                    let value = match[2] || '';
                    // remove quotes if present
                    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                        value = value.slice(1, -1);
                    }
                    process.env[key] = value;
                }
            }
        } else {
            console.warn(".env.local not found at " + envPath);
        }
    } catch (e) {
        console.error("Error loading .env.local:", e.message);
    }
}
loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const geminiKey = process.env.GOOGLE_GEMINI_API_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials. Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const genAI = new GoogleGenerativeAI(geminiKey);

const QUESTIONS_PER_TOPIC = 15;
const SLEEP_BETWEEN_TOPICS = 5000;

async function importStaticQuestions() {
    console.log(`\n--- Importing ${STATIC_QUESTIONS.length} Static Questions ---`);

    const dbRows = STATIC_QUESTIONS.map(q => ({
        grade: q.grade,
        subject: q.subject,
        topic: q.topic,
        question: q.question,
        options: q.choices,
        correct_index: q.answer,
        custom_id: q.id
    }));

    const BATCH_SIZE = 50;
    for (let i = 0; i < dbRows.length; i += BATCH_SIZE) {
        const batch = dbRows.slice(i, i + BATCH_SIZE);
        console.log(`  Inserting/Updating batch ${i / BATCH_SIZE + 1}...`);

        const { error } = await supabase
            .from('question_bank')
            .upsert(batch, { onConflict: 'custom_id' });

        if (error) {
            console.error(`  Error in batch ${i / BATCH_SIZE + 1}:`, error.message);
        }
    }
    console.log("Static Question Import Complete!");
}

async function seedCurriculum() {
    console.log("Starting Question Bank Static Import (Grades 1-12)...");

    // 1. Import Static Questions Only
    await importStaticQuestions();

    console.log("\nStatic Import Complete!");
}

seedCurriculum().catch(console.error);
