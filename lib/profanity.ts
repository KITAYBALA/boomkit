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

    // Variations
    "f*ck", "sh*t", "b*tch", "a$$", "d!ck", "p*ssy", "c*nt", "f u c k", "s h i t",

    // Spanish
    "puta", "puto", "mierda", "cabron", "cabrón", "joder", "coño", "culero",
    "pendejo", "pinche", "verga", "chinga", "chingar", "maricon", "maricón",
    "zorra", "follar", "polla", "mamaguevo", "gilipollas",

    // French
    "merde", "putain", "connard", "salope", "batard", "encule", "enculé",
    "foutre", "bite", "couille", "poufiasse",

    // German
    "scheisse", "scheiße", "arschloch", "schlampe", "hure", "fotze", "wichser",
    "verdammt",

    // Italian
    "cazzo", "merda", "vaffanculo", "troia", "stronzo", "puttana", "fanculo",

    // Portuguese
    "porra", "merda", "caralho", "fodase", "foda-se", "puta", "viado", "boceta",

    // Russian (Transliterated)
    "cyka", "blyat", "nahuj", "pizda", "gondon",

    // Turkish
    "amk", "aq", "siktir", "pic", "yarak", "oç", "oc", "ananı", "bacını", "yarrak",
    "göt", "orosbu", "kahpe", "sikecem", "sokayım", "amına",

    // Polish
    "kurwa", "jebac", "pierdole", "chuj", "cipa",

    // Filipino/Tagalog
    "putangina", "gago", "tanga", "ulol", "bobo", "kantot", "pekpek", "tite",

    // Indonesian/Malay
    "anjing", "babi", "bangsat", "kontol", "memek", "jembut", "pantek", "pukimak",

    // Hindi (Transliterated)
    "bhenchod", "madarchod", "chutiya", "gandu", "bhosdike", "randi",

    // Arabic (Transliterated)
    "kus", "sharmuta", "kalb", "khara", "ayr", "zeb"
]

export function containsProfanity(message: string): boolean {
    if (!message) return false

    const lowerMessage = message.toLowerCase()

    // 1. Check for exact word matches (with word boundaries)
    for (const word of PROFANITY_LIST) {
        // Escape special regex characters in the bad word
        const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        // Look for whole words only
        const regex = new RegExp(`\\b${escapedWord}\\b`, 'i')
        if (regex.test(lowerMessage)) {
            return true
        }
    }

    // 2. Check for Leetspeak / Substitutions
    // Normalize the message to standard letters
    const normalizedMessage = lowerMessage
        .replace(/0/g, 'o')
        .replace(/1/g, 'i')
        .replace(/3/g, 'e')
        .replace(/4/g, 'a')
        .replace(/5/g, 's')
        .replace(/7/g, 't')
        .replace(/@/g, 'a')
        .replace(/\$/g, 's')
        .replace(/!/g, 'i')

    for (const word of PROFANITY_LIST) {
        const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        const regex = new RegExp(`\\b${escapedWord}\\b`, 'i')
        if (regex.test(normalizedMessage)) {
            return true
        }
    }

    // 3. Simple inclusion check for very strong unique words 
    // (be careful not to flat mild words like "ass" which is in "pass")
    // For this list, we'll stick to boundary checks primarily to avoid false positives (Scunthorpe problem),
    // but we can add specific non-boundary checks for unique strong slurs if needed.

    return false
}
