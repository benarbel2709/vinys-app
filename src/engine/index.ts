/**
 * Vinys Recommendation Engine v2.1.2 — Public API
 */

export { generateSessionV2, buildPool, scoreExercise, assembleSession, applyRelevanceThreshold } from "./engine";
export { getCatalogV2, migrateExercise, migrateAllExercises, getMigrationLog, resetCatalogCache } from "./migrate";
export type { MigrationLog } from "./migrate";
export { validateCatalog, validateExercise, validateConditionProfiles, assertV2Exercise } from "./validators";
export { CONDITION_PROFILES, LEGACY_CONDITION_MAP } from "./conditions";
export { generateConditionAuditReport } from "./audit";
export type { AuditReport } from "./audit";
export type {
  ExerciseV2,
  UserInputV2,
  SessionOutputV2,
  SessionExerciseV2,
  SessionMetadataV2,
  ConditionIdV2,
  ConditionProfileV2,
  ModeV2,
  PregnancyStageV2,
  RelevanceScoresV2,
  TagsV2,
  ContraV2,
  PlaneV2,
  MovementPatternV2,
  PoseSetV2,
  FoundationTierV2,
  SlotCounts,
  EquipmentItemV2,
  RecentSelection,
} from "./types";
export { SESSION_SLOTS, RELEVANCE_KEYS, normalizeTitleKey } from "./types";
