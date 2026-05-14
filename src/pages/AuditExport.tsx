import { useEffect, useState } from "react";

const AUDIT_TEXT = `# EXPORT — FULL APP SYSTEM AUDIT
## Yael Arbel Yoga — Therapeutic Yoga PWA
### Generated: 2026-02-18

---

## 1. GLOBAL DESIGN SYSTEM

### Color Palette (HSL Tokens — defined in src/index.css)

| Token | HSL Value | Approx Hex | Usage |
|---|---|---|---|
| --background | 30 29% 95% | #F6F1EB | Warm off-white page background |
| --foreground | 0 0% 12% | #1E1E1E | Primary text (charcoal) |
| --card | 30 22% 98% | #FBF9F6 | Card surfaces |
| --card-foreground | 0 0% 12% | #1E1E1E | Card text |
| --primary | 14 37% 52% | #B26A57 | Terracotta accent — buttons, icons, highlights |
| --primary-foreground | 0 0% 100% | #FFFFFF | Text on primary backgrounds |
| --secondary | 25 12% 90% | #E9E4DF | Subtle secondary surfaces |
| --secondary-foreground | 0 0% 12% | #1E1E1E | Text on secondary |
| --muted | 210 8% 55% | #848B92 | Muted text |
| --muted-foreground | 207 10% 42% | #616C76 | Secondary descriptive text |
| --accent | 25 12% 90% | #E9E4DF | Accent backgrounds |
| --destructive | 0 65% 55% | #D94444 | Red — stop, danger, red flags |
| --border | 14 18% 84% | #DCD4CE | Borders, dividers |
| --input | 220 6% 87% | #DDDEE0 | Input backgrounds |
| --ring | 14 37% 52% | #B26A57 | Focus ring (terracotta) |
| --terracotta | 14 37% 52% | #B26A57 | Brand primary |
| --terracotta-light | 14 37% 67% | #C89485 | Light terracotta variant |
| --terracotta-dark | 14 37% 42% | #8E5444 | Dark terracotta variant |
| --radius | 1.25rem (20px) | — | Base border-radius |

### Gradients

| Name | Definition | Usage |
|---|---|---|
| gradient-warm | linear-gradient(135deg, hsl(--warm-bg), hsl(--warm-card)) | Warm subtle page gradient |
| hero-glow | radial-gradient(ellipse 65% 55% at 50% 25%, hsl(--terracotta / 0.08), transparent 70%) | Hero section glow |
| Hero overlay | linear-gradient(to bottom, hsl(20 20% 12%/0.35) → hsl(20 20% 12%/0.45) → hsl(--background/0.98)) | Hero image dark warm overlay |

### Background Colors

- Page: hsl(30 29% 95%) — warm off-white
- Cards: hsl(30 22% 98%) — near-white warm
- Header: card/90 + backdrop-blur-xl — translucent
- Breathing strip: #E8C2B6 (inline) — terracotta blush
- "Why" card: #F4EDE6 (inline) — warm cream

### Accent Usage Rules

- Primary terracotta (--primary): Used for CTAs, active states, slider thumbs, progress indicators, icons
- Destructive red (--destructive): ONLY for red flags, STOP screen, "too much" toggle, safety warnings
- Blue/Green/Amber/Purple: Used ONLY for category badges (breath/mobility/stability/release)
- Category badge colors (hardcoded, not tokenized):
  - Breath: bg-blue-50 text-blue-600
  - Mobility: bg-emerald-50 text-emerald-600
  - Stability: bg-amber-50 text-amber-700
  - Release: bg-purple-50 text-purple-600

### Typography Scale

| Element | Font | Size | Weight | Line-Height |
|---|---|---|---|---|
| body | Heebo | 15px | 400 | 1.65 |
| h1 | Heebo | 28px (mobile), 32px (sm+) | 700 (bold) | 1.25 |
| h2 | Heebo | 18px (mobile), 20px (sm+) | 700 | snug (~1.3) |
| h3 (in-page) | Heebo | 15–16px | 700 | — |
| small / .text-small | Heebo | 12px | — | — |
| p, li, span, label | Heebo | 15px | 400 | 1.65 |
| Hero H1 | Heebo | 36px (mobile), 42px (sm+) | 700 | 1.18 |
| Hero subtitle | Heebo | 28px (mobile), 34px (sm+) | 600 | — |
| Slider value badge | Heebo | 14px | 700 | — |

Font source: Google Fonts Heebo (loaded in index.html).

### Border Radius Scale

| Token | Value | Usage |
|---|---|---|
| --radius (lg) | 1.25rem (20px) | Base card radius |
| md | calc(--radius - 2px) = 18px | Medium elements |
| sm | calc(--radius - 4px) = 16px | Small elements |
| card-premium class | 20px | All premium cards |
| Buttons | 14px (rounded-2xl = 16px in practice) | Rounded buttons |
| Badges/chips | rounded-full (999px) | Category pills, slider thumbs |
| Custom checkbox | 6px | Checkbox corners |

### Shadow System

| Class | Definition | Usage |
|---|---|---|
| shadow-calm | 0 4px 24px -4px hsl(--terracotta/0.09), 0 1px 3px hsl(--terracotta/0.04) | Standard card shadow |
| shadow-calm-lg | 0 8px 36px -6px hsl(--terracotta/0.15), 0 2px 8px hsl(--terracotta/0.06) | Elevated card shadow |
| Premium card shadow | 0 20px 50px rgba(0,0,0,0.06) (inline) | Home page large cards |
| Logo circle shadow | 0 8px 30px rgba(0,0,0,0.12) | Home page logo circle |
| Slider thumb shadow | 0 2px 8px hsl(--primary/0.35) | Range slider thumb |
| Header shadow | shadow-calm class | Sticky header |

### Spacing Scale

Standard Tailwind spacing used throughout. Key patterns:
- Page horizontal padding: px-4 (16px)
- Card internal padding: p-4 to p-6 (16–24px)
- Section vertical gap: space-y-5 to space-y-6 (20–24px)
- Inner element gap: space-y-2 to space-y-4 (8–16px)
- Container max-width: max-w-lg (~512px) for mobile-first layout
- Bottom padding for sticky bars: pb-24 to pb-28 (96–112px)

### Breakpoints

| Breakpoint | Size | Usage |
|---|---|---|
| default (mobile) | <640px | Primary design target |
| sm | ≥640px | Typography scale-up (h1: 32px, hero: 42px) |
| md | ≥768px | ExpertReview grid columns |
| 2xl | 1400px | Container max-width |

### RTL Implementation

- direction: rtl set on body in index.css
- dir="rtl" on dialog content, expert review page
- Range slider explicitly set to direction: ltr (to prevent inversion)
- RTL toggle switch: uses right-1 and right-[calc(100%-1.75rem)] positioning
- Selected condition checkmarks: left-2 (visually top-right in RTL)
- All text naturally flows RTL via Heebo font
- Border-right used for safety warnings (visually left border in RTL)

### Animation Timing Constants

| Animation | Duration | Easing | Delay |
|---|---|---|---|
| pageEnter | 200ms | ease-out | none |
| heroFadeUp | 400ms | ease-out | 150ms |
| fade-in | 400ms | ease-out | none |
| slide-in | 300ms | ease-out | none |
| accordion-down/up | 200ms | ease-out | none |
| Press scale | 120ms | ease | none |
| V7 animation easing | — | cubic-bezier(0.45,0.05,0.55,0.95) | varies per body part |

### Easing Curves

- Standard: ease-out — page transitions, fades
- Press feedback: ease — button press scale
- V7 animations: cubic-bezier(0.45,0.05,0.55,0.95) — organic breathing/movement
- Tailwind default transition-all, transition-colors used throughout

### Transition Durations

- Color transitions: transition-colors (~150ms default)
- All transitions: transition-all (~150ms default)
- Page enter: 200ms
- Hero fade: 400ms with 150ms delay
- V7 body part cycles: 4.2s–6.8s (per keyframe)

---

## 2. COMPONENT INVENTORY

### Layout (src/components/Layout.tsx)
- Purpose: Global page wrapper — header, flow progress bar, main content area
- Props: children: ReactNode, hideHeader?: boolean
- Visual structure: div min-h-screen → header sticky (logo + "about" button) → FlowProgress (if on flow route) → main max-w-lg
- Styling: Tailwind semantic tokens, card/90 backdrop-blur-xl header
- Used in: Every page except Home (which uses hideHeader)

### Header (embedded in Layout)
- Purpose: Sticky top bar with logo and "about" link
- Visual: Logo image (40×40 circle) + "יעל ארבל" text + info icon
- Not a separate component — part of Layout.tsx

### FlowProgress (src/components/FlowProgress.tsx)
- Purpose: Multi-step progress indicator showing current position in user flow
- Props: current: number, total: number
- Used in: Layout (auto-shown for flow routes)

### Hero (embedded in Home page)
- Purpose: Full-bleed hero section with background image, overlay, CTA
- Not a separate component — built into Home.tsx

### ExerciseCard (src/components/ExerciseCard.tsx)
- Purpose: Individual exercise display card
- Props: Exercise data
- Used in: Various exercise display contexts

### ExerciseAnimationV7 (src/components/animations/ExerciseAnimationV7.tsx)
- Purpose: Primary animation system — rigged SVG feminine silhouette
- Props: exercise: Exercise, large?: boolean
- Visual structure: SVG viewBox (320×110) with 7 body part groups (head, torso, hips, armL, armR, legL, legR) + shadow
- Styling: CSS keyframes injected via style tag, Tailwind gradient backgrounds per category
- 16 motion recipes: breath, catCow, bridge, birdDog, wallSlides, pelvicTilt, walkInPlace, neckRelease, chairSquat, heelRaises, sideLegRaise, bodyScan, hamstringStretch, shoulderOpen, coreHold, gentleFlow
- Used in: Workout page

### SafeImage (src/components/SafeImage.tsx)
- Purpose: Image with fallback handling on load error
- Props: src, alt, className, fallbackClassName
- Used in: Plan page (coach chip)

### AboutModal (src/components/AboutModal.tsx)
- Purpose: Full "About Yael" dialog with bio, method description, animation toggle, debug panel, reset
- Props: open: boolean, onClose: () => void
- Visual: Dialog with scrollable content, image strip, multiple sections, animation toggle switch, reset button with confirmation
- Used in: Layout (triggered by header "about" button)

### PageIllustration (src/components/illustrations/PageIllustration.tsx)
- Purpose: Decorative SVG illustration per page theme
- Props: theme: string (shield, list, settings, sliders, calendar, check, etc.)
- Used in: Disclaimer, Conditions, Setup, Questionnaire, Plan, CheckinPage

### HeroIllustration (src/components/illustrations/HeroIllustration.tsx)
- Purpose: Hero-specific decorative illustration
- Used in: Potentially Home page (currently not used — hero uses background image)

### Button (src/components/ui/button.tsx)
- Purpose: Shadcn button with custom variants
- Key variants: hero (primary terracotta solid), outline-calm (soft outline), stop (destructive), default, outline
- Sizes: sm, default, lg, xl
- Used in: Every page

### Card (src/components/ui/card.tsx)
- Purpose: Shadcn card primitives
- Note: Most cards use card-premium utility class instead of Card component directly

### Navigation Logic
- Router: react-router-dom v6 with BrowserRouter
- Guard: DisclaimerGuard component redirects to /disclaimer if disclaimer not accepted
- Flow routes: /conditions → /setup → /questionnaire → /plan → /workout/:sessionId → /checkin/:sessionId
- Unguarded routes: /, /disclaimer, /stop, /expert-review

### Footer
- Does not exist. No dedicated footer component.

---

## 3. PAGE-BY-PAGE STRUCTURE

### Home (/)
- Purpose: Landing page — explain the app, build trust, CTA to start
- Layout tree: Layout(hideHeader) → Hero (full-bleed bg image + overlay + CTA) → Logo circle → Feature highlights → Method section → Why it works → How it works (3 steps) → Trust strip → Bottom CTA
- Primary CTA: "מתחילים" (hero variant button) → /disclaimer
- Secondary CTA: "קצת על השיטה ↓" (scroll anchor)
- Animation: animate-page-enter, animate-hero-fade-up
- Images: /assets/yael/hero.jpg (hero background), /assets/brand/logo-option-1.png (logo circle), /assets/yael/yoga.jpg (mid-page photo)
- Density: Medium — 6 major visual blocks
- Known compromises: Category badge colors are hardcoded (not tokenized)

[INSERT HOME SCREENSHOT HERE]

### Disclaimer (/disclaimer)
- Purpose: Medical disclaimer acceptance gate
- Layout tree: Layout → PageIllustration(shield) → H1 → Disclaimer card → Checkbox → Continue button
- Primary CTA: "ממשיכים" (disabled until checkbox checked) → /conditions
- No secondary CTA
- Animation: animate-page-enter
- Images: None (SVG illustration only)
- Density: Low — single card + checkbox

### Condition Selection (/conditions)
- Purpose: Select one or more health conditions
- Layout tree: Layout → PageIllustration(list) → H1 + subtitle → 2-column grid of condition buttons → Sticky bottom CTA
- Primary CTA: "המשך" (sticky bottom) → /setup
- Animation: animate-page-enter
- Images: None
- Density: Medium — 17 condition buttons in 2-column grid
- Known compromises: Condition buttons can feel tight on small screens with long Hebrew text

### Setup (/setup)
- Purpose: Configure sessions/week, minutes, time of day, energy level, flare toggle
- Layout tree: Layout → PageIllustration(settings) → H1 → Sessions card → Minutes card → Time card → Energy card → Flare toggle card → Continue button
- Primary CTA: "המשך" → /questionnaire
- Animation: animate-page-enter
- Images: None
- Density: High — 5 configuration cards stacked vertically

### Questionnaire (/questionnaire)
- Purpose: Condition-specific health assessment (pain, fatigue, sleep, triggers, red flags)
- Layout tree: Layout → PageIllustration(sliders) → Dynamic title → Condition-specific sections (SectionCard components) → Submit button
- Three modes: Fibromyalgia questionnaire (5 sections), condition-specific questionnaire, generic questionnaire
- Primary CTA: "צור תכנית" → /plan (or /stop if red flags)
- Animation: animate-page-enter
- Images: None
- Density: Very high — multiple cards with sliders, multi-selects, radio groups
- Known compromises: Long page on fibro path; many inputs may overwhelm

[INSERT QUESTIONNAIRE SCREENSHOT HERE]

### Plan (/plan)
- Purpose: Display weekly workout plan with session cards
- Layout tree: Layout → PageIllustration(calendar) → H1 + subtitle + coach chip → Session cards (each with day, duration, mode badge, start button) → Info card → Tip card → Change settings button
- Primary CTA: "התחל אימון" per session → /workout/:sessionId
- Secondary CTA: "שנה דקות/תדירות" → /setup
- Animation: animate-page-enter
- Images: /assets/yael/hero.jpg (coach chip avatar, 28×28)
- Density: Medium-high — 2–5 session cards + 2 info cards

[INSERT PLAN SCREENSHOT HERE]

### Workout (/workout/:sessionId)
- Purpose: Active exercise execution screen
- Layout tree: Layout → Progress dots + timer → Exercise title + category badge + voice button → Instructions card (numbered steps) → SVG Animation → Breathing strip → Reps/range badges → Collapsible "why" card → Safety warning → Equipment badges → Next exercise button → Pacing reminder → Condition tip → Sticky bottom bar (easier/flare/pause/finish)
- Primary CTA: "סיימתי אימון" (sticky bottom) → /checkin/:sessionId
- Secondary CTA: "לתרגיל הבא ←", "קל יותר", "היום פלייר"
- Animation: ExerciseAnimationV7 (SVG rigged body), animate-page-enter, animate-fade-in on why card
- Images: None (SVG animation only)
- Density: High — immersive single-exercise focus with multiple info sections
- Known compromises: Many sections stacked; long scroll per exercise

[INSERT WORKOUT SCREENSHOT HERE]

### Check-in (/checkin/:sessionId)
- Purpose: Post-workout pain/fatigue reporting
- Layout tree: Layout → PageIllustration(check) → H1 + subtitle → Pain/fatigue sliders (before/after) → "Too much" toggle + "What helped most" radio → Save button
- Primary CTA: "שמור והמשך" → /plan
- Animation: animate-page-enter
- Images: None
- Density: Medium — 2 cards with sliders and controls

### Stop (/stop)
- Purpose: Red flag safety screen — blocks workout when dangerous symptoms reported
- Layout tree: Layout → Warning icon (80px circle) → H1 "עצרי רגע" → Warning card with symptoms → Return home button
- Primary CTA: "חזרה לעמוד הראשי" → /
- Animation: None specific
- Images: None
- Density: Low — single warning card

### About (modal, no route)
- Purpose: About Yael, method description, tools, reset
- Layout: Dialog modal with scrollable content
- Major blocks: Image strip → Bio → Personal method → Home program → Why it works → Therapeutic approach → Teachers → Tools (animation toggle) → Debug panel (hidden) → Reset button
- Images: /assets/yael/hero.jpg, /assets/yael/yoga.jpg (both 128×96 thumbnails)

### Expert Review (/expert-review)
- Purpose: Developer/expert audit view of exercise library
- Layout: Full-width (not in Layout wrapper), max-w-[1400px], dir="rtl"
- Tabs: Matrix view (exercise × condition safety), Export view (CSV download)
- Primary CTA: CSV download button
- Density: Very high — full table of 85+ exercises × 12+ conditions

---

## 4. MASTER EXERCISE LIBRARY

### Total Exercises: ~85–90

### Breakdown by Category

| Category (Hebrew) | Category (ID) | Count (approx) |
|---|---|---|
| נשימה | breath | 20 |
| תנועה | mobility | 27 |
| יציבות | stability | 25 |
| שחרור | release | 23 |

### Safety Tags Explanation

| Tag | Meaning | When false |
|---|---|---|
| universalSafe | Safe for general population | Exercise has specific risk |
| pregnancySafe | Safe during pregnancy/postpartum | Prone position, deep twists, long supine |
| discSafe | Safe for disc herniation / sciatica | Deep flexion, loaded rotation |
| kneeSafe | Safe for knee conditions | Deep loaded knee flexion |
| oaSafe | Safe for osteoarthritis | High impact, deep load |
| shoulderSafe | Safe for neck/shoulder conditions | Overhead load, extreme ROM |
| flareSafe | Safe during flare/crisis day | Intensity too high for crisis |

### How Filtering Works

1. Exercise Adapter (src/data/exerciseAdapter.ts): At app load, iterates all 17 conditions. For each condition, filters MASTER_EXERCISES by the condition's safety tag. Creates prefixed IDs (e.g., fib_breath_01, back_mob_03) and converts to legacy Exercise[] format.
2. Plan Generator (src/lib/planGenerator.ts): When generating a plan, looks up exercises by condition prefix. Applies additional safety filters (disc unsafe patterns, pregnancy restrictions).

### How Multi-Condition Merge Works

- When user selects multiple conditions, getConditionExerciseIds() collects exercises matching ANY condition prefix.
- mergeExerciseIds() deduplicates via Set.
- Cross-condition safety: If disc is selected, exercises with flexion patterns are removed. If pregnancy is selected, prone/bridge exercises are restricted.

### Mode Logic

| Mode | Trigger | Behavior |
|---|---|---|
| normal | Default; energy ≠ low | Full exercise pool, balanced categories |
| easier | Pain ≥ 5, fatigue ≥ 5, energy = "נמוכה" | Limited stability, full breath + mobility + release |
| flare | Pain ≥ 7, fatigue ≥ 7, sleep ≤ 3, flare = "כן", or flareToday toggle | Only flareSafe exercises, bias to breath + release, minimal mobility, no stability |

Fibro-specific thresholds:
- Flare: flareNow === "כן" OR profile.flareToday
- Easier: pain >= 7 OR fatigue >= 7 OR sleep <= 3
- Normal: default

Generic thresholds:
- Flare: pain >= 7 OR fatigue >= 7 OR sleep <= 3 OR flareNow === "כן"
- Easier: pain >= 5 OR fatigue >= 5
- Normal: default

### Category Balance in Selection

| Mode | Breath | Mobility | Stability | Release |
|---|---|---|---|---|
| Normal | 1 | 40% | 30% | 30% |
| Easier | 1 | 35% | 20% | 45% |
| Flare | 1 | 20% | 10% | 70% |

### Exercise Count Per Duration

| Minutes | Exercise Count |
|---|---|
| ≤10 | 3 |
| ≤15 | 5 |
| ≤20 | 6 |
| ≤30 | 8 |
| ≤45 | 10 |
| 60+ | 12 |

### Randomization Logic

Currently no randomization — exercises are selected deterministically by category order and array position. Same inputs produce same plan.

### Scoring System

Newer exercises include relevance scores (0–5) per condition. These are defined but not yet used in plan generation — the current engine uses prefix-based filtering and safety tags only.

---

## 5. CONDITION LOGIC

### פיברומיאלגיה (Fibromyalgia)
- Internal key: פיברומיאלגיה
- Prefix: fib_
- Safety tag: universalSafe
- Exercise pools:
  - Flare: 7 specific IDs
  - Easier: 9 IDs (adds mobility + 1 stability)
  - Normal: 11 IDs (full pool)
- Questionnaire: Full 5-section fibro assessment
- Contraindicated movements: High intensity, aggressive stretching, loaded stability in flare
- Special rules: Only condition with hardcoded exercise ID pools; gets dedicated questionnaire path

### כאבי גב (Back Pain)
- Internal key: כאבי גב
- Prefix: back_
- Safety tag: universalSafe
- Safety exclusions: back_mob_02 filtered out when disc is also selected

### צוואר / כתפיים (Neck / Shoulders)
- Internal keys: צוואר, כתפיים
- Prefixes: neck_, shoulder_
- Safety tag: shoulderSafe

### ברכיים / מפרקי ירך (Knee / Hip)
- Internal keys: ברכיים, מפרקי ירך
- Prefixes: knee_, hip_
- Safety tag: kneeSafe
- Contraindicated: Deep loaded flexion

### היריון / אחרי לידה (Pregnancy / Postpartum)
- Internal keys: היריון, אחרי לידה
- Prefixes: pregnancy_, postpartum_
- Safety tag: pregnancySafe
- Contraindicated: Prone positions, deep twists, long supine

### פריצת דיסק / סיאטיקה (Disc / Sciatica)
- Internal keys: פריצת דיסק, סיאטיקה
- Prefixes: disc_, sciatica_
- Safety tag: discSafe
- Contraindicated: Deep flexion, loaded rotation

### אוסטאוארתריטיס (Osteoarthritis)
- Internal key: אוסטאוארתריטיס
- Prefix: oa_
- Safety tag: oaSafe
- Contraindicated: High impact, deep loaded flexion

### שיקום אחרי פציעה (Post-Injury Rehab)
- Internal key: שיקום אחרי פציעה
- Prefix: rehab_
- Safety tag: universalSafe

### חרדה/מתח (Anxiety/Stress)
- Internal key: חרדה/מתח
- Prefix: stress_
- Safety tag: universalSafe
- Exercise bias: Breath + release heavy

### בעיות שינה (Sleep Issues)
- Internal key: בעיות שינה
- Prefix: sleep_
- Safety tag: universalSafe
- Exercise bias: Breath + release + slow mobility

---

## 6. ANIMATION SYSTEM

### Current Active Version: V7

### Implementation Method
- Pure CSS keyframes injected via style tag in component
- SVG with grouped body parts — 7 rigged groups: head, torso, hips, armL, armR, legL, legR + shadow
- No JavaScript animation — all motion is CSS animation property

### Whether Movement is Real Transform-Based
Yes. All motion uses CSS transform properties:
- translateX, translateY for position
- rotate for joint rotation
- scaleX, scaleY for breathing expansion
- transform-origin per body part for anatomically correct pivots

### Loop Duration
- Per-recipe, ranging from 4.2s to 6.8s
- All animations are infinite loop
- Different body parts have different durations within the same recipe for organic feel

### 16 Motion Recipes
breath, catCow, bridge, birdDog, wallSlides, pelvicTilt, walkInPlace, neckRelease, chairSquat, heelRaises, sideLegRaise, bodyScan, hamstringStretch, shoulderOpen, coreHold, gentleFlow

### Reduced Motion Handling
- @media (prefers-reduced-motion: reduce) → all animations disabled
- User toggle in About modal → writes yaelYogaDisableAnimations to localStorage
- If disabled: .v7-frozen * sets animation-play-state: paused

### Known Visual Limitations
- All exercises within a category share a limited set of recipes
- SVG figure is stylized (not photorealistic)
- No exercise-specific poses — same standing figure for all
- Body proportions are fixed (no seated, prone, or supine variations visible)

---

## 7. VISUAL ASSET MAP

### Logo Files
| File | Location | Usage |
|---|---|---|
| logo.png | public/assets/brand/logo.png | Header (Layout.tsx) — 40×40 circle |
| logo-option-1.png | public/assets/brand/logo-option-1.png | Home page logo circle — 64×64 |
| logo-option-2.png | public/assets/brand/logo-option-2.png | Not used in code |

### Hero Image
| File | Location | Usage |
|---|---|---|
| hero.jpg | public/assets/yael/hero.jpg | Home page hero background, Plan page coach chip, About modal |

### Yoga Image
| File | Location | Usage |
|---|---|---|
| yoga.jpg | public/assets/yael/yoga.jpg | Home page mid-section photo, About modal |

### Fallback Logic
- All img tags have onError handlers that hide the element
- SafeImage component provides fallback className when image fails
- No placeholder images shown on error — element simply disappears

### Branding Consistency Issues
- Two different logo files exist (logo.png in header, logo-option-1.png on home)
- logo-option-2.png exists but is unused
- Hero image doubles as both a full-bleed atmospheric photo and a tiny coach avatar

---

## 8. UX / FLOW MAP

### Step-by-Step Flow

Home (/)
  ↓ "מתחילים" button
Disclaimer (/disclaimer)
  ↓ Accept checkbox + "ממשיכים"
Conditions (/conditions)
  ↓ Select 1+ conditions + "המשך"
Setup (/setup)
  ↓ Configure sessions/week, minutes, time, energy, flare → "המשך"
Questionnaire (/questionnaire)
  ↓ Fill condition-specific assessment
  ↓ [if red flags checked → /stop]
  ↓ "צור תכנית" → generates plan
Plan (/plan)
  ↓ "התחל אימון" per session
Workout (/workout/:sessionId)
  ↓ Navigate through exercises → "סיימתי אימון"
Check-in (/checkin/:sessionId)
  ↓ Report pain/fatigue → "שמור והמשך" → /plan

### State Management Method
- React Context (AppContext.tsx) wrapping entire app
- Custom hook (useAppState.ts) manages state + persistence
- No Redux, no Zustand — simple useState + useCallback

### localStorage Usage
| Key | Type | Purpose |
|---|---|---|
| yaelYogaAppState | AppState object | All app state |
| yaelYogaDisableAnimations | boolean | Animation toggle preference |
| debugForceAnimate | boolean | Debug: force animations |
| debugAnimations | boolean | Debug: show animation debug panel |

### Recovery Behavior
- On page load, loadState() reads from localStorage
- Exercise library is always refreshed from code (not persisted)
- If localStorage is corrupted/empty, falls back to DEFAULT_APP_STATE
- Full reset available via About modal → "איפוס מלא" (with confirmation)

### Edge Cases Handled
- Missing session: Workout page shows "אימון לא נמצא" with back button
- No plan: Plan page shows empty state with CTA to create plan
- Image load failure: All images have onError → hide
- Red flags: Any checked red flag redirects to STOP screen
- Small exercise pool: UNIVERSAL_SAFE_IDS fallback pads pool
- Too much reported: adaptNextSession() downgrades next session
- Pain increase: If painAfter - painBefore >= 2 AND tooMuch, next session adapts

---

## 9. KNOWN DESIGN LIMITATIONS

### Layout / Spacing
- Questionnaire page (especially fibro path) is very long
- Condition selection grid — some Hebrew names may wrap awkwardly
- Workout page has many stacked sections per exercise
- Setup page has 5 cards stacked — feels dense but functional

### Animation Subtlety
- Many exercises fall back to gentleFlow or bodyScan recipes
- Only ~16 unique motion recipes for 85+ exercises
- SVG figure is always standing — no seated, prone, or supine poses
- Movement amplitudes are intentionally small for medical safety feel

### Brand Consistency
- Category colors are hardcoded Tailwind colors, not part of design token system
- Some inline styles bypass the design system
- Workout page has hardcoded category color maps

### Code Compromises Affecting Design
- Exercise adapter generates IDs by array position — if order changes, IDs shift
- No randomization in exercise selection
- Relevance scores exist in schema but aren't used in selection
- No offline support despite being a practice app

---

## 10. SCREENSHOT EMBED PLACEHOLDERS

[INSERT HOME SCREENSHOT HERE]
[INSERT WORKOUT SCREENSHOT HERE]
[INSERT PLAN SCREENSHOT HERE]
[INSERT QUESTIONNAIRE SCREENSHOT HERE]
[INSERT CONDITIONS SCREENSHOT HERE]
[INSERT SETUP SCREENSHOT HERE]
[INSERT DISCLAIMER SCREENSHOT HERE]
[INSERT STOP SCREENSHOT HERE]
[INSERT CHECKIN SCREENSHOT HERE]
[INSERT ABOUT MODAL SCREENSHOT HERE]
[INSERT EXPERT REVIEW SCREENSHOT HERE]

---

End of audit export.
Generated for external expert review — no code was modified.`;

const AuditExport = () => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(AUDIT_TEXT).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    });
  };

  const handleDownload = () => {
    const blob = new Blob([AUDIT_TEXT], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "EXPORT_FULL_APP_SYSTEM_AUDIT.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ direction: "ltr", padding: "20px", maxWidth: "900px", margin: "0 auto", fontFamily: "monospace" }}>
      <div style={{ display: "flex", gap: "12px", marginBottom: "20px", position: "sticky", top: 0, background: "#fff", padding: "12px 0", zIndex: 10 }}>
        <button
          onClick={handleDownload}
          style={{ padding: "12px 24px", fontSize: "18px", background: "#B26A57", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}
        >
          ⬇ Download .md File
        </button>
        <button
          onClick={handleCopy}
          style={{ padding: "12px 24px", fontSize: "18px", background: copied ? "#22c55e" : "#333", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}
        >
          {copied ? "✅ Copied!" : "📋 Copy All"}
        </button>
      </div>
      <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", fontSize: "13px", lineHeight: 1.6, background: "#f5f5f5", padding: "20px", borderRadius: "8px" }}>
        {AUDIT_TEXT}
      </pre>
    </div>
  );
};

export default AuditExport;
