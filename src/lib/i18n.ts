/**
 * Internationalization display maps.
 * Internal keys remain Hebrew for logic compatibility.
 * Only displayed text is translated.
 */

// CONDITIONS_LIST display map (Hebrew key → English label)
export const CONDITIONS_EN: Record<string, string> = {
  "כאבי גב": "Back Pain",
  "צוואר": "Neck",
  "כתפיים": "Shoulders",
  "ברכיים": "Knees",
  "מפרקי ירך": "Hips",
  "היריון": "Pregnancy",
  "אחרי לידה": "Postpartum",
  "פיברומיאלגיה": "Fibromyalgia",
  "פריצת דיסק": "Disc Herniation",
  "סיאטיקה": "Sciatica",
  "אוסטאוארתריטיס": "Osteoarthritis",
  "שיקום אחרי פציעה": "Post-Injury Rehab",
  "חרדה/מתח": "Stress & Anxiety",
  "בעיות שינה": "Sleep Issues",
  "גיל מעבר": "Menopause",
  "תרגול משלים": "Complementary Training",
  "רק יוגה": "Yoga Only",
};

// RED_FLAGS display map
export const RED_FLAGS_EN: Record<string, string> = {
  "כאב חד חדש": "New sharp pain",
  "נימול/חולשה מתגברים": "Increasing numbness or weakness",
  "סחרחורת חריגה/עילפון": "Unusual dizziness or fainting",
  "קוצר נשימה": "Shortness of breath",
  "חום/מחלה חריפה": "Fever or acute illness",
};

// Flare options
export const FLARE_OPTIONS_EN: Record<string, string> = {
  "כן": "Yes",
  "לא": "No",
  "לא בטוח/ה": "Not sure",
};

// Gentle movement effect
export const GENTLE_EFFECT_EN: Record<string, string> = {
  "משפרת": "Improves",
  "ניטרלי": "Neutral",
  "מחמיר": "Worsens",
};

// Day type
export const DAY_TYPE_EN: Record<string, string> = {
  "יושבני": "Sedentary",
  "מעורב": "Mixed",
  "פיזי": "Physical",
};

// Practice time
export const PRACTICE_TIME_EN: Record<string, string> = {
  "בוקר": "Morning",
  "צהריים": "Afternoon",
  "ערב": "Evening",
  "לילה": "Night",
};

// Energy level
export const ENERGY_EN: Record<string, string> = {
  "נמוכה": "Low",
  "בינונית": "Moderate",
  "גבוהה": "High",
};

// Helped most (checkin)
export const HELPED_MOST_EN: Record<string, string> = {
  "נשימה": "Breath",
  "תנועה": "Movement",
  "שחרור": "Release",
};

// Pain areas
export const PAIN_AREAS_EN: Record<string, string> = {
  "צוואר": "Neck",
  "כתפיים": "Shoulders",
  "גב עליון": "Upper back",
  "גב תחתון": "Lower back",
  "אגן/ירכיים": "Pelvis / Hips",
  "ברכיים": "Knees",
  "כפות ידיים": "Hands",
  "כללי": "General",
  "צוואר קדמי": "Front neck",
  "צוואר אחורי": "Back of neck",
  "צוואר צדדי": "Side of neck",
  "כתף ימין": "Right shoulder",
  "כתף שמאל": "Left shoulder",
  "שתי הכתפיים": "Both shoulders",
  "שכמות": "Shoulder blades",
  "זרועות": "Arms",
  "ברך ימין": "Right knee",
  "ברך שמאל": "Left knee",
  "שתי הברכיים": "Both knees",
  "ירך ימין": "Right hip",
  "ירך שמאל": "Left hip",
  "שני הירכיים": "Both hips",
  "מפשעה": "Groin",
  "אגן": "Pelvis",
  "ישבן": "Buttock",
  "רגל ימין": "Right leg",
  "רגל שמאל": "Left leg",
  "כף רגל": "Foot",
  "ידיים": "Hands",
  "עמוד שדרה": "Spine",
};

// Triggers
export const TRIGGERS_EN: Record<string, string> = {
  "ישיבה ממושכת": "Prolonged sitting",
  "עמידה ממושכת": "Prolonged standing",
  "הליכה ארוכה": "Long walks",
  "מדרגות": "Stairs",
  "אימון כוח": "Strength training",
  "מתיחות אינטנסיביות": "Intense stretches",
  "סטרס רגשי": "Emotional stress",
  "חוסר שינה": "Poor sleep",
  "כיפוף": "Bending",
  "הרמת משאות": "Lifting",
  "סיבוב": "Twisting",
  "עבודה מול מסך": "Screen work",
  "נהיגה": "Driving",
  "שינה": "Sleep position",
  "סטרס": "Stress",
  "תנועה מהירה": "Quick movement",
  "הרמת ידיים": "Raising arms",
  "שכיבה על הצד": "Side lying",
  "עומס בעבודה": "Work stress",
  "קונפליקטים": "Conflicts",
  "שינויים": "Changes",
  "קפאין": "Caffeine",
};

// Other activities
export const ACTIVITIES_EN: Record<string, string> = {
  "הליכה": "Walking",
  "חדר כושר": "Gym",
  "פילאטיס": "Pilates",
  "ריצה": "Running",
  "שחייה": "Swimming",
  "אחר": "Other",
  "אין": "None",
  "אימון כוח": "Strength training",
  "רכיבה": "Cycling",
  "אירובי אחר": "Other cardio",
};

// Equipment
export const EQUIPMENT_EN: Record<string, string> = {
  "קיר": "Wall",
  "כיסא": "Chair",
  "בלוקים": "Blocks",
  "רצועה": "Strap",
  "בולסטר": "Bolster",
  "שמיכה": "Blanket",
};

// Sleep issues
export const SLEEP_ISSUES_EN: Record<string, string> = {
  "קושי להירדם": "Difficulty falling asleep",
  "יקיצות ליליות": "Night waking",
  "יקיצה מוקדמת": "Early waking",
  "שינה לא איכותית": "Poor sleep quality",
};

// Pregnancy complaints
export const PREGNANCY_COMPLAINTS_EN: Record<string, string> = {
  "כאבי גב": "Back pain",
  "כאבי אגן": "Pelvic pain",
  "עייפות": "Fatigue",
  "נפיחות": "Swelling",
};

// Menopause symptoms
export const MENOPAUSE_EN: Record<string, string> = {
  "גלי חום": "Hot flashes",
  "הפרעות שינה": "Sleep disruption",
  "כאבי מפרקים": "Joint pain",
  "שינויי מצב רוח": "Mood changes",
  "עייפות": "Fatigue",
  "יובש": "Dryness",
};

// OA joints
export const OA_JOINTS_EN: Record<string, string> = {
  "ברכיים": "Knees",
  "ירכיים": "Hips",
  "ידיים": "Hands",
  "כתפיים": "Shoulders",
  "עמוד שדרה": "Spine",
};

// Trimester
export const TRIMESTER_EN: Record<string, string> = {
  "טרימסטר 1": "Trimester 1",
  "טרימסטר 2": "Trimester 2",
  "טרימסטר 3": "Trimester 3",
};

/**
 * Generic translator: returns English label or falls back to original key
 */
export function t(key: string, map: Record<string, string>): string {
  return map[key] || key;
}

/**
 * Translate an array of Hebrew keys
 */
export function tArray(keys: string[], map: Record<string, string>): string[] {
  return keys.map(k => map[k] || k);
}
