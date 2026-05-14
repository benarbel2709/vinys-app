/**
 * Scoring Engine v2.0 — Weighted score-based exercise selection.
 * Now uses ConditionKey enums (English) instead of Hebrew strings.
 * v2.1 — Mandatory session order: breath → body → closing rest.
 *         Spinal variety enforcement for sessions ≥ 20 min.
 *         Duration calibration to match user's chosen session time.
 */

import { Exercise } from "@/types";
import { MasterExercise, RelevanceScores, MASTER_EXERCISES } from "@/data/masterExercises";
import { MASTER_LOOKUP } from "@/data/exerciseAdapter";
import { readState, writeState } from "@/lib/storage";
import type { ConditionKey, Mode } from "@/constants/conditions";
import {
  CONDITION_WEIGHT,
  CONDITION_RELEVANCE_KEY,
  CONDITION_SAFETY_TAG,
} from "@/constants/conditions";

export type { Mode };

// ═══════════════════════════════════
// DEFAULT RELEVANCE (for exercises without scores)
// ═══════════════════════════════════
const CATEGORY_DEFAULT_RELEVANCE: Record<string, RelevanceScores> = {
  "breath": { fibro: 5, backPain: 3, neckShoulder: 3, discSciatica: 3, kneeHip: 3, oa: 3, pregnancyPostpartum: 4, sleep: 5, stressAnxiety: 5, rehab: 3, weightMgmt: 4 },
  "mobility": { fibro: 3, backPain: 4, neckShoulder: 3, discSciatica: 3, kneeHip: 3, oa: 3, pregnancyPostpartum: 3, sleep: 2, stressAnxiety: 3, rehab: 4, weightMgmt: 4 },
  "stability": { fibro: 3, backPain: 4, neckShoulder: 3, discSciatica: 3, kneeHip: 4, oa: 3, pregnancyPostpartum: 3, sleep: 2, stressAnxiety: 2, rehab: 4, weightMgmt: 4 },
  "release": { fibro: 5, backPain: 4, neckShoulder: 4, discSciatica: 3, kneeHip: 3, oa: 4, pregnancyPostpartum: 4, sleep: 5, stressAnxiety: 5, rehab: 3, weightMgmt: 4 },
};

function getRelevance(master: MasterExercise): RelevanceScores {
  return master.relevance || CATEGORY_DEFAULT_RELEVANCE[master.category] || CATEGORY_DEFAULT_RELEVANCE["mobility"];
}

// ═══════════════════════════════════
// SESSION HASH — deterministic variety
// ═══════════════════════════════════
const STORAGE_KEY_RECENT = "vinys_recent_exercises";

function getSessionSeed(conditions: ConditionKey[]): number {
  const now = new Date();
  const weekNum = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000));
  const condStr = conditions.sort().join(",");
  let hash = weekNum * 31;
  for (let i = 0; i < condStr.length; i++) {
    hash = ((hash << 5) - hash + condStr.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function seededShuffle<T>(arr: T[], seed: number): T[] {
  const result = [...arr];
  let s = seed;
  for (let i = result.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0x7fffffff;
    const j = s % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// ═══════════════════════════════════
// RECENT USAGE TRACKING
// ═══════════════════════════════════
function getRecentExercises(): string[] {
  const recent = readState<string[]>(STORAGE_KEY_RECENT, []);
  if (recent.length === 0) {
    // Migrate from old keys
    const oldYogacare = readState<string[]>("yogacareRecentExercises", []);
    if (oldYogacare.length > 0) {
      writeState(STORAGE_KEY_RECENT, oldYogacare);
      return oldYogacare;
    }
    const old = readState<string[]>("yaelRecentExercises", []);
    if (old.length > 0) {
      writeState(STORAGE_KEY_RECENT, old);
      return old;
    }
  }
  return recent;
}

function recordUsedExercises(ids: string[]) {
  const recent = getRecentExercises();
  const updated = [...ids, ...recent].slice(0, 20);
  writeState(STORAGE_KEY_RECENT, updated);
}

// ═══════════════════════════════════
// MASTER EXERCISE LOOKUP BY ID
// ═══════════════════════════════════
const MASTER_BY_ID = new Map<string, MasterExercise>();
for (const m of MASTER_EXERCISES) {
  MASTER_BY_ID.set(m.id, m);
}

function getMasterForExercise(exercise: Exercise): MasterExercise | undefined {
  const fromLookup = MASTER_LOOKUP[exercise.id];
  if (fromLookup) return fromLookup;
  return MASTER_BY_ID.get(exercise.id);
}

// ═══════════════════════════════════
// SAFETY FILTER
// ═══════════════════════════════════
function isSafeForConditions(master: MasterExercise, conditions: ConditionKey[], mode: Mode): boolean {
  for (const condition of conditions) {
    const tag = CONDITION_SAFETY_TAG[condition];
    if (tag && !master.tags[tag as keyof MasterExercise["tags"]]) return false;
  }

  if (mode === "flare" && !master.tags.flareSafe) return false;

  const hasDisc = conditions.includes("disc_herniation") || conditions.includes("sciatica");
  if (hasDisc) {
    if (master.contraindicationFlags) {
      if (master.contraindicationFlags.avoidFlexion || master.contraindicationFlags.avoidRotation) {
        return false;
      }
    } else if (master.contraindications?.some(c => c.toLowerCase().includes("disc") || c.toLowerCase().includes("sciatica") || c.toLowerCase().includes("flexion") || c.toLowerCase().includes("rotation"))) {
      return false;
    }
  }

  const hasPregnancy = conditions.includes("pregnancy");
  if (hasPregnancy && !master.tags.pregnancySafe) return false;

  return true;
}

// ═══════════════════════════════════
// SCORING PIPELINE
// ═══════════════════════════════════
interface ScoredExercise {
  exercise: Exercise;
  master: MasterExercise;
  score: number;
}

function scoreExercise(
  exercise: Exercise,
  master: MasterExercise,
  conditions: ConditionKey[],
  mode: Mode,
  recentIds: Set<string>,
  userEquipment?: string[],
): number {
  const relevance = getRelevance(master);
  let score = 0;

  const condScores: number[] = [];
  for (const condition of conditions) {
    const key = CONDITION_RELEVANCE_KEY[condition] as keyof RelevanceScores;
    const weight = CONDITION_WEIGHT[condition] || 1.0;
    if (key) {
      condScores.push((relevance[key] || 0) * weight);
    }
  }

  if (condScores.length > 0) {
    score += condScores[0] * 2;
    if (condScores.length > 1) {
      const secondary = condScores.slice(1).reduce((a, b) => a + b, 0) / (condScores.length - 1);
      score += secondary;
    }
  }

  const cat = exercise.category;
  if (mode === "flare") {
    if (cat === "breath" || cat === "release") score += 2;
    if (cat === "stability") score -= 2;
  } else if (mode === "easier") {
    if (cat === "breath") score += 1;
    if (cat === "release") score += 0.5;
  }

  const hasStressOrFibro = conditions.some(c => c === "stress_anxiety" || c === "fibromyalgia" || c === "sleep_issues");
  if (hasStressOrFibro && (cat === "breath" || cat === "release")) {
    score += 1;
  }

  if (recentIds.has(exercise.id)) {
    score -= 2;
  }

  if (!master.equipment || master.equipment.length === 0) {
    score += 0.3;
  }

  // Equipment boost: boost exercises that match user's equipment (case-insensitive)
  if (userEquipment && userEquipment.length > 0 && master.equipment && master.equipment.length > 0) {
    const normalizedUserEquip = userEquipment.map(e => e.toLowerCase());
    const hasMatch = master.equipment.some(e => normalizedUserEquip.includes(e.toLowerCase()));
    if (hasMatch) score += 1;
  }

  return score;
}

// ═══════════════════════════════════
// CATEGORY BALANCE ENFORCEMENT
// ═══════════════════════════════════
interface CategoryTargets {
  breath: number;
  mobility: number;
  stability: number;
  release: number;
}

function getCategoryTargets(count: number, mode: Mode, conditions: ConditionKey[]): CategoryTargets {
  const hasSleep = conditions.includes("sleep_issues");

  // Always reserve 1 breath for opening and 1 release for closing
  const bodyCount = count - 2; // minus opening breath and closing rest

  if (mode === "flare") {
    const stability = Math.max(0, Math.floor(bodyCount * 0.1));
    const release = Math.max(0, Math.ceil(bodyCount * 0.45));
    const mobility = Math.max(0, bodyCount - stability - release);
    return { breath: 1, mobility, stability, release: release + 1 }; // +1 for closing
  }

  if (mode === "easier") {
    const stability = Math.max(0, Math.floor(bodyCount * 0.15));
    const release = Math.max(0, Math.ceil(bodyCount * 0.35));
    const mobility = Math.max(0, bodyCount - stability - release);
    return { breath: 1, mobility, stability, release: release + 1 };
  }

  const stability = Math.max(1, Math.floor(bodyCount * 0.25));
  const release = hasSleep
    ? Math.max(1, Math.ceil(bodyCount * 0.3))
    : Math.max(0, Math.ceil(bodyCount * 0.2));
  const mobility = Math.max(1, bodyCount - stability - release);
  return { breath: 1, mobility, stability, release: release + 1 };
}

// ═══════════════════════════════════
// EXERCISE COUNT BY DURATION
// ═══════════════════════════════════
function getExerciseCount(minutes: number): number {
  if (minutes <= 10) return 3;
  if (minutes <= 15) return 5;
  if (minutes <= 20) return 6;
  if (minutes <= 30) return 8;
  if (minutes <= 45) return 10;
  return 12;
}

// ═══════════════════════════════════
// SPINAL VARIETY (Section 9.2)
// ═══════════════════════════════════
type SpinalPlane = "flexion" | "extension" | "lateral" | "rotation";

const SPINAL_PATTERN_MAP: Record<string, SpinalPlane[]> = {
  "catcow_small": ["flexion", "extension"],
  "catcow_full": ["flexion", "extension"],
  "child_pose": ["flexion"],
  "forward_fold_seated": ["flexion"],
  "cobra_mini": ["extension"],
  "bridge_basic": ["extension"],
  "bridge_supported": ["extension"],
  "side_bend_seated": ["lateral"],
  "side_stretch_standing": ["lateral"],
  "seated_twist": ["rotation"],
  "supine_twist": ["rotation"],
  "thread_needle": ["rotation"],
};

function getSpinalPlanes(master: MasterExercise): SpinalPlane[] {
  // Check by ID first
  if (SPINAL_PATTERN_MAP[master.id]) return SPINAL_PATTERN_MAP[master.id];
  // Check by movement patterns or title keywords
  const title = master.title.toLowerCase();
  const planes: SpinalPlane[] = [];
  if (title.includes("cat") || title.includes("child") || title.includes("forward fold")) planes.push("flexion");
  if (title.includes("cobra") || title.includes("bridge") || title.includes("cow") || title.includes("extension")) planes.push("extension");
  if (title.includes("side bend") || title.includes("side stretch") || title.includes("lateral")) planes.push("lateral");
  if (title.includes("twist") || title.includes("rotation") || title.includes("thread")) planes.push("rotation");
  return planes;
}

// ═══════════════════════════════════
// POSE SET ORDERING for session structure
// ═══════════════════════════════════
const POSE_ORDER: Record<string, number> = {
  supine: 0, seated: 1, pelvic: 2, bridge: 3,
  sideLying: 4, allFours: 5, birdDog: 6,
  wall: 7, standing: 8, neck: 1,
};

function getPoseOrder(master: MasterExercise): number {
  if (master.poseSet) return POSE_ORDER[master.poseSet] ?? 5;
  return 5;
}

// ═══════════════════════════════════
// DURATION CALIBRATION (Section 9.3)
// ═══════════════════════════════════
function calibrateDurations(
  exerciseIds: string[],
  totalMinutes: number,
  library: Exercise[],
): Map<string, number> {
  const durations = new Map<string, number>();
  const exerciseMap = new Map(library.map(e => [e.id, e]));

  // Assign base durations by category
  let totalAssigned = 0;
  const entries: { id: string; baseDur: number; category: string; isLast: boolean }[] = [];

  exerciseIds.forEach((id, idx) => {
    const ex = exerciseMap.get(id);
    const master = MASTER_LOOKUP[id] || MASTER_BY_ID.get(id);
    const cat = ex?.category || master?.category || "mobility";
    const isLast = idx === exerciseIds.length - 1;

    let baseDur: number;
    if (isLast) baseDur = 2; // closing: min 2 min
    else if (cat === "breath") baseDur = 2;
    else if (cat === "mobility") baseDur = 2;
    else if (cat === "stability") baseDur = 2.5;
    else baseDur = 2;

    entries.push({ id, baseDur, category: cat, isLast });
    totalAssigned += baseDur;
  });

  // Distribute remaining time
  let remaining = totalMinutes - totalAssigned;

  // First, give closing exercise up to 5 min max
  const lastEntry = entries[entries.length - 1];
  if (lastEntry && remaining > 0) {
    const closingAdd = Math.min(3, remaining); // up to 5 total (2+3)
    lastEntry.baseDur += closingAdd;
    remaining -= closingAdd;
  }

  // Distribute rest evenly across middle exercises
  const middleEntries = entries.filter((_, i) => i > 0 && i < entries.length - 1);
  if (middleEntries.length > 0 && remaining > 0) {
    const perExercise = remaining / middleEntries.length;
    middleEntries.forEach(e => {
      const maxForCat = e.category === "mobility" ? 3 : 3;
      const add = Math.min(perExercise, maxForCat - e.baseDur);
      e.baseDur += Math.max(0, add);
    });
  }

  entries.forEach(e => durations.set(e.id, Math.round(e.baseDur)));
  return durations;
}

// ═══════════════════════════════════
// MAIN SELECTION FUNCTION
// ═══════════════════════════════════
export function selectExercisesScored(
  library: Exercise[],
  conditions: ConditionKey[],
  mode: Mode,
  minutes: number,
  closingPreference: "savasana" | "meditation" | "body_rest" = "savasana",
  userEquipment?: string[],
): string[] {
  const count = getExerciseCount(minutes);
  const recentIds = new Set(getRecentExercises());
  const seed = getSessionSeed(conditions);

  // Normalize user equipment for comparison
  const normalizedEquip = (userEquipment || []).map(e => e.toLowerCase());

  const scored: ScoredExercise[] = [];
  for (const exercise of library) {
    const master = getMasterForExercise(exercise);
    if (!master) continue;
    if (!isSafeForConditions(master, conditions, mode)) continue;

    // Equipment filter: always run — skip exercises requiring equipment the user doesn't have
    if (master.equipment && master.equipment.length > 0) {
      const needsUnavailable = master.equipment.some(
        eq => eq.toLowerCase() !== "mat" && !normalizedEquip.includes(eq.toLowerCase())
      );
      if (needsUnavailable) continue;
    }

    const score = scoreExercise(exercise, master, conditions, mode, recentIds, userEquipment);
    scored.push({ exercise, master, score });
  }

  const buckets: Record<string, ScoredExercise[]> = {
    breath: [], mobility: [], stability: [], release: [],
  };

  for (const s of scored) {
    const cat = s.exercise.category;
    if (buckets[cat]) buckets[cat].push(s);
  }

  for (const cat of Object.keys(buckets)) {
    buckets[cat].sort((a, b) => b.score - a.score);
  }

  for (const cat of Object.keys(buckets)) {
    const bucket = buckets[cat];
    const topHalf = Math.ceil(bucket.length / 2);
    const top = seededShuffle(bucket.slice(0, topHalf), seed + cat.charCodeAt(0));
    const bottom = bucket.slice(topHalf);
    buckets[cat] = [...top, ...bottom];
  }

  const targets = getCategoryTargets(count, mode, conditions);
  
  // ═══════════════════════════════════
  // MANDATORY SESSION ORDER (Section 9.1)
  // 1. OPENING: 1 breath exercise (seated preferred)
  // 2. MIDDLE: mobility + stability, ordered supine→seated→standing
  // 3. CLOSING: Savasana or meditation exercise (always last)
  // ═══════════════════════════════════

  // 1. Opening breath (prefer seated)
  const seatedBreaths = buckets.breath.filter(s => s.master.poseSet === "seated");
  const openingBreath = seatedBreaths[0] || buckets.breath[0];
  const opening: string[] = openingBreath ? [openingBreath.exercise.id] : [];

  // 2. Middle body exercises
  const usedIds = new Set(opening);
  const middleScored: ScoredExercise[] = [];

  // Collect mobility exercises
  const mobilityPool = buckets.mobility.filter(s => !usedIds.has(s.exercise.id));
  middleScored.push(...mobilityPool.slice(0, targets.mobility));

  // Collect stability exercises
  const stabilityPool = buckets.stability.filter(s => !usedIds.has(s.exercise.id));
  middleScored.push(...stabilityPool.slice(0, targets.stability));

  // Sort middle by pose progression: supine → seated → all fours → standing
  middleScored.sort((a, b) => getPoseOrder(a.master) - getPoseOrder(b.master));
  const middle = middleScored.map(s => s.exercise.id);
  middle.forEach(id => usedIds.add(id));

  // 3. Closing exercise
  let closingId: string | null = null;
  
  if (closingPreference === "savasana") {
    // Find savasana exercise (release category, supine pose)
    const savasana = buckets.release.find(s => 
      !usedIds.has(s.exercise.id) && 
      (s.master.id.includes("savasana") || s.master.title.toLowerCase().includes("savasana"))
    );
    closingId = savasana?.exercise.id || null;
  } else if (closingPreference === "body_rest") {
    // Find body scan or gentle rest exercise
    const bodyRest = buckets.release.find(s =>
      !usedIds.has(s.exercise.id) &&
      (s.master.id.includes("body_scan") || 
       s.master.title.toLowerCase().includes("body scan") ||
       s.master.title.toLowerCase().includes("stillness"))
    );
    closingId = bodyRest?.exercise.id || null;
  } else {
    // "meditation" — Find meditation/guided stillness exercise
    const meditation = buckets.release.find(s =>
      !usedIds.has(s.exercise.id) &&
      (s.master.title.toLowerCase().includes("meditation") ||
       s.master.title.toLowerCase().includes("stillness") ||
       s.master.title.toLowerCase().includes("body scan"))
    );
    closingId = meditation?.exercise.id || null;
  }

  // Fallback: any release exercise as closing
  if (!closingId) {
    const anyRelease = buckets.release.find(s => !usedIds.has(s.exercise.id));
    closingId = anyRelease?.exercise.id || null;
  }

  // Fill remaining release exercises into middle (not including closing)
  const releaseForMiddle = buckets.release
    .filter(s => !usedIds.has(s.exercise.id) && s.exercise.id !== closingId)
    .slice(0, Math.max(0, targets.release - 1));
  const middleRelease = releaseForMiddle.map(s => s.exercise.id);

  // Combine: opening + middle (mobility+stability) + middle release + closing
  const selected = [...opening, ...middle, ...middleRelease];

  // ═══════════════════════════════════
  // SPINAL VARIETY (Section 9.2)
  // ═══════════════════════════════════
  if (minutes >= 20 && middle.length >= 3) {
    const coveredPlanes = new Set<SpinalPlane>();
    const allMiddleIds = [...middle, ...middleRelease];
    
    for (const id of allMiddleIds) {
      const master = MASTER_LOOKUP[id] || MASTER_BY_ID.get(id);
      if (master) getSpinalPlanes(master).forEach(p => coveredPlanes.add(p));
    }

    const allPlanes: SpinalPlane[] = ["flexion", "extension", "lateral", "rotation"];
    const missingPlanes = allPlanes.filter(p => !coveredPlanes.has(p));
    const minRequired = minutes >= 20 ? 4 : 2;
    const missingCount = Math.max(0, minRequired - coveredPlanes.size);

    if (missingCount > 0 && missingPlanes.length > 0) {
      for (const plane of missingPlanes.slice(0, missingCount)) {
        // Find exercise with this plane from unused scored
        const replacement = scored.find(s => {
          if (usedIds.has(s.exercise.id)) return false;
          if (s.exercise.id === closingId) return false;
          if (s.exercise.category === "breath") return false;
          const planes = getSpinalPlanes(s.master);
          return planes.includes(plane);
        });

        if (replacement && selected.length > 2) {
          // Replace lowest-scoring middle exercise
          let lowestIdx = -1;
          let lowestScore = Infinity;
          for (let i = 1; i < selected.length; i++) { // skip opening
            const se = scored.find(s => s.exercise.id === selected[i]);
            if (se && se.score < lowestScore) {
              lowestScore = se.score;
              lowestIdx = i;
            }
          }
          if (lowestIdx > 0) {
            selected[lowestIdx] = replacement.exercise.id;
            usedIds.add(replacement.exercise.id);
          }
        }
      }
    }
  }

  // Add closing at the end
  if (closingId) {
    selected.push(closingId);
  }

  // Fill if under count
  if (selected.length < count) {
    const selectedSet = new Set(selected);
    const remaining = scored
      .filter(s => !selectedSet.has(s.exercise.id))
      .sort((a, b) => b.score - a.score);
    for (const s of remaining) {
      if (selected.length >= count) break;
      // Insert before closing
      selected.splice(selected.length - 1, 0, s.exercise.id);
    }
  }

  // Deduplicate: ensure no exercise appears more than once
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const id of selected) {
    if (!seen.has(id)) {
      seen.add(id);
      unique.push(id);
    }
    if (unique.length >= count) break;
  }
  recordUsedExercises(unique);
  return unique;
}

// ═══════════════════════════════════
// MODE DETERMINATION (exported for reuse)
// ═══════════════════════════════════
export function determineMode(
  profile: { flareToday: boolean; energyLevel: string },
  pain: number,
  fatigue: number,
  sleep: number,
  flareNow?: string,
): Mode {
  if (profile.flareToday) return "flare";
  if (flareNow === "yes") return "flare";
  if (pain >= 7 || fatigue >= 7 || sleep <= 3) return "flare";
  if (pain >= 5 || fatigue >= 5) return "easier";
  if (profile.energyLevel === "low") return "easier";
  return "normal";
}
