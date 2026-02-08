// Comprehensive multilingual profanity list
// Includes variations, common obfuscations, and words from multiple languages

const PROFANITY_LIST = [
    // English
    "fuck", "shit", "ass", "asshole", "bitch", "bastard", "damn", "dick", "cock",
    "pussy", "cunt", "whore", "slut", "fag", "faggot", "nigger", "nigga", "retard",
    "rape", "rapist", "kys", "kill yourself", "suicide", "piss", "prick", "wanker",
    "twat", "bollocks", "bugger", "arse", "motherfucker", "fucker", "fucking",
    "shitty", "bullshit", "horseshit", "dumbass", "dipshit", "jackass", "cum", "jizz",
    "tit", "tits", "boob", "boobs", "nipple", "clit", "clitoris", "vagina", "penis",
    "chink", "gook", "kike", "spic", "wetback", "beaner", "coon", "jigaboo", "negro",

    // Variations & Common Misspellings
    "f*ck", "sh*t", "b*tch", "a$$", "d!ck", "p*ssy", "c*nt", "f u c k", "s h i t",
    "biatch", "b1tch", "fvck", "fvk", "sh1t", "sh!t", "assh0le", "a55", "d1ck",
    "c0ck", "pussies", "pve", "pvssy", "cvnt", "wh0re", "slvt", "f4g", "fa9", "fagg0t",
    "n1gger", "n!gger", "nigg3r", "nigg4", "n1gga", "ret4rd", "r3tard", "kys",
    "kill urs3lf", "k1ll yourself", "su1cide", "suic1de", "p1ss", "pr1ck", "w4nker",
    "tw4t", "b0llocks", "bugg3r", "ars3", "m0therfucker", "motherfvk", "motherf*cker",
    "fvcker", "fook", "phuck", "phuq", "shyt", "bullsh1t", "h0rse", "dumb4ss",
    "dIpShIt", "jack4ss", "cvm", "j1zz", "t1t", "t1ts", "b00b", "b00bs", "n1pple",
    "cl1t", "cl1toris", "vag1na", "p3nis", "pen1s",

    // Spanish
    "puta", "puto", "mierda", "cabron", "cabrón", "joder", "coño", "culero",
    "pendejo", "pinche", "verga", "chinga", "chingar", "maricon", "maricón",
    "zorra", "follar", "polla", "mamaguevo", "gilipollas", "concha", "boludo",
    "pelotudo", "chupa", "chupapollas", "malparido", "gonorrea", "hp", "hdp",

    // French
    "merde", "putain", "connard", "salope", "batard", "encule", "enculé",
    "foutre", "bite", "couille", "poufiasse", "bordel", "feuj",

    // German
    "scheisse", "scheiße", "arschloch", "schlampe", "hure", "fotze", "wichser",
    "verdammt", "mist", "kanake", "schwuchtel", "bastard", "ficken",

    // Italian
    "cazzo", "merda", "vaffanculo", "troia", "stronzo", "puttana", "fanculo",
    "figa", "zoccola", "finocchio", "baldracca",

    // Portuguese
    "porra", "merda", "caralho", "fodase", "foda-se", "puta", "viado", "boceta",
    "piranha", "arrombado", "fuder", "chupa", "cacete",

    // Russian (Transliterated)
    "cyka", "blyat", "nahuj", "pizda", "gondon", "suka", "bliat", "xuy", "hui",
    "ebat", "pidor", "mudak",

    // Turkish
    "amk", "aq", "siktir", "pic", "yarak", "oç", "oc", "ananı", "bacını", "yarrak",
    "göt", "orosbu", "kahpe", "sikecem", "sokayım", "amına", "ibne", "puşt",
    "sik", "amcik", "amcık", "yavşak",

    // Polish
    "kurwa", "jebac", "pierdole", "chuj", "cipa", "kutas", "suka", "pizda",

    // Filipino/Tagalog
    "putangina", "gago", "tanga", "ulol", "bobo", "kantot", "pekpek", "tite",
    "kupal", "hindot", "punyeta",

    // Indonesian/Malay
    "anjing", "babi", "bangsat", "kontol", "memek", "jembut", "pantek", "pukimak",
    "keparat", "sialan", "jancok", "ngentot",

    // Hindi (Transliterated)
    "bhenchod", "madarchod", "chutiya", "gandu", "bhosdike", "randi", "kamina",
    "saala", "haramkhor",

    // Arabic (Transliterated)
    "kus", "sharmuta", "kalb", "khara", "ayr", "zeb", "sharmoota", "kuss",
    "gahba", "manyak"
]

// Normalizes text to handle Leetspeak and repeated characters
// e.g. "Hxllo" -> "hello", "baaad" -> "bad"
function normalizeText(text: string): string {
    if (!text) return "";

    let normalized = text.toLowerCase();

    // 1. Convert Leetspeak
    normalized = normalized
        .replace(/0/g, 'o')
        .replace(/1/g, 'i')
        .replace(/3/g, 'e')
        .replace(/4/g, 'a')
        .replace(/5/g, 's')
        .replace(/7/g, 't')
        .replace(/8/g, 'b')
        .replace(/@/g, 'a')
        .replace(/\$/g, 's')
        .replace(/!/g, 'i')
        .replace(/\+/g, 't')
        .replace(/\|/g, 'i');

    // 2. Remove non-alphabetic characters (allows for "f.u.c.k" to become "fuck")
    normalized = normalized.replace(/[^a-z]/g, '');

    // 3. Remove repeated characters (e.g. "fuuuck" -> "fugk" -> will fail word match but helps substring match)
    // Actually, simply removing 3+ repeats handles "fuuuck" -> "fuck"
    normalized = normalized.replace(/(.)\1{2,}/g, '$1');

    return normalized;
}

export function containsProfanity(message: string): boolean {
    if (!message) return false

    const lowerMessage = message.toLowerCase()

    // 1. Direct Word Match (with word boundaries)
    // Catches "fuck" but avoids "scunthorpe"
    for (const word of PROFANITY_LIST) {
        // Escape special regex characters in the bad word
        const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

        // Look for whole words
        const regex = new RegExp(`\\b${escapedWord}\\b`, 'i')
        if (regex.test(lowerMessage)) {
            return true
        }
    }

    // 2. Normalized Text Check
    // "f.u.c.k" -> "fuck"
    // "sh1t" -> "shit"
    // "niiigggeeerrr" -> "niger" (imperfect but catches many)
    const normalized = normalizeText(message);

    for (const word of PROFANITY_LIST) {
        // Only check really bad words here to avoid false positives like "pass" or "class"
        // For example if "ass" is in list, "classic" normalized is "classic" -> contains "ass" -> FALSE POSITIVE
        // So we need strict checking even in normalized mode.

        // This part is tricky. Let's do a substring check ONLY for words longer than 3 chars to avoid "ass" matching "bass"
        if (word.length > 3 && normalized.includes(word)) {
            return true;
        }

        // Start/End checks for short words
        if (word.length <= 3) {
            if (normalized === word ||
                normalized.startsWith(word + " ") ||
                normalized.endsWith(" " + word) ||
                normalized.includes(" " + word + " ")) {
                return true;
            }
        }
    }

    // 3. Specific Variation Patterns (Regex for spaced out words)
    // "f u c k" -> /f\s*u\s*c\s*k/
    for (const word of PROFANITY_LIST) {
        if (word.length < 3) continue; // Skip too short

        const spreadRegex = new RegExp(word.split('').join('\\s*'), 'i');
        if (spreadRegex.test(message)) {
            return true;
        }
    }

    return false
}
