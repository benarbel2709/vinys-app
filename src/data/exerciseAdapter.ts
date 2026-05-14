/**
 * Exercise Adapter — converts Master exercises to legacy Exercise[] format.
 * Now uses ConditionKey from constants.
 */

import { Exercise } from "@/types";
import { MasterExercise, MASTER_EXERCISES } from "@/data/masterExercises";
import type { ConditionKey, ExerciseCategory } from "@/constants/conditions";
import { CONDITION_PREFIX, CONDITION_SAFETY_TAG } from "@/constants/conditions";

const CATEGORY_MAP: Record<string, ExerciseCategory> = {
  "breath": "breath",
  "mobility": "mobility",
  "stability": "stability",
  "release": "release",
};

const CATEGORY_ID: Record<string, string> = {
  "breath": "breath",
  "mobility": "mob",
  "stability": "stab",
  "release": "rel",
};

/** Lookup: generated Exercise ID → MasterExercise */
export const MASTER_LOOKUP: Record<string, MasterExercise> = {};

function convertToExercise(master: MasterExercise, id: string): Exercise {
  MASTER_LOOKUP[id] = master;
  return {
    id,
    name_he: master.title,
    category: CATEGORY_MAP[master.category],
    why_he: master.why,
    steps_he: master.instructions,
    safety_he: master.safety,
    minutes_default: master.durationMin,
    lottie_url_normal: null,
    lottie_url_easier: null,
    lottie_url_flare: null,
    equipment: master.equipment || [],
  };
}

/**
 * Generate full Exercise[] library from master exercises.
 * For each condition, filters by safety tag and assigns prefixed IDs.
 */
export function generateExerciseLibrary(): Exercise[] {
  const exercises: Exercise[] = [];
  const seenIds = new Set<string>();

  for (const [condition, prefix] of Object.entries(CONDITION_PREFIX)) {
    const tag = CONDITION_SAFETY_TAG[condition as ConditionKey];
    const filtered = MASTER_EXERCISES.filter((m) => m.tags[tag as keyof MasterExercise["tags"]]);

    // Group by category preserving array order
    const byCategory: Record<string, MasterExercise[]> = {};
    for (const m of filtered) {
      if (!byCategory[m.category]) byCategory[m.category] = [];
      byCategory[m.category].push(m);
    }

    for (const [cat, masters] of Object.entries(byCategory)) {
      const catId = CATEGORY_ID[cat];
      masters.forEach((m, i) => {
        const id = `${prefix}${catId}_${String(i + 1).padStart(2, "0")}`;
        if (!seenIds.has(id)) {
          seenIds.add(id);
          exercises.push(convertToExercise(m, id));
        }
      });
    }
  }

  return exercises;
}
