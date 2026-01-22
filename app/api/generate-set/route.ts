import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

// Comprehensive fallback questions - 25 per category
const FALLBACK_QUESTIONS: { [key: string]: any[] } = {
  // Grade 1-3 Math (25 questions)
  "math_elementary": [
    { id: "me1", question: "What is 3 + 4?", options: ["5", "6", "7", "8"], correctIndex: 2 },
    { id: "me2", question: "What is 10 - 3?", options: ["5", "6", "7", "8"], correctIndex: 2 },
    { id: "me3", question: "How many sides does a triangle have?", options: ["2", "3", "4", "5"], correctIndex: 1 },
    { id: "me4", question: "What is 2 + 2?", options: ["2", "3", "4", "5"], correctIndex: 2 },
    { id: "me5", question: "What is 5 + 3?", options: ["6", "7", "8", "9"], correctIndex: 2 },
    { id: "me6", question: "What is 9 - 4?", options: ["3", "4", "5", "6"], correctIndex: 2 },
    { id: "me7", question: "How many corners does a square have?", options: ["2", "3", "4", "5"], correctIndex: 2 },
    { id: "me8", question: "What is 6 + 2?", options: ["6", "7", "8", "9"], correctIndex: 2 },
    { id: "me9", question: "What number comes after 15?", options: ["14", "15", "16", "17"], correctIndex: 2 },
    { id: "me10", question: "What is 4 + 5?", options: ["7", "8", "9", "10"], correctIndex: 2 },
    { id: "me11", question: "What is 8 - 3?", options: ["4", "5", "6", "7"], correctIndex: 1 },
    { id: "me12", question: "What is 7 + 1?", options: ["6", "7", "8", "9"], correctIndex: 2 },
    { id: "me13", question: "How many sides does a rectangle have?", options: ["3", "4", "5", "6"], correctIndex: 1 },
    { id: "me14", question: "What is 10 - 5?", options: ["3", "4", "5", "6"], correctIndex: 2 },
    { id: "me15", question: "What is 1 + 9?", options: ["8", "9", "10", "11"], correctIndex: 2 },
    { id: "me16", question: "What number comes before 10?", options: ["8", "9", "10", "11"], correctIndex: 1 },
    { id: "me17", question: "What is 6 + 6?", options: ["10", "11", "12", "13"], correctIndex: 2 },
    { id: "me18", question: "How many fingers on two hands?", options: ["8", "9", "10", "12"], correctIndex: 2 },
    { id: "me19", question: "What is 15 - 5?", options: ["8", "9", "10", "11"], correctIndex: 2 },
    { id: "me20", question: "What is 3 + 3 + 3?", options: ["6", "7", "8", "9"], correctIndex: 3 },
    { id: "me21", question: "What shape has no corners?", options: ["Square", "Triangle", "Circle", "Rectangle"], correctIndex: 2 },
    { id: "me22", question: "What is 20 - 10?", options: ["5", "10", "15", "20"], correctIndex: 1 },
    { id: "me23", question: "What is 4 + 4?", options: ["6", "7", "8", "9"], correctIndex: 2 },
    { id: "me24", question: "How many days in a week?", options: ["5", "6", "7", "8"], correctIndex: 2 },
    { id: "me25", question: "What is 11 - 1?", options: ["9", "10", "11", "12"], correctIndex: 1 },
  ],

  // Grade 4-6 Math (25 questions)
  "math_middle": [
    { id: "mm1", question: "What is 12 × 5?", options: ["50", "55", "60", "65"], correctIndex: 2 },
    { id: "mm2", question: "What is 144 ÷ 12?", options: ["10", "11", "12", "13"], correctIndex: 2 },
    { id: "mm3", question: "What is 25% of 80?", options: ["15", "20", "25", "30"], correctIndex: 1 },
    { id: "mm4", question: "What is 7 × 8?", options: ["54", "56", "58", "60"], correctIndex: 1 },
    { id: "mm5", question: "What is 100 - 37?", options: ["53", "63", "73", "83"], correctIndex: 1 },
    { id: "mm6", question: "What is 15 × 4?", options: ["50", "55", "60", "65"], correctIndex: 2 },
    { id: "mm7", question: "What is 81 ÷ 9?", options: ["7", "8", "9", "10"], correctIndex: 2 },
    { id: "mm8", question: "What is 1/2 + 1/4?", options: ["1/2", "2/4", "3/4", "1"], correctIndex: 2 },
    { id: "mm9", question: "What is 6²?", options: ["12", "24", "36", "42"], correctIndex: 2 },
    { id: "mm10", question: "What is 50% of 120?", options: ["50", "55", "60", "65"], correctIndex: 2 },
    { id: "mm11", question: "What is 9 × 9?", options: ["72", "81", "90", "99"], correctIndex: 1 },
    { id: "mm12", question: "What is 200 ÷ 4?", options: ["40", "50", "60", "70"], correctIndex: 1 },
    { id: "mm13", question: "What is 3/4 - 1/4?", options: ["1/4", "1/2", "2/4", "3/4"], correctIndex: 1 },
    { id: "mm14", question: "What is 11 × 11?", options: ["111", "121", "131", "141"], correctIndex: 1 },
    { id: "mm15", question: "What is 10% of 250?", options: ["15", "20", "25", "30"], correctIndex: 2 },
    { id: "mm16", question: "What is 8 × 7?", options: ["54", "56", "58", "64"], correctIndex: 1 },
    { id: "mm17", question: "What is 1000 ÷ 10?", options: ["10", "100", "1000", "10000"], correctIndex: 1 },
    { id: "mm18", question: "What is 2/3 of 30?", options: ["10", "15", "20", "25"], correctIndex: 2 },
    { id: "mm19", question: "What is 5³?", options: ["15", "25", "125", "625"], correctIndex: 2 },
    { id: "mm20", question: "What is 75% of 40?", options: ["20", "25", "30", "35"], correctIndex: 2 },
    { id: "mm21", question: "What is the perimeter of a square with side 5?", options: ["15", "20", "25", "30"], correctIndex: 1 },
    { id: "mm22", question: "What is 6 × 12?", options: ["62", "66", "72", "78"], correctIndex: 2 },
    { id: "mm23", question: "What is 45 ÷ 5?", options: ["7", "8", "9", "10"], correctIndex: 2 },
    { id: "mm24", question: "What is 0.5 + 0.25?", options: ["0.25", "0.50", "0.75", "1.00"], correctIndex: 2 },
    { id: "mm25", question: "What is the area of a rectangle 6 × 4?", options: ["20", "24", "28", "32"], correctIndex: 1 },
  ],

  // Grade 7-12 Math (25 questions)
  "math_high": [
    { id: "mh1", question: "Solve: 2x + 5 = 15", options: ["x = 3", "x = 4", "x = 5", "x = 6"], correctIndex: 2 },
    { id: "mh2", question: "What is the value of π rounded to 2 decimals?", options: ["3.12", "3.14", "3.16", "3.18"], correctIndex: 1 },
    { id: "mh3", question: "What is √144?", options: ["10", "11", "12", "13"], correctIndex: 2 },
    { id: "mh4", question: "Solve: 3x - 9 = 12", options: ["x = 5", "x = 6", "x = 7", "x = 8"], correctIndex: 2 },
    { id: "mh5", question: "What is 2³?", options: ["4", "6", "8", "10"], correctIndex: 2 },
    { id: "mh6", question: "What is the area of a circle with radius 5? (π ≈ 3.14)", options: ["31.4", "50", "78.5", "100"], correctIndex: 2 },
    { id: "mh7", question: "What is sin(90°)?", options: ["0", "0.5", "1", "undefined"], correctIndex: 2 },
    { id: "mh8", question: "Simplify: (x²)(x³)", options: ["x⁵", "x⁶", "2x⁵", "x⁹"], correctIndex: 0 },
    { id: "mh9", question: "What is log₁₀(100)?", options: ["1", "2", "10", "100"], correctIndex: 1 },
    { id: "mh10", question: "Factor: x² - 9", options: ["(x-3)(x-3)", "(x+3)(x+3)", "(x-3)(x+3)", "(x-9)(x+1)"], correctIndex: 2 },
    { id: "mh11", question: "What is cos(0°)?", options: ["0", "0.5", "1", "undefined"], correctIndex: 2 },
    { id: "mh12", question: "Solve: x² = 49", options: ["x = 5", "x = 6", "x = 7", "x = 8"], correctIndex: 2 },
    { id: "mh13", question: "What is √225?", options: ["13", "14", "15", "16"], correctIndex: 2 },
    { id: "mh14", question: "Simplify: 3x + 2x - x", options: ["3x", "4x", "5x", "6x"], correctIndex: 1 },
    { id: "mh15", question: "What is the slope of y = 3x + 2?", options: ["1", "2", "3", "5"], correctIndex: 2 },
    { id: "mh16", question: "What is 4! (4 factorial)?", options: ["12", "16", "24", "48"], correctIndex: 2 },
    { id: "mh17", question: "Solve: 5x = 35", options: ["x = 5", "x = 6", "x = 7", "x = 8"], correctIndex: 2 },
    { id: "mh18", question: "What is tan(45°)?", options: ["0", "0.5", "1", "undefined"], correctIndex: 2 },
    { id: "mh19", question: "What is (2 + 3i) - (1 + i)?", options: ["1 + 2i", "1 + 4i", "3 + 2i", "3 + 4i"], correctIndex: 0 },
    { id: "mh20", question: "What is the derivative of x²?", options: ["x", "2x", "x²", "2x²"], correctIndex: 1 },
    { id: "mh21", question: "Solve: 2x + 3 = x + 7", options: ["x = 2", "x = 3", "x = 4", "x = 5"], correctIndex: 2 },
    { id: "mh22", question: "What is ∛27?", options: ["2", "3", "4", "9"], correctIndex: 1 },
    { id: "mh23", question: "If f(x) = 2x, what is f(5)?", options: ["7", "10", "25", "32"], correctIndex: 1 },
    { id: "mh24", question: "What is the y-intercept of y = 2x + 5?", options: ["2", "5", "7", "10"], correctIndex: 1 },
    { id: "mh25", question: "Simplify: 2(x + 3)", options: ["2x + 3", "2x + 5", "2x + 6", "x + 6"], correctIndex: 2 },
  ],

  // Reading/English (25 questions)
  "reading": [
    { id: "r1", question: "What is a synonym for 'happy'?", options: ["Sad", "Joyful", "Angry", "Tired"], correctIndex: 1 },
    { id: "r2", question: "What is the opposite of 'big'?", options: ["Large", "Huge", "Small", "Tall"], correctIndex: 2 },
    { id: "r3", question: "Which word is a noun?", options: ["Run", "Beautiful", "Cat", "Quickly"], correctIndex: 2 },
    { id: "r4", question: "What is the plural of 'child'?", options: ["Childs", "Children", "Childes", "Child"], correctIndex: 1 },
    { id: "r5", question: "Which is a complete sentence?", options: ["Running fast", "The cat", "She runs quickly.", "Very happy"], correctIndex: 2 },
    { id: "r6", question: "What is a verb?", options: ["A person, place, or thing", "An action word", "A describing word", "A naming word"], correctIndex: 1 },
    { id: "r7", question: "What punctuation ends a question?", options: ["Period", "Comma", "Question mark", "Exclamation point"], correctIndex: 2 },
    { id: "r8", question: "What is an antonym for 'cold'?", options: ["Freezing", "Chilly", "Hot", "Cool"], correctIndex: 2 },
    { id: "r9", question: "Which word is an adjective?", options: ["Quickly", "Beautiful", "Run", "The"], correctIndex: 1 },
    { id: "r10", question: "What is the past tense of 'go'?", options: ["Goes", "Going", "Went", "Gone"], correctIndex: 2 },
    { id: "r11", question: "What is a synonym for 'fast'?", options: ["Slow", "Quick", "Heavy", "Light"], correctIndex: 1 },
    { id: "r12", question: "Which word is a pronoun?", options: ["Dog", "Run", "She", "Blue"], correctIndex: 2 },
    { id: "r13", question: "What is the plural of 'mouse'?", options: ["Mouses", "Mouse", "Mice", "Mices"], correctIndex: 2 },
    { id: "r14", question: "What is an adverb?", options: ["Describes a noun", "Describes a verb", "Names a thing", "Joins words"], correctIndex: 1 },
    { id: "r15", question: "Which sentence is correct?", options: ["He don't like it", "He doesn't like it", "He not like it", "He no like it"], correctIndex: 1 },
    { id: "r16", question: "What is a metaphor?", options: ["A comparison using 'like'", "A direct comparison", "An exaggeration", "A question"], correctIndex: 1 },
    { id: "r17", question: "What is the opposite of 'begin'?", options: ["Start", "Continue", "End", "Middle"], correctIndex: 2 },
    { id: "r18", question: "Which is a compound word?", options: ["Happy", "Sunshine", "Running", "Beautiful"], correctIndex: 1 },
    { id: "r19", question: "What is the root word in 'unhappy'?", options: ["Un", "Happy", "Unhap", "Py"], correctIndex: 1 },
    { id: "r20", question: "What does 'gigantic' mean?", options: ["Very small", "Very fast", "Very large", "Very quiet"], correctIndex: 2 },
    { id: "r21", question: "Which is a proper noun?", options: ["city", "dog", "Paris", "book"], correctIndex: 2 },
    { id: "r22", question: "What is a simile?", options: ["Comparison using like/as", "Direct comparison", "Exaggeration", "Repetition"], correctIndex: 0 },
    { id: "r23", question: "What is the past tense of 'eat'?", options: ["Eated", "Ate", "Eaten", "Eating"], correctIndex: 1 },
    { id: "r24", question: "Which word rhymes with 'cat'?", options: ["Dog", "Hat", "Cup", "Run"], correctIndex: 1 },
    { id: "r25", question: "What is an antonym for 'empty'?", options: ["Hollow", "Full", "Light", "Dark"], correctIndex: 1 },
  ],

  // Science (25 questions)
  "science": [
    { id: "s1", question: "What planet is known as the Red Planet?", options: ["Venus", "Mars", "Jupiter", "Saturn"], correctIndex: 1 },
    { id: "s2", question: "What is H₂O commonly known as?", options: ["Salt", "Sugar", "Water", "Oxygen"], correctIndex: 2 },
    { id: "s3", question: "How many planets are in our solar system?", options: ["7", "8", "9", "10"], correctIndex: 1 },
    { id: "s4", question: "What is the largest organ in the human body?", options: ["Heart", "Brain", "Liver", "Skin"], correctIndex: 3 },
    { id: "s5", question: "What gas do plants absorb from air?", options: ["Oxygen", "Carbon dioxide", "Nitrogen", "Hydrogen"], correctIndex: 1 },
    { id: "s6", question: "What force keeps us on the ground?", options: ["Magnetism", "Friction", "Gravity", "Electricity"], correctIndex: 2 },
    { id: "s7", question: "What is the center of an atom called?", options: ["Electron", "Proton", "Nucleus", "Neutron"], correctIndex: 2 },
    { id: "s8", question: "What do we call animals that eat only plants?", options: ["Carnivores", "Herbivores", "Omnivores", "Insectivores"], correctIndex: 1 },
    { id: "s9", question: "What is the chemical symbol for gold?", options: ["Go", "Gd", "Au", "Ag"], correctIndex: 2 },
    { id: "s10", question: "What type of energy does the sun provide?", options: ["Nuclear", "Solar", "Wind", "Hydroelectric"], correctIndex: 1 },
    { id: "s11", question: "What is the hardest natural substance?", options: ["Gold", "Iron", "Diamond", "Quartz"], correctIndex: 2 },
    { id: "s12", question: "What organ pumps blood?", options: ["Brain", "Lungs", "Heart", "Liver"], correctIndex: 2 },
    { id: "s13", question: "What gas do humans breathe out?", options: ["Oxygen", "Carbon dioxide", "Nitrogen", "Helium"], correctIndex: 1 },
    { id: "s14", question: "What is the boiling point of water in Celsius?", options: ["50°C", "100°C", "150°C", "200°C"], correctIndex: 1 },
    { id: "s15", question: "What is the closest star to Earth?", options: ["Moon", "Mars", "Sun", "Alpha Centauri"], correctIndex: 2 },
    { id: "s16", question: "What type of animal is a frog?", options: ["Reptile", "Mammal", "Amphibian", "Fish"], correctIndex: 2 },
    { id: "s17", question: "What is the chemical formula for salt?", options: ["NaCl", "H2O", "CO2", "O2"], correctIndex: 0 },
    { id: "s18", question: "How many bones are in the human body?", options: ["106", "156", "206", "256"], correctIndex: 2 },
    { id: "s19", question: "What causes the seasons?", options: ["Moon's orbit", "Earth's tilt", "Sun's rotation", "Wind patterns"], correctIndex: 1 },
    { id: "s20", question: "What is the largest planet?", options: ["Saturn", "Jupiter", "Neptune", "Uranus"], correctIndex: 1 },
    { id: "s21", question: "What part of the plant makes food?", options: ["Roots", "Stem", "Leaves", "Flowers"], correctIndex: 2 },
    { id: "s22", question: "What is molten rock called?", options: ["Granite", "Magma", "Marble", "Limestone"], correctIndex: 1 },
    { id: "s23", question: "What is the speed of light?", options: ["300 km/s", "3000 km/s", "300,000 km/s", "3,000,000 km/s"], correctIndex: 2 },
    { id: "s24", question: "What is the main gas in Earth's atmosphere?", options: ["Oxygen", "Carbon dioxide", "Nitrogen", "Hydrogen"], correctIndex: 2 },
    { id: "s25", question: "What type of rock is formed from cooled lava?", options: ["Sedimentary", "Metamorphic", "Igneous", "Mineral"], correctIndex: 2 },
  ],

  // Social Studies / History (25 questions)
  "history": [
    { id: "h1", question: "What is the capital of France?", options: ["London", "Berlin", "Paris", "Madrid"], correctIndex: 2 },
    { id: "h2", question: "How many continents are there?", options: ["5", "6", "7", "8"], correctIndex: 2 },
    { id: "h3", question: "What is the largest ocean?", options: ["Atlantic", "Indian", "Arctic", "Pacific"], correctIndex: 3 },
    { id: "h4", question: "Who was the first President of the United States?", options: ["Lincoln", "Washington", "Jefferson", "Adams"], correctIndex: 1 },
    { id: "h5", question: "What year did World War II end?", options: ["1943", "1944", "1945", "1946"], correctIndex: 2 },
    { id: "h6", question: "What is the longest river in the world?", options: ["Amazon", "Nile", "Mississippi", "Yangtze"], correctIndex: 1 },
    { id: "h7", question: "What country gifted the Statue of Liberty to the USA?", options: ["England", "Germany", "France", "Spain"], correctIndex: 2 },
    { id: "h8", question: "What is the capital of Japan?", options: ["Seoul", "Beijing", "Tokyo", "Bangkok"], correctIndex: 2 },
    { id: "h9", question: "Who discovered America in 1492?", options: ["Magellan", "Columbus", "Vespucci", "Drake"], correctIndex: 1 },
    { id: "h10", question: "What is the largest country by area?", options: ["China", "USA", "Canada", "Russia"], correctIndex: 3 },
    { id: "h11", question: "In what year did the Titanic sink?", options: ["1910", "1911", "1912", "1913"], correctIndex: 2 },
    { id: "h12", question: "What ancient wonder was in Egypt?", options: ["Colosseum", "Pyramids", "Parthenon", "Lighthouse"], correctIndex: 1 },
    { id: "h13", question: "What continent is Brazil in?", options: ["Africa", "Europe", "South America", "North America"], correctIndex: 2 },
    { id: "h14", question: "Who wrote the Declaration of Independence?", options: ["Washington", "Adams", "Jefferson", "Franklin"], correctIndex: 2 },
    { id: "h15", question: "What is the capital of Australia?", options: ["Sydney", "Melbourne", "Canberra", "Perth"], correctIndex: 2 },
    { id: "h16", question: "What empire built the Colosseum?", options: ["Greek", "Roman", "Egyptian", "Persian"], correctIndex: 1 },
    { id: "h17", question: "What ocean is between USA and Europe?", options: ["Pacific", "Indian", "Atlantic", "Arctic"], correctIndex: 2 },
    { id: "h18", question: "What is the capital of China?", options: ["Shanghai", "Hong Kong", "Beijing", "Taipei"], correctIndex: 2 },
    { id: "h19", question: "Who was known as the 'Father of India'?", options: ["Nehru", "Gandhi", "Patel", "Bose"], correctIndex: 1 },
    { id: "h20", question: "What year did the Berlin Wall fall?", options: ["1987", "1988", "1989", "1990"], correctIndex: 2 },
    { id: "h21", question: "What is the tallest mountain in the world?", options: ["K2", "Kilimanjaro", "Everest", "Denali"], correctIndex: 2 },
    { id: "h22", question: "What country has the most people?", options: ["India", "USA", "China", "Indonesia"], correctIndex: 2 },
    { id: "h23", question: "What desert is the largest in the world?", options: ["Gobi", "Kalahari", "Sahara", "Arabian"], correctIndex: 2 },
    { id: "h24", question: "What language has the most native speakers?", options: ["English", "Spanish", "Mandarin", "Hindi"], correctIndex: 2 },
    { id: "h25", question: "What is the capital of the United Kingdom?", options: ["Manchester", "London", "Liverpool", "Edinburgh"], correctIndex: 1 },
  ],

  // General Knowledge (25 questions)
  "general": [
    { id: "g1", question: "How many days are in a year?", options: ["360", "364", "365", "366"], correctIndex: 2 },
    { id: "g2", question: "What color do you get mixing blue and yellow?", options: ["Purple", "Orange", "Green", "Brown"], correctIndex: 2 },
    { id: "g3", question: "Who painted the Mona Lisa?", options: ["Picasso", "Van Gogh", "Da Vinci", "Michelangelo"], correctIndex: 2 },
    { id: "g4", question: "How many hours are in a day?", options: ["12", "20", "24", "48"], correctIndex: 2 },
    { id: "g5", question: "What is the tallest animal?", options: ["Elephant", "Giraffe", "Horse", "Camel"], correctIndex: 1 },
    { id: "g6", question: "How many weeks are in a year?", options: ["48", "50", "52", "54"], correctIndex: 2 },
    { id: "g7", question: "What season comes after summer?", options: ["Spring", "Winter", "Autumn", "Summer"], correctIndex: 2 },
    { id: "g8", question: "How many minutes in an hour?", options: ["30", "45", "60", "90"], correctIndex: 2 },
    { id: "g9", question: "What is the fastest land animal?", options: ["Lion", "Cheetah", "Horse", "Gazelle"], correctIndex: 1 },
    { id: "g10", question: "How many sides does a hexagon have?", options: ["4", "5", "6", "8"], correctIndex: 2 },
    { id: "g11", question: "What is the largest mammal?", options: ["Elephant", "Blue Whale", "Giraffe", "Hippo"], correctIndex: 1 },
    { id: "g12", question: "How many colors in a rainbow?", options: ["5", "6", "7", "8"], correctIndex: 2 },
    { id: "g13", question: "What is baby frog called?", options: ["Calf", "Tadpole", "Cub", "Pup"], correctIndex: 1 },
    { id: "g14", question: "What do bees make?", options: ["Milk", "Honey", "Silk", "Wax"], correctIndex: 1 },
    { id: "g15", question: "How many seasons are there?", options: ["2", "3", "4", "5"], correctIndex: 2 },
    { id: "g16", question: "What is frozen water called?", options: ["Steam", "Ice", "Fog", "Mist"], correctIndex: 1 },
    { id: "g17", question: "What color is an emerald?", options: ["Red", "Blue", "Green", "Yellow"], correctIndex: 2 },
    { id: "g18", question: "What is a group of lions called?", options: ["Pack", "Herd", "Pride", "Flock"], correctIndex: 2 },
    { id: "g19", question: "How many months have 31 days?", options: ["5", "6", "7", "8"], correctIndex: 2 },
    { id: "g20", question: "What animal is known as man's best friend?", options: ["Cat", "Dog", "Horse", "Rabbit"], correctIndex: 1 },
    { id: "g21", question: "What shape is a stop sign?", options: ["Circle", "Square", "Triangle", "Octagon"], correctIndex: 3 },
    { id: "g22", question: "What comes after one million?", options: ["Billion", "Trillion", "Ten million", "Hundred thousand"], correctIndex: 0 },
    { id: "g23", question: "What color is a ruby?", options: ["Blue", "Green", "Red", "Yellow"], correctIndex: 2 },
    { id: "g24", question: "How many legs does a spider have?", options: ["4", "6", "8", "10"], correctIndex: 2 },
    { id: "g25", question: "What is the opposite of 'day'?", options: ["Morning", "Evening", "Night", "Afternoon"], correctIndex: 2 },
  ],

  // Computer Science (25 questions)
  "computer": [
    { id: "c1", question: "What does CPU stand for?", options: ["Central Processing Unit", "Computer Personal Unit", "Central Program Utility", "Core Processing Unit"], correctIndex: 0 },
    { id: "c2", question: "What is the brain of a computer?", options: ["RAM", "CPU", "Hard Drive", "Monitor"], correctIndex: 1 },
    { id: "c3", question: "What does RAM stand for?", options: ["Read Access Memory", "Random Access Memory", "Run All Memory", "Real Active Memory"], correctIndex: 1 },
    { id: "c4", question: "What language is used for web pages?", options: ["Python", "Java", "HTML", "C++"], correctIndex: 2 },
    { id: "c5", question: "What does www stand for?", options: ["World Wide Web", "Web World Wide", "Wide World Web", "Web Wide World"], correctIndex: 0 },
    { id: "c6", question: "What is a bug in programming?", options: ["An insect", "An error", "A feature", "A program"], correctIndex: 1 },
    { id: "c7", question: "What device is used to click on screen?", options: ["Keyboard", "Monitor", "Mouse", "Speaker"], correctIndex: 2 },
    { id: "c8", question: "What is the binary system based on?", options: ["1 digit", "2 digits", "8 digits", "10 digits"], correctIndex: 1 },
    { id: "c9", question: "What is an algorithm?", options: ["A type of computer", "Step-by-step instructions", "A programming language", "A website"], correctIndex: 1 },
    { id: "c10", question: "What does USB stand for?", options: ["Universal Serial Bus", "United System Bus", "Universal System Byte", "United Serial Byte"], correctIndex: 0 },
    { id: "c11", question: "What is the main function of an operating system?", options: ["Play games", "Manage hardware/software", "Browse internet", "Send emails"], correctIndex: 1 },
    { id: "c12", question: "What is a loop in programming?", options: ["A circle", "Repeated code", "An error", "A variable"], correctIndex: 1 },
    { id: "c13", question: "What does HTTP stand for?", options: ["HyperText Transfer Protocol", "High Text Transfer Protocol", "Hyper Transfer Text Protocol", "High Transfer Text Protocol"], correctIndex: 0 },
    { id: "c14", question: "What is a variable?", options: ["A constant value", "A stored value that can change", "A type of loop", "An error message"], correctIndex: 1 },
    { id: "c15", question: "What is cloud computing?", options: ["Computing in the sky", "Storing data on remote servers", "A type of weather app", "A new computer"], correctIndex: 1 },
    { id: "c16", question: "What is an input device?", options: ["Monitor", "Keyboard", "Printer", "Speaker"], correctIndex: 1 },
    { id: "c17", question: "What is Python?", options: ["A snake", "A programming language", "A website", "An operating system"], correctIndex: 1 },
    { id: "c18", question: "What does AI stand for?", options: ["Automatic Intelligence", "Artificial Intelligence", "Advanced Internet", "Automated Input"], correctIndex: 1 },
    { id: "c19", question: "What is a website address called?", options: ["Email", "URL", "IP", "DNS"], correctIndex: 1 },
    { id: "c20", question: "What is debugging?", options: ["Adding bugs", "Removing errors", "Writing code", "Saving files"], correctIndex: 1 },
    { id: "c21", question: "What is a firewall?", options: ["A wall of fire", "Security system", "A browser", "A virus"], correctIndex: 1 },
    { id: "c22", question: "What does PDF stand for?", options: ["Portable Document Format", "Print Document File", "Personal Data Format", "Public Document Format"], correctIndex: 0 },
    { id: "c23", question: "What is an output device?", options: ["Mouse", "Keyboard", "Monitor", "Microphone"], correctIndex: 2 },
    { id: "c24", question: "What is a function in programming?", options: ["Reusable block of code", "An error", "A file type", "A variable"], correctIndex: 0 },
    { id: "c25", question: "What is encryption?", options: ["Deleting data", "Securing data with code", "Copying data", "Printing data"], correctIndex: 1 },
  ],

  // Art & Music (25 questions)
  "art": [
    { id: "a1", question: "What are the three primary colors?", options: ["Red, Green, Blue", "Red, Yellow, Blue", "Red, Orange, Yellow", "Blue, Green, Purple"], correctIndex: 1 },
    { id: "a2", question: "Who painted the Starry Night?", options: ["Picasso", "Van Gogh", "Monet", "Da Vinci"], correctIndex: 1 },
    { id: "a3", question: "What is the musical term for loud?", options: ["Piano", "Forte", "Allegro", "Adagio"], correctIndex: 1 },
    { id: "a4", question: "How many lines does a music staff have?", options: ["4", "5", "6", "7"], correctIndex: 1 },
    { id: "a5", question: "What color do you get mixing red and blue?", options: ["Green", "Orange", "Purple", "Brown"], correctIndex: 2 },
    { id: "a6", question: "What instrument has 88 keys?", options: ["Guitar", "Violin", "Piano", "Flute"], correctIndex: 2 },
    { id: "a7", question: "What is a sculpture made of clay called?", options: ["Mosaic", "Pottery", "Collage", "Sketch"], correctIndex: 1 },
    { id: "a8", question: "What is the musical term for slow?", options: ["Allegro", "Adagio", "Forte", "Piano"], correctIndex: 1 },
    { id: "a9", question: "What color is made by mixing all colors of light?", options: ["Black", "White", "Gray", "Brown"], correctIndex: 1 },
    { id: "a10", question: "What family does the violin belong to?", options: ["Brass", "Woodwind", "String", "Percussion"], correctIndex: 2 },
    { id: "a11", question: "What is drawing with pencil called?", options: ["Painting", "Sketching", "Sculpting", "Printing"], correctIndex: 1 },
    { id: "a12", question: "How many strings does a standard guitar have?", options: ["4", "5", "6", "8"], correctIndex: 2 },
    { id: "a13", question: "What are colors opposite on the color wheel called?", options: ["Primary", "Secondary", "Complementary", "Tertiary"], correctIndex: 2 },
    { id: "a14", question: "What clef is used for high notes?", options: ["Bass", "Treble", "Alto", "Tenor"], correctIndex: 1 },
    { id: "a15", question: "What is a painting of a person called?", options: ["Landscape", "Portrait", "Still life", "Abstract"], correctIndex: 1 },
    { id: "a16", question: "What family does the trumpet belong to?", options: ["String", "Woodwind", "Brass", "Percussion"], correctIndex: 2 },
    { id: "a17", question: "What is the space between two notes called?", options: ["Chord", "Interval", "Scale", "Key"], correctIndex: 1 },
    { id: "a18", question: "What is art on walls called?", options: ["Portrait", "Mural", "Sculpture", "Mosaic"], correctIndex: 1 },
    { id: "a19", question: "How many notes are in a musical octave?", options: ["6", "7", "8", "12"], correctIndex: 2 },
    { id: "a20", question: "What tool is used to mix paint colors?", options: ["Brush", "Palette", "Canvas", "Easel"], correctIndex: 1 },
    { id: "a21", question: "What is a group of musicians called?", options: ["Choir", "Orchestra", "Band", "All of these"], correctIndex: 3 },
    { id: "a22", question: "What is a painting of scenery called?", options: ["Portrait", "Landscape", "Still life", "Abstract"], correctIndex: 1 },
    { id: "a23", question: "What symbol means repeat in music?", options: ["Sharp", "Flat", "Repeat sign", "Rest"], correctIndex: 2 },
    { id: "a24", question: "What is the Italian word for soft in music?", options: ["Forte", "Piano", "Mezzo", "Crescendo"], correctIndex: 1 },
    { id: "a25", question: "What is art made from cut paper called?", options: ["Painting", "Sculpture", "Collage", "Sketch"], correctIndex: 2 },
  ],

  // Physical Education (25 questions)
  "pe": [
    { id: "p1", question: "How many players on a soccer team on the field?", options: ["9", "10", "11", "12"], correctIndex: 2 },
    { id: "p2", question: "What sport uses a racket and shuttlecock?", options: ["Tennis", "Badminton", "Squash", "Ping Pong"], correctIndex: 1 },
    { id: "p3", question: "How many points is a basketball free throw worth?", options: ["1", "2", "3", "4"], correctIndex: 0 },
    { id: "p4", question: "What is the term for a score of zero in tennis?", options: ["Nil", "Zero", "Love", "Nothing"], correctIndex: 2 },
    { id: "p5", question: "How long is a marathon in kilometers?", options: ["21 km", "26 km", "42 km", "50 km"], correctIndex: 2 },
    { id: "p6", question: "What sport is played on ice with a puck?", options: ["Curling", "Hockey", "Figure Skating", "Speed Skating"], correctIndex: 1 },
    { id: "p7", question: "How many innings in a standard baseball game?", options: ["7", "8", "9", "10"], correctIndex: 2 },
    { id: "p8", question: "What does 'cardio' exercise improve?", options: ["Flexibility", "Heart health", "Strength", "Balance"], correctIndex: 1 },
    { id: "p9", question: "How many periods in an ice hockey game?", options: ["2", "3", "4", "5"], correctIndex: 1 },
    { id: "p10", question: "What equipment is needed for gymnastics balance?", options: ["Bar", "Beam", "Vault", "Ring"], correctIndex: 1 },
    { id: "p11", question: "How many players on a basketball team on court?", options: ["4", "5", "6", "7"], correctIndex: 1 },
    { id: "p12", question: "What is stretching before exercise called?", options: ["Cool down", "Warm up", "Sprint", "Rest"], correctIndex: 1 },
    { id: "p13", question: "Which sport uses the term 'home run'?", options: ["Football", "Baseball", "Basketball", "Soccer"], correctIndex: 1 },
    { id: "p14", question: "What sport involves swimming, cycling, and running?", options: ["Decathlon", "Pentathlon", "Triathlon", "Marathon"], correctIndex: 2 },
    { id: "p15", question: "How many sets to win a tennis match (best of)?", options: ["2", "3", "4", "5"], correctIndex: 1 },
    { id: "p16", question: "What does flexibility help prevent?", options: ["Hunger", "Injuries", "Fatigue", "Thirst"], correctIndex: 1 },
    { id: "p17", question: "What sport is played at Wimbledon?", options: ["Golf", "Tennis", "Cricket", "Rugby"], correctIndex: 1 },
    { id: "p18", question: "How many players on a volleyball team on court?", options: ["4", "5", "6", "7"], correctIndex: 2 },
    { id: "p19", question: "What is a touchdown worth in American football?", options: ["3", "5", "6", "7"], correctIndex: 2 },
    { id: "p20", question: "What does the heart rate measure?", options: ["Breathing", "Beats per minute", "Blood pressure", "Temperature"], correctIndex: 1 },
    { id: "p21", question: "What swimming stroke is the fastest?", options: ["Backstroke", "Breaststroke", "Butterfly", "Freestyle"], correctIndex: 3 },
    { id: "p22", question: "What equipment is used in fencing?", options: ["Bat", "Sword", "Stick", "Racket"], correctIndex: 1 },
    { id: "p23", question: "How many holes on a standard golf course?", options: ["9", "12", "18", "20"], correctIndex: 2 },
    { id: "p24", question: "What is important to drink during exercise?", options: ["Soda", "Coffee", "Water", "Juice"], correctIndex: 2 },
    { id: "p25", question: "What sport uses a bow and arrow?", options: ["Fencing", "Archery", "Shooting", "Javelin"], correctIndex: 1 },
  ],
}

function getFallbackQuestions(grade: number, subject: string, count: number) {
  let questionSet: any[] = []
  const subjectLower = subject.toLowerCase()

  // Match subject to question bank
  if (subjectLower.includes("math") || subjectLower.includes("algebra") || subjectLower.includes("geometry") || subjectLower.includes("calculus") || subjectLower.includes("trigonometry")) {
    if (grade <= 3) questionSet = [...FALLBACK_QUESTIONS["math_elementary"]]
    else if (grade <= 6) questionSet = [...FALLBACK_QUESTIONS["math_middle"]]
    else questionSet = [...FALLBACK_QUESTIONS["math_high"]]
  } else if (subjectLower.includes("reading") || subjectLower.includes("english") || subjectLower.includes("writing") || subjectLower.includes("literature") || subjectLower.includes("language")) {
    questionSet = [...FALLBACK_QUESTIONS["reading"]]
  } else if (subjectLower.includes("science") || subjectLower.includes("biology") || subjectLower.includes("chemistry") || subjectLower.includes("physics")) {
    questionSet = [...FALLBACK_QUESTIONS["science"]]
  } else if (subjectLower.includes("history") || subjectLower.includes("social") || subjectLower.includes("geography") || subjectLower.includes("civics")) {
    questionSet = [...FALLBACK_QUESTIONS["history"]]
  } else if (subjectLower.includes("computer") || subjectLower.includes("ict") || subjectLower.includes("programming") || subjectLower.includes("technology")) {
    questionSet = [...FALLBACK_QUESTIONS["computer"]]
  } else if (subjectLower.includes("art") || subjectLower.includes("music")) {
    questionSet = [...FALLBACK_QUESTIONS["art"]]
  } else if (subjectLower.includes("pe") || subjectLower.includes("physical") || subjectLower.includes("sport") || subjectLower.includes("education")) {
    questionSet = [...FALLBACK_QUESTIONS["pe"]]
  } else {
    questionSet = [...FALLBACK_QUESTIONS["general"]]
  }

  // Add more questions from other sets to reach count
  const additionalSets = ["general", "science", "history"]
  for (const setName of additionalSets) {
    if (questionSet.length < count) {
      questionSet.push(...FALLBACK_QUESTIONS[setName])
    }
  }

  // Shuffle for variety
  for (let i = questionSet.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [questionSet[i], questionSet[j]] = [questionSet[j], questionSet[i]]
  }

  // Return with unique IDs
  return questionSet.slice(0, count).map((q, idx) => ({
    ...q,
    id: `fallback_${Date.now()}_${idx}`
  }))
}

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
        questions: getFallbackQuestions(grade, subject, count),
        fallback: true
      })
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

    const systemPrompt = `
      You are a world-class educational content creator for a game called Boomkit.
      Generate a set of EXACTLY ${count} multiple-choice questions for the following:
      Grade: ${grade}
      Subject: ${subject}
      Topic/Instructions: ${prompt}

      CRITICAL DIFFICULTY & DIVERSITY RULES:
      - EVERY question MUST have EXACTLY 4 options. Never 2 or 3.
      - AVOID REPETITIVE QUESTIONS. Every single question in the set must be unique and different in structure and content.
      - For Grade 1 Math: Focus on a wide variety of topics: addition, subtraction, basic shapes, counting objects, telling time, and simple word problems. AVOID repeating simple "X+Y" patterns.
      - For Grade 1 Reading: Use diverse vocabulary, sentence completion, identifying main ideas, and phonics. Every reading question should look and feel different.
      - For Grade 2-5: Use intermediate arithmetic (multiplication/division), basic science, descriptive grammar, and reading comprehension.
      - For Grade 6-12: Increase complexity naturally (Algebra, Biology, Physics, etc.) but MAINTAIN the 4-option requirement and high diversity.
      - AVOID extremely simple or repetitive math like "5+5" unless it's a very small part of a larger, more complex set for Grade 1.
      - Questions MUST get progressively slightly harder within the set.

      Return the response ONLY as a valid JSON object in this format:
      {
        "title": "Set Title",
        "description": "Short description",
        "grade": ${grade},
        "subject": "${subject}",
        "questions": [
          {
            "id": "unique_id_1",
            "question": "The question text",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correctIndex": 0
          }
        ]
      }
      
      Only return the JSON, no other text.
    `

    console.log(`[AI API] Generating ${count} questions for Grade ${grade}, Subject: ${subject}`)
    const result = await model.generateContent(systemPrompt)
    const response = await result.response
    const text = response.text()

    console.log("[AI API] Raw response length:", text.length)

    let jsonStr = text
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      jsonStr = jsonMatch[0]
    }

    try {
      const data = JSON.parse(jsonStr)
      if (!data.questions || data.questions.length === 0) {
        throw new Error("AI returned empty question set");
      }
      console.log("[AI API] Successfully generated", data.questions.length, "questions");
      return NextResponse.json(data)
    } catch (parseError) {
      console.error("[AI API] Logic/Parsing failed:", parseError)
      console.log("[AI API] Using fallback questions due to parse error")
      return NextResponse.json({
        title: `${subject} Questions`,
        description: `Pre-generated ${subject} questions for Grade ${grade}`,
        grade,
        subject,
        questions: getFallbackQuestions(grade, subject, count),
        fallback: true
      })
    }
  } catch (error: any) {
    console.error("Error generating set:", error)
    console.log("[AI API] Using fallback questions due to API error:", error.message)
    return NextResponse.json({
      title: `${subject} Questions`,
      description: `Pre-generated ${subject} questions for Grade ${grade}`,
      grade,
      subject,
      questions: getFallbackQuestions(grade, subject, count),
      fallback: true
    })
  }
}
