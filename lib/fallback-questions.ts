export interface Question {
    id: string
    question: string
    options: string[]
    correctIndex: number
}

export const FALLBACK_QUESTIONS: { [key: string]: Question[] } = {
    "math_elementary": [
        { id: "me1", question: "What is 3 + 4?", options: ["5", "6", "7", "8"], correctIndex: 2 },
        { id: "me2", question: "What is 10 - 5?", options: ["3", "4", "5", "6"], correctIndex: 2 },
        { id: "me3", question: "What is 2 x 3?", options: ["5", "6", "7", "8"], correctIndex: 1 },
        { id: "me4", question: "What is 12 / 4?", options: ["2", "3", "4", "5"], correctIndex: 1 },
        { id: "me5", question: "Which is greater: 15 or 12?", options: ["15", "12", "Equal", "None"], correctIndex: 0 }
    ],
    "reading_elementary": [
        { id: "re1", question: "Which word is a noun?", options: ["Run", "Happy", "Apple", "Quickly"], correctIndex: 2 },
        { id: "re2", question: "What is the opposite of 'hot'?", options: ["Warm", "Cold", "Sunny", "Ice"], correctIndex: 1 },
        { id: "re3", question: "Which word starts with a capital letter?", options: ["dog", "cat", "London", "apple"], correctIndex: 2 },
        { id: "re4", question: "What do you use to write on a whiteboard?", options: ["Pencil", "Crayon", "Marker", "Pen"], correctIndex: 2 },
        { id: "re5", question: "Which animal says 'meow'?", options: ["Dog", "Cat", "Cow", "Bird"], correctIndex: 1 }
    ],
    "science_elementary": [
        { id: "se1", question: "What planet do we live on?", options: ["Mars", "Venus", "Earth", "Jupiter"], correctIndex: 2 },
        { id: "se2", question: "What do plants need to grow?", options: ["Milk", "Soda", "Water", "Juice"], correctIndex: 2 },
        { id: "se3", question: "How many legs does a spider have?", options: ["4", "6", "8", "10"], correctIndex: 2 },
        { id: "se4", question: "What part of a plant is underground?", options: ["Leaves", "Stem", "Roots", "Flower"], correctIndex: 2 },
        { id: "se5", question: "Which is a solid?", options: ["Water", "Air", "Ice", "Steam"], correctIndex: 2 }
    ]
}

export function getFallbackQuestions(grade: number, subject: string, count: number): Question[] {
    const subjectKey = subject.toLowerCase()
    let pool: Question[] = []

    if (subjectKey.includes("math")) pool = FALLBACK_QUESTIONS["math_elementary"]
    else if (subjectKey.includes("read") || subjectKey.includes("english")) pool = FALLBACK_QUESTIONS["reading_elementary"]
    else if (subjectKey.includes("science")) pool = FALLBACK_QUESTIONS["science_elementary"]
    else pool = [
        ...FALLBACK_QUESTIONS["math_elementary"],
        ...FALLBACK_QUESTIONS["reading_elementary"],
        ...FALLBACK_QUESTIONS["science_elementary"]
    ]

    // Shuffle and slice
    return [...pool].sort(() => Math.random() - 0.5).slice(0, count)
}
