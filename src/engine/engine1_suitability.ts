// ─────────────────────────────────────────────────────────────────────────────
// src/engine/engine1_suitability.ts
// Engine 1 — Pose Suitability
//
// Pure function. Receives a user profile map and the full exercise library.
// Returns a ranked list of clinically suitable poses.
// Has NO knowledge of session structure or sequencing.
//
// Per Aviv's Algorithm Specification v1.0, Part 2.
// ─────────────────────────────────────────────────────────────────────────────

import type { Exercise, BodyArea } from '../data/exercises_v2';
import { EXERCISES_V2 } from '../data/exercises_v2';

export interface ActiveAreaProfile {
  area: BodyArea;
  primary: string;
  secondary?: string | null;
}

export type UserProfile = ActiveAreaProfile[];

export interface ModificationEntry {
  area: BodyArea;
  profile_code: string;
  modification_text: string;
}

export interface SuitedPose {
  exercise: Exercise;
  clinical_score: number;
  caution_flag: boolean;
  caution_areas: BodyArea[];
  has_modification_gap: boolean;
  modifications_available: Partial<Record<BodyArea, string>>;
  var_rank: number | null;
}

export interface E1Result {
  eligible_pool: SuitedPose[];
  excluded_count: number;
  total_in_library: number;
}

const SCORE_ESPECIALLY_BENEFICIAL = 2;
const SCORE_DEFAULT = 0;
const SCORE_CAUTION = -1;

/** When user selects "Whole body / general", movement-profile scores are halved */
const MOVEMENT_PROFILE_WEIGHT_GEN = 0.5;

function scoreArea(exercise: Exercise, ap: ActiveAreaProfile, weightMultiplier: number = 1.0): { score: number; is_caution: boolean; modification_text: string } {
  const area_data = exercise.profiles[ap.area];
  if (!area_data) return { score: SCORE_DEFAULT, is_caution: false, modification_text: '' };
  const { especially_beneficial, caution, avoid } = area_data;
  const primary_beneficial = especially_beneficial.includes(ap.primary);
  const primary_caution = caution.includes(ap.primary);
  const secondary_beneficial = ap.secondary ? especially_beneficial.includes(ap.secondary) : false;
  const secondary_caution = ap.secondary ? caution.includes(ap.secondary) : false;
  const secondary_avoid = ap.secondary ? avoid.includes(ap.secondary) : false;
  let score = SCORE_DEFAULT;
  let is_caution = false;
  if (primary_beneficial) { score = SCORE_ESPECIALLY_BENEFICIAL; }
  else if (primary_caution) { score = SCORE_CAUTION; is_caution = true; }
  else { if (secondary_beneficial) { score = 1; } else if (secondary_caution || secondary_avoid) { score = SCORE_CAUTION; is_caution = true; } }
  // Apply GEN weight: halve movement-profile-based scores for "whole body" profiles
  score = Math.round(score * weightMultiplier * 100) / 100;
  const modification_text = is_caution ? (area_data.modifications || '') : '';
  return { score, is_caution, modification_text };
}

function isHardExcluded(exercise: Exercise, user_profile: UserProfile): boolean {
  for (const ap of user_profile) {
    const area_data = exercise.profiles[ap.area];
    if (!area_data) continue;
    if (area_data.avoid.includes(ap.primary)) return true;
    // Secondary profile exclusion: union of both profiles' avoided poses
    if (ap.secondary && area_data.avoid.includes(ap.secondary)) return true;
  }
  return false;
}

export function runEngine1(user_profile: UserProfile, library: Exercise[] = EXERCISES_V2): E1Result {
  const total_in_library = library.length;
  let excluded_count = 0;
  const eligible_pool: SuitedPose[] = [];
  // Detect if any area is GEN → halve movement-profile score weight
  const hasGenArea = user_profile.some(ap => ap.area === 'GEN' as BodyArea);
  const genWeight = hasGenArea ? MOVEMENT_PROFILE_WEIGHT_GEN : 1.0;
  for (const exercise of library) {
    if (isHardExcluded(exercise, user_profile)) { excluded_count++; continue; }
    let total_score = 0;
    let caution_flag = false;
    const caution_areas: BodyArea[] = [];
    const modifications_available: Partial<Record<BodyArea, string>> = {};
    let has_modification_gap = false;
    for (const ap of user_profile) {
      const weight = ap.area === ('GEN' as BodyArea) ? genWeight : 1.0;
      const { score, is_caution, modification_text } = scoreArea(exercise, ap, weight);
      total_score += score;
      if (is_caution) { caution_flag = true; caution_areas.push(ap.area); if (modification_text) { modifications_available[ap.area] = modification_text; } else { has_modification_gap = true; } }
    }
    eligible_pool.push({ exercise, clinical_score: total_score, caution_flag, caution_areas, has_modification_gap, modifications_available, var_rank: exercise.var_rank });
  }
  eligible_pool.sort((a, b) => { if (b.clinical_score !== a.clinical_score) return b.clinical_score - a.clinical_score; return (a.var_rank ?? 99) - (b.var_rank ?? 99); });
  return { eligible_pool, excluded_count, total_in_library };
}

export function filterByVarRankCeiling(pool: SuitedPose[], ceiling: number): SuitedPose[] {
  return pool.filter(p => p.var_rank === null || p.var_rank <= ceiling);
}

export function splitByCaution(pool: SuitedPose[]): { safe: SuitedPose[]; caution: SuitedPose[] } {
  return { safe: pool.filter(p => !p.caution_flag), caution: pool.filter(p => p.caution_flag) };
}
