// ─────────────────────────────────────────────────────────────────────────────
// src/engine/combined.ts — Vinys Systemic Pipeline v2.1, Prompt 5
// Combined path arbitration: when a user has BOTH a body-area diagnosis AND
// profile.systemic !== null, merge the two RefinedModelParams conservatively.
//
// Rules (per spec):
//   - lengthMin       = min(body, systemic)
//   - densityMax      = min(body, systemic)
//   - loadCeiling     = min(body, systemic)
//   - allowedCategories = intersection
//   - suppressTags    = union  (systemic-suppress wins on conflict — already
//                       captured by union: a tag suppressed on either side is
//                       dropped, even if the other side boosted it)
//   - boostTags       = union, MINUS anything in the merged suppressTags
//   - repeatCeiling / preferPriorBias: take the most conservative
//     (lower repeatCeiling, higher preferPriorBias)
// ─────────────────────────────────────────────────────────────────────────────

import type { RefinedModelParams } from "./tier";

export function applyCombinedPath(
  body: RefinedModelParams,
  systemic: RefinedModelParams,
): RefinedModelParams {
  const lengthMin   = Math.min(body.lengthMin,   systemic.lengthMin);
  const densityMax  = Math.min(body.densityMax,  systemic.densityMax);
  const loadCeiling = Math.min(body.loadCeiling, systemic.loadCeiling);

  const bodySet = new Set(body.allowedCategories);
  const allowedCategories = systemic.allowedCategories.filter(c => bodySet.has(c));

  // suppress union; systemic-suppress wins by virtue of being in the union
  const suppressTags = new Set<string>([...body.suppressTags, ...systemic.suppressTags]);
  // boost union, then remove anything also in suppress (suppress wins)
  const boostTags = new Set<string>(
    [...body.boostTags, ...systemic.boostTags].filter(t => !suppressTags.has(t)),
  );

  // Most conservative repeat / prior bias
  let repeatCeiling: number | undefined;
  if (body.repeatCeiling != null || systemic.repeatCeiling != null) {
    repeatCeiling = Math.min(
      body.repeatCeiling ?? 1,
      systemic.repeatCeiling ?? 1,
    );
  }
  let preferPriorBias: number | undefined;
  if (body.preferPriorBias != null || systemic.preferPriorBias != null) {
    preferPriorBias = Math.max(
      body.preferPriorBias ?? 0,
      systemic.preferPriorBias ?? 0,
    );
  }

  return {
    lengthMin,
    densityMax,
    loadCeiling,
    allowedCategories,
    suppressTags,
    boostTags,
    repeatCeiling,
    preferPriorBias,
  };
}

// ─── Dev-time self-tests ─────────────────────────────────────────────────────
if (typeof import.meta !== "undefined" && (import.meta as any).env?.DEV) {
  try {
    // A. body=0.85, systemic=0.50 → effective=0.50; lengthMin=18; intersect=[a,c]
    const combined = applyCombinedPath(
      { lengthMin: 28, densityMax: 0.80, loadCeiling: 0.85, allowedCategories: ["a","b","c"], suppressTags: new Set(), boostTags: new Set() },
      { lengthMin: 18, densityMax: 0.55, loadCeiling: 0.50, allowedCategories: ["a","c","d"], suppressTags: new Set(["x"]), boostTags: new Set() },
    );
    console.assert(combined.loadCeiling === 0.50, "[combined] A1 loadCeiling");
    console.assert(combined.lengthMin === 18, "[combined] A2 lengthMin");
    console.assert(
      combined.allowedCategories.length === 2 &&
      combined.allowedCategories.includes("a") &&
      combined.allowedCategories.includes("c"),
      "[combined] A3 intersection",
    );
    console.assert(combined.suppressTags.has("x"), "[combined] A4 suppress union");

    // B. systemic-suppress wins on conflict
    const conflict = applyCombinedPath(
      { lengthMin: 28, densityMax: 0.80, loadCeiling: 1.00, allowedCategories: ["x"], suppressTags: new Set(), boostTags: new Set(["x"]) },
      { lengthMin: 28, densityMax: 0.80, loadCeiling: 1.00, allowedCategories: ["x"], suppressTags: new Set(["x"]), boostTags: new Set() },
    );
    console.assert(conflict.suppressTags.has("x"), "[combined] B suppress wins");
    console.assert(!conflict.boostTags.has("x"),  "[combined] B boost dropped on suppress conflict");
  } catch (e) {
    console.warn("[combined] self-test setup error:", e);
  }
}
