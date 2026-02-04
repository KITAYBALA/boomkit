const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

// Manually load .env.local
const envContent = fs.readFileSync(path.resolve(__dirname, '../.env.local'), 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, ...value] = line.split('=');
    if (key && value) env[key.trim()] = value.join('=').trim();
});

const GOOGLE_API_KEY = env.GOOGLE_GEMINI_API_KEY;
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const curriculumMap = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../lib/curriculum-map.json')));

async function generate(grade, subject, topic, n) {
    if (n <= 0) return [];
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
    const prompt = `Generate ${n} educational MCQs for Grade ${grade}, Subject ${subject}, Topic ${topic}. 
    Return ONLY JSON: { "qs": [{ "q": "text", "opts": ["A","B","C","D"], "ans": 0 }] }`;

    try {
        const result = await model.generateContent(prompt);
        const data = JSON.parse(result.response.text().match(/\{[\s\S]*\}/)[0]);
        return (data.qs || []).map(q => ({
            grade, subject, topic, question: q.q, options: q.opts, correct_index: q.ans
        }));
    } catch (e) {
        console.error("Gen error:", e.message);
        return [];
    }
}

async function run() {
    for (const g of curriculumMap.grades) {
        for (const s in curriculumMap.subjects) {
            for (const t of curriculumMap.subjects[s]) {
                const { count } = await supabase.from('question_bank').select('*', { count: 'exact', head: true }).match({ grade: g, subject: s, topic: t });
                if (count < 25) {
                    const newQs = await generate(g, s, t, 25 - count);
                    if (newQs.length > 0) await supabase.from('question_bank').insert(newQs);
                    console.log(`Added questions for ${g}-${s}-${t}`);
                }
            }
        }
    }
}
run();
