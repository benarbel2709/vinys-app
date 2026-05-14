# יעל ארבל — יוגה מותאמת אישית | Project Overview

> **Purpose**: This document gives a complete picture of the app — architecture, navigation, content, design, and logic — for review by AI LLMs or human experts.

---

## 1. What This App Does

A **personalized therapeutic yoga app** (Hebrew, RTL) built for Yael Arbel, a yoga therapist since 2008. The app creates tailored exercise plans based on the user's medical conditions, energy level, pain state, and available time. It adapts in real-time — if the user is having a "flare day" (bad pain day), the plan shifts to gentler exercises automatically.

**Key value proposition**: "The practice adapts to the person — not the person to the method."

---

## 2. Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS with semantic HSL design tokens (warm terracotta palette)
- **UI Components**: shadcn/ui (Radix primitives)
- **State**: React Context (localStorage persistence, no auth/database)
- **TTS**: Browser-native Web Speech API (Hebrew `he-IL`)
- **Direction**: RTL throughout

---

## 3. Navigation Flow

```
Home (/) → Disclaimer (/disclaimer) → Conditions (/conditions) → Setup (/setup) → Questionnaire (/questionnaire) → Plan (/plan) → Workout (/workout/:id) → Check-in (/checkin/:id) → back to Plan
```

### Flow Steps (with progress bar 1–5):

| Step | Route | Purpose |
|------|-------|---------|
| — | `/` | Landing page: hero image, method explanation, trust signals |
| — | `/disclaimer` | Medical disclaimer — must accept before proceeding |
| 1 | `/conditions` | Select conditions (multi-select from 17 options) |
| 2 | `/setup` | Configure: sessions/week (2–5), minutes/session (10–60), practice time, energy level, flare toggle |
| 3 | `/questionnaire` | Condition-specific assessment: pain/fatigue/sleep sliders, triggers, equipment, red flags |
| 4 | `/plan` | Generated weekly plan with sessions, modes, exercise counts |
| 5 | `/workout/:id` | Exercise-by-exercise guided workout with instructions, breathing, safety, TTS |
| 5 | `/checkin/:id` | Post-workout report: pain before/after, fatigue, "too much?" toggle, what helped most |
| — | `/stop` | Red flag detected → stop and see a doctor |
| — | `/expert-review` | Expert matrix + CSV export (not user-facing) |

---

## 4. Supported Conditions (17 total)

Hebrew label → Internal safety tag mapping:

| Condition (Hebrew) | English | Safety Tag Used |
|---|---|---|
| כאבי גב | Back pain | `universalSafe` |
| צוואר | Neck | `shoulderSafe` |
| כתפיים | Shoulders | `shoulderSafe` |
| ברכיים | Knees | `kneeSafe` |
| מפרקי ירך | Hip joints | `kneeSafe` |
| היריון | Pregnancy | `pregnancySafe` |
| אחרי לידה | Postpartum | `pregnancySafe` |
| פיברומיאלגיה | Fibromyalgia | `universalSafe` (special path) |
| פריצת דיסק | Disc herniation | `discSafe` |
| סיאטיקה | Sciatica | `discSafe` |
| אוסטאוארתריטיס | Osteoarthritis | `oaSafe` |
| שיקום אחרי פציעה | Post-injury rehab | `universalSafe` |
| חרדה/מתח | Anxiety/stress | `universalSafe` |
| בעיות שינה | Sleep issues | `universalSafe` |
| גיל מעבר | Menopause | `universalSafe` |
| תרגול משלים | Complementary practice | `universalSafe` |
| רק יוגה | Just yoga | `universalSafe` |

---

## 5. Exercise Library — Structure

**40 fully-written therapeutic exercises** in `src/data/masterExercises.ts`.

### Categories (4):

| Category | Hebrew | Count | Color |
|---|---|---|---|
| Breath | נשימה | 7 | Blue |
| Mobility | תנועה | 12 | Green |
| Stability | יציבות | 10 | Amber |
| Release | שחרור | 11 | Purple |

### Each Exercise Contains:

| Field | Description | Example |
|---|---|---|
| `id` | Unique ID | `breath_supine` |
| `title` | Hebrew name | נשימה בבטן בשכיבה |
| `category` | One of 4 categories | נשימה |
| `durationMin` | Minutes | 4 |
| `intensityTarget` | Target intensity | 2/10 |
| `instructions` | Step-by-step array (5–7 steps) | ["שכב/י על הגב...", ...] |
| `breathing` | Breathing pattern | שאיפה 4 שניות, נשיפה 6–8 שניות |
| `reps` | Repetitions | 8–12 נשימות איטיות |
| `range` | Range of motion guidance | תנועה רכה בלבד |
| `why` | Clinical rationale | מפחית עוררות סימפתטית... |
| `safety` | Safety warnings | אם מופיעה סחרחורת — לחזור לנשימה טבעית |
| `cue` | Coach cue | הבטן מתרחבת כמו בלון רך |
| `equipment` | Required equipment | ["קיר"], ["כיסא"] |
| `contraindications` | When to avoid | (optional array) |
| `tags` | 7 boolean safety tags | see below |

### Safety Tags (per exercise):

| Tag | Meaning |
|---|---|
| `universalSafe` | Safe for general use |
| `pregnancySafe` | Safe during pregnancy |
| `discSafe` | Safe for disc herniation |
| `kneeSafe` | Safe for knee issues |
| `oaSafe` | Safe for osteoarthritis |
| `shoulderSafe` | Safe for shoulder/neck |
| `flareSafe` | Safe during pain flare-ups |

---

## 6. Plan Generation Logic

File: `src/lib/planGenerator.ts`

### Mode Selection (3 modes):

| Mode | When Selected |
|---|---|
| `normal` | Default — energy is medium/high, no flare |
| `easier` | Pain ≥5 or fatigue ≥5 or low energy |
| `flare` | Flare today, or pain ≥7, or fatigue ≥7, or sleep ≤3 |

### Exercise Selection by Mode:

- **Normal**: All exercises for the condition
- **Easier**: All but limit stability to 1 exercise
- **Flare**: Breath + 1 mobility + all release (gentlest possible)

### Duration → Exercise Count:

| Minutes | Exercises |
|---|---|
| ≤10 | 3 |
| ≤15 | 5 |
| ≤20 | 6 |
| ≤30 | 8 |
| ≤45 | 10 |
| 60+ | 12 |

### Category Distribution (body exercises, after 1 breath):

| Mode | Mobility | Stability | Release |
|---|---|---|---|
| Normal | 40% | 30% | 30% |
| Easier | 35% | 20% | 45% |
| Flare | 20% | 10% | 70% |

### Adaptive Logic (post-workout):
After each workout check-in, if the user reported "too much" or pain increased by ≥2 points, the next planned session automatically downgrades to `easier` or `flare` mode.

---

## 7. Questionnaire Logic

### Fibromyalgia Path (special):
Full assessment with: pain, fatigue, sleep, flare status, pain areas (8 options), triggers (8 options), gentle movement effect, touch sensitivity, day type, other activities, equipment, restrictions, red flags.

### Condition-Specific Path:
Shows relevant sections based on selected conditions:
- **Back**: pain areas (lower/mid/upper/pelvis), aggravating factors
- **Neck**: pain areas (front/back/side), aggravating factors
- **Knees**: swelling, stairs difficulty
- **Disc/Sciatica**: radiating pain, numbness
- **Pregnancy**: trimester selection
- **Postpartum**: weeks since birth

### Red Flags (stop immediately):
1. כאב חד חדש (New sharp pain)
2. נימול/חולשה מתגברים (Increasing numbness/weakness)
3. סחרחורת חריגה/עילפון (Unusual dizziness/fainting)
4. קוצר נשימה (Shortness of breath)
5. חום/מחלה חריפה (Fever/acute illness)

If ANY red flag is checked → redirect to `/stop` page (see a doctor).

---

## 8. Workout Screen

The workout displays exercises one at a time with:
- **Progress bar** (dots showing current position)
- **Timer** (elapsed time)
- **Exercise name** + category badge + duration
- **Step-by-step instructions** (numbered, always visible)
- **Animation** (SVG-based human figure demonstrating the exercise)
- **Breathing strip** (terracotta-colored bar with breathing pattern)
- **Reps + Range** badges
- **Expandable "Why this exercise?"** section
- **Safety warning** (red border accent)
- **Equipment** badges
- **TTS button** (reads exercise aloud in Hebrew via Web Speech API)

### Bottom Action Bar:
- "Easier" mode button
- "Flare day" mode button
- Pause/Resume timer
- "Finish workout" → goes to check-in

---

## 9. Design System

### Color Palette (HSL):
| Token | HSL | Usage |
|---|---|---|
| `--background` | 30 29% 95% | Page background (warm off-white) |
| `--foreground` | 0 0% 12% | Text (near-black) |
| `--primary` | 14 37% 52% | Terracotta — buttons, accents |
| `--primary-foreground` | 0 0% 100% | White text on primary |
| `--muted-foreground` | 207 10% 42% | Secondary text |
| `--card` | 30 22% 98% | Card backgrounds |
| `--border` | 14 18% 84% | Borders |
| `--destructive` | 0 65% 55% | Red — safety warnings |

### Typography:
- Font: **Heebo** (Hebrew-optimized Google Font)
- H1: 28–32px bold
- Body: 15px, line-height 1.65
- Small: 12px

### Component Patterns:
- `card-premium`: rounded-[20px], subtle border, calm shadow
- `shadow-calm`: 4px 24px with terracotta tint
- `press-scale`: active:scale(0.98) for button feedback
- `animate-page-enter`: fade-up entrance (200ms)
- `hero-glow`: radial gradient for hero section

### Layout:
- Max width: `max-w-lg` (32rem / 512px) — mobile-first
- RTL direction throughout
- Sticky header with logo + "About" button
- Flow progress bar (5 steps)

---

## 10. Data Persistence

- **localStorage only** — no server, no auth
- Full state saved on every update via `useAppState` hook
- State includes: profile, assessments, exercise library, current plan, check-ins, progress

---

## 11. Expert Review Page (`/expert-review`)

Not user-facing. Built for therapist/expert review:
- **Matrix tab**: Table of all 40 exercises × 17 conditions, showing ✓ for safe combinations
- **Export tab**: CSV download with full exercise content (UTF-8 BOM for Hebrew support)
- Category summary cards showing exercise count per category

---

## 12. File Structure (Key Files)

```
src/
├── pages/
│   ├── Home.tsx          — Landing page with hero
│   ├── Disclaimer.tsx    — Medical disclaimer
│   ├── Conditions.tsx    — Condition selector (17 options)
│   ├── Setup.tsx         — Sessions/minutes/energy config
│   ├── Questionnaire.tsx — Condition-specific assessment
│   ├── Plan.tsx          — Weekly plan display
│   ├── Workout.tsx       — Exercise player
│   ├── CheckinPage.tsx   — Post-workout feedback
│   ├── Stop.tsx          — Red flag warning
│   └── ExpertReview.tsx  — Expert matrix + export
├── data/
│   ├── masterExercises.ts — 40 exercises (986 lines)
│   ├── exerciseAdapter.ts — Converts master → app format
│   ├── exercises.ts       — Fibro-specific exercises
│   ├── backExercises.ts   — Back pain exercises
│   ├── neckExercises.ts   — Neck exercises
│   ├── stressExercises.ts — Stress/anxiety exercises
│   └── scaffoldExercises.ts — Other condition exercises
├── lib/
│   ├── planGenerator.ts   — Plan generation + adaptation
│   └── storage.ts         — localStorage wrapper
├── hooks/
│   ├── useTTS.ts          — Web Speech API for Hebrew TTS
│   └── useAppState.ts     — State management
├── types/
│   └── index.ts           — All TypeScript interfaces
└── components/
    ├── Layout.tsx         — App shell with header + progress
    ├── animations/        — SVG exercise animations
    └── illustrations/     — Page header illustrations
```

---

## 13. Sample Exercise (Full Content)

```
ID: breath_supine
Title: נשימה בבטן בשכיבה (Supine Belly Breathing)
Category: נשימה (Breath)
Duration: 4 minutes
Intensity: 2/10
Equipment: None

Instructions:
1. שכב/י על הגב, ברכיים כפופות וכפות רגליים ברוחב אגן על הרצפה.
2. הנח/י יד אחת על הבטן ויד שנייה על בית החזה — כדי לחוש את תנועת הנשימה.
3. שאיפה דרך האף — הרחב/י את הבטן קדימה ולצדדים, החזה כמעט ואינו זז.
4. נשיפה ארוכה דרך האף או פה רפוי — אפשר/י לבטן לשקוע לאט פנימה.
5. שמור/י לסת, עורף וכתפיים רפויים לחלוטין — אין מתיחה ואין דחיפה.
6. הנשימה רכה ואיטית — אין מאמץ, אין לחץ.
7. ודא/י שהנשיפה מעט ארוכה יותר מהשאיפה — זה המפתח להרגעה.

Breathing: שאיפה 4 שניות, נשיפה 6–8 שניות.
Reps: 8–12 נשימות איטיות.
Range: תנועה רכה בלבד — בטן נעה, חזה לא.
Why: מפחית עוררות סימפתטית, מוריד רגישות כאב ומשפר ויסות נשימתי.
Safety: אם מופיעה סחרחורת — לחזור לנשימה טבעית ולקצר נשיפה.
Cue: הבטן מתרחבת כמו בלון רך.
Tags: universalSafe ✓, pregnancySafe ✓, discSafe ✓, kneeSafe ✓, oaSafe ✓, shoulderSafe ✓, flareSafe ✓
```

---

## 14. Published URL

**Live**: https://yael-yoga-flow.lovable.app
