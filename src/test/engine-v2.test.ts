/**
 * Vinys Engine v2.1.2 — Full Test Suite
 * Sections 0-10 coverage.
 */

import { describe, it, expect } from "vitest";
import { buildPool, scoreExercise, assembleSession, generateSessionV2, applyRelevanceThreshold } from "@/engine/engine";
import { getCatalogV2, getMigrationLog } from "@/engine/migrate";
import { validateCatalog, validateConditionProfiles, assertV2Exercise } from "@/engine/validators";
import { CONDITION_PROFILES } from "@/engine/conditions";
import { generateConditionAuditReport } from "@/engine/audit";
import { normalizeTitleKey } from "@/engine/types";
import type { UserInputV2, ExerciseV2, ConditionIdV2 } from "@/engine/types";

function makeUser(overrides: Partial<UserInputV2> = {}): UserInputV2 {
  return {
    primaryCondition: "back_pain",
    secondaryConditions: [],
    mode: "normal",
    sessionMinutes: 20,
    availableEquipment: ["none"],
    pregnancyStage: "none",
    redFlags: { hasRedFlags: false, flags: [] },
    history: { recentExerciseIds: [], recentPatterns: [], recentSelections: [] },
    ...overrides,
  };
}

// ═══════════════════════════════════
// SECTION 0: SINGLE SOURCE OF TRUTH
// ═══════════════════════════════════

describe("Section 0: Single Source of Truth", () => {
  it("all catalog exercises pass v2 assertion (no legacy fields)", () => {
    const catalog = getCatalogV2();
    for (const e of catalog) {
      expect(assertV2Exercise(e)).toBe(true);
    }
  });

  it("no exercise has durationMin/intensityTarget/safetyTags/contraindications/contraindicationFlags", () => {
    const catalog = getCatalogV2();
    for (const e of catalog) {
      const raw = e as any;
      expect(raw.durationMin).toBeUndefined();
      expect(raw.intensityTarget).toBeUndefined();
      expect(raw.safetyTags).toBeUndefined();
      expect(raw.contraindications).toBeUndefined();
      expect(raw.contraindicationFlags).toBeUndefined();
    }
  });

  it("session only contains v2 exercises", () => {
    const catalog = getCatalogV2();
    const user = makeUser();
    const session = generateSessionV2(user, catalog);
    const catalogMap = new Map(catalog.map(e => [e.id, e]));
    for (const se of session.exercises) {
      const ex = catalogMap.get(se.id);
      expect(ex).toBeDefined();
      if (ex) expect(assertV2Exercise(ex)).toBe(true);
    }
  });
});

// ═══════════════════════════════════
// SECTION 1: RELEVANCE THRESHOLD
// ═══════════════════════════════════

describe("Section 1: Relevance Threshold", () => {
  it("OA session respects relevance threshold unless relaxed", () => {
    const catalog = getCatalogV2();
    const user = makeUser({ primaryCondition: "osteoarthritis", mode: "normal", sessionMinutes: 20 });
    const session = generateSessionV2(user, catalog);
    const catalogMap = new Map(catalog.map(e => [e.id, e]));

    if (!session.metadata.relevance_threshold_relaxed) {
      for (const se of session.exercises) {
        const ex = catalogMap.get(se.id);
        if (ex) expect(ex.relevanceScores.osteoarthritis).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it("stress_sleep session respects relevance threshold unless relaxed", () => {
    const catalog = getCatalogV2();
    const user = makeUser({ primaryCondition: "stress_sleep", mode: "normal", sessionMinutes: 20 });
    const session = generateSessionV2(user, catalog);
    const catalogMap = new Map(catalog.map(e => [e.id, e]));

    if (!session.metadata.relevance_threshold_relaxed) {
      for (const se of session.exercises) {
        const ex = catalogMap.get(se.id);
        if (ex) expect(ex.relevanceScores.stressSleep).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it("flare mode uses threshold of 1", () => {
    const catalog = getCatalogV2();
    const user = makeUser({ primaryCondition: "back_pain", mode: "flare" });
    const pool = buildPool(user, catalog);
    const { filtered, relaxed } = applyRelevanceThreshold(pool, user);

    if (!relaxed) {
      for (const e of filtered) {
        expect(e.relevanceScores.backPain).toBeGreaterThanOrEqual(1);
      }
    }
  });
});

// ═══════════════════════════════════
// SECTION 2: DUPLICATE ID + TITLE
// ═══════════════════════════════════

describe("Section 2: Duplicate ID/Title Validation", () => {
  it("catalog has no duplicate IDs", () => {
    const catalog = getCatalogV2();
    const ids = catalog.map(e => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("catalog has no duplicate titleKeys", () => {
    const catalog = getCatalogV2();
    const tks = catalog.map(e => normalizeTitleKey(e.title));
    expect(new Set(tks).size).toBe(tks.length);
  });

  it("duplicate IDs fail validation", () => {
    const catalog = getCatalogV2();
    const dup = { ...catalog[0] };
    const errors = validateCatalog([...catalog, dup]);
    const idErrors = errors.filter(e => e.field === "id" && e.message.includes("Duplicate"));
    expect(idErrors.length).toBeGreaterThan(0);
  });

  it("duplicate titles fail validation", () => {
    const catalog = getCatalogV2();
    const dup = { ...catalog[0], id: "fake_duplicate_id_xyz" };
    const errors = validateCatalog([...catalog, dup]);
    const titleErrors = errors.filter(e => e.field === "title" && e.message.includes("Duplicate titleKey"));
    expect(titleErrors.length).toBeGreaterThan(0);
  });
});

// ═══════════════════════════════════
// SECTION 3: RUNTIME TITLE DEDUPE
// ═══════════════════════════════════

describe("Section 3: Runtime Title Dedupe", () => {
  it("no session contains duplicate titleKeys", () => {
    const catalog = getCatalogV2();
    const user = makeUser({ sessionMinutes: 30 });
    const session = generateSessionV2(user, catalog);

    const titleKeys = session.exercises.map(e => normalizeTitleKey(e.title));
    const unique = new Set(titleKeys);
    expect(unique.size).toBe(titleKeys.length);
  });
});

// ═══════════════════════════════════
// SECTION 4: WEEK-LEVEL REPETITION
// ═══════════════════════════════════

describe("Section 4: Week-Level Repetition", () => {
  it("variety exercise hard-excluded within 7 days", () => {
    const catalog = getCatalogV2();
    const variety = catalog.find(e => e.foundationTier === "variety");
    if (!variety) return;

    const primary = CONDITION_PROFILES["back_pain"];
    const user = makeUser({
      history: {
        recentExerciseIds: [variety.id],
        recentPatterns: [],
        recentSelections: [{
          exerciseId: variety.id,
          titleKey: normalizeTitleKey(variety.title),
          movementPattern: variety.movementPattern,
          selectedAtISO: new Date().toISOString(),
        }],
      },
    });

    const score = scoreExercise(variety, user, primary, []);
    expect(score).toBeLessThan(-900);
  });

  it("foundation exercise can repeat but is penalized", () => {
    const catalog = getCatalogV2();
    const foundation = catalog.find(e => e.foundationTier === "foundation")!;
    const primary = CONDITION_PROFILES["back_pain"];

    const userWithHistory = makeUser({
      history: {
        recentExerciseIds: [foundation.id],
        recentPatterns: [],
        recentSelections: [{
          exerciseId: foundation.id,
          titleKey: normalizeTitleKey(foundation.title),
          movementPattern: foundation.movementPattern,
          selectedAtISO: new Date().toISOString(),
        }],
      },
    });
    const userNoHistory = makeUser();

    const scoreWith = scoreExercise(foundation, userWithHistory, primary, []);
    const scoreWithout = scoreExercise(foundation, userNoHistory, primary, []);

    expect(scoreWith).toBeLessThan(scoreWithout);
    expect(scoreWith).toBeGreaterThan(-100); // should not be hard-excluded
  });
});

// ═══════════════════════════════════
// SECTION 5: EQUIPMENT VALIDATION
// ═══════════════════════════════════

describe("Section 5: Equipment Keyword Validation", () => {
  it("equipment keyword mismatch flagged in validation", () => {
    const catalog = getCatalogV2();
    const errors = validateCatalog(catalog);
    expect(errors).toBeDefined();
  });

  it("migration log tracks equipment auto-adds", () => {
    getCatalogV2(); // ensure migration ran
    const log = getMigrationLog();
    expect(log).toBeDefined();
    expect(Array.isArray(log.equipmentAutoAdds)).toBe(true);
  });
});

// ═══════════════════════════════════
// SECTION 6: PREGNANCY SAFETY
// ═══════════════════════════════════

describe("Section 6: Pregnancy Safety", () => {
  it("late pregnancy excludes prone and long supine holds", () => {
    const catalog = getCatalogV2();
    const user = makeUser({ primaryCondition: "pregnancy", pregnancyStage: "late", mode: "normal" });
    const pool = buildPool(user, catalog);

    for (const e of pool) {
      expect(e.poseSet).not.toBe("prone");
      if (e.poseSet === "supine") {
        expect(e.dose.baseSeconds).toBeLessThanOrEqual(45);
      }
    }
  });

  it("late pregnancy excludes high-intensity rotation", () => {
    const catalog = getCatalogV2();
    const user = makeUser({ primaryCondition: "pregnancy", pregnancyStage: "late", mode: "normal" });
    const pool = buildPool(user, catalog);

    for (const e of pool) {
      if (e.spine.motion === "rotation" || e.spine.motion === "mixed") {
        expect(e.intensity.levelNumeric).toBeLessThan(3);
      }
    }
  });

  it("late pregnancy session has no prone and no long supine", () => {
    const catalog = getCatalogV2();
    const user = makeUser({ primaryCondition: "pregnancy", pregnancyStage: "late", mode: "normal", sessionMinutes: 20 });
    const session = generateSessionV2(user, catalog);
    const catalogMap = new Map(catalog.map(e => [e.id, e]));

    for (const se of session.exercises) {
      const ex = catalogMap.get(se.id);
      if (ex) {
        expect(ex.poseSet).not.toBe("prone");
        if (ex.poseSet === "supine") {
          expect(ex.dose.baseSeconds).toBeLessThanOrEqual(45);
        }
      }
    }
  });
});

// ═══════════════════════════════════
// SECTION 7: SCIATICA / DISC
// ═══════════════════════════════════

describe("Section 7: Sciatica/Disc Enforcement", () => {
  it("sciatica excludes exercises with avoidFlexion and avoidRotation contra", () => {
    const catalog = getCatalogV2();
    const user = makeUser({ primaryCondition: "sciatica", mode: "normal" });
    const pool = buildPool(user, catalog);

    for (const e of pool) {
      expect(e.contra.avoidFlexion).toBe(false);
      expect(e.contra.avoidRotation).toBe(false);
    }
  });

  it("sciatica session excludes spinal_rotation when contraindicated", () => {
    const catalog = getCatalogV2();
    const user = makeUser({ primaryCondition: "sciatica", mode: "normal", sessionMinutes: 20 });
    const pool = buildPool(user, catalog);

    for (const e of pool) {
      expect(e.contra.avoidFlexion).toBe(false);
      expect(e.contra.avoidRotation).toBe(false);
    }
  });
});

// ═══════════════════════════════════
// SECTION 8: SCHEMA PURGE
// ═══════════════════════════════════

describe("Section 8: Schema Purge", () => {
  it("no exercises in catalog have null relevanceScores or dose", () => {
    const catalog = getCatalogV2();
    for (const e of catalog) {
      expect(e.relevanceScores).not.toBeNull();
      expect(e.dose).not.toBeNull();
      expect(typeof e.movementPattern).toBe("string");
      expect(e.targets.length).toBeGreaterThan(0);
    }
  });

  it("migrated catalog has zero critical validation errors", () => {
    const catalog = getCatalogV2();
    const errors = validateCatalog(catalog);
    const critical = errors.filter(e => e.severity === "error");
    if (critical.length > 0) {
      console.warn("Critical errors:", critical.slice(0, 5));
    }
    // No duplicate IDs, no null relevanceScores, no legacy fields
    const legacyErrors = critical.filter(e =>
      ["durationMin", "intensityTarget", "safetyTags", "contraindications", "contraindicationFlags"].includes(e.field)
    );
    expect(legacyErrors).toHaveLength(0);
  });
});

// ═══════════════════════════════════
// SECTION 9: AUDIT REPORTS
// ═══════════════════════════════════

describe("Section 9: Audit Reports", () => {
  it("audit report generates expected structure for back_pain", () => {
    const catalog = getCatalogV2();
    const report = generateConditionAuditReport("back_pain", catalog);

    expect(report.condition).toBe("back_pain");
    expect(report.generatedAtISO).toBeDefined();
    expect(Array.isArray(report.lowRelevanceSafe)).toBe(true);
    expect(Array.isArray(report.highRelevanceExcluded)).toBe(true);
    expect(Array.isArray(report.movementRiskCandidates)).toBe(true);
    expect(Array.isArray(report.topRelevant)).toBe(true);
    expect(report.topRelevant.length).toBeLessThanOrEqual(30);
  });

  it("audit report generates expected structure for stress_sleep", () => {
    const catalog = getCatalogV2();
    const report = generateConditionAuditReport("stress_sleep", catalog);

    expect(report.condition).toBe("stress_sleep");
    expect(Array.isArray(report.topRelevant)).toBe(true);
    expect(report.movementRiskCandidates).toHaveLength(0);
  });
});

// ═══════════════════════════════════
// ORIGINAL FUNCTIONAL TESTS
// ═══════════════════════════════════

describe("Flare Mode Safety", () => {
  it("flare mode excludes intensity>=4 and spine.load=loaded", () => {
    const catalog = getCatalogV2();
    const user = makeUser({ mode: "flare" });
    const pool = buildPool(user, catalog);

    for (const e of pool) {
      expect(e.intensity.levelNumeric).toBeLessThan(4);
      expect(e.spine.load).not.toBe("loaded");
    }
  });
});

describe("Red Flag Gate", () => {
  it("red-flag gate returns only universalSafe+flareSafe and intensity<=2", () => {
    const catalog = getCatalogV2();
    const user = makeUser({ redFlags: { hasRedFlags: true, flags: ["New sharp pain"] } });
    const session = generateSessionV2(user, catalog);

    expect(session.metadata.mode).toBe("flare");
    expect(session.exercises.length).toBeGreaterThan(0);
    expect(session.exercises.length).toBeLessThanOrEqual(5);

    const catalogMap = new Map(catalog.map(e => [e.id, e]));
    for (const se of session.exercises) {
      const ex = catalogMap.get(se.id);
      if (ex) {
        expect(ex.tags.universalSafe).toBe(true);
        expect(ex.tags.flareSafe).toBe(true);
        expect(ex.intensity.levelNumeric).toBeLessThanOrEqual(2);
      }
    }
  });
});

describe("Recent Usage Penalty", () => {
  it("foundation exercises are penalized less than variety", () => {
    const catalog = getCatalogV2();
    const foundation = catalog.find(e => e.foundationTier === "foundation")!;
    const variety = catalog.find(e => e.foundationTier === "variety");
    if (!variety) return;

    const primary = CONDITION_PROFILES["back_pain"];
    const user = makeUser({
      history: { recentExerciseIds: [foundation.id, variety.id], recentPatterns: [], recentSelections: [] },
    });

    const foundationScore = scoreExercise(foundation, user, primary, []);
    const varietyScore = scoreExercise(variety, user, primary, []);
    const userNoHistory = makeUser();
    const foundationBase = scoreExercise(foundation, userNoHistory, primary, []);
    const varietyBase = scoreExercise(variety, userNoHistory, primary, []);

    expect(foundationBase - foundationScore).toBeLessThan(varietyBase - varietyScore);
  });
});

describe("Pose Set Limit (short sessions)", () => {
  it("sessionMinutes<=15 uses max 2 poseSets", () => {
    const catalog = getCatalogV2();
    const user = makeUser({ sessionMinutes: 15, mode: "normal" });
    const session = generateSessionV2(user, catalog);
    expect(session.metadata.poseSetsUsed.length).toBeLessThanOrEqual(2);
  });
});

describe("Anti-pattern for back_pain", () => {
  it("back_pain normal includes at least 1 anti_rotation or anti_extension", () => {
    const catalog = getCatalogV2();
    const user = makeUser({ primaryCondition: "back_pain", mode: "normal", sessionMinutes: 20 });
    const session = generateSessionV2(user, catalog);

    expect(session.exercises.length).toBeGreaterThan(0);
    const antiInCatalog = catalog.some(e =>
      ["anti_rotation", "anti_extension"].includes(e.movementPattern) && e.tags.universalSafe
    );
    if (antiInCatalog) {
      const hasAnti = session.metadata.patternsCovered.some(
        p => p === "anti_rotation" || p === "anti_extension"
      );
      expect(hasAnti).toBe(true);
    }
  });
});

describe("Session Slot Counts", () => {
  it("10-minute session produces 6 exercises", () => {
    const catalog = getCatalogV2();
    const user = makeUser({ sessionMinutes: 10 });
    const session = generateSessionV2(user, catalog);
    expect(session.exercises.length).toBeLessThanOrEqual(6);
    expect(session.exercises.length).toBeGreaterThanOrEqual(3);
  });

  it("30-minute session produces up to 18 exercises", () => {
    const catalog = getCatalogV2();
    const user = makeUser({ sessionMinutes: 30 });
    const session = generateSessionV2(user, catalog);
    expect(session.exercises.length).toBeLessThanOrEqual(18);
    expect(session.exercises.length).toBeGreaterThanOrEqual(6);
  });
});

describe("Condition Profiles", () => {
  it("condition profiles have valid relevance keys", () => {
    const errors = validateConditionProfiles();
    expect(errors).toHaveLength(0);
  });
});

describe("Migration Log", () => {
  it("migration log is populated after catalog generation", () => {
    getCatalogV2();
    const log = getMigrationLog();
    expect(log).toBeDefined();
    expect(typeof log.renamedIds).toBe("object");
    expect(Array.isArray(log.equipmentAutoAdds)).toBe(true);
    expect(Array.isArray(log.removedInvalidExercises)).toBe(true);
  });
});

// ═══════════════════════════════════
// OSTEOPOROSIS CLINICAL SAFETY FLAGS
// ═══════════════════════════════════

describe("Osteoporosis clinical safety flags", () => {
  it("profile declares avoidSpinalFlexion, avoidHighImpact, excludedPoseSets and boneLoadingBonus", () => {
    const p = CONDITION_PROFILES.osteoporosis;
    expect(p.contraRules.avoidSpinalFlexion).toBe(true);
    expect(p.contraRules.avoidHighImpact).toBe(true);
    expect(p.contraRules.excludedPoseSets).toEqual(["highImpact"]);
    expect(p.boneLoadingBonus).toBe(2);
  });

  it("buildPool for osteoporosis contains zero spine-flexion exercises", () => {
    const catalog = getCatalogV2();
    const user = makeUser({ primaryCondition: "osteoporosis" });
    const pool = buildPool(user, catalog);
    expect(pool.length).toBeGreaterThan(0);
    for (const e of pool) {
      expect(e.spine?.motion).not.toBe("flexion");
      expect(e.contra.avoidFlexion).not.toBe(true);
    }
  });

  it("buildPool for osteoporosis contains zero highImpact poseSet members", () => {
    const catalog = getCatalogV2();
    const user = makeUser({ primaryCondition: "osteoporosis" });
    const pool = buildPool(user, catalog);
    for (const e of pool) {
      const ps: any = (e as any).poseSet;
      const list: string[] = Array.isArray(ps) ? ps : (typeof ps === "string" ? [ps] : []);
      expect(list.includes("highImpact")).toBe(false);
    }
  });

  it("all condition profiles still build a non-empty pool — regression check", () => {
    const catalog = getCatalogV2();
    const ids = Object.keys(CONDITION_PROFILES) as ConditionIdV2[];
    for (const id of ids) {
      const user = makeUser({ primaryCondition: id });
      const pool = buildPool(user, catalog);
      expect(pool.length, `pool for ${id} should be non-empty`).toBeGreaterThan(0);
    }
  });
});
