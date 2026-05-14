// ─── Exercise instruction cues for the workout player ───
// Generates alignment, breath, and modification cues from V2 exercise data.

import type { Exercise, MovementCategory, MovementDirection } from "@/data/exercises_v2";

export interface ExerciseCues {
  alignment: string;
  breath: string;
  modification: string | null;
}

/** Alignment cues by movement category */
const ALIGNMENT_BY_CATEGORY: Record<MovementCategory, string> = {
  "Spinal Mobility": "Keep your spine long — initiate movement from the centre of your back.",
  "Stability / Core": "Draw your navel gently toward your spine — maintain a neutral pelvis.",
  "Hip Mobility": "Keep your pelvis level — let the movement come from the hip joint.",
  "Balance": "Fix your gaze on a steady point — root down through your standing foot.",
  "Upper Limb Weight Bearing": "Spread your fingers wide — press evenly through both hands.",
  "Restorative": "Let your body be fully supported — release all muscular effort.",
  "Breath": "Sit or lie comfortably — let your shoulders drop away from your ears.",
  "Transitional": "Move slowly and deliberately — use your hands for support if needed.",
};

/** Breath cues by movement direction */
const BREATH_BY_DIRECTION: Record<MovementDirection, string> = {
  "Flexion": "Exhale as you fold forward — inhale to lengthen.",
  "Extension": "Inhale as you open and extend — exhale to release.",
  "Flexion–Extension Cycle": "Inhale to extend, exhale to flex — match breath to movement.",
  "Rotation": "Inhale to prepare, exhale as you rotate — keep the breath smooth.",
  "Lateral Flexion": "Inhale to reach tall, exhale to bend to the side.",
  "Neutral Stability": "Breathe steadily — in through the nose, out through the mouth.",
  "Multi-plane": "Maintain a calm, even breath throughout the movement.",
};

/**
 * Generate 2–3 instruction lines for an exercise.
 * Returns an alignment cue, a breath cue, and optionally a modification note.
 */
export function getExerciseCues(
  exercise: Exercise,
  activeModification?: string,
): ExerciseCues {
  const alignment = ALIGNMENT_BY_CATEGORY[exercise.movement_category];
  const breath = BREATH_BY_DIRECTION[exercise.movement_direction];

  // Build modification note from active modification or profile modifications
  let modification: string | null = activeModification?.trim() || null;

  // If no active modification, try to pull a general one from profiles
  if (!modification) {
    const allMods = Object.values(exercise.profiles)
      .map(p => p?.modifications)
      .filter((m): m is string => !!m && m.trim().length > 0);
    if (allMods.length > 0) {
      // Use the first non-empty one as a general option
      modification = `If needed: ${allMods[0]}`;
    }
  }

  return { alignment, breath, modification };
}
