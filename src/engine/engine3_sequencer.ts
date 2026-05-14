// src/engine/engine3_sequencer.ts — Engine 3: Session Sequencer
// Orders E2 poses into 5-phase clinical arc: Arrival → Preparation → Main Build → Peak → Closure

import type { Exercise, MovementCategory } from '../data/exercises_v2';
import type { SelectedPose, SessionDuration } from './engine2_session_builder';

export type SessionPhase = 'arrival' | 'preparation' | 'main_build' | 'peak' | 'closure';

export const PHASE_LABELS: Record<SessionPhase, string> = {
  arrival: 'Arrival', preparation: 'Preparation', main_build: 'Main Build', peak: 'Peak', closure: 'Closure',
};

export const PHASE_DESCRIPTIONS: Record<SessionPhase, string> = {
  arrival:     'Settle the nervous system · Introduce breath and gentle movement',
  preparation: 'Prepare tissues and joints · Establish movement patterns',
  main_build:  'Central therapeutic work — mobility, strength, stability',
  peak:        'Most demanding element of the session',
  closure:     'Reduce load · Integrate · Close with breath and rest',
};

const PHASE_MAX_COMPLEXITY: Record<SessionPhase, number> = {
  arrival: 1, preparation: 2, main_build: 3, peak: 4, closure: 1,
};

function varRankToPreferredPhase(var_rank: number | null): SessionPhase {
  if (var_rank === null) return 'main_build';
  if (var_rank <= 1)  return 'arrival';
  if (var_rank === 2) return 'preparation';
  if (var_rank <= 4) return 'main_build';
  return 'peak';
}

const FORCED_PHASE: Partial<Record<MovementCategory, SessionPhase[]>> = {
  'Breath':      ['arrival', 'closure'],
  'Restorative': ['closure'],
};

function maxPeakPoses(duration_minutes: SessionDuration, irritability: number = 0, hasSecondaryProfile: boolean = false): number {
  if (irritability >= 3) return 1;
  if (hasSecondaryProfile) return 1; // stricter phase limits with secondary profile
  return duration_minutes <= 20 ? 1 : 2;
}

export interface SequencedPose extends SelectedPose {
  phase: SessionPhase;
  phase_label: string;
  position: number;
}

export interface E3Result {
  sequence: SequencedPose[];
  phases: Record<SessionPhase, SequencedPose[]>;
  duration_minutes: SessionDuration;
  peak_count: number;
}

function assignPhase(
  pose: SelectedPose,
  phase_counts: Record<SessionPhase, number>,
  phase_limits: Record<SessionPhase, number>,
  peak_used: number,
  max_peaks: number
): SessionPhase {
  const ex = pose.exercise;

  const forced = FORCED_PHASE[ex.movement_category];
  if (forced && forced.length > 0) {
    for (const fp of forced) {
      if (phase_counts[fp] < phase_limits[fp]) return fp;
    }
  }

  const preferred = varRankToPreferredPhase(ex.var_rank);

  const isCompatible = (phase: SessionPhase): boolean => {
    if (phase_counts[phase] >= phase_limits[phase]) return false;
    if (ex.complexity > PHASE_MAX_COMPLEXITY[phase]) return false;
    if (phase === 'peak' && pose.caution_flag) return false;
    if (phase === 'peak' && peak_used >= max_peaks) return false;
    if (phase === 'peak' && ex.var_rank !== null && ex.var_rank <= 2) return false;
    return true;
  };

  const order = [...new Set([preferred, 'preparation', 'main_build', 'arrival', 'peak', 'closure'] as SessionPhase[])];
  for (const phase of order) {
    if (isCompatible(phase)) return phase;
  }
  return 'closure';
}

function calculatePhaseLimits(session_size: number, max_peaks: number): Record<SessionPhase, number> {
  const arrival     = Math.max(1, Math.round(session_size * 0.12));
  const peak        = Math.min(max_peaks, Math.max(1, Math.round(session_size * 0.12)));
  const closure     = Math.max(1, Math.round(session_size * 0.15));
  const preparation = Math.max(1, Math.round(session_size * 0.28));
  const main_build  = Math.max(1, session_size - arrival - peak - closure - preparation);
  return { arrival, preparation, main_build, peak, closure };
}

export function sequenceSession(selected_poses: SelectedPose[], duration_minutes: SessionDuration, irritability: number = 0, hasSecondaryProfile: boolean = false): E3Result {
  const session_size = selected_poses.length;
  const max_peaks    = maxPeakPoses(duration_minutes, irritability, hasSecondaryProfile);
  const phase_limits = calculatePhaseLimits(session_size, max_peaks);
  const phase_counts: Record<SessionPhase, number> = { arrival: 0, preparation: 0, main_build: 0, peak: 0, closure: 0 };

  const sorted = [...selected_poses].sort((a, b) => {
    const va = a.exercise.var_rank ?? 4;
    const vb = b.exercise.var_rank ?? 4;
    return va !== vb ? va - vb : a.exercise.complexity - b.exercise.complexity;
  });

  type Assigned = { pose: SelectedPose; phase: SessionPhase };
  const assigned: Assigned[] = [];
  let peak_used = 0;

  for (const pose of sorted) {
    const phase = assignPhase(pose, phase_counts, phase_limits, peak_used, max_peaks);
    assigned.push({ pose, phase });
    phase_counts[phase]++;
    if (phase === 'peak') peak_used++;
  }

  const phase_order: SessionPhase[] = ['arrival', 'preparation', 'main_build', 'peak', 'closure'];
  const by_phase: Record<SessionPhase, Assigned[]> = { arrival: [], preparation: [], main_build: [], peak: [], closure: [] };
  for (const a of assigned) by_phase[a.phase].push(a);
  for (const ph of phase_order) by_phase[ph].sort((a, b) => a.pose.exercise.complexity - b.pose.exercise.complexity);

  const sequence: SequencedPose[] = [];
  let position = 1;
  for (const ph of phase_order) {
    for (const { pose } of by_phase[ph]) {
      sequence.push({ ...pose, phase: ph, phase_label: PHASE_LABELS[ph], position: position++ });
    }
  }

  const phases: Record<SessionPhase, SequencedPose[]> = { arrival: [], preparation: [], main_build: [], peak: [], closure: [] };
  for (const sp of sequence) phases[sp.phase].push(sp);

  return { sequence, phases, duration_minutes, peak_count: peak_used };
}

import type { SessionRequest } from './engine2_session_builder';
import { buildSession } from './engine2_session_builder';

export interface FullSessionResult {
  e2: import('./engine2_session_builder').E2Result;
  e3: E3Result;
}

export function generateSession(request: SessionRequest): FullSessionResult {
  const e2 = buildSession(request);
  const hasSecondary = request.user_profile.some(ap => ap.secondary != null);
  const e3 = sequenceSession(e2.selected_poses, request.duration_minutes, request.irritability, hasSecondary);
  return { e2, e3 };
}
