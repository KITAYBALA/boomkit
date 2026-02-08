const G1_SCIENCE_P1 = require('./questions/G1_SCIENCE_P1');
const G1_SCIENCE_P2 = require('./questions/G1_SCIENCE_P2');
const G1_ELA_COMPLETE = require('./questions/G1_ELA_COMPLETE');
const G1_SOCIAL_STUDIES_COMPLETE = require('./questions/G1_SOCIAL_STUDIES_COMPLETE');
const G2_MATH_COMPLETE = require('./questions/G2_MATH_COMPLETE');
const G2_SCIENCE_COMPLETE = require('./questions/G2_SCIENCE_COMPLETE');
const G2_ELA_COMPLETE = require('./questions/G2_ELA_COMPLETE');
const G2_SOCIAL_STUDIES_COMPLETE = require('./questions/G2_SOCIAL_STUDIES_COMPLETE');

// Grade 3
const G3_MATH_COMPLETE = require('./questions/G3_MATH_COMPLETE');
const G3_SCIENCE_COMPLETE = require('./questions/G3_SCIENCE_COMPLETE');
const G3_ELA_COMPLETE = require('./questions/G3_ELA_COMPLETE');
const G3_SOCIAL_STUDIES_COMPLETE = require('./questions/G3_SOCIAL_STUDIES_COMPLETE');

// Grade 4
const G4_MATH_COMPLETE = require('./questions/G4_MATH_COMPLETE');
const G4_SCIENCE_COMPLETE = require('./questions/G4_SCIENCE_COMPLETE');
const G4_ELA_PARTIAL = require('./questions/G4_ELA_PARTIAL');
const G4_SOCIAL_STUDIES_PARTIAL = require('./questions/G4_SOCIAL_STUDIES_PARTIAL');

// Grade 5
const G5_MATH_PARTIAL = require('./questions/G5_MATH_PARTIAL');
const G5_SCIENCE_PARTIAL = require('./questions/G5_SCIENCE_PARTIAL');
const G5_ELA_PARTIAL = require('./questions/G5_ELA_PARTIAL');
const G5_SOCIAL_STUDIES_PARTIAL = require('./questions/G5_SOCIAL_STUDIES_PARTIAL');

const STATIC_QUESTIONS = [
    ...G1_SCIENCE_P1,
    ...G1_SCIENCE_P2,
    ...G1_ELA_COMPLETE,
    ...G1_SOCIAL_STUDIES_COMPLETE,
    ...G2_MATH_COMPLETE,
    ...G2_SCIENCE_COMPLETE,
    ...G2_ELA_COMPLETE,
    ...G2_SOCIAL_STUDIES_COMPLETE,
    ...G3_MATH_COMPLETE,
    ...G3_SCIENCE_COMPLETE,
    ...G3_ELA_COMPLETE,
    ...G3_SOCIAL_STUDIES_COMPLETE,
    ...G4_MATH_COMPLETE,
    ...G4_SCIENCE_COMPLETE,
    ...G4_ELA_PARTIAL,
    ...G4_SOCIAL_STUDIES_PARTIAL,
    ...G5_MATH_PARTIAL,
    ...G5_SCIENCE_PARTIAL,
    ...G5_ELA_PARTIAL,
    ...G5_SOCIAL_STUDIES_PARTIAL
];

module.exports = STATIC_QUESTIONS;
