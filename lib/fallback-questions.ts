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
        { id: "me23", question: "What is 12 + 12?", options: ["22", "23", "24", "25"], correctIndex: 2 },
        { id: "me24", question: "What is 4 x 2?", options: ["6", "8", "10", "12"], correctIndex: 1 },
        { id: "me25", question: "What is 30 + 20?", options: ["40", "50", "60", "70"], correctIndex: 1 },
        // New Math Questions
        { id: "me26", question: "What is 11 + 9?", options: ["18", "19", "20", "21"], correctIndex: 2 },
        { id: "me27", question: "What is 25 - 10?", options: ["10", "15", "20", "25"], correctIndex: 1 },
        { id: "me28", question: "What is 5 x 4?", options: ["15", "20", "25", "30"], correctIndex: 1 },
        { id: "me29", question: "What is 18 / 2?", options: ["7", "8", "9", "10"], correctIndex: 2 },
        { id: "me30", question: "How many sides in a pentagon?", options: ["4", "5", "6", "7"], correctIndex: 1 },
        { id: "me31", question: "What is 100 + 1?", options: ["100", "101", "110", "111"], correctIndex: 1 },
        { id: "me32", question: "What is 50 - 25?", options: ["20", "25", "30", "35"], correctIndex: 1 },
        { id: "me33", question: "What is 2 x 10?", options: ["12", "20", "22", "100"], correctIndex: 1 },
        { id: "me34", question: "What is 16 / 4?", options: ["2", "4", "6", "8"], correctIndex: 1 },
        { id: "me35", question: "How many hours in a day?", options: ["12", "24", "48", "60"], correctIndex: 1 },
        { id: "me36", question: "What is 13 + 7?", options: ["18", "19", "20", "21"], correctIndex: 2 },
        { id: "me37", question: "What is 40 - 5?", options: ["30", "35", "40", "45"], correctIndex: 1 },
        { id: "me38", question: "What is 6 x 2?", options: ["8", "10", "12", "14"], correctIndex: 2 },
        { id: "me39", question: "What is 20 / 5?", options: ["2", "4", "5", "10"], correctIndex: 1 },
        { id: "me40", question: "How many months in a year?", options: ["10", "11", "12", "13"], correctIndex: 2 }
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
        { id: "re25", question: "Rhymes with 'Sun'?", options: ["Fun", "Sad", "Mad", "Bad"], correctIndex: 0 },
        // New Reading Questions
        { id: "re26", question: "Which word is an adjective?", options: ["Box", "Beautiful", "Quickly", "Jump"], correctIndex: 1 },
        { id: "re27", question: "What is the opposite of 'Strong'?", options: ["Fast", "Big", "Weak", "Tough"], correctIndex: 2 },
        { id: "re28", question: "Which word is a pronoun?", options: ["He", "Car", "Apple", "Run"], correctIndex: 0 },
        { id: "re29", question: "Rhymes with 'Pink'?", options: ["Sink", "Red", "Blue", "Fast"], correctIndex: 0 },
        { id: "re30", question: "What is the main character in a book called?", options: ["Author", "Protagonist", "Villain", "Reader"], correctIndex: 1 },
        { id: "re31", question: "Which is a compound word?", options: ["Sun", "Flower", "Sunflower", "Light"], correctIndex: 2 },
        { id: "re32", question: "Opposite of 'Dry'?", options: ["Hot", "Wet", "Cold", "Hard"], correctIndex: 1 },
        { id: "re33", question: "Which word implies 'many'?", options: ["Single", "One", "Several", "None"], correctIndex: 2 },
        { id: "re34", question: "What do you find at the end of a question?", options: ["Period", "Comma", "Question Mark", "Dash"], correctIndex: 2 },
        { id: "re35", question: "Which word is a synonym for 'Quick'?", options: ["Slow", "Fast", "Quiet", "Loud"], correctIndex: 1 }
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
        { id: "se25", question: "Hardest mineral?", options: ["Gold", "Iron", "Diamond", "Silver"], correctIndex: 2 },
        // New Science Questions
        { id: "se26", question: "What is the closest star to Earth?", options: ["Mars", "Moon", "Sun", "Jupiter"], correctIndex: 2 },
        { id: "se27", question: "Which animal is an amphibian?", options: ["Dog", "Frog", "Fish", "Bird"], correctIndex: 1 },
        { id: "se28", question: "What do we use to measure temperature?", options: ["Ruler", "Scale", "Thermometer", "Clock"], correctIndex: 2 },
        { id: "se29", question: "Which organ is used for thinking?", options: ["Heart", "Lungs", "Brain", "Stomach"], correctIndex: 2 },
        { id: "se30", question: "What happens when water freezes?", options: ["Turns to Gas", "Turns to Liquid", "Turns to Ice", "Vanishes"], correctIndex: 2 },
        { id: "se31", question: "Which is a source of renewable energy?", options: ["Coal", "Oil", "Wind", "Gas"], correctIndex: 2 },
        { id: "se32", question: "How many planets are in our solar system?", options: ["7", "8", "9", "10"], correctIndex: 1 },
        { id: "se33", question: "Search for 'Photosynthesis' involves which life form?", options: ["Animals", "Plants", "Fungi", "Rocks"], correctIndex: 1 },
        { id: "se34", question: "What does a caterpillar turn into?", options: ["Ant", "Bee", "Butterfly", "Spider"], correctIndex: 2 },
        { id: "se35", question: "Which gas do plants absorb?", options: ["Oxygen", "Carbon Dioxide", "Nitrogen", "Helium"], correctIndex: 1 }
    ],
    "pe_elementary": [
        { id: "pe1", question: "What should you do before exercising?", options: ["Sleep", "Warm up", "Eat a big meal", "Watch TV"], correctIndex: 1 },
        { id: "pe2", question: "Which is a team sport?", options: ["Tennis", "Swimming", "Soccer", "Running"], correctIndex: 2 },
        { id: "pe3", question: "What do we use to pump blood?", options: ["Lungs", "Brain", "Heart", "Stomach"], correctIndex: 2 },
        { id: "pe4", question: "Which fruit has the most Vitamin C?", options: ["Apple", "Orange", "Banana", "Grape"], correctIndex: 1 },
        { id: "pe5", question: "How many players are on a basketball court per team?", options: ["5", "6", "11", "2"], correctIndex: 0 }
    ],
    "social_studies_elementary": [
        { id: "ss1", question: "Who was the first U.S. President?", options: ["Lincoln", "Washington", "Jefferson", "Adams"], correctIndex: 1 },
        { id: "ss2", question: "Which continent is the South Pole on?", options: ["Africa", "Asia", "Antarctica", "Europe"], correctIndex: 2 },
        { id: "ss3", question: "What is the capital of the USA?", options: ["New York", "Washington D.C.", "Los Angeles", "Chicago"], correctIndex: 1 },
        { id: "ss4", question: "What do we use to see where countries are?", options: ["Book", "Calculator", "Map", "Compass"], correctIndex: 2 },
        { id: "ss5", question: "Which is a holiday in July?", options: ["Christmas", "Halloween", "Independence Day", "Easter"], correctIndex: 2 }
    ],
    "math_middle": [
        { id: "mm1", question: "What is the area of a rectangle with length 5 and width 4?", options: ["9", "20", "18", "10"], correctIndex: 1 },
        { id: "mm2", question: "Simplify: x + x + x", options: ["x^3", "3x", "x+3", "3+x"], correctIndex: 1 },
        { id: "mm3", question: "What is 15% of 200?", options: ["15", "20", "30", "45"], correctIndex: 2 },
        { id: "mm4", question: "Solve for y: y / 3 = 12", options: ["4", "9", "15", "36"], correctIndex: 3 },
        { id: "mm5", question: "Which is greater: 0.5 or 0.25?", options: ["0.5", "0.25", "They are equal", "Cannot tell"], correctIndex: 0 },
        { id: "mm6", question: "What is the square root of 64?", options: ["6", "7", "8", "9"], correctIndex: 2 },
        { id: "mm7", question: "If 2x = 10, what is x?", options: ["2", "3", "5", "8"], correctIndex: 2 },
        { id: "mm8", question: "How many degrees are in a triangle?", options: ["90", "180", "270", "360"], correctIndex: 1 },
        { id: "mm9", question: "What is 3 squared?", options: ["6", "9", "12", "15"], correctIndex: 1 },
        { id: "mm10", question: "Which is a prime number?", options: ["4", "6", "7", "9"], correctIndex: 2 }
    ],
    "science_middle": [
        { id: "sm1", question: "What is the powerhouse of the cell?", options: ["Nucleus", "Ribosome", "Mitochondria", "Vacuole"], correctIndex: 2 },
        { id: "sm2", question: "Which gas do humans breathe out?", options: ["Oxygen", "Nitrogen", "Carbon Dioxide", "Hydrogen"], correctIndex: 2 },
        { id: "sm3", question: "What is the atomic symbol for Water?", options: ["O2", "H2O", "CO2", "HO"], correctIndex: 1 },
        { id: "sm4", question: "Which layer of the Earth is the hottest?", options: ["Crust", "Mantle", "Outer Core", "Inner Core"], correctIndex: 3 },
        { id: "sm5", question: "Sound cannot travel through which of these?", options: ["Water", "Air", "Steel", "Vacuum"], correctIndex: 3 },
        { id: "sm6", question: "Which planet is known as the Red Planet?", options: ["Venus", "Mars", "Jupiter", "Saturn"], correctIndex: 1 },
        { id: "sm7", question: "What is the boiling point of water in Celsius?", options: ["0", "50", "100", "200"], correctIndex: 2 },
        { id: "sm8", question: "Which organ filters blood?", options: ["Heart", "Lungs", "Kidneys", "Stomach"], correctIndex: 2 },
        { id: "sm9", question: "What is the largest organ of the human body?", options: ["Liver", "Brain", "Skin", "Heart"], correctIndex: 2 },
        { id: "sm10", question: "Which force pulls objects toward Earth?", options: ["Magnetism", "Friction", "Gravity", "Inertia"], correctIndex: 2 }
    ],
    "math_high": [
        { id: "mh1", question: "What is the derivative of x^2?", options: ["x", "2x", "x^3/3", "2"], correctIndex: 1 },
        { id: "mh2", question: "Solve for x: 2x + 5 = 15", options: ["5", "10", "2", "20"], correctIndex: 0 },
        { id: "mh3", question: "In a right triangle, if a=3 and b=4, what is c?", options: ["5", "6", "7", "25"], correctIndex: 0 },
        { id: "mh4", question: "What is the log(100)?", options: ["1", "2", "10", "100"], correctIndex: 1 },
        { id: "mh5", question: "Which is the formula for the area of a circle?", options: ["2πr", "πr^2", "πd", "2πr^2"], correctIndex: 1 },
        { id: "mh6", question: "What is the sine of 90 degrees?", options: ["0", "0.5", "1", "-1"], correctIndex: 2 },
        { id: "mh7", question: "Solve: x^2 = 49", options: ["5", "6", "7", "8"], correctIndex: 2 },
        { id: "mh8", question: "What is the value of Pi (to 2 decimal places)?", options: ["3.12", "3.14", "3.16", "3.18"], correctIndex: 1 },
        { id: "mh9", question: "Which is a quadratic equation?", options: ["y=mx+b", "ax^2+bx+c=0", "a^2+b^2=c^2", "V=IR"], correctIndex: 1 },
        { id: "mh10", question: "What is the limit of 1/x as x goes to infinity?", options: ["1", "0", "Infinity", "Undefined"], correctIndex: 1 }
    ],
    "reading_middle": [
        { id: "rm1", question: "What is a 'protagonist'?", options: ["The villain", "The sidekick", "The main character", "The narrator"], correctIndex: 2 },
        { id: "rm2", question: "Which is an example of a simile?", options: ["He is a lion", "As brave as a lion", "Lions roar", "The lion slept"], correctIndex: 1 },
        { id: "rm3", question: "What is the main idea of a story?", options: ["The first sentence", "The character names", "What the story is mostly about", "The ending"], correctIndex: 2 },
        { id: "rm4", question: "What does 'anonymous' mean?", options: ["Famous", "Unknown", "Angry", "Fast"], correctIndex: 1 },
        { id: "rm5", question: "Which is a synonym for 'happy'?", options: ["Sad", "Gloomy", "Joyful", "Bored"], correctIndex: 2 },
        { id: "rm6", question: "What is a 'metaphor'?", options: ["Direct comparison", "Using 'like' or 'as'", "Exaggeration", "Repeating sounds"], correctIndex: 0 },
        { id: "rm7", question: "What is the 'climax' of a plot?", options: ["The beginning", "The turning point", "The resolution", "The character introduction"], correctIndex: 1 },
        { id: "rm8", question: "Which word is an adverb?", options: ["Quickly", "Fast", "Green", "House"], correctIndex: 0 },
        { id: "rm9", question: "What is 'foreshadowing'?", options: ["Looking back", "Hints about future events", "The main character", "The setting"], correctIndex: 1 },
        { id: "rm10", question: "What is 'alliteration'?", options: ["Vowel sounds", "Repeating initial consonant sounds", "Rhyming", "Exaggeration"], correctIndex: 1 },
        { id: "rm11", question: "What is 'onomatopoeia'?", options: ["Words that sound like their meaning", "A long journey", "A type of bird", "A figure of speech"], correctIndex: 0 },
        { id: "rm12", question: "Which is an example of personification?", options: ["The wind whispered", "Strong as an ox", "Life is a highway", "Bang!"], correctIndex: 0 }
    ],
    "social_studies_high": [
        { id: "ssh1", question: "When was the US Declaration of Independence signed?", options: ["1492", "1776", "1812", "1865"], correctIndex: 1 },
        { id: "ssh2", question: "Who was the leader of the Soviet Union during WWII?", options: ["Lenin", "Stalin", "Khrushchev", "Gorbachev"], correctIndex: 1 },
        { id: "ssh3", question: "Which was the first human-made satellite?", options: ["Apollo 11", "Sputnik 1", "Voyager", "Explorer"], correctIndex: 1 },
        { id: "ssh4", question: "Who wrote 'The Communist Manifesto'?", options: ["Adam Smith", "Karl Marx", "John Locke", "Thomas Hobbes"], correctIndex: 1 },
        { id: "ssh5", question: "What was the main cause of the French Revolution?", options: ["Tea tax", "Inequality and debt", "Invasion by England", "Religion"], correctIndex: 1 },
        { id: "ssh6", question: "Which empire did Julius Caesar lead?", options: ["Greek", "Roman", "Persian", "Egyptian"], correctIndex: 1 },
        { id: "ssh7", question: "What was the Cold War primarily about?", options: ["Territory", "Ideology (Capitalism vs Communism)", "Trade", "Oil"], correctIndex: 1 },
        { id: "ssh8", question: "Who was the first woman to win a Nobel Prize?", options: ["Marie Curie", "Rosa Parks", "Jane Addams", "Ada Lovelace"], correctIndex: 0 },
        { id: "ssh9", question: "Which treaty ended WWI?", options: ["Treaty of Paris", "Treaty of Versailles", "Treaty of Ghent", "Treaty of London"], correctIndex: 1 },
        { id: "ssh10", question: "What is the supreme law of the Land in the US?", options: ["The Bible", "The Constitution", "The Declaration", "Common sense"], correctIndex: 1 },
        { id: "ssh11", question: "Who was the first President to live in the White House?", options: ["Washington", "Adams", "Jefferson", "Madison"], correctIndex: 1 },
        { id: "ssh12", question: "Which planet is closest to the Sun?", options: ["Mars", "Venus", "Mercury", "Earth"], correctIndex: 2 }
    ],
    "reading_high": [
        { id: "rh1", question: "What is an 'allegory'?", options: ["A type of poem", "A story with a hidden meaning", "A short summary", "A character name"], correctIndex: 1 },
        { id: "rh2", question: "In literature, what is 'hubris'?", options: ["Bravery", "Extreme pride", "Wisdom", "Sadness"], correctIndex: 1 },
        { id: "rh3", question: "Who wrote '1984'?", options: ["Aldous Huxley", "George Orwell", "Ray Bradbury", "Ernest Hemingway"], correctIndex: 1 },
        { id: "rh4", question: "What is 'soliloquy'?", options: ["A group song", "A character speaking their thoughts alone", "A type of dance", "A short poem"], correctIndex: 1 },
        { id: "rh5", question: "Which is a characteristic of 'Modernism'?", options: ["Strict rhyme", "Fragmentation and stream of consciousness", "Focus on nature only", "Heroic couplets"], correctIndex: 1 }
    ],
    "science_high": [
        { id: "sh1", question: "What is the result of mitosis?", options: ["Two identical cells", "Four different cells", "One larger cell", "No cells"], correctIndex: 0 },
        { id: "sh2", question: "What is the chemical formula for Glucose?", options: ["H2O", "CO2", "C6H12O6", "NaCl"], correctIndex: 2 },
        { id: "sh3", question: "What is the speed of light in a vacuum?", options: ["300,000 km/s", "150,000 km/s", "500,000 km/s", "1,000,000 km/s"], correctIndex: 0 },
        { id: "sh4", question: "Which law states that energy cannot be created or destroyed?", options: ["Newton's First Law", "Law of Conservation of Energy", "Ohm's Law", "Boyle's Law"], correctIndex: 1 },
        { id: "sh5", question: "What is the pH of a neutral solution?", options: ["1", "7", "14", "0"], correctIndex: 1 }
    ],
    "social_studies_middle": [
        { id: "ssm1", question: "Which civilization built the pyramids?", options: ["Greek", "Roman", "Egyptian", "Mayan"], correctIndex: 2 },
        { id: "ssm2", question: "What was the main purpose of the Silk Road?", options: ["War", "Trade", "Religion", "Tourism"], correctIndex: 1 },
        { id: "ssm3", question: "Who was the leader of the Underground Railroad?", options: ["Harriet Tubman", "Abraham Lincoln", "Frederick Douglass", "John Brown"], correctIndex: 0 },
        { id: "ssm4", question: "What is the longest river in the world?", options: ["Amazon", "Nile", "Mississippi", "Yangtze"], correctIndex: 1 },
        { id: "ssm5", question: "Which document begins 'We the People'?", options: ["Declaration", "Bill of Rights", "Constitution", "Magna Carta"], correctIndex: 2 }
    ]
}

// Topic-specific fallback questions
export const TOPIC_FALLBACKS: { [key: string]: Question[] } = {
    "counting by 10s": [
        { id: "c10_1", question: "10, 20, 30, _?", options: ["35", "40", "50", "60"], correctIndex: 1 },
        { id: "c10_2", question: "What comes after 80 when counting by 10s?", options: ["81", "85", "90", "100"], correctIndex: 2 },
        { id: "c10_3", question: "If you have 4 tens, what is the number?", options: ["4", "14", "40", "400"], correctIndex: 2 },
        { id: "c10_4", question: "How many tens are in 100?", options: ["5", "10", "20", "100"], correctIndex: 1 },
        { id: "c10_5", question: "50, 60, _, 80", options: ["65", "70", "75", "90"], correctIndex: 1 },
        { id: "c10_6", question: "What is 10 more than 30?", options: ["31", "40", "50", "60"], correctIndex: 1 },
        { id: "c10_7", question: "Counting by 10s: 0, 10, 20, 30, 40, _?", options: ["45", "50", "60", "70"], correctIndex: 1 },
        { id: "c10_8", question: "Which number is not hit when counting by 10s from 0?", options: ["20", "35", "50", "90"], correctIndex: 1 },
        { id: "c10_9", question: "What is 9 tens?", options: ["9", "19", "90", "900"], correctIndex: 2 },
        { id: "c10_10", question: "How do you write 'seventy' in numbers?", options: ["17", "7", "70", "700"], correctIndex: 2 }
    ],
    "counting by 2s": [
        { id: "c2_1", question: "2, 4, 6, _?", options: ["7", "8", "9", "10"], correctIndex: 1 },
        { id: "c2_2", question: "What comes next: 10, 12, 14, _?", options: ["15", "16", "17", "18"], correctIndex: 1 }
    ],
    "counting by 5s": [
        { id: "c5_1", question: "5, 10, 15, _?", options: ["20", "25", "30", "35"], correctIndex: 0 },
        { id: "c5_2", question: "What comes after 25 when counting by 5s?", options: ["26", "27", "30", "35"], correctIndex: 2 }
    ],
    "addition within 20": [
        { id: "add20_1", question: "What is 8 + 5?", options: ["12", "13", "14", "15"], correctIndex: 1 },
        { id: "add20_2", question: "What is 9 + 7?", options: ["15", "16", "17", "18"], correctIndex: 1 },
        { id: "add20_3", question: "What is 12 + 6?", options: ["17", "18", "19", "20"], correctIndex: 1 }
    ],
    "multiplication facts": [
        { id: "mult_1", question: "What is 5 x 5?", options: ["20", "25", "30", "35"], correctIndex: 1 },
        { id: "mult_2", question: "What is 2 x 8?", options: ["14", "16", "18", "20"], correctIndex: 1 },
        { id: "mult_3", question: "What is 10 x 4?", options: ["14", "40", "44", "400"], correctIndex: 1 }
    ],
    "photosynthesis": [
        { id: "photo_1", question: "What do plants need for photosynthesis?", options: ["Milk", "Sunlight", "Juice", "Soda"], correctIndex: 1 },
        { id: "photo_2", question: "What gas do plants release?", options: ["Carbon Dioxide", "Oxygen", "Nitrogen", "Helium"], correctIndex: 1 },
        { id: "photo_3", question: "Where does photosynthesis happen?", options: ["Roots", "Leaves", "Stem", "Flowers"], correctIndex: 1 }
    ],
    "parts of speech": [
        { id: "pos_1", question: "Which word is a verb?", options: ["Dog", "Run", "Blue", "Big"], correctIndex: 1 },
        { id: "pos_2", question: "Which word is an adjective?", options: ["Table", "Apple", "Beautiful", "Jump"], correctIndex: 2 },
        { id: "pos_3", question: "Which is a proper noun?", options: ["city", "country", "Paris", "street"], correctIndex: 2 }
    ],
    "state capitals": [
        { id: "sc_1", question: "What is the capital of New York?", options: ["New York City", "Albany", "Buffalo", "Rochester"], correctIndex: 1 },
        { id: "sc_2", question: "What is the capital of California?", options: ["Los Angeles", "San Francisco", "Sacramento", "San Diego"], correctIndex: 2 },
        { id: "sc_3", question: "What is the capital of Texas?", options: ["Houston", "Dallas", "Austin", "San Antonio"], correctIndex: 2 }
    ]
}

export function getFallbackQuestions(grade: number, subject: string, count: number, topic?: string): Question[] {
    const subjectKey = subject.toLowerCase()
    const topicKey = topic?.toLowerCase() || ""
    let pool: Question[] = []

    // 1. Try topic-specific pool first
    if (topicKey && TOPIC_FALLBACKS[topicKey]) {
        pool = TOPIC_FALLBACKS[topicKey]
    }

    // 2. If no topic pool or too few questions, use subject pool
    if (pool.length < count) {
        let subjectPool: Question[] = []

        // Advanced Grade-Based Routing
        if (grade >= 9) {
            if (subjectKey.includes("math")) subjectPool = FALLBACK_QUESTIONS["math_high"]
            else if (subjectKey.includes("science")) subjectPool = FALLBACK_QUESTIONS["science_high"]
            else if (subjectKey.includes("read") || subjectKey.includes("english") || subjectKey.includes("write")) subjectPool = FALLBACK_QUESTIONS["reading_high"]
            else subjectPool = FALLBACK_QUESTIONS["social_studies_high"]
        } else if (grade >= 6) {
            if (subjectKey.includes("math")) subjectPool = FALLBACK_QUESTIONS["math_middle"]
            else if (subjectKey.includes("science")) subjectPool = FALLBACK_QUESTIONS["science_middle"]
            else if (subjectKey.includes("read") || subjectKey.includes("english") || subjectKey.includes("write")) subjectPool = FALLBACK_QUESTIONS["reading_middle"]
            else subjectPool = FALLBACK_QUESTIONS["social_studies_middle"]
        } else {
            // Elementary
            if (subjectKey.includes("math")) subjectPool = FALLBACK_QUESTIONS["math_elementary"]
            else if (subjectKey.includes("read") || subjectKey.includes("english") || subjectKey.includes("write")) subjectPool = FALLBACK_QUESTIONS["reading_elementary"]
            else if (subjectKey.includes("science")) subjectPool = FALLBACK_QUESTIONS["science_elementary"]
            else if (subjectKey.includes("physical") || subjectKey.includes("pe") || subjectKey.includes("health")) subjectPool = FALLBACK_QUESTIONS["pe_elementary"]
            else if (subjectKey.includes("social") || subjectKey.includes("history") || subjectKey.includes("geography")) subjectPool = FALLBACK_QUESTIONS["social_studies_elementary"]
            else {
                subjectPool = FALLBACK_QUESTIONS["reading_elementary"]
            }
        }

        // Merge pools and avoid duplicates
        const existingIds = new Set(pool.map(q => q.id))
        const filteredSubjectPool = subjectPool.filter(q => !existingIds.has(q.id))
        pool = [...pool, ...filteredSubjectPool]
    }

    // 3. Ultimate safety check - if still empty, use elementary reading as global fallback
    if (pool.length === 0) {
        pool = FALLBACK_QUESTIONS["reading_elementary"]
    }

    // Shuffle and slice
    return [...pool].sort(() => Math.random() - 0.5).slice(0, count)
}
