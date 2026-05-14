/**
 * Vinys v2.1.2 — Migration / backfill from MasterExercise to ExerciseV2.
 * Single source of truth: only exercisesV2 (getCatalogV2) is used by the engine.
 * Includes: dedupe, equipment auto-fix, legacy field purge.
 */

import type { MasterExercise } from "@/data/masterExercises";
import { MASTER_EXERCISES } from "@/data/masterExercises";
import type {
  ExerciseV2,
  ExerciseCategoryV2,
  PoseSetV2,
  PlaneV2,
  MovementPatternV2,
  TargetV2,
  EquipmentV2,
  EquipmentItemV2,
  SpineMotionV2,
  SpineLoadV2,
  FoundationTierV2,
  RelevanceScoresV2,
  TagsV2,
  ContraV2,
} from "./types";
import { normalizeTitleKey } from "./types";

// ═══════════════════════════════════
// MIGRATION LOG (Section 2+5)
// ═══════════════════════════════════

export interface MigrationLog {
  renamedIds: Record<string, string>;
  equipmentAutoAdds: { exerciseId: string; addedEquipment: string; matchedKeyword: string }[];
  removedInvalidExercises: string[];
  duplicateTitlesRenamed: string[];
}

let _migrationLog: MigrationLog = {
  renamedIds: {},
  equipmentAutoAdds: [],
  removedInvalidExercises: [],
  duplicateTitlesRenamed: [],
};

export function getMigrationLog(): MigrationLog {
  return _migrationLog;
}

// ═══════════════════════════════════
// CATEGORY MAPPING
// ═══════════════════════════════════

function mapCategory(m: MasterExercise): ExerciseCategoryV2 {
  if (m.category === "breath") return "opening_breath";
  if (m.category === "release") return "release";
  if (m.category === "stability") return "stability";
  return "mobility";
}

// ═══════════════════════════════════
// POSE SET MAPPING
// ═══════════════════════════════════

const POSE_MAP: Record<string, PoseSetV2> = {
  supine: "supine", seated: "seated", standing: "standing",
  allFours: "kneeling", birdDog: "kneeling", wall: "standing",
  neck: "seated", pelvic: "supine", bridge: "supine",
  sideLying: "side_lying", prone: "prone",
};

function mapPoseSet(m: MasterExercise): PoseSetV2 {
  if (m.poseSet && POSE_MAP[m.poseSet]) return POSE_MAP[m.poseSet];
  const t = m.title.toLowerCase();
  if (t.includes("supine") || t.includes("lying on back")) return "supine";
  if (t.includes("prone") || t.includes("lying on belly")) return "prone";
  if (t.includes("standing") || t.includes("wall")) return "standing";
  if (t.includes("all fours") || t.includes("kneeling") || t.includes("bird dog") || t.includes("cat")) return "kneeling";
  if (t.includes("side lying") || t.includes("side-lying")) return "side_lying";
  return "seated";
}

// ═══════════════════════════════════
// MOVEMENT PATTERN INFERENCE
// ═══════════════════════════════════

function inferMovementPattern(m: MasterExercise): MovementPatternV2 {
  if (m.category === "breath") return "breath";
  const t = m.title.toLowerCase();
  const id = m.id.toLowerCase();

  if (t.includes("savasana") || t.includes("body scan") || t.includes("meditation") || t.includes("stillness") || m.category === "release") {
    if (t.includes("twist")) return "spinal_rotation";
    if (t.includes("pigeon") || t.includes("hip")) return "hip_extension";
    return "restorative_release";
  }

  if (t.includes("twist") || t.includes("rotation") || id.includes("twist") || id.includes("rotation")) return "spinal_rotation";
  if (t.includes("cat") || t.includes("child") || t.includes("forward fold") || t.includes("flexion")) return "spinal_flexion";
  if (t.includes("cobra") || t.includes("extension") || t.includes("bridge") || t.includes("cow")) return "spinal_extension";
  if (t.includes("side bend") || t.includes("lateral")) return "spinal_lateral_flexion";
  if (t.includes("dead bug") || t.includes("bird dog") || t.includes("plank") || t.includes("anti")) return "anti_extension";
  if (t.includes("pallof") || t.includes("anti-rotation")) return "anti_rotation";
  if (t.includes("clam") || t.includes("abduction") || t.includes("side leg")) return "hip_abduction";
  if (t.includes("glute") || t.includes("hip extension")) return "hip_extension";
  if (t.includes("squat")) return "squat_pattern";
  if (t.includes("lunge")) return "lunge_pattern";
  if (t.includes("hinge") || t.includes("deadlift")) return "hip_hinge";
  if (t.includes("push")) return "push";
  if (t.includes("pull") || t.includes("row")) return "pull";
  if (t.includes("balance")) return t.includes("dynamic") ? "balance_dynamic" : "balance_static";
  if (t.includes("ankle") || t.includes("calf")) return "ankle_strength";
  if (t.includes("pelvic tilt")) return "spinal_flexion";
  if (t.includes("chin tuck") || t.includes("neck")) return "spinal_extension";
  if (t.includes("shoulder") || t.includes("chest")) return "pull";

  if (m.category === "stability") return "anti_extension";
  return "restorative_release";
}

// ═══════════════════════════════════
// TARGETS INFERENCE
// ═══════════════════════════════════

const LEGACY_TARGET_MAP: Record<string, TargetV2> = {
  jaw: "neck", face: "neck", throat: "neck", diaphragm: "breath",
  "deep-abs": "core", "nervous-system": "nervous_system", "nervous system": "nervous_system",
  chest: "shoulder", "upper back": "thoracic", "lower back": "spine",
  glutes: "hip", pelvis: "hip", calves: "ankle", feet: "ankle",
  hamstrings: "hip", quads: "knee",
};

function inferTargets(m: MasterExercise): TargetV2[] {
  const VALID_TARGETS = new Set<string>(["spine", "neck", "shoulder", "thoracic", "hip", "knee", "ankle", "wrist", "core", "breath", "nervous_system"]);

  if (m.targets && m.targets.length > 0) {
    const mapped = m.targets.map(t => LEGACY_TARGET_MAP[t] || t).filter((t): t is TargetV2 => VALID_TARGETS.has(t));
    if (mapped.length > 0) return [...new Set(mapped)];
  }

  if (m.category === "breath") return ["breath", "nervous_system"];

  const t = m.title.toLowerCase();
  const targets: TargetV2[] = [];
  if (t.includes("neck") || t.includes("chin")) targets.push("neck");
  if (t.includes("shoulder") || t.includes("chest")) targets.push("shoulder");
  if (t.includes("thoracic")) targets.push("thoracic");
  if (t.includes("hip") || t.includes("pelvic") || t.includes("glute") || t.includes("pigeon")) targets.push("hip");
  if (t.includes("knee")) targets.push("knee");
  if (t.includes("ankle") || t.includes("calf") || t.includes("foot")) targets.push("ankle");
  if (t.includes("wrist")) targets.push("wrist");
  if (t.includes("core") || t.includes("dead bug") || t.includes("bird dog") || t.includes("plank") || t.includes("bridge")) targets.push("core");
  if (t.includes("cat") || t.includes("cow") || t.includes("spine") || t.includes("back") || t.includes("cobra") || t.includes("twist") || t.includes("extension") || t.includes("flexion")) targets.push("spine");
  if (t.includes("savasana") || t.includes("body scan") || t.includes("meditation") || t.includes("release")) targets.push("nervous_system");

  return targets.length > 0 ? targets : ["spine"];
}

// ═══════════════════════════════════
// PLANES INFERENCE
// ═══════════════════════════════════

function inferPlanes(_m: MasterExercise, pattern: MovementPatternV2): PlaneV2[] {
  const planes: PlaneV2[] = [];
  if (["spinal_flexion", "spinal_extension", "hip_hinge", "squat_pattern", "lunge_pattern", "anti_extension", "breath"].includes(pattern)) planes.push("sagittal");
  if (["spinal_lateral_flexion", "anti_lateral_flexion", "hip_abduction"].includes(pattern)) planes.push("frontal");
  if (["spinal_rotation", "anti_rotation"].includes(pattern)) planes.push("transverse");
  if (planes.length === 0) planes.push("sagittal");
  return planes;
}

// ═══════════════════════════════════
// INTENSITY MAPPING
// ═══════════════════════════════════

function mapIntensity(m: MasterExercise): { levelNumeric: number; label: string } {
  const target = m.intensityTarget || "3/10";
  const numMatch = target.match(/(\d+)/);
  const raw = numMatch ? parseInt(numMatch[1], 10) : 3;
  const level = Math.max(1, Math.min(5, Math.ceil(raw / 2)));
  return { levelNumeric: level, label: target };
}

// ═══════════════════════════════════
// DOSE MAPPING
// ═══════════════════════════════════

function mapDose(m: MasterExercise): { baseSeconds: number; flareSeconds: number; progressionHint: string } {
  if (m.dose) {
    return { baseSeconds: Math.max(10, m.dose.baseSeconds), flareSeconds: m.dose.flareSeconds, progressionHint: m.dose.progressionHint };
  }
  const baseSec = Math.max(10, (m.durationMin || 3) * 60);
  const flareSec = m.tags.flareSafe ? Math.max(10, Math.round(baseSec * 0.7)) : 0;
  return { baseSeconds: baseSec, flareSeconds: flareSec, progressionHint: "Increase hold time or add reps when comfortable." };
}

// ═══════════════════════════════════
// EQUIPMENT MAPPING + AUTO-FIX (Section 5)
// ═══════════════════════════════════

const EQUIP_MAP: Record<string, EquipmentV2> = {
  wall: "wall", chair: "chair", strap: "strap", block: "block",
  bolster: "bolster", band: "band", "foam roller": "none", towel: "none", "tennis ball": "none",
};

const EQUIPMENT_KEYWORD_MAP: Record<string, EquipmentV2> = {
  chair: "chair",
  wall: "wall",
  strap: "strap",
  bolster: "bolster",
  pillow: "bolster",
  cushion: "bolster",
  block: "block",
  band: "band",
};

function mapEquipment(m: MasterExercise): EquipmentV2[] {
  if (!m.equipment || m.equipment.length === 0) return ["none"];
  const mapped = m.equipment.map(e => EQUIP_MAP[e.toLowerCase()] || "none");
  return [...new Set(mapped)];
}

function mapEquipmentDetailed(m: MasterExercise): EquipmentItemV2[] {
  if (!m.equipment || m.equipment.length === 0) return [{ type: "none", required: false }];
  return [...new Set(m.equipment.map(e => EQUIP_MAP[e.toLowerCase()] || "none"))].map(type => ({
    type, required: type !== "none",
  }));
}

function autoFixEquipment(e: ExerciseV2, log: MigrationLog): void {
  const text = [...e.instructions, e.title, e.safety, e.cue].join(" ").toLowerCase();
  const existingTypes = new Set(e.equipmentDetailed.map(eq => eq.type));
  const existingFlat = new Set(e.equipment);

  for (const [keyword, eqType] of Object.entries(EQUIPMENT_KEYWORD_MAP)) {
    if (text.includes(keyword) && !existingTypes.has(eqType) && !existingFlat.has(eqType)) {
      e.equipmentDetailed.push({ type: eqType, required: true });
      if (!e.equipment.includes(eqType)) {
        e.equipment = e.equipment.filter(eq => eq !== "none");
        e.equipment.push(eqType);
      }
      log.equipmentAutoAdds.push({ exerciseId: e.id, addedEquipment: eqType, matchedKeyword: keyword });
    }
  }
}

// ═══════════════════════════════════
// SPINE MAPPING
// ═══════════════════════════════════

function mapSpine(m: MasterExercise, pattern: MovementPatternV2): { motion: SpineMotionV2; load: SpineLoadV2 } {
  let motion: SpineMotionV2 = "none";
  if (pattern === "spinal_flexion") motion = "flexion";
  else if (pattern === "spinal_extension") motion = "extension";
  else if (pattern === "spinal_rotation") motion = "rotation";
  else if (pattern === "spinal_lateral_flexion") motion = "lateral_flexion";
  else if (["anti_extension", "anti_rotation", "anti_lateral_flexion"].includes(pattern)) motion = "mixed";

  let load: SpineLoadV2 = "none";
  if (["stability", "strength"].includes(m.category)) load = "light";
  const t = m.title.toLowerCase();
  if (t.includes("weighted") || t.includes("loaded") || t.includes("resistance")) load = "loaded";

  return { motion, load };
}

// ═══════════════════════════════════
// CONTRA MAPPING
// ═══════════════════════════════════

function mapContra(m: MasterExercise): ContraV2 {
  const flags = m.contraindicationFlags;
  const contra: ContraV2 = {
    avoidFlexion: flags?.avoidFlexion === true,
    avoidExtension: false,
    avoidRotation: flags?.avoidRotation === true,
    avoidLateralFlexion: false,
    avoidOverhead: false,
    avoidDeepKneeFlexion: false,
    avoidWristLoad: false,
    avoidSupineLong: false,
    avoidEndRangeStretching: false,
    avoidHighAbdominalLoad: false,
  };

  if (m.contraindications) {
    for (const c of m.contraindications) {
      const cl = c.toLowerCase();
      if (cl.includes("flexion") && !cl.includes("lateral")) contra.avoidFlexion = true;
      if (cl.includes("extension")) contra.avoidExtension = true;
      if (cl.includes("rotation") || cl.includes("twist")) contra.avoidRotation = true;
      if (cl.includes("lateral")) contra.avoidLateralFlexion = true;
      if (cl.includes("overhead")) contra.avoidOverhead = true;
      if (cl.includes("knee")) contra.avoidDeepKneeFlexion = true;
      if (cl.includes("wrist")) contra.avoidWristLoad = true;
    }
  }

  // Infer avoidHighAbdominalLoad from title/id for postpartum safety
  const t = m.title.toLowerCase();
  const id = m.id.toLowerCase();
  if (id.includes("dead_bug") || id.includes("plank") || 
      (id.includes("bridge") && !id.includes("micro") && !id.includes("small")) ||
      t.includes("dead bug") || t.includes("plank")) {
    contra.avoidHighAbdominalLoad = true;
  }

  return contra;
}

// ═══════════════════════════════════
// RELEVANCE SCORES MAPPING
// ═══════════════════════════════════

function mapRelevanceScores(m: MasterExercise): RelevanceScoresV2 {
  const old = m.relevance;
  if (old) {
    return {
      backPain: old.backPain ?? 1, neckShoulder: old.neckShoulder ?? 1,
      hipsPelvis: old.kneeHip ?? 1, knees: old.kneeHip ?? 1,
      pregnancy: old.pregnancyPostpartum ?? 1, fibromyalgia: old.fibro ?? 1,
      sciatica: old.discSciatica ?? 1, osteoarthritis: old.oa ?? 1,
      stressSleep: Math.max(old.stressAnxiety ?? 1, old.sleep ?? 1),
    };
  }

  const defaults: Record<string, RelevanceScoresV2> = {
    breath: { backPain: 3, neckShoulder: 3, hipsPelvis: 3, knees: 3, pregnancy: 4, fibromyalgia: 5, sciatica: 3, osteoarthritis: 3, stressSleep: 5 },
    mobility: { backPain: 4, neckShoulder: 3, hipsPelvis: 3, knees: 3, pregnancy: 3, fibromyalgia: 3, sciatica: 3, osteoarthritis: 3, stressSleep: 3 },
    stability: { backPain: 4, neckShoulder: 3, hipsPelvis: 4, knees: 4, pregnancy: 3, fibromyalgia: 3, sciatica: 3, osteoarthritis: 3, stressSleep: 2 },
    release: { backPain: 4, neckShoulder: 4, hipsPelvis: 3, knees: 3, pregnancy: 4, fibromyalgia: 5, sciatica: 3, osteoarthritis: 4, stressSleep: 5 },
  };

  return defaults[m.category] || defaults.mobility;
}

// ═══════════════════════════════════
// FOUNDATION TIER
// ═══════════════════════════════════

const FOUNDATION_IDS = new Set([
  "breath_supine", "breath_seated", "breath_extended_exhale",
  "pelvic_tilt", "heel_slides", "dead_bug_basic", "savasana", "body_scan",
]);

const VARIETY_KEYWORDS = ["advanced", "dynamic", "loaded", "challenging"];

function inferFoundationTier(m: MasterExercise): FoundationTierV2 {
  if (FOUNDATION_IDS.has(m.id)) return "foundation";
  if (m.category === "breath") return "foundation";
  const t = m.title.toLowerCase();
  if (VARIETY_KEYWORDS.some(kw => t.includes(kw))) return "variety";
  const intensity = mapIntensity(m);
  if (intensity.levelNumeric >= 4) return "variety";
  return "standard";
}

// ═══════════════════════════════════
// TAGS MAPPING
// ═══════════════════════════════════

function mapTags(m: MasterExercise): TagsV2 {
  return {
    universalSafe: m.tags.universalSafe,
    flareSafe: m.tags.flareSafe,
    flareStability: m.tags.flareSafe && m.category === "stability" && mapIntensity(m).levelNumeric <= 2,
    pregnancySafe: m.tags.pregnancySafe,
    kneeSafe: m.tags.kneeSafe,
    shoulderSafe: m.tags.shoulderSafe,
    oaSafe: m.tags.oaSafe,
  };
}

// ═══════════════════════════════════
// MAIN MIGRATION FUNCTION
// ═══════════════════════════════════

export function migrateExercise(m: MasterExercise): ExerciseV2 {
  const pattern = inferMovementPattern(m);
  const intensity = mapIntensity(m);

  return {
    id: m.id,
    title: m.title,
    category: mapCategory(m),
    poseSet: mapPoseSet(m),
    planes: inferPlanes(m, pattern),
    movementPattern: pattern,
    targets: inferTargets(m),
    intensity,
    dose: mapDose(m),
    equipment: mapEquipment(m),
    equipmentDetailed: mapEquipmentDetailed(m),
    tags: mapTags(m),
    spine: mapSpine(m, pattern),
    contra: mapContra(m),
    relevanceScores: mapRelevanceScores(m),
    foundationTier: inferFoundationTier(m),
    instructions: m.instructions,
    breathing: m.breathing,
    reps: m.reps,
    range: m.range,
    why: m.why,
    safety: m.safety,
    cue: m.cue,
  };
}

// ═══════════════════════════════════
// DEDUPLICATE + PURGE (Sections 0,2,3,8)
// ═══════════════════════════════════

function deduplicateAndPurge(raw: ExerciseV2[], log: MigrationLog): ExerciseV2[] {
  const idSeen = new Map<string, number>();
  const titleKeySeen = new Map<string, string>(); // titleKey -> first ID
  const result: ExerciseV2[] = [];

  for (const e of raw) {
    // Deduplicate IDs (Section 2)
    const idCount = (idSeen.get(e.id) || 0) + 1;
    idSeen.set(e.id, idCount);
    if (idCount > 1) {
      const newId = `${e.id}__dup${idCount}`;
      log.renamedIds[e.id] = newId;
      e.id = newId;
    }

    // Deduplicate titles (Section 2)
    const tk = normalizeTitleKey(e.title);
    if (titleKeySeen.has(tk)) {
      // Skip duplicate title — keep first occurrence
      log.duplicateTitlesRenamed.push(`${e.id} (title: "${e.title}" same as ${titleKeySeen.get(tk)})`);
      continue;
    }
    titleKeySeen.set(tk, e.id);

    // Section 8: purge legacy fields from the object itself
    const raw2 = e as any;
    delete raw2.durationMin;
    delete raw2.intensityTarget;
    delete raw2.safetyTags;
    delete raw2.contraindications;
    delete raw2.contraindicationFlags;

    // Validate critical fields
    if (!e.relevanceScores || !e.dose || !e.movementPattern || !e.targets || e.targets.length === 0) {
      log.removedInvalidExercises.push(e.id);
      continue;
    }

    // Section 5: equipment auto-fix
    autoFixEquipment(e, log);

    // Add precomputed titleKey
    (e as any).titleKey = tk;

    result.push(e);
  }

  return result;
}

/**
 * Migrate the entire master exercise catalog to v2.1.2 format.
 * Single source of truth — deduped, purged, equipment auto-fixed.
 */
export function migrateAllExercises(): ExerciseV2[] {
  _migrationLog = { renamedIds: {}, equipmentAutoAdds: [], removedInvalidExercises: [], duplicateTitlesRenamed: [] };
  const raw = MASTER_EXERCISES.map(migrateExercise);
  return deduplicateAndPurge(raw, _migrationLog);
}

/** Cached catalog */
let _catalog: ExerciseV2[] | null = null;

export function getCatalogV2(): ExerciseV2[] {
  if (!_catalog) _catalog = migrateAllExercises();
  return _catalog;
}

/** Reset cache (for testing) */
export function resetCatalogCache(): void {
  _catalog = null;
}
