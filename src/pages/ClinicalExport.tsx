/**
 * Clinical Audit Export v2.2.0 — generates a comprehensive JSON of the
 * entire recommendation engine for human reviewer auditing.
 * SINGLE SOURCE OF TRUTH: only exercisesV2 catalog. No legacy exercises.
 * Now includes full condition→engine mapping for all 35 conditions.
 */
import { useState } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Download, Loader2, CheckCircle } from "lucide-react";

import {
  CONDITIONS,
  CONDITION_RELEVANCE_KEY,
  CONDITION_SAFETY_TAG,
  CONDITION_WEIGHT,
  CONDITION_PREFIX,
  CONDITION_TIPS,
} from "@/constants/conditions";
import { CONDITION_CATEGORIES, CONDITION_DETAILS } from "@/constants/conditionCategories";

import { getCatalogV2, getMigrationLog } from "@/engine/migrate";
import { validateCatalog } from "@/engine/validators";
import { CONDITION_PROFILES, LEGACY_CONDITION_MAP } from "@/engine/conditions";
import { generateConditionAuditReport } from "@/engine/audit";
import { SESSION_SLOTS } from "@/engine/types";
import type { ConditionIdV2 } from "@/engine/types";

function buildExport() {
  // V2.1.2 migrated catalog (single source of truth — deduped, purged)
  const catalogV2 = getCatalogV2();
  const validationErrors = validateCatalog(catalogV2);
  const migrationLog = getMigrationLog();

  // 1. Conditions (metadata only)
  const conditions = CONDITIONS.map((c) => ({
    key: c.key,
    label: c.label,
    description: c.description,
    tip: CONDITION_TIPS[c.key],
    relevanceKey: CONDITION_RELEVANCE_KEY[c.key],
    safetyTag: CONDITION_SAFETY_TAG[c.key],
    scoringWeight: CONDITION_WEIGHT[c.key],
    exerciseIdPrefix: CONDITION_PREFIX[c.key],
  }));

  // 2. V2.1.2 exercises (ONLY source — no legacy)
  const exercises = catalogV2.map((e) => ({
    id: e.id,
    title: e.title,
    category: e.category,
    poseSet: e.poseSet,
    planes: e.planes,
    movementPattern: e.movementPattern,
    targets: e.targets,
    intensity: e.intensity,
    dose: e.dose,
    equipment: e.equipment,
    equipmentDetailed: e.equipmentDetailed,
    tags: e.tags,
    spine: e.spine,
    contra: e.contra,
    relevanceScores: e.relevanceScores,
    foundationTier: e.foundationTier,
    instructions: e.instructions,
    breathing: e.breathing,
    reps: e.reps,
    range: e.range,
    why: e.why,
    safety: e.safety,
    cue: e.cue,
  }));

  // 3. Condition profiles v2.1.2
  const conditionProfilesV2 = Object.entries(CONDITION_PROFILES).map(([id, p]) => ({
    id,
    relevanceKey: p.relevanceKey,
    requiredTags: p.requiredTags,
    excludedPoseSets: p.excludedPoseSets,
    contraRules: p.contraRules,
    notes: p.notes,
  }));

  // 4. Engine documentation
  const safetyConstraints = {
    discSciatica: { description: "Disc Herniation and Sciatica cases exclude exercises with avoidFlexion and avoidRotation contra flags.", excludedFlags: ["avoidFlexion", "avoidRotation"], appliesTo: ["disc_herniation", "sciatica"] },
    pregnancy: { description: "Pregnancy cases require pregnancySafe tag. Late-stage excludes prone, long supine (>45s), high-intensity rotation.", requiredTag: "pregnancySafe", appliesTo: ["pregnancy"] },
    kneeOA: { description: "Knee and OA conditions use kneeSafe and oaSafe tags respectively.", requiredTags: { knee_pain: "kneeSafe", hip_pain: "kneeSafe", osteoarthritis: "oaSafe" } },
    flare: { description: "During a flare, only flareSafe exercises are selected with intensity < 4.", requiredTag: "flareSafe" },
    relevanceThreshold: { description: "Normal/easier modes require relevanceScores[primaryKey] >= 2. Flare requires >= 1. Relaxed only if pool too small." },
  };

  const scoringPipeline = {
    formula: "SCORE = 10*primary + 4*secondaryAvg + safetyBoosts + doseFit + modeIntensityFit - secondaryContraPenalty - recencyPenalty - patternPenalty - weeklyRepetitionPenalty",
    weeklyRepetition: "variety: -1000 (hard exclude), standard: -4, foundation: -1 if selected within 7 days",
  };

  const sessionStructure = {
    slotsByDuration: { 10: { opening: 1, main: 4, closing: 1 }, 15: { opening: 1, main: 6, closing: 1 }, 20: { opening: 2, main: 8, closing: 2 }, 30: { opening: 2, main: 14, closing: 2 } },
    poseProgression: "supine/side_lying → seated/kneeling → standing. ≤15min: max 2 poseSets. ≥20min: max 3.",
    rampRule: "No consecutive intensity increase >2 levels.",
    determinism: "Seed from userId+date+sessionMinutes+primaryCondition.",
    titleDedupe: "Runtime: no two exercises with same normalized titleKey in one session.",
  };

  // Section 9: Structured catalog audit reports — ALL conditions
  const allConditionIds: ConditionIdV2[] = [
    "back_pain", "neck_shoulder", "hips_pelvis", "knees", "pregnancy",
    "fibromyalgia", "sciatica", "osteoarthritis", "stress_sleep",
  ];
  const catalogAuditReports = allConditionIds.map(cid =>
    generateConditionAuditReport(cid, catalogV2)
  );

  const criticalErrors = validationErrors.filter(e => e.severity === "error");
  const warnings = validationErrors.filter(e => e.severity === "warning");

  // Section 10: Full condition → engine → exercise mapping
  const conditionToEngineMapping = CONDITIONS.map((c) => {
    const engineProfileId = LEGACY_CONDITION_MAP[c.key];
    const engineProfile = CONDITION_PROFILES[engineProfileId];
    const safetyTag = CONDITION_SAFETY_TAG[c.key];

    // Count exercises that would pass safety filtering for this condition
    const safePool = catalogV2.filter(e => {
      // Check required tags from the engine profile
      for (const tag of engineProfile.requiredTags) {
        if (!e.tags[tag as keyof typeof e.tags]) return false;
      }
      // Check contra rules
      for (const [key, val] of Object.entries(engineProfile.contraRules)) {
        if (val && e.contra[key as keyof typeof e.contra]) return false;
      }
      return true;
    });

    const highRelevance = safePool.filter(e => e.relevanceScores[engineProfile.relevanceKey] >= 3);

    return {
      conditionKey: c.key,
      label: c.label,
      description: c.description,
      tip: CONDITION_TIPS[c.key],
      engineProfileId,
      engineProfile: {
        relevanceKey: engineProfile.relevanceKey,
        requiredTags: engineProfile.requiredTags,
        excludedPoseSets: engineProfile.excludedPoseSets,
        contraRules: engineProfile.contraRules,
        notes: engineProfile.notes,
      },
      safetyTag,
      scoringWeight: CONDITION_WEIGHT[c.key],
      detailTags: CONDITION_DETAILS[c.key] || [],
      exercisePoolSize: safePool.length,
      highRelevanceCount: highRelevance.length,
      exerciseBreakdown: {
        opening_breath: safePool.filter(e => e.category === "opening_breath").length,
        mobility: safePool.filter(e => e.category === "mobility").length,
        stability: safePool.filter(e => e.category === "stability").length,
        strength: safePool.filter(e => e.category === "strength").length,
        release: safePool.filter(e => e.category === "release").length,
        cooldown: safePool.filter(e => e.category === "cooldown").length,
      },
    };
  });

  // Section 11: Onboarding categories
  const onboardingCategories = CONDITION_CATEGORIES.map(cat => ({
    name: cat.name,
    conditions: cat.conditions.map(key => {
      const info = CONDITIONS.find(c => c.key === key);
      return {
        key,
        label: info?.label || key,
        mapsToEngine: LEGACY_CONDITION_MAP[key],
      };
    }),
  }));

  // Section 12: Session configuration options
  const sessionConfiguration = {
    durations: [10, 15, 20, 30],
    slotsByDuration: SESSION_SLOTS,
    weeklyFrequency: { min: 1, max: 5 },
    modes: {
      normal: "Standard intensity, balanced exercise selection",
      easier: "Reduced intensity, gentler exercises preferred",
      flare: "Ultra-gentle, only flareSafe exercises, intensity < 4",
    },
    sessionArc: ["Ground (opening breath)", "Build (mobility + stability)", "Integrate (strength/patterns)", "Restore (cooldown + release)"],
    multiConditionHandling: "Primary condition drives safety filtering and relevance scoring. Secondary conditions add soft scoring bonuses and contra penalties. All conditions share the same exercise catalog.",
    dailyAdaptation: {
      energyLevel: "Low/Medium/High — affects mode selection",
      flareStatus: "Yes/No/Not sure — triggers flare mode if yes",
      painLevel: "Tracked via check-ins, influences next session intensity",
    },
  };

  return {
    exportVersion: "2.2.0",
    exportDate: new Date().toISOString(),
    system: "Vinys Adaptive Therapeutic Yoga — Recommendation Engine v2.2.0",
    singleSourceOfTruth: "exercises (formerly exercisesV2) — no legacy arrays included",
    summary: {
      totalSelectableConditions: conditions.length,
      totalEngineProfiles: Object.keys(CONDITION_PROFILES).length,
      totalExercises: exercises.length,
      criticalErrors: criticalErrors.length,
      warnings: warnings.length,
      migrationLog: {
        renamedIds: Object.keys(migrationLog.renamedIds).length,
        equipmentAutoAdds: migrationLog.equipmentAutoAdds.length,
        removedInvalidExercises: migrationLog.removedInvalidExercises.length,
        duplicateTitlesRemoved: migrationLog.duplicateTitlesRenamed.length,
      },
      categories: {
        opening_breath: exercises.filter(e => e.category === "opening_breath").length,
        mobility: exercises.filter(e => e.category === "mobility").length,
        stability: exercises.filter(e => e.category === "stability").length,
        release: exercises.filter(e => e.category === "release").length,
        strength: exercises.filter(e => e.category === "strength").length,
        balance: exercises.filter(e => e.category === "balance").length,
        cooldown: exercises.filter(e => e.category === "cooldown").length,
      },
    },
    migrationLog,
    onboardingCategories,
    conditionToEngineMapping,
    conditions,
    conditionProfilesV2,
    exercises,
    safetyConstraints,
    scoringPipeline,
    sessionStructure,
    sessionConfiguration,
    catalogAuditReports,
    validationErrors: criticalErrors,
    validationWarnings: warnings,
  };
}

export default function ClinicalExport() {
  const [status, setStatus] = useState<"idle" | "building" | "done">("idle");

  const handleExport = () => {
    setStatus("building");
    setTimeout(() => {
      const data = buildExport();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `vinys-clinical-audit-v2.2.0-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setStatus("done");
    }, 300);
  };

  const preview = status === "done" ? buildExport() : null;

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Clinical Audit Export v2.2.0</h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive mapping of all {CONDITIONS.length} conditions → 9 engine profiles → exercise catalog.
            Includes session configuration, daily adaptation, and multi-condition handling.
          </p>
        </div>

        <div className="card-premium p-6 space-y-4">
          <h2 className="font-bold text-lg">What's included (v2.2.0)</h2>
          <ul className="text-sm text-muted-foreground space-y-1.5 list-disc list-inside">
            <li>All {CONDITIONS.length} selectable conditions mapped to 9 engine profiles</li>
            <li>Full condition → engine → exercise pool mapping with pool sizes</li>
            <li>Onboarding categories with detail tags per condition</li>
            <li>Session configuration: durations, weekly frequency, modes, daily adaptation</li>
            <li>Multi-condition handling: primary/secondary scoring, safety gates</li>
            <li>Structured audit reports for all 9 engine profiles</li>
            <li>Scoring pipeline with weekly repetition control</li>
            <li>Single-source exercise catalog (deduped, equipment auto-fixed)</li>
          </ul>
        </div>

        <Button
          variant="hero"
          size="lg"
          className="w-full gap-2"
          onClick={handleExport}
          disabled={status === "building"}
        >
          {status === "building" ? (
            <><Loader2 size={18} className="animate-spin" /> Building export…</>
          ) : status === "done" ? (
            <><CheckCircle size={18} /> Download again</>
          ) : (
            <><Download size={18} /> Export Clinical Audit JSON (v2.2.0)</>
          )}
        </Button>

        {preview && (
          <div className="card-premium p-4 space-y-3">
            <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">Export Summary</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-muted-foreground">Selectable Conditions</span>
              <span className="font-medium">{preview.summary.totalSelectableConditions}</span>
              <span className="text-muted-foreground">Engine Profiles</span>
              <span className="font-medium">{preview.summary.totalEngineProfiles}</span>
              <span className="text-muted-foreground">Exercises</span>
              <span className="font-medium">{preview.summary.totalExercises}</span>
              <span className="text-muted-foreground">Critical Errors</span>
              <span className={`font-medium ${preview.summary.criticalErrors > 0 ? "text-destructive" : "text-green-600"}`}>
                {preview.summary.criticalErrors === 0 ? "✅ 0" : `⚠️ ${preview.summary.criticalErrors}`}
              </span>
              <span className="text-muted-foreground">Warnings</span>
              <span className="font-medium text-amber-600">{preview.summary.warnings}</span>
              <span className="text-muted-foreground">IDs Renamed</span>
              <span className="font-medium">{preview.summary.migrationLog.renamedIds}</span>
              <span className="text-muted-foreground">Equip Auto-Adds</span>
              <span className="font-medium">{preview.summary.migrationLog.equipmentAutoAdds}</span>
              <span className="text-muted-foreground">Dup Titles Removed</span>
              <span className="font-medium">{preview.summary.migrationLog.duplicateTitlesRemoved}</span>
            </div>

            {preview.summary.criticalErrors > 0 && (
              <div className="mt-3 p-3 bg-destructive/10 rounded-md">
                <h4 className="font-bold text-sm text-destructive mb-2">Critical Issues</h4>
                <ul className="text-xs space-y-1">
                  {preview.validationErrors.slice(0, 10).map((err, i) => (
                    <li key={i} className="text-destructive">
                      <span className="font-mono">{err.exerciseId || "global"}</span>: {err.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
