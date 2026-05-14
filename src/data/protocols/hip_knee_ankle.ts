// src/data/protocols/hip_knee_ankle.ts
// Diagnostic Protocol definitions for Hip, Knee, and Ankle
// Source: Aviv Shimoni clinical protocol documents (April 2026)

export interface MovementProfile { code: string; name: string; clinical_pattern: string; key_postures: number[]; }
export interface ProtocolPosture { number: number; name: string; clinical_note: string; double_score?: boolean; conditional?: string; questions: PostureQuestion[]; }
export interface PostureQuestion { id: string; text: string; data_collected: string; options: QuestionOption[]; }
export interface QuestionOption { text: string; scores: Record<string, number>; }
export interface CrossoverLogic { target_area: 'LB' | 'HI' | 'KN'; trigger_conditions: string[]; posture_sequence: string[]; algorithm: string; }
export interface DiagnosticProtocol { area: 'HI' | 'KN' | 'AN'; area_label: string; profiles: MovementProfile[]; parameter_summary: { posture_count: string; question_count: string; double_score_postures: string; }; crossover: CrossoverLogic | null; decision_tree_steps: string[]; postures: ProtocolPosture[]; }

export const HIP_PROTOCOL: DiagnosticProtocol = {
  area: 'HI', area_label: 'Hip',
  profiles: [
    { code: 'AN', name: 'Anterior Hip Overload', clinical_pattern: 'Pain front of hip / groin — FAI, labrum, hip flexor', key_postures: [3, 5, 6, 7] },
    { code: 'LA', name: 'Lateral Hip / Gluteal Overload', clinical_pattern: 'Pain outside of hip — gluteal tendinopathy, IT band', key_postures: [8, 9] },
    { code: 'PO', name: 'Posterior Hip / Yoga Butt', clinical_pattern: 'Pain buttock / back of thigh — proximal hamstring, piriformis', key_postures: [1, 2, 3, 4] },
    { code: 'NE', name: 'Neural / Sciatic Component', clinical_pattern: 'Pulling or radiation down the leg — referred from back or piriformis', key_postures: [2, 3] },
    { code: 'ST', name: 'Hip Needs Strength', clinical_pattern: 'Instability, weakness, shaking under load', key_postures: [4, 8, 9] },
    { code: 'MO', name: 'Hip Needs Mobility', clinical_pattern: 'Restricted range, tightness, no sharp pain', key_postures: [2, 3, 5, 6, 7] },
  ],
  parameter_summary: { posture_count: '9', question_count: '9–11 (1–2 per posture)', double_score_postures: 'None specified' },
  crossover: {
    target_area: 'LB',
    trigger_conditions: ['Lower back pain in 2+ postures (Bridge, Lunge, Warrior)', 'Neural signal present (pulling sensation or pain down the leg)', 'No specific hip joint pain in anterior, lateral, or posterior zone'],
    posture_sequence: ['Supine Knee Hug', 'Cat-Cow', "Child's Pose", 'Sphinx / Cobra', 'Seated Forward Fold'],
    algorithm: 'Lower Back Hybrid Algorithm → outputs FL / EX / NE / LI / ST',
  },
  decision_tree_steps: [
    'STEP 1 — Neural Screen: Check for pulling sensation down the leg, pain spreading toward the leg, numbness or tingling. If triggered → flag Neural as secondary. Continue tree.',
    'STEP 2 — Anterior Hip Provocation: Requires 2+ signals. Chair Pose pain (front hip/groin), Low Lunge pain (front of front hip), Pigeon pain (front hip/groin side down), Warrior I/II pain (front of hip). If 2+ → PRIMARY = AN.',
    'STEP 3 — Posterior Hip Check: Requires 2+ signals. Reclined Figure-4 pain (deep buttock), Forward Fold pain (sitting bone), Pigeon pain (back of hip/buttock side down). If 2+ → PRIMARY = PO.',
    'STEP 4 — Lateral Hip Check: Warrior II (outer hip), Side-Lying Hip Abduction (outer hip). If 2+ → PRIMARY = LA.',
    'STEP 5 — Strength vs Mobility: Warrior III / Single-leg test — instability/shaking = ST. Forward fold restrictions with no sharp pain = MO. Most restricted = primary.',
  ],
  postures: [
    { number: 1, name: 'Reclined Figure-4 (Supine)', clinical_note: 'Posterior hip baseline + crossover screen', questions: [{ id: 'hi_01_q1', text: 'With your ankle crossed over your opposite knee, where do you feel the stretch or discomfort?', data_collected: 'Posterior hip vs anterior vs neural signal', options: [{ text: 'Deep in the buttock', scores: { PO: 1 } }, { text: 'Front of the hip or groin', scores: { AN: 1 } }, { text: 'Down the leg', scores: { NE: 1 } }, { text: 'No pain — just a stretch', scores: { MO: 1 } }] }] },
    { number: 2, name: 'Supine Hip Rotation (internal/external)', clinical_note: 'Hip mobility baseline — range + end-feel', questions: [{ id: 'hi_02_q1', text: 'When rotating your hip, what did you notice?', data_collected: 'Mobility restriction + direction sensitivity', options: [{ text: 'Restricted in one direction — felt like tightness', scores: { MO: 1 } }, { text: 'Pain at end of range', scores: { AN: 1, PO: 1 } }, { text: 'Pulling sensation down the leg', scores: { NE: 1 } }, { text: 'No restriction — movement was free', scores: {} }] }] },
    { number: 3, name: 'Low Lunge (Anjaneyasana)', clinical_note: 'Anterior hip provocation — flexor + anterior capsule', questions: [{ id: 'hi_03_q1', text: 'How did your front hip feel in the lunge position?', data_collected: 'Anterior hip overload + neural signal', options: [{ text: 'Pinching or pain at the front of the hip / groin', scores: { AN: 2 } }, { text: 'Pulling sensation down the leg from the back hip', scores: { NE: 1 } }, { text: 'Deep ache in the back of the hip or buttock', scores: { PO: 1 } }, { text: 'No pain — just a stretch', scores: { MO: 1 } }] }] },
    { number: 4, name: 'Warrior I (Virabhadrasana I)', clinical_note: 'Hip flexor + posterior chain + strength demand', questions: [{ id: 'hi_04_q1', text: 'What did you feel in your hips in Warrior I?', data_collected: 'Anterior overload vs posterior vs strength deficit', options: [{ text: 'Pain or pinching front of the front hip / groin', scores: { AN: 1 } }, { text: 'Deep ache or discomfort in the buttock area', scores: { PO: 1 } }, { text: 'Instability or shaking — the leg felt weak', scores: { ST: 2 } }, { text: 'No pain — felt manageable', scores: {} }] }] },
    { number: 5, name: 'Pigeon Pose (Eka Pada Rajakapotasana)', clinical_note: 'Anterior vs posterior provocation — key differentiator', questions: [{ id: 'hi_05_q1', text: 'In Pigeon Pose, what did you feel in the front (bent) leg hip?', data_collected: 'AN vs PO differentiation', options: [{ text: 'Pinching or groin pain at the front of the hip', scores: { AN: 2 } }, { text: 'Deep ache in the buttock or back of the hip', scores: { PO: 2 } }, { text: 'Pulling sensation down the leg', scores: { NE: 1 } }, { text: 'Stretch sensation — no sharp pain', scores: { MO: 1 } }] }] },
    { number: 6, name: 'Warrior II (Virabhadrasana II)', clinical_note: 'Lateral hip + outer hip provocation', questions: [{ id: 'hi_06_q1', text: 'What did you feel in your hips in Warrior II?', data_collected: 'Lateral vs anterior vs strength', options: [{ text: 'Pain or pressure on the outer side of the hip', scores: { LA: 2 } }, { text: 'Pinching at the front of the hip / groin', scores: { AN: 1 } }, { text: 'Shaking or instability in the front leg', scores: { ST: 1 } }, { text: 'No pain — felt stable', scores: {} }] }] },
    { number: 7, name: 'Chair Pose (Utkatasana)', clinical_note: 'Deep flexion load — anterior overload screen', questions: [{ id: 'hi_07_q1', text: 'In the squat position, how did your hips feel?', data_collected: 'Anterior hip overload + depth tolerance', options: [{ text: 'Pinching or groin pain — got worse with deeper squat', scores: { AN: 2 } }, { text: 'Deep ache at the back of the hip', scores: { PO: 1 } }, { text: "Restricted — couldn't go deep", scores: { MO: 1 } }, { text: 'No pain — felt stable', scores: {} }] }] },
    { number: 8, name: 'Side-Lying Hip Abduction', clinical_note: 'Lateral hip strength + gluteal tendinopathy screen', questions: [{ id: 'hi_08_q1', text: 'When lifting the leg to the side, what did you feel?', data_collected: 'Lateral hip overload vs strength deficit', options: [{ text: 'Pain or ache on the outer hip during the lift', scores: { LA: 2 } }, { text: 'Weakness — difficult to lift and hold', scores: { ST: 2 } }, { text: 'No pain — felt light', scores: {} }] }] },
    { number: 9, name: 'Warrior III / Single-Leg Balance', clinical_note: 'Strength + stability screen — final differentiator', questions: [{ id: 'hi_09_q1', text: 'On one leg, what happened?', data_collected: 'ST vs MO — strength vs mobility primary', options: [{ text: 'Significant instability or shaking', scores: { ST: 2 } }, { text: 'Pain on the outer hip while balancing', scores: { LA: 1 } }, { text: "Restricted — hip didn't lift high / felt tight", scores: { MO: 1 } }, { text: 'Balanced well — no major difficulty', scores: {} }] }] },
  ],
};

export const KNEE_PROTOCOL: DiagnosticProtocol = {
  area: 'KN', area_label: 'Knee',
  profiles: [
    { code: 'PA', name: 'Patellofemoral Overload', clinical_pattern: 'Anterior knee pain — patellofemoral syndrome, quad tendinopathy', key_postures: [3, 4, 7] },
    { code: 'ME', name: 'Medial Knee Stress', clinical_pattern: 'Inner knee pain — MCL, medial meniscus, pes anserinus', key_postures: [4, 5, 8] },
    { code: 'LA', name: 'Lateral Knee Stress', clinical_pattern: "Outer knee pain — IT band, LCL, lateral meniscus", key_postures: [4, 5, 9, 10] },
    { code: 'PO', name: 'Posterior Knee / Hamstring', clinical_pattern: "Back-of-knee pain — Baker's cyst, hamstring insertion", key_postures: [1, 2, 6] },
    { code: 'ST', name: 'Knee Needs Strength', clinical_pattern: 'Instability, weakness, caving, giving way under load', key_postures: [3, 7, 8, 9, 10] },
    { code: 'MO', name: 'Knee Needs Mobility', clinical_pattern: 'Restricted range, stiffness, no sharp pain', key_postures: [1, 2, 5, 6] },
  ],
  parameter_summary: { posture_count: '10 postures + 1 session summary', question_count: '11–13', double_score_postures: 'Chair Pose (★ x2), High Lunge (★ x2)' },
  crossover: { target_area: 'HI', trigger_conditions: ['Hip pain in 2+ postures (Chair Pose, Warrior, Low Lunge)', 'No specific knee joint pain (no anterior, inner, or outer knee pain)', 'Instability or giving-way signal in all postures without joint-specific location'], posture_sequence: ['Reclined Figure-4', 'Low Lunge', 'Warrior I', 'Warrior II', 'Single-Leg Balance'], algorithm: 'Hip Decision Tree → outputs AN / LA / PO / ST / MO' },
  decision_tree_steps: [
    'STEP 1 — Posterior Knee Screen: Back-of-knee pain in extension (posture 2) or deep flexion (posture 1). If present → flag PO.',
    'STEP 2 — Patellofemoral Screen: Pain under or around kneecap in postures 3, 4, 7. If 2+ → PRIMARY = PA.',
    'STEP 3 — Medial vs Lateral: Inner knee pain (MCL, pes anserinus) → ME. Outer knee pain (IT band, LCL) → LA. Check postures 4, 5, 8–10.',
    'STEP 4 — Strength vs Mobility: Instability / valgus collapse → ST. Restricted range / stiffness → MO.',
  ],
  postures: [
    { number: 1, name: 'Supine Knee Hug (single leg)', clinical_note: 'Flexion baseline + posterior knee screen', questions: [{ id: 'kn_01_q1', text: 'How does your knee feel when drawn toward your chest?', data_collected: 'Posterior knee baseline + flexion tolerance', options: [{ text: 'Pain behind the knee in deep flexion', scores: { PO: 2 } }, { text: 'Restricted — could not flex fully', scores: { MO: 1 } }, { text: 'Pain around the kneecap', scores: { PA: 1 } }, { text: 'No pain — comfortable', scores: {} }] }] },
    { number: 2, name: 'Standing Knee Extension', clinical_note: 'Terminal extension + posterior chain screen', questions: [{ id: 'kn_02_q1', text: 'Standing with soft knees, slowly straighten one leg fully. How does the knee feel at full extension?', data_collected: 'Terminal extension tolerance — posterior knee, hamstring insertion', options: [{ text: 'Pulling or ache behind the knee at full extension', scores: { PO: 2 } }, { text: 'Cannot fully straighten — feels restricted', scores: { MO: 1 } }, { text: 'No issue — full extension comfortable', scores: {} }] }] },
    { number: 3, name: 'Chair Pose (Utkatasana)', clinical_note: 'Double-score (★x2). Round 1: feet together. Round 2: hip-width.', double_score: true, questions: [{ id: 'kn_03_q1', text: 'How did your knees feel in the squat, and did they cave inward in round 2?', data_collected: 'Patellofemoral load + valgus collapse + strength', options: [{ text: 'Pain under or around the kneecap', scores: { PA: 2 } }, { text: 'Knees caved inward — felt unstable', scores: { ST: 2 } }, { text: 'Inner knee pain', scores: { ME: 1 } }, { text: 'No pain — felt stable', scores: {} }] }] },
    { number: 4, name: 'Low Lunge (Anjaneyasana)', clinical_note: 'Deep flexion tolerance + medial/lateral screen — 2 questions', questions: [{ id: 'kn_04_q1', text: 'How did your front knee feel in the deep bend?', data_collected: 'Deep flexion tolerance + PA vs ME vs LA signal', options: [{ text: 'Pain under or around the kneecap', scores: { PA: 1 } }, { text: 'Inner knee pain', scores: { ME: 1 } }, { text: 'Outer knee pain', scores: { LA: 1 } }, { text: 'No pain', scores: {} }] }, { id: 'kn_04_q2', text: 'How did your back knee feel on the mat?', data_collected: 'Pressure sensitivity — kneeling tolerance', options: [{ text: 'Pain or pressure directly on the kneecap', scores: { PA: 1 } }, { text: 'Inner knee pain', scores: { ME: 1 } }, { text: 'Manageable with a blanket / pad', scores: {} }, { text: 'No pain', scores: {} }] }] },
    { number: 5, name: 'Reclined Figure-4 (Supta Kapotasana)', clinical_note: 'IT band + medial stress — lateral vs medial differentiator', questions: [{ id: 'kn_05_q1', text: 'In figure-4 position, what did you feel in the crossed-leg knee?', data_collected: 'Lateral vs medial knee distinction', options: [{ text: 'Outer knee pulling or ache', scores: { LA: 2 } }, { text: 'Inner knee pain', scores: { ME: 1 } }, { text: 'No knee pain — felt the hip', scores: {} }] }] },
    { number: 6, name: 'Seated Forward Fold (Paschimottanasana)', clinical_note: 'Posterior knee stretch + hamstring screen', questions: [{ id: 'kn_06_q1', text: 'Reaching forward with legs extended, where did you feel discomfort?', data_collected: 'Posterior knee vs hamstring vs range restriction', options: [{ text: 'Behind the knee or lower thigh', scores: { PO: 2 } }, { text: 'Hamstring tightness pulling from upper thigh', scores: { MO: 1 } }, { text: 'Could not reach — very restricted range', scores: { MO: 2 } }, { text: 'No pain — comfortable stretch', scores: {} }] }] },
    { number: 7, name: 'High Lunge (Crescent Pose)', clinical_note: 'Double-score (★x2). Load + kneecap tracking under dynamic demand.', double_score: true, questions: [{ id: 'kn_07_q1', text: 'In the high lunge, how did the front knee feel?', data_collected: 'PA under dynamic load + strength demand', options: [{ text: 'Pain under or around the kneecap', scores: { PA: 2 } }, { text: 'Shaking or giving way', scores: { ST: 2 } }, { text: 'Outer knee pain', scores: { LA: 1 } }, { text: 'No pain', scores: {} }] }] },
    { number: 8, name: 'Warrior II (Virabhadrasana II)', clinical_note: 'Valgus load + inner knee + stability demand', questions: [{ id: 'kn_08_q1', text: 'In Warrior II, how did the front knee feel?', data_collected: 'ME vs ST under sustained lateral load', options: [{ text: 'Inner knee pain', scores: { ME: 2 } }, { text: 'Knee caved inward — felt unstable', scores: { ST: 2 } }, { text: 'Outer knee pain', scores: { LA: 1 } }, { text: 'No pain', scores: {} }] }] },
    { number: 9, name: 'Triangle Pose (Trikonasana)', clinical_note: 'Lateral chain + IT band load in extended position', questions: [{ id: 'kn_09_q1', text: 'In Triangle Pose, what did you feel in the front knee?', data_collected: 'LA vs ST in extended lateral position', options: [{ text: 'Outer knee pulling or pain', scores: { LA: 2 } }, { text: 'Knee felt unstable or hyperextended', scores: { ST: 1 } }, { text: 'No knee pain', scores: {} }] }] },
    { number: 10, name: 'Single-Leg Balance / Warrior III', clinical_note: 'Final strength + stability differentiator', questions: [{ id: 'kn_10_q1', text: 'Balancing on one leg, what happened at the knee?', data_collected: 'ST vs LA — strength vs lateral overload', options: [{ text: 'Significant shaking or giving way', scores: { ST: 2 } }, { text: 'Outer knee pain during balance', scores: { LA: 1 } }, { text: 'Knee buckled inward', scores: { ST: 2, ME: 1 } }, { text: 'Balanced well', scores: {} }] }] },
  ],
};

export const ANKLE_PROTOCOL: DiagnosticProtocol = {
  area: 'AN', area_label: 'Ankle',
  profiles: [
    { code: 'AN', name: 'Anterior Ankle Impingement', clinical_pattern: 'Front-of-ankle pinching in dorsiflexion — bone spur, capsule', key_postures: [2, 3] },
    { code: 'AC', name: 'Achilles / Posterior Overload', clinical_pattern: 'Back-of-ankle pain — Achilles tendinopathy, calf tightness', key_postures: [1, 4] },
    { code: 'PF', name: 'Plantar Fascia Involvement', clinical_pattern: 'Sole-of-foot / heel pain — plantar fasciitis', key_postures: [1, 3, 4] },
    { code: 'LA', name: 'Lateral Ankle Instability', clinical_pattern: 'Outer ankle giving way — chronic sprains, peroneal weakness', key_postures: [5, 6] },
    { code: 'ST', name: 'Ankle Needs Strength', clinical_pattern: 'Instability, weakness, poor balance on single leg', key_postures: [4, 5, 6] },
    { code: 'MO', name: 'Ankle Needs Mobility', clinical_pattern: 'Restricted dorsiflexion/plantarflexion, stiffness, no sharp pain', key_postures: [1, 2, 3] },
  ],
  parameter_summary: { posture_count: '6 postures + 1 optional stability challenge', question_count: '7–9', double_score_postures: 'Chair Pose (★ x2)' },
  crossover: { target_area: 'KN', trigger_conditions: ['Knee pain in 2+ postures (Chair Pose, Warrior II, Low Lunge)', 'No specific ankle joint pain (no front-of-ankle, outer ankle, or Achilles pain)', 'Instability present but ankle joint itself is asymptomatic'], posture_sequence: ['Supine Knee Hug', 'Chair Pose', 'Low Lunge', 'Warrior II', 'Triangle Pose'], algorithm: 'Knee Decision Tree → outputs PA / ME / LA / PO / ST / MO' },
  decision_tree_steps: [
    'STEP 1 — Anterior Impingement: Front-of-ankle pinching in dorsiflexion (postures 2, 3). If present → PRIMARY = AN.',
    'STEP 2 — Achilles / Posterior: Back-of-ankle pain or calf tightness (postures 1, 4). If present → PRIMARY = AC.',
    'STEP 3 — Plantar Fascia: Heel or sole pain, especially on standing after rest (postures 1, 3, 4). If present → consider PF as primary or secondary.',
    'STEP 4 — Lateral Instability: Outer ankle giving way or wobble (postures 5, 6). If present → PRIMARY = LA.',
    'STEP 5 — Strength vs Mobility: Cannot rise onto toes / balance fails → ST. Cannot dorsiflex → MO.',
  ],
  postures: [
    { number: 1, name: 'Downward Dog (Adho Mukha Svanasana)', clinical_note: 'Dorsiflexion baseline + Achilles/calf screen + plantar fascia stretch', questions: [{ id: 'an_01_q1', text: 'When pressing your heels toward the floor, what did you feel?', data_collected: 'Achilles/calf length + plantar fascia + dorsiflexion baseline', options: [{ text: 'Pulling or pain in the back of the ankle / calf', scores: { AC: 2 } }, { text: 'Heel or sole-of-foot pain when the heel presses down', scores: { PF: 2 } }, { text: 'Could not reach the heels to the ground — very tight', scores: { MO: 2 } }, { text: 'No pain — heels reached or close to the floor', scores: {} }] }] },
    { number: 2, name: 'Chair Pose (Utkatasana)', clinical_note: 'Double-score (★x2). Loaded dorsiflexion + anterior impingement.', double_score: true, questions: [{ id: 'an_02_q1', text: 'How did the front of your ankles feel in the squat?', data_collected: 'Anterior impingement under load + mobility restriction', options: [{ text: 'Pinching or squeezing at the front of the ankle', scores: { AN: 2 } }, { text: 'Could not squat — ankles too restricted', scores: { MO: 2 } }, { text: 'Back-of-ankle pain or tightness in the calf', scores: { AC: 1 } }, { text: 'No ankle issue', scores: {} }] }] },
    { number: 3, name: 'Low Lunge (Anjaneyasana)', clinical_note: 'Maximal dorsiflexion + anterior ankle capsule + plantar fascia', questions: [{ id: 'an_03_q1', text: 'When your front knee moved past your toes, what did you feel in that ankle?', data_collected: 'Deep dorsiflexion tolerance + anterior impingement + PF', options: [{ text: 'Pinching at the front of the ankle', scores: { AN: 2 } }, { text: 'Pulling at the back of the ankle / calf', scores: { AC: 1 } }, { text: 'Heel or arch pain', scores: { PF: 1 } }, { text: 'No ankle issue', scores: {} }] }] },
    { number: 4, name: 'Single-Leg Heel Raise', clinical_note: 'Most informative test. Option to do both legs if single too difficult.', questions: [{ id: 'an_04_q1', text: 'Standing on one leg, rise onto your toes. What happened?', data_collected: 'Achilles load + calf strength + PF response', options: [{ text: 'Pain or ache in the back of the ankle / calf', scores: { AC: 2 } }, { text: 'Heel or arch pain at top of raise', scores: { PF: 2 } }, { text: 'Could not rise fully — weakness', scores: { ST: 2 } }, { text: 'Rose with no pain', scores: {} }] }, { id: 'an_04_q2', text: 'How many repetitions could you do before the ankle or calf gave up?', data_collected: 'Achilles/calf endurance + strength asymmetry', options: [{ text: 'Fewer than 5', scores: { AC: 1, ST: 1 } }, { text: '5–10', scores: {} }, { text: 'More than 10 — no issue', scores: {} }] }] },
    { number: 5, name: 'Single-Leg Balance (Eyes Closed)', clinical_note: 'Lateral stability + proprioception challenge', questions: [{ id: 'an_05_q1', text: 'Balancing on one leg with eyes closed, what happened?', data_collected: 'Lateral instability + proprioception deficit', options: [{ text: 'Ankle wobbled significantly outward', scores: { LA: 2 } }, { text: 'General instability — difficult to stay balanced', scores: { ST: 2 } }, { text: 'Slight sway but manageable', scores: {} }, { text: 'Balanced well', scores: {} }] }] },
    { number: 6, name: 'Tree Pose (Vrksasana) or Lateral Step', clinical_note: 'Outer ankle stress + lateral stability under sustained load', questions: [{ id: 'an_06_q1', text: 'In the balance, what did you notice on the outer ankle or foot?', data_collected: 'LA vs ST in sustained balance', options: [{ text: 'Outer ankle pain or instability', scores: { LA: 2 } }, { text: 'Ankle gave way — had to step down', scores: { LA: 1, ST: 1 } }, { text: 'General weakness — no specific location', scores: { ST: 1 } }, { text: 'No issues', scores: {} }] }] },
  ],
};

export const PROTOCOL_REGISTRY = { HI: HIP_PROTOCOL, KN: KNEE_PROTOCOL, AN: ANKLE_PROTOCOL } as const;
export type ProtocolArea = keyof typeof PROTOCOL_REGISTRY;

/** Full registry mapping all 8 body-area codes to their diagnostic protocol (or null if not yet available). */
export const FULL_PROTOCOL_REGISTRY: Record<string, DiagnosticProtocol | null> = {
  LB: HIP_PROTOCOL,   // Lower Back — shares hip_knee_ankle protocol set
  HI: HIP_PROTOCOL,
  KN: KNEE_PROTOCOL,
  AN: ANKLE_PROTOCOL,
  UB: null,   // Upper Back — not yet available
  NK: null,   // Neck — not yet available
  SH: null,   // Shoulder — not yet available
  WR: null,   // Wrist & Hand — not yet available
};
export type FullProtocolArea = keyof typeof FULL_PROTOCOL_REGISTRY;
