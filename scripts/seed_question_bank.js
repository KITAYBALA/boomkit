const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');
const dotenv = require('dotenv');
const path = require('path');

// Load env from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role for seeding

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env.local (URL and SERVICE_ROLE_KEY required)");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Import curriculum data (we can just define a few for testing or read from the file)
// Since this is a Node script, we'll manually define the targets for now or provide an example
const TARGET_TOPICS = [
    { grade: 1, subject: "Math", topics: ["Addition within 10", "Subtraction within 10", "Counting to 100"] },
    // Add more here to scale
];

async function generateAndSeed(grade, subject, topic, iterations = 5) {
    console.log(`--- Seeding ${grade}th Grade ${subject}: ${topic} (${iterations} iterations) ---`);

    for (let i = 0; i < iterations; i++) {
        console.log(`  Iteration ${i + 1}/${iterations}...`);
        try {
            // Use the existing internal API if it was public, but here we'll simulate the Gemini call
            // or call the local dev server if it's running.
            // For a standalone script, it's better to call Gemini directly if we have the key.

            const res = await fetch(`http://localhost:3000/api/generate-set`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ grade, subject, prompt: topic, count: 50 }) // Generate 50 at a time
            });

            if (!res.ok) {
                console.error(`    FAILED iteration ${i + 1}: ${res.statusText}`);
                continue;
            }

            const data = await res.json();
            if (!data.questions || data.questions.length === 0) continue;

            const questionsToInsert = data.questions.map(q => ({
                grade,
                subject,
                topic,
                question: q.question,
                options: q.options,
                correct_index: q.correctIndex
            }));

            const { error } = await supabase.from('question_bank').insert(questionsToInsert);

            if (error) {
                console.error(`    Supabase Error: ${error.message}`);
            } else {
                console.log(`    SUCCESS: Added ${questionsToInsert.length} questions.`);
            }

            // Wait a bit to avoid rate limits
            await new Promise(r => setTimeout(r, 2000));

        } catch (err) {
            console.error(`    ERROR: ${err.message}`);
        }
    }
}

async function run() {
    console.log("Starting Question Bank Seeding...");
    for (const group of TARGET_TOPICS) {
        for (const topic of group.topics) {
            await generateAndSeed(group.grade, group.subject, topic, 2); // Start small for testing
        }
    }
    console.log("Seeding Complete!");
}

run();
