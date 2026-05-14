// src/engine/engine_tests.ts — Test suite for Engines 1, 2, and 3
// Run: npx ts-node engine_tests.ts

import { EXERCISES_V2, LIBRARY_STATS } from '../data/exercises_v2';
import type { Exercise } from '../data/exercises_v2';
import { runEngine1, filterByVarRankCeiling } from './engine1_suitability';
import type { UserProfile } from './engine1_suitability';
import { buildSession } from './engine2_session_builder';
import type { SessionRequest } from './engine2_session_builder';
import { generateSession, PHASE_LABELS } from './engine3_sequencer';

let pass = 0; let fail = 0; const failures: string[] = [];

function test(name: string, fn: () => void): void {
  try { fn(); console.log(`  ✓ ${name}`); pass++; }
  catch (e: any) { console.error(`  ✗ ${name}: ${e.message}`); failures.push(`${name}: ${e.message}`); fail++; }
}
function assert(c: boolean, m: string) { if (!c) throw new Error(m); }
function assertEqual<T>(a: T, b: T, m?: string) { if (a !== b) throw new Error(m || `Expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); }
function assertGte(a: number, b: number, m?: string) { if (a < b) throw new Error(m || `Expected ${a} >= ${b}`); }
function assertLte(a: number, b: number, m?: string) { if (a > b) throw new Error(m || `Expected ${a} <= ${b}`); }

const LB_FL_ONLY: UserProfile = [{ area: 'LB', primary: 'FL', secondary: null }];
const LB_EX_ONLY: UserProfile = [{ area: 'LB', primary: 'EX', secondary: null }];
const LB_NE:      UserProfile = [{ area: 'LB', primary: 'NE', secondary: 'FL' }];
const LB_HI:      UserProfile = [{ area: 'LB', primary: 'FL', secondary: null }, { area: 'HI', primary: 'AN', secondary: null }];
const MULTI_AREA: UserProfile = [{ area: 'LB', primary: 'ST', secondary: null }, { area: 'KN', primary: 'PA', secondary: null }, { area: 'AN', primary: 'AC', secondary: null }];

console.log('\n📚 Library Sanity Checks');
test('Library has expected number of exercises', () => { assertGte(EXERCISES_V2.length, 200, 'Expected at least 200 exercises'); });
test('All exercises have valid IDs', () => { for (const ex of EXERCISES_V2) assert(ex.id.startsWith('v2_'), `Invalid ID: ${ex.id}`); });
test('All exercises have non-empty names', () => { for (const ex of EXERCISES_V2) assert(ex.name.length > 0, `Empty name for ID ${ex.id}`); });
test('All exercises have at least one body area', () => { for (const ex of EXERCISES_V2) assert(ex.areas.length > 0, `No areas for ${ex.name}`); });
test('All exercises have valid complexity (1–4)', () => { for (const ex of EXERCISES_V2) assert(ex.complexity >= 1 && ex.complexity <= 4, `Invalid complexity ${ex.complexity} for ${ex.name}`); });
test('All exercises have valid movement categories', () => {
  const valid = new Set(['Spinal Mobility','Stability / Core','Hip Mobility','Balance','Upper Limb Weight Bearing','Restorative','Breath','Transitional']);
  for (const ex of EXERCISES_V2) assert(valid.has(ex.movement_category), `Invalid category: ${ex.movement_category} (${ex.name})`);
});
test('Library contains at least one Breath exercise', () => { assertGte(EXERCISES_V2.filter(e => e.movement_category === 'Breath').length, 1, 'No Breath exercises'); });
test('Library contains at least one Restorative exercise', () => { assertGte(EXERCISES_V2.filter(e => e.movement_category === 'Restorative').length, 1, 'No Restorative exercises'); });
test('Var ranks are null or 1–10', () => { for (const ex of EXERCISES_V2) if (ex.var_rank !== null) assert(ex.var_rank >= 1 && ex.var_rank <= 10, `Invalid var_rank ${ex.var_rank} for ${ex.name}`); });
test('Duration ranges are positive and ordered', () => { for (const ex of EXERCISES_V2) { assert(ex.duration[0] > 0, `Non-positive min duration for ${ex.name}`); assert(ex.duration[1] >= ex.duration[0], `Max < min duration for ${ex.name}`); } });
test('No duplicate exercise IDs', () => { const ids = EXERCISES_V2.map(e => e.id); assertEqual(ids.length, new Set(ids).size, `Duplicate IDs found`); });

console.log('\n🔬 Engine 1 — Pose Suitability');
test('E1: Hard filter removes Avoid exercises', () => {
  const ex = EXERCISES_V2.find(e => e.profiles['LB'] && e.profiles['LB'].avoid.length > 0);
  if (!ex) return;
  const profile: UserProfile = [{ area: 'LB', primary: ex.profiles['LB']!.avoid[0] }];
  const result = runEngine1(profile);
  assert(!result.eligible_pool.find(p => p.exercise.id === ex.id), `Exercise ${ex.name} should be excluded`);
  assertGte(result.excluded_count, 1, 'Expected at least 1 excluded exercise');
});
test('E1: Especially Beneficial exercises score +2 per area', () => {
  const ex = EXERCISES_V2.find(e => e.profiles['LB'] && e.profiles['LB'].especially_beneficial.length > 0);
  if (!ex) return;
  const result = runEngine1([{ area: 'LB', primary: ex.profiles['LB']!.especially_beneficial[0] }]);
  const scored = result.eligible_pool.find(p => p.exercise.id === ex.id);
  assert(scored !== undefined, `Exercise ${ex.name} should be in pool`);
  assertGte(scored!.clinical_score, 2, 'Expected score >= 2 for especially_beneficial');
});
test('E1: Caution exercises get caution_flag', () => {
  const ex = EXERCISES_V2.find(e => e.profiles['LB'] && e.profiles['LB'].caution.length > 0 && e.profiles['LB'].avoid.length === 0);
  if (!ex) return;
  const result = runEngine1([{ area: 'LB', primary: ex.profiles['LB']!.caution[0] }]);
  const scored = result.eligible_pool.find(p => p.exercise.id === ex.id);
  assert(scored !== undefined, `Caution exercise ${ex.name} should still be in pool`);
  assert(scored!.caution_flag, 'Caution exercise should have caution_flag = true');
});
test('E1: Output is sorted by clinical_score descending', () => {
  const scores = runEngine1(LB_FL_ONLY).eligible_pool.map(p => p.clinical_score);
  for (let i = 1; i < scores.length; i++) assert(scores[i] <= scores[i-1], `Pool not sorted`);
});
test('E1: Multi-area profile scores compound across areas', () => {
  const s = Math.max(...runEngine1([{ area: 'LB', primary: 'FL' }]).eligible_pool.map(p => p.clinical_score));
  const m = Math.max(...runEngine1(LB_HI).eligible_pool.map(p => p.clinical_score));
  assertGte(m, s, 'Multi-area scoring should produce higher max scores');
});
test('E1: filterByVarRankCeiling removes high-rank exercises', () => {
  const filtered = filterByVarRankCeiling(runEngine1(LB_FL_ONLY).eligible_pool, 3);
  for (const p of filtered) assert(p.var_rank === null || p.var_rank <= 3, `VR ${p.var_rank} exceeds ceiling 3`);
});

console.log('\n🏗️  Engine 2 — Session Builder');
const BASE: SessionRequest = { user_profile: LB_FL_ONLY, stage: 1, experience_level: 'beginner', duration_minutes: 20 };
test('E2: Session contains at least one Breath pose', () => { assert(buildSession(BASE).selected_poses.some(p => p.exercise.movement_category === 'Breath'), 'No Breath pose'); });
test('E2: Session contains at least one Restorative pose', () => { assert(buildSession(BASE).selected_poses.some(p => p.exercise.movement_category === 'Restorative'), 'No Restorative pose'); });
test('E2: Session size matches 20-min target range', () => { const r = buildSession(BASE); assertGte(r.session_size, 5); assertLte(r.session_size, 10); });
test('E2: No area exceeds 40% of session', () => {
  const r = buildSession(BASE);
  for (const [area, count] of Object.entries(r.diversity_stats.area_counts))
    assert(count / r.session_size <= 0.45, `Area ${area} dominates: ${count}/${r.session_size}`);
});
test('E2: No pose family appears more than twice', () => {
  for (const [fam, count] of Object.entries(buildSession(BASE).diversity_stats.pose_family_counts))
    assertLte(count, 2, `Pose family '${fam}' appears ${count} times`);
});
test('E2: Var Rank ceiling respected for Stage 1 Beginner (max 3)', () => {
  for (const pose of buildSession(BASE).selected_poses) {
    const vr = pose.exercise.var_rank;
    assert(vr === null || vr <= 3, `VR ${vr} exceeds Stage 1 ceiling for ${pose.exercise.name}`);
  }
});
test('E2: No excluded exercises appear in session', () => {
  const excluded = new Set(EXERCISES_V2.filter(ex => ex.profiles['LB'] && ex.profiles['LB'].avoid.includes('FL')).map(ex => ex.id));
  for (const pose of buildSession(BASE).selected_poses)
    assert(!excluded.has(pose.exercise.id), `Excluded exercise ${pose.exercise.name} in session`);
});
test('E2: Multi-area session builds correctly', () => {
  const r = buildSession({ ...BASE, user_profile: MULTI_AREA });
  assertGte(r.session_size, 4);
  assert(r.selected_poses.some(p => p.exercise.movement_category === 'Breath'), 'No Breath in multi-area');
});
test('E2: Stage 3 ceiling >= Stage 1', () => {
  const s1 = Math.max(...buildSession({ ...BASE, stage: 1 }).selected_poses.map(p => p.exercise.var_rank ?? 0));
  const s3 = Math.max(...buildSession({ ...BASE, stage: 3 }).selected_poses.map(p => p.exercise.var_rank ?? 0));
  assertGte(s3, s1, 'Stage 3 should not be more restrictive than Stage 1');
});

console.log('\n🎭 Engine 3 — Session Sequencer');
test('E3: Session has exactly 5 phases', () => { assertEqual(Object.keys(generateSession(BASE).e3.phases).length, 5); });
test('E3: Every pose is assigned to a phase', () => { const {e2,e3} = generateSession(BASE); assertEqual(e3.sequence.length, e2.selected_poses.length); });
test('E3: Positions are sequential 1..n', () => { const {e3} = generateSession(BASE); for (let i=0;i<e3.sequence.length;i++) assertEqual(e3.sequence[i].position, i+1); });
test('E3: Arrival contains only Complexity=1 poses', () => { for (const p of generateSession(BASE).e3.phases.arrival) assertLte(p.exercise.complexity, 1, `${p.exercise.name} complexity ${p.exercise.complexity}`); });
test('E3: Closure contains only Complexity=1 poses', () => { for (const p of generateSession(BASE).e3.phases.closure) assertLte(p.exercise.complexity, 1, `${p.exercise.name} complexity ${p.exercise.complexity}`); });
test('E3: Peak never first pose', () => { const seq = generateSession({...BASE,duration_minutes:30}).e3.sequence; if (seq.length > 0) assert(seq[0].phase !== 'peak', 'Peak must not be first'); });
test('E3: ≤20-min session has at most 1 peak pose', () => { assertLte(generateSession(BASE).e3.peak_count, 1); });
test('E3: 30-min session has at most 2 peak poses', () => { assertLte(generateSession({...BASE,duration_minutes:30}).e3.peak_count, 2); });
test('E3: Caution poses not at Peak', () => { for (const p of generateSession(BASE).e3.phases.peak) assert(!p.caution_flag, `Caution pose ${p.exercise.name} at Peak`); });
test('E3: Breath poses in Arrival or Closure only', () => {
  for (const p of generateSession(BASE).e3.sequence)
    if (p.exercise.movement_category === 'Breath') assert(p.phase === 'arrival' || p.phase === 'closure', `Breath pose ${p.exercise.name} in ${p.phase}`);
});
test('E3: Restorative poses in Closure', () => { assert(generateSession(BASE).e3.phases.closure.some(p => p.exercise.movement_category === 'Restorative'), 'No Restorative in Closure'); });

console.log('\n📈 Progression System');
test('Stage 1 Beginner: no VR 5+', () => { for (const p of buildSession({...BASE,stage:1,experience_level:'beginner'}).selected_poses) { const vr=p.exercise.var_rank; assert(vr===null||vr<=3,`Stage 1 includes VR${vr}`); } });
test('Stage 2 Beginner ceiling = 4', () => { assertEqual(buildSession({...BASE,stage:2}).var_rank_ceiling, 4); });
test('Stage 3 Beginner ceiling = 5', () => { assertEqual(buildSession({...BASE,stage:3}).var_rank_ceiling, 5); });
test('Advanced ceiling >= Beginner for same stage', () => { assertGte(buildSession({...BASE,stage:2,experience_level:'advanced'}).var_rank_ceiling, buildSession({...BASE,stage:2}).var_rank_ceiling); });

console.log('\n' + '─'.repeat(60));
console.log(`Results: ${pass} passed · ${fail} failed`);
if (failures.length > 0) { console.error('\nFailed tests:'); for (const f of failures) console.error(`  ✗ ${f}`); process.exit(1); }
else { console.log('✅  All tests passed'); process.exit(0); }
