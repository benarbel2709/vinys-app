import { useMemo } from "react";

import { getCatalogV2, getMigrationLog, generateSessionV2, buildPool, scoreExercise } from "@/engine";
import { CONDITION_PROFILES, LEGACY_CONDITION_MAP } from "@/engine/conditions";
import { SESSION_SLOTS, RELEVANCE_KEYS } from "@/engine/types";
import type { ExerciseV2, UserInputV2, ConditionIdV2, SessionOutputV2 } from "@/engine/types";
import { CONDITIONS, CONDITION_RELEVANCE_KEY, type ConditionKey } from "@/constants/conditions";
import { MASTER_EXERCISES } from "@/data/masterExercises";


// Dev-only page — route is only mounted when import.meta.env.DEV (see App.tsx)
// No client-side auth gate needed since route doesn't exist in production builds

// ─── Helpers ───
function toDataUri(data: unknown): string {
  const json = JSON.stringify(data, null, 2);
  return "data:application/json;charset=utf-8," + encodeURIComponent(json);
}

function copyJson(data: unknown) {
  navigator.clipboard.writeText(JSON.stringify(data, null, 2)).catch(() => {});
}

// ─── FILE 1: exercise-library.json ───
function buildExerciseLibrary(catalog: ExerciseV2[]) {
  return {
    exportDate: new Date().toISOString(),
    totalExercises: catalog.length,
    exercises: catalog.map(e => ({
      id: e.id,
      title: e.title,
      category: e.category,
      durationMin: Math.round(e.dose.baseSeconds / 60),
      intensityTarget: e.intensity.label,
      poseSet: e.poseSet,
      equipment: e.equipment,
      tags: e.tags,
      relevance: e.relevanceScores,
      instructions: e.instructions,
      breathing: e.breathing,
      reps: e.reps,
      range: e.range,
      why: e.why,
      safety: e.safety,
      cue: e.cue,
      targets: e.targets,
      movementPattern: e.movementPattern,
      dose: e.dose,
      foundationTier: e.foundationTier,
      contra: e.contra,
      spine: e.spine,
      planes: e.planes,
    })),
  };
}

// ─── FILE 2: condition-mappings.json ───
function buildConditionMappings(catalog: ExerciseV2[]) {
  const onboardingConditions = CONDITIONS.map(c => {
    const engineId = LEGACY_CONDITION_MAP[c.key as keyof typeof LEGACY_CONDITION_MAP];
    const profile = engineId ? CONDITION_PROFILES[engineId] : null;
    return {
      displayName: c.label,
      onboardingKey: c.key,
      engineProfileId: engineId || null,
      libraryRelevanceKey: profile?.relevanceKey || CONDITION_RELEVANCE_KEY[c.key] || null,
    };
  });

  const libraryConditions = Object.values(CONDITION_PROFILES).map(p => ({
    key: p.relevanceKey,
    id: p.id,
    displayName: p.id.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
    requiredTags: p.requiredTags,
    excludedPoseSets: p.excludedPoseSets,
    contraRules: p.contraRules,
    notes: p.notes,
    exerciseCount: catalog.filter(e => (e.relevanceScores[p.relevanceKey] || 0) >= 1).length,
  }));

  const unmappedConditions = onboardingConditions
    .filter(c => !c.engineProfileId)
    .map(c => ({ displayName: c.displayName, onboardingKey: c.onboardingKey, fallbackKey: c.libraryRelevanceKey }));

  return { exportDate: new Date().toISOString(), onboardingConditions, libraryConditions, unmappedConditions };
}

// ─── FILE 3: session-builder-config.json ───
function buildSessionConfig() {
  return {
    exportDate: new Date().toISOString(),
    durationOptions: [10, 15, 20, 30],
    energyLevels: {
      gentle: { label: "Gentle day", mode: "flare" as const, description: "Flare-safe exercises only, reduced intensity" },
      medium: { label: "Feeling okay", mode: "easier" as const, description: "Standard exercises, intensity capped at 4/5" },
      full: { label: "Full energy", mode: "normal" as const, description: "Full exercise selection, no intensity cap" },
    },
    sessionStructure: SESSION_SLOTS,
    selectionAlgorithm: {
      description: "Exercises are filtered by safety tags, equipment, and contra rules. Then scored by primary condition relevance (×10), secondary condition relevance (×4 avg), safety tag bonuses, dose fit, mode/intensity fit, and recency penalties. Top 5 candidates per slot are tie-broken with a deterministic seed. Duplicate titles are excluded. Week-level repetition control penalizes or hard-excludes exercises used in the last 7 days.",
      sortBy: "Composite score (relevance × 10 + secondary × 4 + safety bonuses − penalties), then tie-break top 5 with seeded random",
      equipmentFiltering: "Required equipment in exerciseDetailed must be in user's available list. 'none' always available.",
      recentExerciseAvoidance: true,
      recentExerciseWindow: "7 days for week-level, index-based for session-level",
      multiConditionHandling: "Primary condition scores ×10, secondary conditions averaged ×4. Secondary contra rules apply soft penalty (−6).",
    },
    closingOptions: ["cooldown", "release", "opening_breath (intensity ≤ 2)"],
    relevanceKeys: RELEVANCE_KEYS,
    conditionProfiles: CONDITION_PROFILES,
  };
}

// ─── FILE 4: sample-sessions.json ───
function buildSampleSessions(catalog: ExerciseV2[]) {
  const scenarios: { label: string; condition: ConditionIdV2; minutes: 10 | 15 | 20 | 30; equipment: string[]; mode: "flare" | "easier" | "normal" }[] = [
    { label: "Back Pain + 15min + Strap + Full Energy", condition: "back_pain", minutes: 15, equipment: ["strap"], mode: "normal" },
    { label: "Back Pain + 20min + No equipment + Gentle Day", condition: "back_pain", minutes: 20, equipment: [], mode: "flare" },
    { label: "Back Pain + 30min + All equipment + Full Energy", condition: "back_pain", minutes: 30, equipment: ["chair", "wall", "strap", "block", "bolster", "band"], mode: "normal" },
    { label: "Sciatica + 20min + No equipment + Feeling Okay", condition: "sciatica", minutes: 20, equipment: [], mode: "easier" },
    { label: "Fibromyalgia + 15min + No equipment + Gentle Day", condition: "fibromyalgia", minutes: 15, equipment: [], mode: "flare" },
    { label: "Fibromyalgia + 30min + Chair + Full Energy", condition: "fibromyalgia", minutes: 30, equipment: ["chair"], mode: "normal" },
    { label: "Knees + 20min + Chair + Feeling Okay", condition: "knees", minutes: 20, equipment: ["chair"], mode: "easier" },
    { label: "Stress & Sleep + 15min + No equipment + Gentle Day", condition: "stress_sleep", minutes: 15, equipment: [], mode: "flare" },
    { label: "Pregnancy + 20min + Bolster + Feeling Okay", condition: "pregnancy", minutes: 20, equipment: ["bolster"], mode: "easier" },
    { label: "Stress & Sleep + 20min + No equipment + Gentle Day", condition: "stress_sleep", minutes: 20, equipment: [], mode: "flare" },
    { label: "Sciatica + 20min + No equipment + Gentle Day", condition: "sciatica", minutes: 20, equipment: [], mode: "flare" },
    { label: "Neck & Shoulder + 15min + Strap + Full Energy", condition: "neck_shoulder", minutes: 15, equipment: ["strap"], mode: "normal" },
  ];

  return {
    exportDate: new Date().toISOString(),
    sessions: scenarios.map((s, idx) => {
      const user: UserInputV2 = {
        primaryCondition: s.condition,
        secondaryConditions: [],
        mode: s.mode,
        sessionMinutes: s.minutes,
        availableEquipment: s.equipment.length > 0 ? s.equipment as any : ["none"],
        pregnancyStage: s.condition === "pregnancy" ? "late" : "none",
        redFlags: { hasRedFlags: false, flags: [] },
        history: { recentExerciseIds: [], recentPatterns: [], recentSelections: [] },
      };

      const session = generateSessionV2(user, catalog, `sample_${idx}`);
      const pool = buildPool(user, catalog);
      const primary = CONDITION_PROFILES[s.condition];

      const categoryBreakdown: Record<string, number> = {};
      let totalSeconds = 0;
      let relevanceSum = 0;
      let equipCount = 0;

      const exercises = session.exercises.map((se, order) => {
        const full = catalog.find(e => e.id === se.id);
        const cat = full?.category || "unknown";
        categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + 1;
        totalSeconds += se.seconds;
        const rel = full ? (full.relevanceScores[primary.relevanceKey] || 0) : 0;
        relevanceSum += rel;
        if (full && full.equipment.some(eq => eq !== "none")) equipCount++;

        return {
          order: order + 1,
          exerciseId: se.id,
          exerciseTitle: se.title,
          category: cat,
          relevanceScore: rel,
          allocatedSeconds: se.seconds,
          poseSet: full?.poseSet,
          intensity: full?.intensity.levelNumeric,
        };
      });

      return {
        scenario: { condition: s.label, durationMin: s.minutes, equipment: s.equipment, energyLevel: s.mode },
        generatedSession: exercises,
        sessionAnalysis: {
          totalDurationSeconds: totalSeconds,
          categoryBreakdown,
          avgRelevanceScore: session.exercises.length > 0 ? +(relevanceSum / session.exercises.length).toFixed(2) : 0,
          exercisesUsingEquipment: equipCount,
          exerciseCount: session.exercises.length,
          poolSize: pool.length,
          metadata: session.metadata,
        },
      };
    }),
  };
}

// ─── FILE 5: coverage-gaps.json ───
function buildCoverageGaps(catalog: ExerciseV2[]) {
  // Exercises with no/zero relevance
  const noRelevance = catalog.filter(e => {
    const vals = Object.values(e.relevanceScores);
    return vals.every(v => v === 0);
  }).map(e => ({ id: e.id, title: e.title, category: e.category }));

  // Thin coverage per condition
  const thinCoverage = Object.values(CONDITION_PROFILES).map(p => {
    const matching = catalog.filter(e => (e.relevanceScores[p.relevanceKey] || 0) >= 3);
    return {
      condition: p.id,
      relevanceKey: p.relevanceKey,
      count: matching.length,
      isThin: matching.length < 8,
      exercises: matching.map(e => ({ id: e.id, title: e.title, score: e.relevanceScores[p.relevanceKey] })),
    };
  }).filter(c => c.isThin);

  // Equipment coverage
  const equipTypes = ["chair", "wall", "strap", "block", "bolster", "band"] as const;
  const equipmentCoverage: Record<string, { exerciseCount: number; categories: Record<string, number> }> = {};
  for (const eq of equipTypes) {
    const matching = catalog.filter(e => e.equipment.includes(eq));
    const cats: Record<string, number> = {};
    matching.forEach(e => { cats[e.category] = (cats[e.category] || 0) + 1; });
    equipmentCoverage[eq] = { exerciseCount: matching.length, categories: cats };
  }

  // Duration feasibility
  const durationFeasibility: { condition: string; minutes: number; poolSize: number; feasible: boolean }[] = [];
  for (const p of Object.values(CONDITION_PROFILES)) {
    for (const mins of [10, 15, 20, 30] as const) {
      const user: UserInputV2 = {
        primaryCondition: p.id,
        secondaryConditions: [],
        mode: "normal",
        sessionMinutes: mins,
        availableEquipment: ["none"],
        pregnancyStage: p.id === "pregnancy" ? "late" : "none",
        redFlags: { hasRedFlags: false, flags: [] },
        history: { recentExerciseIds: [], recentPatterns: [], recentSelections: [] },
      };
      const pool = buildPool(user, catalog);
      const slots = SESSION_SLOTS[mins];
      const needed = slots.opening + slots.main + slots.closing;
      durationFeasibility.push({ condition: p.id, minutes: mins, poolSize: pool.length, feasible: pool.length >= needed });
    }
  }

  // Conditions with zero coverage
  const zeroCoverage = Object.values(CONDITION_PROFILES)
    .filter(p => catalog.filter(e => (e.relevanceScores[p.relevanceKey] || 0) >= 1).length === 0)
    .map(p => p.id);

  return {
    exportDate: new Date().toISOString(),
    exercisesWithNoRelevanceScores: noRelevance,
    conditionsWithNoCoverage: zeroCoverage,
    conditionsWithThinCoverage: thinCoverage,
    equipmentCoverage,
    durationFeasibility: durationFeasibility.filter(d => !d.feasible || d.poolSize < 10),
    totalCatalogSize: catalog.length,
    masterExerciseCount: MASTER_EXERCISES.length,
  };
}

// ─── PAGE ───
export default function DevExportEngineData() {
  const catalog = useMemo(() => getCatalogV2(), []);
  const migLog = useMemo(() => getMigrationLog(), []);

  const files = useMemo(() => ({
    exerciseLibrary: buildExerciseLibrary(catalog),
    conditionMappings: buildConditionMappings(catalog),
    sessionConfig: buildSessionConfig(),
    sampleSessions: buildSampleSessions(catalog),
    coverageGaps: buildCoverageGaps(catalog),
  }), [catalog]);

  const stats = useMemo(() => {
    const cats: Record<string, number> = {};
    catalog.forEach(e => { cats[e.category] = (cats[e.category] || 0) + 1; });
    return {
      total: catalog.length,
      categories: cats,
      conditions: Object.keys(CONDITION_PROFILES).length,
      onboardingConditions: CONDITIONS.length,
      thinGaps: files.coverageGaps.conditionsWithThinCoverage.length,
      infeasible: files.coverageGaps.durationFeasibility.filter(d => !d.feasible).length,
      migrationDupes: migLog.duplicateTitlesRenamed.length,
      migrationInvalid: migLog.removedInvalidExercises.length,
    };
  }, [catalog, files, migLog]);

  // Route only exists in dev mode (guarded in App.tsx)

  const linkClass = "inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors no-underline";
  const copyClass = "px-2 py-2 rounded-lg text-xs font-medium bg-muted text-muted-foreground hover:bg-muted/80 transition-colors";

  const fileList: { name: string; icon: string; label: string; data: unknown }[] = [
    { name: "exercise-library.json", icon: "📦", label: `Exercise Library (${stats.total})`, data: files.exerciseLibrary },
    { name: "condition-mappings.json", icon: "🗂", label: "Condition Mappings", data: files.conditionMappings },
    { name: "session-builder-config.json", icon: "⚙️", label: "Session Builder Config", data: files.sessionConfig },
    { name: "sample-sessions.json", icon: "🧪", label: "Sample Sessions (12)", data: files.sampleSessions },
    { name: "coverage-gaps.json", icon: "🔍", label: "Coverage Gaps", data: files.coverageGaps },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-1">Engine Data Export — for AI Analysis</h1>
      <p className="text-sm text-muted-foreground mb-2">Click any file to download it. If downloads don't start, right-click → "Save link as…"</p>
      <p className="text-xs text-muted-foreground mb-6">
        Or use <code className="bg-muted px-1.5 py-0.5 rounded text-xs">localStorage.setItem('vinys_dev_mode', 'true')</code> in browser console for permanent access
      </p>

      {/* Download links */}
      <div className="space-y-3 mb-8">
        {fileList.map(f => (
          <div key={f.name} className="flex items-center gap-2">
            <a href={toDataUri(f.data)} download={f.name} className={linkClass} target="_blank" rel="noopener noreferrer">
              {f.icon} {f.label}
            </a>
            <button className={copyClass} onClick={() => { copyJson(f.data); alert("Copied " + f.name + " to clipboard!"); }}>
              📋 Copy
            </button>
          </div>
        ))}
      </div>

      {/* Stats summary */}
      <div className="rounded-xl border border-border bg-surface-warm p-5 space-y-3">
        <h2 className="text-lg font-semibold">Summary</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
          <Stat label="Total exercises (v2)" value={stats.total} />
          <Stat label="Master exercises (raw)" value={MASTER_EXERCISES.length} />
          <Stat label="Engine condition profiles" value={stats.conditions} />
          <Stat label="Onboarding conditions" value={stats.onboardingConditions} />
          <Stat label="Thin coverage gaps" value={stats.thinGaps} warn={stats.thinGaps > 0} />
          <Stat label="Infeasible duration combos" value={stats.infeasible} warn={stats.infeasible > 0} />
          <Stat label="Migration: dupes removed" value={stats.migrationDupes} />
          <Stat label="Migration: invalid removed" value={stats.migrationInvalid} />
        </div>

        <h3 className="text-sm font-semibold mt-4">Category breakdown</h3>
        <div className="flex flex-wrap gap-2">
          {Object.entries(stats.categories).map(([cat, count]) => (
            <span key={cat} className="bg-muted px-2.5 py-1 rounded-full text-xs font-medium">
              {cat}: {count}
            </span>
          ))}
        </div>

        <h3 className="text-sm font-semibold mt-4">Condition coverage (exercises with relevance ≥ 3)</h3>
        <div className="space-y-1">
          {Object.values(CONDITION_PROFILES).map(p => {
            const count = catalog.filter(e => (e.relevanceScores[p.relevanceKey] || 0) >= 3).length;
            return (
              <div key={p.id} className="flex items-center gap-2 text-xs">
                <span className="w-28 font-medium">{p.id}</span>
                <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${Math.min(100, (count / stats.total) * 100 * 3)}%`, background: count < 8 ? "hsl(var(--destructive))" : "hsl(var(--secondary))" }} />
                </div>
                <span className={`w-8 text-right ${count < 8 ? "text-destructive font-bold" : ""}`}>{count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, warn }: { label: string; value: number | string; warn?: boolean }) {
  return (
    <div className="bg-muted/50 rounded-lg p-3">
      <div className={`text-xl font-bold ${warn ? "text-destructive" : ""}`}>{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
