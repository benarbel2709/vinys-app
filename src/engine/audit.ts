/**
 * Vinys v2.1.2 — Structured Catalog Audit Module (Section 9)
 * Diagnostic only — does NOT change runtime behavior.
 */

import type { ExerciseV2, ConditionIdV2, RelevanceKeyV2 } from "./types";
import { CONDITION_PROFILES } from "./conditions";
import type { TagsV2, ContraV2 } from "./types";

export interface AuditReport {
  condition: string;
  generatedAtISO: string;
  lowRelevanceSafe: Pick<ExerciseV2, "id" | "title" | "relevanceScores" | "tags">[];
  highRelevanceExcluded: (Pick<ExerciseV2, "id" | "title" | "relevanceScores"> & { excludeReason: string })[];
  movementRiskCandidates: Pick<ExerciseV2, "id" | "title" | "movementPattern" | "relevanceScores">[];
  topRelevant: Pick<ExerciseV2, "id" | "title" | "relevanceScores" | "category" | "foundationTier">[];
}

export function generateConditionAuditReport(
  conditionId: ConditionIdV2,
  catalog: ExerciseV2[],
  userEquipment: string[] = ["none"],
): AuditReport {
  const profile = CONDITION_PROFILES[conditionId];
  const key = profile.relevanceKey;

  // A) LOW-RELEVANCE SAFE POOL
  const lowRelevanceSafe = catalog
    .filter(e => e.tags.universalSafe && e.relevanceScores[key] <= 1)
    .map(e => ({ id: e.id, title: e.title, relevanceScores: e.relevanceScores, tags: e.tags }));

  // B) HIGH-RELEVANCE BUT EXCLUDED
  const highRelevanceExcluded: AuditReport["highRelevanceExcluded"] = [];
  for (const e of catalog) {
    if (e.relevanceScores[key] < 4) continue;
    const reasons: string[] = [];

    for (const tag of profile.requiredTags) {
      if (!e.tags[tag as keyof TagsV2]) reasons.push(`missing tag: ${tag}`);
    }
    for (const [ck, cv] of Object.entries(profile.contraRules)) {
      if (cv && e.contra[ck as keyof ContraV2]) reasons.push(`contra: ${ck}`);
    }
    const equipSet = new Set(userEquipment);
    equipSet.add("none");
    if (!e.equipment.every(eq => equipSet.has(eq))) reasons.push("equipment mismatch");

    if (reasons.length > 0) {
      highRelevanceExcluded.push({
        id: e.id, title: e.title, relevanceScores: e.relevanceScores,
        excludeReason: reasons.join("; "),
      });
    }
  }

  // C) ROTATION / FLEXION RISK (spine conditions only)
  const spineConditions: ConditionIdV2[] = ["back_pain", "sciatica", "neck_shoulder"];
  const movementRiskCandidates: AuditReport["movementRiskCandidates"] = [];
  if (spineConditions.includes(conditionId)) {
    for (const e of catalog) {
      if (
        ["spinal_rotation", "spinal_flexion"].includes(e.movementPattern) &&
        e.relevanceScores[key] >= 3
      ) {
        movementRiskCandidates.push({
          id: e.id, title: e.title,
          movementPattern: e.movementPattern, relevanceScores: e.relevanceScores,
        });
      }
    }
  }

  // D) TOP 30 BY RELEVANCE
  const topRelevant = [...catalog]
    .sort((a, b) => b.relevanceScores[key] - a.relevanceScores[key])
    .slice(0, 30)
    .map(e => ({
      id: e.id, title: e.title, relevanceScores: e.relevanceScores,
      category: e.category, foundationTier: e.foundationTier,
    }));

  return {
    condition: conditionId,
    generatedAtISO: new Date().toISOString(),
    lowRelevanceSafe,
    highRelevanceExcluded,
    movementRiskCandidates,
    topRelevant,
  };
}
