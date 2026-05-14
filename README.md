# Vinys.app — Personalized Therapeutic Yoga

**Live app:** [vinys.app](https://vinys.app)

A personalized therapeutic yoga web app built for Yael Arbel, a yoga therapist since 2008. The app creates tailored exercise plans based on the user's medical conditions, energy level, pain state, and available time — and adapts in real-time if the user is having a flare day.

---

## What This App Does

Users answer a short intake questionnaire (conditions, energy, pain, available time), and the app generates a custom weekly yoga plan from a library of 40 therapeutic exercises. If the user reports worsening pain or fatigue after a session, the next session automatically shifts to a gentler mode.

The app is built in Hebrew (RTL) and uses the browser's native Web Speech API to read exercises aloud.

---

## Tech Stack

- **Frontend:** React 18 + TypeScript + Vite
- - **Styling:** Tailwind CSS with a warm terracotta design system
  - - **UI Components:** shadcn/ui (Radix primitives)
    - - **State:** React Context + localStorage (no auth, no database)
      - - **TTS:** Browser-native Web Speech API (Hebrew he-IL)
        - - **Direction:** RTL throughout
         
          - ---

          ## Features

          - 17 supported conditions (back pain, knees, neck, fibromyalgia, pregnancy, disc herniation, anxiety, and more)
          - - 40 fully-written therapeutic exercises across 4 categories: Breath, Mobility, Stability, Release
            - - 3 adaptive plan modes: Normal, Easier, Flare
              - - Post-workout check-in that adapts future sessions based on feedback
                - - Red flag detection — stops the session and advises seeing a doctor
                  - - Expert review page with full exercise matrix and CSV export
                    - - No login required — all data stored locally
                     
                      - ---

                      ## Local Development

                          git clone https://github.com/benarbel2709/vinysgpt.git
                          npm install
                          npm run dev

                      ---

                      ## Key Files

                          src/pages/      - All app screens (Home, Plan, Workout, Checkin, etc.)
                          src/data/       - 40 exercises across condition-specific files
                          src/lib/        - Plan generation logic and localStorage wrapper
                          src/hooks/      - useTTS (Hebrew speech) and useAppState (state management)
                          src/types/      - TypeScript interfaces
                          src/components/ - Layout, SVG animations, illustrations

                      ---

                      ## Deployment

                      This project is built and deployed via [Lovable](https://lovable.dev) with a custom domain at [vinys.app](https://vinys.app).
