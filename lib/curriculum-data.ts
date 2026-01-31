export const TOPICS_BY_GRADE_SUBJECT: Record<number, Record<string, string[]>> = {
    1: {
        "Math": ["Counting & Number Patterns", "Addition & Subtraction", "Place Value", "Geometry (Shapes)", "Measurement", "Time & Money"],
        "Reading": ["Phonics & Decoding", "Sight Words", "Reading Comprehension", "Story Elements", "Vocabulary"],
        "Writing": ["Sentence Structure", "Punctuation & Capitalization", "Spelling", "Narrative Writing", "Opinion Writing"],
        "English Language Arts": ["Grammar Basics", "Parts of Speech (Nouns/Verbs)", "Listening & Speaking"],
        "Science": ["Plants & Animals (Living Things)", "Weather & Seasons", "Matter (Solids, Liquids)", "Forces & Motion", "Day & Night"],
        "Social Studies": ["Family & Community", "Maps & Globes", "Rules & Laws", "Holidays & Traditions", "Needs vs. Wants"],
        "Art": ["Colors (Primary/Secondary)", "Shapes in Art", "Lines & Patterns", "Drawing Basics"],
        "Music": ["Rhythm & Beat", "Melody", "Instruments", "Singing Basics"],
        "Physical Education": ["Locomotor Skills", "Balance & Coordination", "Personal Health", "Teamwork Games"]
    },
    2: {
        "Math": ["Addition & Subtraction (2-digit)", "Place Value (Hundreds)", "Measurement (Inches/Cm)", "Time (Analog/Digital)", "Money (Counting Coins)", "Data & Graphs"],
        "Reading": ["Fluency", "Main Idea & Details", "Character & Setting", "Cause & Effect", "Poetry Basics"],
        "Writing": ["Paragraph Structure", "Descriptive Writing", "Editing & Revising", "Letter Writing"],
        "English": ["Parts of Speech (Adjectives/Adverbs)", "Contractions (can't, don't)", "Synonyms & Antonyms"],
        "Science": ["Properties of Matter", "Habitats & Ecosystems", "Earth's Resources", "Simple Machines", "Water Cycle Basics"],
        "Social Studies": ["Government Basics", "History (Time & Change)", "Geography (Landforms)", "Culture & Diversity", "Economics (Producers/Consumers)"],
        "Art": ["Texture & Form", "Painting Techniques", "Famous Artists", "Mixed Media"],
        "Music": ["Pitch (High/Low)", "Tempo (Fast/Slow)", "Musical Families", "Performance"],
        "PE": ["Throwing & Catching", "Fitness Basics", "Movement Patterns", "Safety in Activity"]
    },
    3: {
        "Math": ["Multiplication & Division Intro", "Fractions Basics", "Area & Perimeter", "Quadrilaterals", "Rounding & Estimation", "Mass & Volume"],
        "English (Reading & Writing)": ["Main Idea & Summary", "Point of View", "Inferences", "Grammar (Pronouns/Verbs)", "Cursive Writing"],
        "Science": ["Forces & Interactions", "Life Cycles", "Inheritance of Traits", "Weather & Climate", "Ecosystems & Interactions"],
        "Social Studies": ["Communities", "Local History", "Geography (Regions)", "Government Services", "Trade & Currency"],
        "Computer Basics": ["Typing Skills", "Internet Safety", "Parts of a Computer", "Digital Citizenship"],
        "Art": ["Color Theory", "Perspective Intro", "Cultural Art", "Sculpture Basics"],
        "Music": ["Reading Notes", "Musical Notation", "Composers", "Singing in Rounds"],
        "PE": ["Sports Skills", "Aerobic Capacity", "Muscular Strength", "Fair Play"]
    },
    4: {
        "Math": ["Multi-digit Multiplication", "Long Division", "Fractions (Equivalence/Ordering)", "Decimals Intro", "Angles & Lines", "Unit Conversions"],
        "English Language Arts": ["Theme & Moral", "Text Structure", "Figurative Language (Similes)", "Research Skills", "Opinion Essays"],
        "Science": ["Energy & Collisions", "Waves (Light/Sound)", "Earth's Systems (Geology)", "Renewable Energy", "Plant Structures"],
        "Social Studies": ["State History", "US Regions", "American Revolution Intro", "Government Branches", "Immigration Basics"],
        "Computer Science": ["Coding Basics (Blocks)", "Algorithms", "Debugging", "Input/Output"],
        "Art": ["Symmetry & Pattern", "Portraiture", "Landscape Art", "Printmaking"],
        "Music": ["Harmony", "Musical Genres", "Instrumental Skills", "Rhythm Reading"],
        "PE": ["Team Sports", "Fitness Goals", "Rhythmic Movement", "Sportsmanship"]
    },
    5: {
        "Math": ["Decimal Operations", "Fraction Operations", "Volume", "Coordinate Plane", "Order of Operations", "Powers of 10"],
        "English": ["Reading Informational Text", "Multiple Accounts", "Greek & Latin Roots", "Argumentative Writing", "Narrative Arcs"],
        "Science": ["Matter & Particles", "Photosynthesis", "Ecosystem Dynamics", "Earth's Spheres", "Stars & Solar System"],
        "Social Studies": ["US History (Colonial - Civil War)", "Geography of the Americas", "Economics (Supply/Demand)", "Civic Responsibilities"],
        "Computer Science": ["Loops & Conditionals", "Binary Basics", "Presentation Software", "Data Analysis"],
        "Art": ["3D Art", "Art History", "Abstract Art", "Visual Storytelling"],
        "Music": ["Ensemble Playing", "Music Theory", "World Music", "Composition Basics"],
        "PE": ["Game Strategy", "Skill Refinement", "Personal Fitness Plan", "Cooperative Games"]
    },
    6: {
        "Math": ["Ratios & Proportions", "Rational Numbers", "Expressions & Equations", "Statistics (Mean/Median)", "Area of Polygons", "Volume of Prisms"],
        "English": ["Literary Analysis", "Argumentative Essays", "Connotations & Denotations", "Reliable Sources", "Plot vs. Theme"],
        "Science": ["Cells & Organisms", "Body Systems", "Energy Transfer", "Forces (Gravity/Friction)", "Weather Patterns"],
        "History": ["Ancient Civilizations (Mesopotamia, Egypt)", "Ancient Greece & Rome", "World Religions", "Geography & Human Impact"],
        "Geography": ["Maps & Projections", "Physical Geography", "Human Geography", "Resources & Trade"],
        "Computer Science / ICT": ["Text-Based Coding Intro", "HTML/CSS Basics", "Digital Ethics", "Spreadsheet skills"],
        "Art": ["Perspective Drawing", "Color Psychology", "Digital Art Intro", "Critique & Analysis"],
        "Music": ["Music History", "Chords & Scales", "Band/Orchestra", "Appreciation"],
        "PE": ["Team Strategies", "Health-Related Fitness", "Lifetime Activities", "Conflict Resolution"]
    },
    7: {
        "Math (Pre-Algebra)": ["Proportional Relationships", "Operations with Rational Numbers", "Algebraic Expressions", "Inequalities", "Geometry (Circles/Angles)", "Probability"],
        "English": ["Analytical Writing", "Tone & Mood", "Poetry Analysis", "Media Literacy", "Complex Sentence Structure"],
        "Biology": ["Cell Structure & Function", "Genetics & Heredity", "Evolution & Natural Selection", "Ecosystem Organization"],
        "History": ["Middle Ages", "Renaissance & Reformation", "Age of Exploration", "Feudal Japan", "Aztec/Inca/Maya"],
        "Geography": ["Cultural Geography", "Global Interdependence", "Population Trends", "Environmental Issues"],
        "Computer Science": ["Python Basics", "Cybersecurity", "Web Design", "Hardware Components"],
        "Foreign Language": ["Basic Vocabulary", "Common Phrases", "Grammar Introduction", "Cultural Appreciation"],
        "PE": ["Personal Training", "Skill Mastery", "Social Interaction", "Rules & Officiating"]
    },
    8: {
        "Math (Algebra)": ["Linear Equations", "Functions", "Systems of Equations", "Exponents & Scientific Notation", "Pythagorean Theorem", "Transformations"],
        "English": ["Literary Classics", "Research Papers", "Rhetorical Analysis", "Listening & Debate", "Narrative Techniques"],
        "Biology": ["Human Anatomy (Detailed)", "DNA & RNA", "Biotechnology Basics", "Biodiversity"],
        "Chemistry (Basics)": ["Atomic Structure", "Periodic Table Intro", "Chemical Reactions", "States of Matter"],
        "History": ["US History (Constitution - Reconstruction)", "Civil War", "Industrial Revolution", "Government Systems"],
        "Geography": ["Geopolitics", "Global Economics", "Urbanization", "Case Studies"],
        "Computer Science": ["Programming Logic", "App Development Basics", "Networks", "Artificial Intelligence Intro"],
        "Foreign Language": ["Verb Conjugations", "Sentence Construction", "Dialogue Practice", "Reading Short Texts"],
        "PE": ["Fitness Assessment", "Movement Concepts", "Nutrition & Performance", "Leadership"]
    },
    9: {
        "Math (Algebra / Geometry)": ["Polynomials", "Quadratics", "Exponential Functions", "Geometric Proofs", "Coordinate Geometry", "Triangles"],
        "English Literature": ["World Literature", "Shakespeare", "The Hero's Journey", "Analytic Essays", "Novel Studies"],
        "Biology": ["Cellular Respiration", "Mitosis & Meiosis", "Ecology", "Microbiology"],
        "Chemistry": ["Stoichiometry", "Bonding", "Gas Laws", "Solutions", "Acids & Bases"],
        "Physics (Intro)": ["Motion (Kinematics)", "Newton's Laws", "Work & Power", "Electricity Basics"],
        "History": ["World History (Modern)", "World Wars", "Cold War", "Globalization"],
        "Geography": ["Human Migration", "Cultural Landscapes", "Political Geography", "Sustainable Development"],
        "Computer Science": ["Advanced Python/Java", "Data Structures", "Algorithm Design", "Digital Media"],
        "Foreign Language": ["Intermediate Grammar", "Cultural Immersion", "Oral Proficiency", "Essay Writing"],
        "PE": ["Personal Fitness", "Weight Training", "Yoga/Pilates", "Team Sports"]
    },
    10: {
        "Math (Geometry / Algebra II)": ["Similarity & Congruence", "Trigonometry Basics", "Circles & Arcs", "Probability & Statistics", "Complex Numbers", "Logarithms"],
        "English Literature": ["American Literature", "Literary Movements", "Research Methodology", "Public Speaking", "Creative Writing"],
        "Chemistry": ["Chemical Kinetics", "Thermodynamics", "Electrochemistry", "Nuclear Chemistry", "Organic Chemistry Basics"],
        "Physics": ["Vectors", "Projectile Motion", "Momentum", "Circular Motion"],
        "Biology": ["Molecular Biology", "Physiology", "Environmental Science", "Evolutionary Biology"],
        "History": ["US History (1900s - Present)", "Civil Rights Movement", "Major Conflicts", "Economic Shifts"],
        "Computer Science": ["Web Development (Full Stack)", "Database Managment", "Software Engineering Principles", "Project Management"],
        "Foreign Language": ["Literature & Film", "Advanced Conversation", "Idioms & Slang", "Translations"],
        "PE": ["Conditioning", "Lifetime Sports (Golf, Tennis)", "First Aid/CPR", "Wellness"]
    },
    11: {
        "Math (Trigonometry / Pre-Calculus)": ["Unit Circle", "Trig Identities", "Vectors & Matrices", "Conic Sections", "Limits Intro", "Sequence & Series"],
        "English": ["British Literature", "Rhetorical Strategies", "Synthesis Essays", "Modernist Literature", "Journalism"],
        "Physics": ["Electromagnetism", "Optics", "Modern Physics", "Waves & Quantum Examples"],
        "Chemistry": ["Advanced Organic Checklist", "Biochemistry Intro", "Material Science", "Lab Techniques"],
        "Biology": ["Marine Biology", "Anatomy & Physiology", "Genetics (Advanced)", "Zoology"],
        "History": ["European History", "Government & Politics", "Comparative Government", "Historical Analysis"],
        "Philosophy / Civics": ["Ethics", "Political Philosophy", "Logic & Reasoning", "Constitutional Law"],
        "Computer Science / Programming": ["Game Development", "Cybersecurity Advanced", "Machine Learning Concepts", "Capstone Project"],
        "Foreign Language": ["Fluency Practice", "Current Events", "Cultural History", "Literature Analysis"]
    },
    12: {
        "Math (Calculus / Advanced Math)": ["Derivatives", "Integrals", "Differential Equations", "Applications of Calculus", "Statistics (Inference)"],
        "English": ["Contemporary Literature", "College Writing", "Literary Theory", "Senior Thesis", "Business Communication"],
        "Physics": ["Astrophysics", "Quantum Mechanics Intro", "Relativity", "Engineering Physics"],
        "Chemistry": ["AP Chemistry Topics", "Environmental Chemistry", "Pharmaceutical Chemistry", "Forensics"],
        "Biology": ["AP Biology Topics", "Neuroscience Intro", "Botany", "Epidemiology"],
        "History": ["Contemporary Issues", "Economics (Macro/Micro)", "Sociology", "Psychology"],
        "Philosophy / Civics": ["Human Rights", "Global Politics", "Existentialism", "Senior Project"],
        "Computer Science": ["Cloud Computing", "Cryptography", "Mobile App Dev", "Systems Architecture"],
        "Foreign Language": ["Business Language", "Translation & Innovation", "Cultural Immersion Project"],
        "Electives": ["Psychology", "Sociology", "Creative Writing", "Film Studies", "Financial Literacy", "Entrepreneurship"]
    }
}
