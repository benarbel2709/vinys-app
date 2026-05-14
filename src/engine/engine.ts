/**
 * Vinys Recommendation Engine v2.1.2
 * Single source of truth: exercisesV2 only.
 * Patched: relevance threshold, duplicate title guard, week-level repetition,
 * equipment required/optional, coherence check, sciatica/disc enforcement,
 * pregnancy safety, runtime v2 assertion.
 */

import type {
  ExerciseV2,
  UserInputV2,
  ConditionIdV2,
  ConditionProfileV2,
  SessionOutputV2,
  SessionExerciseV2,
  SessionMetadataV2,
  ModeV2,
  PlaneV2,
  MovementPatternV2,
  PoseSetV2,
  ContraV2,
  TagsV2,
} from "./types";
import { SESSION_SLOTS, RELEVANCE_KEYS, normalizeTitleKey } from "./types";
import { CONDITION_PROFILES } from "./conditions";
import { assertV2Exercise } from "./validators";

// ═══════════════════════════════════
// SEED / DETERMINISM
// ═══════════════════════════════════

function computeSeed(userId: string, date: string, minutes: number, primary: ConditionIdV2): number {
  const str = `${userId}:${date}:${minutes}:${primary}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

function tieBreakTop5<T>(items: T[], seed: number): T | undefined {
  if (items.length === 0) return undefined;
  const top = items.slice(0, 5);
  const rng = seededRandom(seed);
  const idx = Math.floor(rng() * top.length);
  return top[idx];
}

// ═══════════════════════════════════
// RED FLAG GATE
// ═══════════════════════════════════

function buildRedFlagSession(
  catalog: ExerciseV2[],
  seed: number,
  user: UserInputV2,
): SessionOutputV2 {
  const safe = catalog.filter(
    e => e.tags.universalSafe && e.tags.flareSafe && e.intensity.levelNumeric <= 2 &&
      e.poseSet !== "standing" && !e.contra.avoidDeepKneeFlexion &&
      e.spine.load !== "loaded" && !e.contra.avoidOverhead
  );

  const openings = safe.filter(e => e.category === "opening_breath" || (e.category === "release" && e.targets.includes("breath")));
  const releases = safe.filter(e => e.category === "release" || e.category === "cooldown");
  const closings = safe.filter(e => e.category === "opening_breath" && e.intensity.levelNumeric <= 1);

  const rng = seededRandom(seed);
  const pick = (arr: ExerciseV2[], n: number, used: Set<string>, usedTK: Set<string>): ExerciseV2[] => {
    const result: ExerciseV2[] = [];
    const filtered = arr.filter(e => !used.has(e.id) && !usedTK.has(normalizeTitleKey(e.title)));
    for (let i = 0; i < n && filtered.length > 0; i++) {
      const idx = Math.floor(rng() * filtered.length);
      result.push(filtered[idx]);
      used.add(filtered[idx].id);
      usedTK.add(normalizeTitleKey(filtered[idx].title));
      filtered.splice(idx, 1);
    }
    return result;
  };

  const used = new Set<string>();
  const usedTK = new Set<string>();
  const o = pick(openings, 2, used, usedTK);
  const r = pick(releases, 2, used, usedTK);
  const c = pick(closings.length > 0 ? closings : openings, 1, used, usedTK);
  const all = [...o, ...r, ...c];

  return {
    exercises: all.map(e => ({
      id: e.id,
      title: e.title,
      seconds: e.dose.flareSeconds || e.dose.baseSeconds,
      progressionHint: e.dose.progressionHint,
    })),
    metadata: {
      mode: "flare",
      primaryCondition: user.primaryCondition,
      secondaryConditions: user.secondaryConditions,
      planesCovered: [...new Set(all.flatMap(e => e.planes))],
      patternsCovered: [...new Set(all.map(e => e.movementPattern))],
      poseSetsUsed: [...new Set(all.map(e => e.poseSet))],
      planes_relaxed: false,
      seed,
    },
  };
}

// ═══════════════════════════════════
// POOL BUILDING (HARD SAFETY)
// ═══════════════════════════════════

export function buildPool(
  user: UserInputV2,
  catalog: ExerciseV2[],
): ExerciseV2[] {
  const primary = CONDITION_PROFILES[user.primaryCondition];

  let pool = [...catalog];

  // Step 1 — Equipment (Section 5: required equipment must be available)
  const userEquip = new Set(user.availableEquipment.length > 0 ? user.availableEquipment : ["none" as const]);
  userEquip.add("none");
  pool = pool.filter(e => {
    if (e.equipmentDetailed && e.equipmentDetailed.length > 0) {
      return e.equipmentDetailed
        .filter(eq => eq.required)
        .every(eq => userEquip.has(eq.type));
    }
    return e.equipment.every(eq => userEquip.has(eq));
  });

  // Step 2 — Required tags
  for (const tag of primary.requiredTags) {
    pool = pool.filter(e => e.tags[tag as keyof TagsV2] === true);
  }

  // Step 3 — Pregnancy (Section 6)
  if (user.primaryCondition === "pregnancy" || user.pregnancyStage !== "none") {
    pool = pool.filter(e => e.tags.pregnancySafe);
    if (user.pregnancyStage === "late") {
      pool = pool.filter(e => e.poseSet !== "prone");
      pool = pool.filter(e => !(e.poseSet === "supine" && e.dose.baseSeconds > 45));
      pool = pool.filter(e => !((e.spine.motion === "rotation" || e.spine.motion === "mixed") && e.intensity.levelNumeric >= 3));
    }
    if (user.pregnancyStage === "early") {
      pool = pool.filter(e => e.poseSet !== "prone");
      pool = pool.filter(e => !(e.spine.load === "loaded" && e.intensity.levelNumeric >= 4));
    }
  }

  // Step 4 — Contra rules (Section 7: sciatica/disc strict enforcement)
  // Dual-check: exercise's own contra flags AND spine/motion fields
  const CONTRA_SPINE_MAP: Partial<Record<keyof ContraV2, string>> = {
    avoidFlexion: "flexion",
    avoidExtension: "extension",
    avoidRotation: "rotation",
    avoidLateralFlexion: "lateral_flexion",
  };

  const contraKeysAll: (keyof ContraV2)[] = [
    "avoidFlexion", "avoidExtension", "avoidRotation", "avoidLateralFlexion",
    "avoidOverhead", "avoidDeepKneeFlexion", "avoidWristLoad",
    "avoidEndRangeStretching", "avoidHighAbdominalLoad",
  ];
  for (const key of contraKeysAll) {
    if (primary.contraRules[key]) {
      const spineMotionMatch = CONTRA_SPINE_MAP[key];
      pool = pool.filter(e => {
        // Check the exercise's own contra flag
        if (e.contra[key]) return false;
        // Also check spine motion for flexion/extension/rotation/lateral_flexion
        if (spineMotionMatch && e.spine?.motion === spineMotionMatch) return false;
        // avoidSupineLong: check poseSet + duration
        if (key === "avoidSupineLong" as any && e.poseSet === "supine" && e.dose.baseSeconds > 45) return false;
        // avoidHighAbdominalLoad: check by movement pattern
        if (key === "avoidHighAbdominalLoad" && 
            (e.movementPattern === "anti_extension" && e.intensity.levelNumeric >= 3)) return false;
        return true;
      });
    }
  }

  // Step 4b — Clinical safety extensions (osteoporosis et al.)
  // avoidSpinalFlexion: stricter than avoidFlexion — checks spine.motion explicitly.
  if (primary.contraRules.avoidSpinalFlexion) {
    pool = pool.filter(e => e.spine?.motion !== "flexion" && !e.contra.avoidFlexion);
  }
  // avoidHighImpact: exclude any exercise tagged as / belonging to a "highImpact" set.
  if (primary.contraRules.avoidHighImpact) {
    pool = pool.filter(e => {
      const ps: any = (e as any).poseSet;
      if (Array.isArray(ps) && ps.includes("highImpact")) return false;
      if (typeof ps === "string" && ps === "highImpact") return false;
      const tags: any = (e as any).tags;
      if (tags && tags.highImpact === true) return false;
      return true;
    });
  }
  // Generic excludedPoseSets at the contra level (string-based, future-proof).
  const excluded = primary.contraRules.excludedPoseSets;
  if (excluded && excluded.length > 0) {
    pool = pool.filter(e => {
      const ps: any = (e as any).poseSet;
      const list: string[] = Array.isArray(ps) ? ps : (typeof ps === "string" ? [ps] : []);
      return !excluded.some(set => list.includes(set));
    });
  }

  // Step 5 — Mode filters
  if (user.mode === "flare") {
    pool = pool.filter(e => e.tags.flareSafe || e.tags.flareStability);
    pool = pool.filter(e => e.intensity.levelNumeric < 4);
    pool = pool.filter(e => e.spine.load !== "loaded");
  }
  if (user.mode === "easier") {
    pool = pool.filter(e => e.intensity.levelNumeric < 5);
  }

  return pool;
}

// ═══════════════════════════════════
// RELEVANCE THRESHOLD (Section 1)
// ═══════════════════════════════════

export function applyRelevanceThreshold(
  pool: ExerciseV2[],
  user: UserInputV2,
): { filtered: ExerciseV2[]; relaxed: boolean } {
  const primary = CONDITION_PROFILES[user.primaryCondition];
  const key = primary.relevanceKey;
  const baseThreshold = user.mode === "flare" ? 1 : 2;

  for (let threshold = baseThreshold; threshold >= 0; threshold--) {
    const filtered = pool.filter(e => e.relevanceScores[key] >= threshold);
    if (filtered.length >= 6) {
      return { filtered, relaxed: threshold < baseThreshold };
    }
  }

  return { filtered: pool, relaxed: true };
}

// ═══════════════════════════════════
// SCORING
// ═══════════════════════════════════

const contraKeys: (keyof ContraV2)[] = [
  "avoidFlexion", "avoidExtension", "avoidRotation", "avoidLateralFlexion",
  "avoidOverhead", "avoidDeepKneeFlexion", "avoidWristLoad",
  "avoidEndRangeStretching", "avoidHighAbdominalLoad",
];

export function scoreExercise(
  e: ExerciseV2,
  user: UserInputV2,
  primary: ConditionProfileV2,
  secondaries: ConditionProfileV2[],
): number {
  let score = 0;

  // Base relevance
  let primaryRel = e.relevanceScores[primary.relevanceKey] || 0;

  // Section 5: Fibromyalgia intensity cap
  // If primary is fibromyalgia (or inherits from it), cap fibro relevance for high-intensity exercises
  if (primary.id === "fibromyalgia" || primary.id === "long_covid") {
    const intensityNum = e.intensity.levelNumeric;
    // levelNumeric is already 1-5 (mapped from "N/10" where level = ceil(N/2))
    // intensityTarget > "2/10" means levelNumeric >= 2 (since ceil(3/2)=2, ceil(4/2)=2, ceil(5/2)=3)
    // More precisely: original intensity > 2/10 means raw > 2, so levelNumeric >= 2
    if (intensityNum >= 2) {
      primaryRel = Math.min(primaryRel, 3);
    }
  }

  // Section 6: Hypermobility release cap
  if (primary.releaseCap !== undefined && (e.category === "release" || e.category === "cooldown")) {
    primaryRel = Math.min(primaryRel, primary.releaseCap);
  }

  score += 10 * primaryRel;

  if (secondaries.length > 0) {
    const secSum = secondaries.reduce((sum, s) => sum + (e.relevanceScores[s.relevanceKey] || 0), 0);
    score += 4 * (secSum / secondaries.length);
  }

  // Safety tag boosts
  if (e.tags.universalSafe) score += 2;
  if (user.mode === "flare" && e.tags.flareSafe) score += 2;
  if (user.mode === "flare" && e.tags.flareStability) score += 1;

  // Section 3: Equipment availability bonus
  if (user.availableEquipment.length > 0) {
    const userEquipSet = new Set(user.availableEquipment);
    const requiredEquip = e.equipmentDetailed
      ? e.equipmentDetailed.filter(eq => eq.required && eq.type !== "none")
      : e.equipment.filter(eq => eq !== "none").map(type => ({ type, required: true }));
    if (requiredEquip.length > 0 && requiredEquip.some(eq => userEquipSet.has(eq.type))) {
      score += 3;
    }
  }

  // Section 6: Hypermobility stability bias
  if (primary.stabilityBias && (e.category === "stability" || e.category === "strength")) {
    score = Math.round(score * 1.5);
  }

  // Section 6: Long COVID standing penalty / supine bonus
  if (primary.standingScorePenalty && e.poseSet === "standing") {
    score += primary.standingScorePenalty;
  }
  if (primary.supineScoreBonus && e.poseSet === "supine") {
    score += primary.supineScoreBonus;
  }

  // Section 6: Menopause bone-loading bonus (standing + stability)
  if (primary.boneLoadingBonus && e.poseSet === "standing" && (e.category === "stability" || e.category === "strength")) {
    score += primary.boneLoadingBonus;
  }

  // Section 6: Perimenopause energy amplifier
  if (primary.energyAmplifier && primary.energyAmplifier !== 1) {
    score = Math.round(score * primary.energyAmplifier);
  }

  // Hormonal fatigue: breath score overrides
  if (primary.breathScoreOverrides && primary.breathScoreOverrides[e.id] !== undefined) {
    score = Math.min(score, primary.breathScoreOverrides[e.id] * 10);
  }

  // Dose-fit
  if (user.mode === "flare" && e.dose.flareSeconds === 0) score -= 1000;
  if (user.sessionMinutes === 10 && e.dose.baseSeconds > 75) score -= 2;
  if (user.sessionMinutes >= 20 && e.dose.baseSeconds < 20) score -= 1;

  // Mode/intensity fit
  if (user.mode === "flare" && e.intensity.levelNumeric >= 3) score -= 4;
  if (user.mode === "easier" && e.intensity.levelNumeric === 4) score -= 2;
  if (user.mode === "normal" && e.intensity.levelNumeric === 1 && ["strength", "stability"].includes(e.category)) score -= 1;

  // Secondary contra soft-forbidden penalty
  for (const sec of secondaries) {
    for (const key of contraKeys) {
      if (sec.contraRules[key] && e.contra[key]) {
        score -= 6;
      }
    }
  }

  // Recent-usage penalty (tiered)
  const recIdx = user.history.recentExerciseIds.indexOf(e.id);
  if (recIdx !== -1) {
    if (e.foundationTier === "foundation") {
      if (recIdx <= 5) score -= 1;
      else if (recIdx <= 15) score -= 0.5;
    } else if (e.foundationTier === "standard") {
      if (recIdx <= 5) score -= 3;
      else if (recIdx <= 20) score -= 1;
    } else {
      if (recIdx <= 10) score -= 6;
      else if (recIdx <= 30) score -= 2;
    }
  }

  // Week-level repetition control (Section 4)
  if (user.history.recentSelections && user.history.recentSelections.length > 0) {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const recentWeek = user.history.recentSelections.filter(s => {
      try { return new Date(s.selectedAtISO) >= sevenDaysAgo; } catch { return false; }
    });
    const wasSelectedThisWeek = recentWeek.some(s => s.exerciseId === e.id);
    if (wasSelectedThisWeek) {
      if (e.foundationTier === "variety") score -= 1000; // hard exclude
      else if (e.foundationTier === "standard") score -= 4;
      else score -= 1; // foundation
    }
  }

  // Pattern repetition penalty
  const recentPatterns = user.history.recentPatterns.slice(0, 12);
  const patternCount = recentPatterns.filter(p => p === e.movementPattern).length;
  if (patternCount >= 4) score -= 4;
  else if (patternCount === 3) score -= 2;

  return score;
}

// ═══════════════════════════════════
// SESSION ASSEMBLY
// ═══════════════════════════════════

const POSE_ORDER: Record<PoseSetV2, number> = {
  supine: 0, side_lying: 1, prone: 2, seated: 3, kneeling: 4, standing: 5,
};

export function assembleSession(
  user: UserInputV2,
  pool: ExerciseV2[],
  seed: number,
): SessionOutputV2 {
  const primary = CONDITION_PROFILES[user.primaryCondition];
  const secondaries = user.secondaryConditions.map(id => CONDITION_PROFILES[id]);

  // Red flag gate
  if (user.redFlags.hasRedFlags) {
    return buildRedFlagSession(pool, seed, user);
  }

  // Section 0: Runtime assertion — all exercises must be v2
  for (const e of pool) {
    if (!assertV2Exercise(e)) {
      console.error(`[vinys] Non-v2 exercise in pool: ${e.id}. Filtering out.`);
    }
  }
  pool = pool.filter(assertV2Exercise);

  // Section 1: relevance threshold
  const { filtered: thresholdPool, relaxed: relevanceRelaxed } = applyRelevanceThreshold(pool, user);

  // Precompute scores
  const scores = new Map<string, number>();
  for (const e of thresholdPool) {
    scores.set(e.id, scoreExercise(e, user, primary, secondaries));
  }

  const slots = SESSION_SLOTS[user.sessionMinutes];
  const selected: ExerciseV2[] = [];
  const usedIds = new Set<string>();
  const usedTitleKeys = new Set<string>(); // Section 3: duplicate title guard
  const poseSetsUsed = new Set<PoseSetV2>();
  let lastIntensity = 0;

  let flareStabilityCount = 0;
  let releaseCount = 0;
  let mobilityCount = 0;
  let stabilityStrengthCount = 0;
  let hasAntiPattern = false;

  const maxPoseSets = user.sessionMinutes <= 15 ? 2 : 3;

  function canUsePoseSet(ps: PoseSetV2): boolean {
    if (poseSetsUsed.has(ps)) return true;
    return poseSetsUsed.size < maxPoseSets;
  }

  function checkRamp(intensity: number): boolean {
    return Math.abs(intensity - lastIntensity) <= 2 || lastIntensity === 0;
  }

  function sortedCandidates(candidates: ExerciseV2[], prevPoseSet?: PoseSetV2): ExerciseV2[] {
    return [...candidates].sort((a, b) => {
      let sa = scores.get(a.id) || 0;
      let sb = scores.get(b.id) || 0;
      if (user.sessionMinutes <= 15 && prevPoseSet) {
        if (a.poseSet !== prevPoseSet) sa -= 1;
        if (b.poseSet !== prevPoseSet) sb -= 1;
      }
      return sb - sa;
    });
  }

  function pickBest(candidates: ExerciseV2[], seedOffset: number): ExerciseV2 | undefined {
    if (candidates.length === 0) return undefined;
    const sorted = candidates.sort((a, b) => (scores.get(b.id) || 0) - (scores.get(a.id) || 0));
    return tieBreakTop5(sorted, seed + seedOffset);
  }

  function addExercise(e: ExerciseV2) {
    selected.push(e);
    usedIds.add(e.id);
    usedTitleKeys.add(normalizeTitleKey(e.title));
    poseSetsUsed.add(e.poseSet);
    lastIntensity = e.intensity.levelNumeric;
    if (e.category === "release" || e.category === "cooldown") releaseCount++;
    if (e.category === "mobility") mobilityCount++;
    if (e.category === "stability" || e.category === "strength") stabilityStrengthCount++;
    if (e.tags.flareStability) flareStabilityCount++;
    if (["anti_rotation", "anti_extension"].includes(e.movementPattern)) hasAntiPattern = true;
  }

  // Common filter: exclude used IDs and duplicate titleKeys
  function baseFilter(e: ExerciseV2): boolean {
    return !usedIds.has(e.id) && !usedTitleKeys.has(normalizeTitleKey(e.title));
  }

  // ── OPENING ──
  const openingPool = thresholdPool.filter(e =>
    e.category === "opening_breath" || (e.category === "release" && e.targets.includes("breath"))
  );
  for (let i = 0; i < slots.opening; i++) {
    const candidates = openingPool.filter(baseFilter);
    const pick = pickBest(candidates, i);
    if (pick) addExercise(pick);
  }

  // ── MAIN ──
  const spineRelated = ["back_pain", "sciatica", "neck_shoulder"].includes(user.primaryCondition);
  const planesCovered = new Set<PlaneV2>();

  for (let i = 0; i < slots.main; i++) {
    let candidates = thresholdPool.filter(e => {
      if (!baseFilter(e)) return false;
      if (e.category === "opening_breath" || e.category === "cooldown") return false;
      if (!canUsePoseSet(e.poseSet)) return false;
      if (!checkRamp(e.intensity.levelNumeric)) return false;

      if (user.mode === "flare") {
        if (e.tags.flareStability && flareStabilityCount >= 2) return false;
        if (e.movementPattern === "balance_dynamic") return false;
      }
      if (user.mode === "easier" && user.sessionMinutes >= 20) {
        if (e.intensity.levelNumeric === 4 && thresholdPool.filter(x => usedIds.has(x.id) && x.intensity.levelNumeric === 4).length >= 2) return false;
      }
      return true;
    });

    const remainingSlots = slots.main - i;

    if (user.mode === "flare") {
      const releaseNeeded = Math.max(0, 2 - releaseCount);
      if (remainingSlots <= releaseNeeded) {
        const releaseCandidates = candidates.filter(e => e.category === "release");
        if (releaseCandidates.length > 0) candidates = releaseCandidates;
      }
    }

    if (user.mode === "normal") {
      const mobilityNeeded = Math.max(0, 2 - mobilityCount);
      const stabNeeded = Math.max(0, 2 - stabilityStrengthCount);
      const releaseNeeded = Math.max(0, 1 - releaseCount);
      const totalNeeded = mobilityNeeded + stabNeeded + releaseNeeded;

      if (remainingSlots <= totalNeeded) {
        if (mobilityCount < 2) {
          const mob = candidates.filter(e => e.category === "mobility");
          if (mob.length > 0) candidates = mob;
        } else if (stabilityStrengthCount < 2) {
          const stab = candidates.filter(e => e.category === "stability" || e.category === "strength");
          if (stab.length > 0) candidates = stab;
        } else if (releaseCount < 1) {
          const rel = candidates.filter(e => e.category === "release");
          if (rel.length > 0) candidates = rel;
        }
      }

      if (["back_pain", "sciatica"].includes(user.primaryCondition) && !hasAntiPattern && remainingSlots <= 2) {
        const anti = candidates.filter(e => ["anti_rotation", "anti_extension"].includes(e.movementPattern));
        if (anti.length > 0) candidates = anti;
      }
    }

    const prevPose = selected.length > 0 ? selected[selected.length - 1].poseSet : undefined;
    const sorted = sortedCandidates(candidates, prevPose);
    const pick = tieBreakTop5(sorted, seed + 100 + i);
    if (pick) {
      addExercise(pick);
      pick.planes.forEach(p => planesCovered.add(p));
    }
  }

  // ── CLOSING ──
  // Opening-only breath exercises must NEVER appear in closing slots
  const OPENING_ONLY_IDS = new Set(["breath_count", "breath_alternate", "breath_478", "breath_box"]);
  const closingPool = thresholdPool.filter(e =>
    (e.category === "cooldown" || e.category === "release") &&
    !OPENING_ONLY_IDS.has(e.id) &&
    e.intensity.levelNumeric <= 2 &&
    baseFilter(e) &&
    canUsePoseSet(e.poseSet)
  );
  const lastMainPose = selected.length > 0 ? selected[selected.length - 1].poseSet : "seated";
  const closingSorted = closingPool.sort((a, b) => {
    let sa = scores.get(a.id) || 0;
    let sb = scores.get(b.id) || 0;
    if (a.poseSet === lastMainPose || a.poseSet === "supine" || a.poseSet === "seated") sa += 3;
    if (b.poseSet === lastMainPose || b.poseSet === "supine" || b.poseSet === "seated") sb += 3;
    return sb - sa;
  });
  for (let i = 0; i < slots.closing; i++) {
    const candidates = closingSorted.filter(baseFilter);
    const pick = tieBreakTop5(candidates, seed + 200 + i);
    if (pick) addExercise(pick);
  }

  // ── POST-CHECK: Planes diversity ──
  let planesRelaxed = false;
  if (user.sessionMinutes >= 20 && spineRelated) {
    const allPlanes: PlaneV2[] = ["sagittal", "frontal", "transverse"];
    const missing = allPlanes.filter(p => !planesCovered.has(p));

    if (planesCovered.size < 3 && missing.length > 0) {
      let attempts = 0;
      for (const plane of missing) {
        if (attempts >= 50) break;
        const replacement = thresholdPool.find(e =>
          !usedIds.has(e.id) &&
          !usedTitleKeys.has(normalizeTitleKey(e.title)) &&
          e.planes.includes(plane) &&
          e.category !== "opening_breath" && e.category !== "cooldown" &&
          e.intensity.levelNumeric <= (user.mode === "flare" ? 3 : 5) &&
          (user.mode !== "flare" || e.tags.flareSafe || e.tags.flareStability)
        );

        if (replacement) {
          let lowestIdx = -1;
          let lowestScore = Infinity;
          const openingCount = slots.opening;
          const mainEnd = openingCount + slots.main;
          for (let i = openingCount; i < mainEnd && i < selected.length; i++) {
            const s = scores.get(selected[i].id) || 0;
            if (s < lowestScore) {
              lowestScore = s;
              lowestIdx = i;
            }
          }
          if (lowestIdx >= 0) {
            usedIds.delete(selected[lowestIdx].id);
            usedTitleKeys.delete(normalizeTitleKey(selected[lowestIdx].title));
            selected[lowestIdx] = replacement;
            usedIds.add(replacement.id);
            usedTitleKeys.add(normalizeTitleKey(replacement.title));
            replacement.planes.forEach(p => planesCovered.add(p));
          }
        }
        attempts++;
      }
      if (planesCovered.size < 3) planesRelaxed = true;
    }
  }

  // ── POST-CHECK: Section 8 — Primary condition coherence ──
  let lowRelevanceWarning = false;
  let structureRelaxed = false;

  const avgPrimaryRelevance = selected.length > 0
    ? selected.reduce((sum, e) => sum + (e.relevanceScores[primary.relevanceKey] || 0), 0) / selected.length
    : 0;
  if (avgPrimaryRelevance < 2) lowRelevanceWarning = true;

  if (spineRelated && user.sessionMinutes >= 20) {
    const patterns = new Set(selected.map(e => e.movementPattern));
    const planesArr = [...new Set(selected.flatMap(e => e.planes))];
    const hasAnti = patterns.has("anti_extension") || patterns.has("anti_rotation");
    const hasSagittalMobility = selected.some(e => e.category === "mobility" && e.planes.includes("sagittal"));
    const hasTransverseFrontal = planesArr.includes("transverse") || planesArr.includes("frontal");

    if (!hasAnti || !hasSagittalMobility || !hasTransverseFrontal) {
      structureRelaxed = true;
    }
  }

  // ── Section 0: Runtime assertion — all selected must be v2 ──
  for (const e of selected) {
    if (!assertV2Exercise(e)) {
      console.error(`[vinys] CRITICAL: Selected exercise ${e.id} failed v2 assertion!`);
    }
  }

  // ── BUILD OUTPUT ──
  return {
    exercises: selected.map(e => ({
      id: e.id,
      title: e.title,
      seconds: user.mode === "flare" ? (e.dose.flareSeconds || e.dose.baseSeconds) : e.dose.baseSeconds,
      progressionHint: e.dose.progressionHint,
    })),
    metadata: {
      mode: user.mode,
      primaryCondition: user.primaryCondition,
      secondaryConditions: user.secondaryConditions,
      planesCovered: [...planesCovered],
      patternsCovered: [...new Set(selected.map(e => e.movementPattern))],
      poseSetsUsed: [...poseSetsUsed],
      planes_relaxed: planesRelaxed,
      seed,
      relevance_threshold_relaxed: relevanceRelaxed,
      low_primary_relevance_warning: lowRelevanceWarning,
      structure_relaxed: structureRelaxed,
    },
  };
}

// ═══════════════════════════════════
// MAIN ENTRY POINT
// ═══════════════════════════════════

export function generateSessionV2(
  user: UserInputV2,
  catalog: ExerciseV2[],
  userId: string = "anonymous",
): SessionOutputV2 {
  const date = new Date().toISOString().slice(0, 10);
  const seed = computeSeed(userId, date, user.sessionMinutes, user.primaryCondition);

  const pool = buildPool(user, catalog);
  return assembleSession(user, pool, seed);
}
