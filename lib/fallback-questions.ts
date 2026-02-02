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
        { id: "me5", question: "Which is greater: 15 or 12?", options: ["15", "12", "Equal", "None"], correctIndex: 0 },
        { id: "me6", question: "What is 5 + 5?", options: ["9", "10", "11", "12"], correctIndex: 1 },
        { id: "me7", question: "What comes next: 2, 4, 6, _?", options: ["7", "8", "9", "10"], correctIndex: 1 },
        { id: "me8", question: "How many sides does a triangle have?", options: ["2", "3", "4", "5"], correctIndex: 1 },
        { id: "me9", question: "What is 20 - 10?", options: ["5", "8", "10", "15"], correctIndex: 2 },
        { id: "me10", question: "Which number is even?", options: ["1", "3", "4", "5"], correctIndex: 2 },
        { id: "me11", question: "What is 3 x 3?", options: ["6", "9", "12", "15"], correctIndex: 1 },
        { id: "me12", question: "What is half of 10?", options: ["2", "4", "5", "6"], correctIndex: 2 },
        { id: "me13", question: "How many cents in a dollar?", options: ["10", "50", "100", "25"], correctIndex: 2 },
        { id: "me14", question: "What is 7 + 6?", options: ["11", "12", "13", "14"], correctIndex: 2 },
        { id: "me15", question: "What is 15 - 7?", options: ["6", "7", "8", "9"], correctIndex: 2 },
        { id: "me16", question: "How many corners does a square have?", options: ["3", "4", "5", "6"], correctIndex: 1 },
        { id: "me17", question: "Which shape is round?", options: ["Square", "Triangle", "Circle", "Rectangle"], correctIndex: 2 },
        { id: "me18", question: "What is 10 x 10?", options: ["100", "50", "20", "10"], correctIndex: 0 },
        { id: "me19", question: "What is 9 / 3?", options: ["2", "3", "4", "5"], correctIndex: 1 },
        { id: "me20", question: "What is 8 + 8?", options: ["14", "15", "16", "17"], correctIndex: 2 },
        { id: "me21", question: "Which is smaller: 5 or 2?", options: ["5", "2", "Equal", "None"], correctIndex: 1 },
        { id: "me22", question: "What is 100 - 50?", options: ["40", "50", "60", "25"], correctIndex: 1 },
        { id: "me23", question: "How many fingers on one hand?", options: ["4", "5", "6", "10"], correctIndex: 1 },
        { id: "me24", question: "What is 4 x 2?", options: ["6", "8", "10", "12"], correctIndex: 1 },
        { id: "me25", question: "What is 30 + 20?", options: ["40", "50", "60", "70"], correctIndex: 1 }
    ],
    "reading_elementary": [
        { id: "re1", question: "Which word is a noun?", options: ["Run", "Happy", "Apple", "Quickly"], correctIndex: 2 },
        { id: "re2", question: "What is the opposite of 'hot'?", options: ["Warm", "Cold", "Sunny", "Ice"], correctIndex: 1 },
        { id: "re3", question: "Which word starts with a capital letter?", options: ["dog", "cat", "London", "apple"], correctIndex: 2 },
        { id: "re4", question: "What do you use to write on a whiteboard?", options: ["Pencil", "Crayon", "Marker", "Pen"], correctIndex: 2 },
        { id: "re5", question: "Which animal says 'meow'?", options: ["Dog", "Cat", "Cow", "Bird"], correctIndex: 1 },
        { id: "re6", question: "What is the plural of 'cat'?", options: ["Cates", "Cats", "Catts", "Kitten"], correctIndex: 1 },
        { id: "re7", question: "Which is a color?", options: ["Run", "Blue", "Fast", "Jump"], correctIndex: 1 },
        { id: "re8", question: "What brings rain?", options: ["Sun", "Moon", "Cloud", "Star"], correctIndex: 2 },
        { id: "re9", question: "Opposite of 'Up'?", options: ["Down", "Left", "Right", "In"], correctIndex: 0 },
        { id: "re10", question: "Which is a fruit?", options: ["Carrot", "Banana", "Potato", "Onion"], correctIndex: 1 },
        { id: "re11", question: "Rhymes with 'Bat'?", options: ["Cat", "Dog", "Pig", "Cow"], correctIndex: 0 },
        { id: "re12", question: "Where do fish live?", options: ["Tree", "Sky", "Water", "Dirt"], correctIndex: 2 },
        { id: "re13", question: "Opposite of 'Big'?", options: ["Large", "Huge", "Small", "Giant"], correctIndex: 2 },
        { id: "re14", question: "Which is a verb?", options: ["Run", "Blue", "Table", "Soft"], correctIndex: 0 },
        { id: "re15", question: "Who flies a plane?", options: ["Chef", "Pilot", "Doctor", "Artist"], correctIndex: 1 },
        { id: "re16", question: "What do you use to see?", options: ["Ears", "Nose", "Eyes", "Hands"], correctIndex: 2 },
        { id: "re17", question: "Correct spelling?", options: ["Happie", "Happy", "Hapy", "Hapey"], correctIndex: 1 },
        { id: "re18", question: "Opposite of 'Fast'?", options: ["Quick", "Slow", "Rapid", "Speedy"], correctIndex: 1 },
        { id: "re19", question: "Which is a number?", options: ["A", "B", "Seven", "Z"], correctIndex: 2 },
        { id: "re20", question: "What is a baby dog called?", options: ["Kitten", "Puppy", "Calf", "Foal"], correctIndex: 1 },
        { id: "re21", question: "First letter of the alphabet?", options: ["B", "C", "A", "Z"], correctIndex: 2 },
        { id: "re22", question: "What do birds have?", options: ["Fur", "Scales", "Wings", "Fins"], correctIndex: 2 },
        { id: "re23", question: "Where do you sleep?", options: ["Kitchen", "Bed", "Garage", "Roof"], correctIndex: 1 },
        { id: "re24", question: "Opposite of 'Open'?", options: ["Closed", "Wide", "Broken", "Free"], correctIndex: 0 },
        { id: "re25", question: "Rhymes with 'Sun'?", options: ["Fun", "Sad", "Mad", "Bad"], correctIndex: 0 }
    ],
    "science_elementary": [
        { id: "se1", question: "What planet do we live on?", options: ["Mars", "Venus", "Earth", "Jupiter"], correctIndex: 2 },
        { id: "se2", question: "What do plants need to grow?", options: ["Milk", "Soda", "Water", "Juice"], correctIndex: 2 },
        { id: "se3", question: "How many legs does a spider have?", options: ["4", "6", "8", "10"], correctIndex: 2 },
        { id: "se4", question: "What part of a plant is underground?", options: ["Leaves", "Stem", "Roots", "Flower"], correctIndex: 2 },
        { id: "se5", question: "Which is a solid?", options: ["Water", "Air", "Ice", "Steam"], correctIndex: 2 },
        { id: "se6", question: "What gives us light during the day?", options: ["Moon", "Sun", "Stars", "Comet"], correctIndex: 1 },
        { id: "se7", question: "Which animal lays eggs?", options: ["Dog", "Cat", "Chicken", "Cow"], correctIndex: 2 },
        { id: "se8", question: "What is water made of?", options: ["H2O", "CO2", "O2", "NaCl"], correctIndex: 0 },
        { id: "se9", question: "What state of matter is air?", options: ["Solid", "Liquid", "Gas", "Plasma"], correctIndex: 2 },
        { id: "se10", question: "Which animal lives in the ocean?", options: ["Lion", "Shark", "Eagle", "Bear"], correctIndex: 1 },
        { id: "se11", question: "What comes from clouds?", options: ["Sand", "Rain", "Rocks", "Fire"], correctIndex: 1 },
        { id: "se12", question: "How many seasons are there?", options: ["2", "3", "4", "5"], correctIndex: 2 },
        { id: "se13", question: "Which is the hottest?", options: ["Ice", "Fire", "Water", "Wind"], correctIndex: 1 },
        { id: "se14", question: "What do bees make?", options: ["Milk", "Honey", "Jam", "Butter"], correctIndex: 1 },
        { id: "se15", question: "Which is a mammal?", options: ["Frog", "Snake", "Human", "Shark"], correctIndex: 2 },
        { id: "se16", question: "What forces pulls things down?", options: ["Magnetic", "Gravity", "Friction", "Push"], correctIndex: 1 },
        { id: "se17", question: "Which part of the body pumps blood?", options: ["Lungs", "Brain", "Heart", "Stomach"], correctIndex: 2 },
        { id: "se18", question: "What color is chlorophyll?", options: ["Red", "Blue", "Green", "Yellow"], correctIndex: 2 },
        { id: "se19", question: "What do we breathe?", options: ["Water", "Oxygen", "Food", "Iron"], correctIndex: 1 },
        { id: "se20", question: "Which is a reptile?", options: ["Dog", "Snake", "Bird", "Fish"], correctIndex: 1 },
        { id: "se21", question: "Does the moon have its own light?", options: ["Yes", "No", "Sometimes", "Maybe"], correctIndex: 1 },
        { id: "se22", question: "What melts ice?", options: ["Cold", "Heat", "Darkness", "Wind"], correctIndex: 1 },
        { id: "se23", question: "Which animal can fly?", options: ["Elephant", "Bat", "Tiger", "Hippo"], correctIndex: 1 },
        { id: "se24", question: "What is the center of an atom?", options: ["Electron", "Nucleus", "Proton", "Shell"], correctIndex: 1 },
        { id: "se25", question: "Hardest mineral?", options: ["Gold", "Iron", "Diamond", "Silver"], correctIndex: 2 }
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
