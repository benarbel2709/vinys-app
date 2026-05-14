import { useState, useEffect, useCallback, useRef } from "react";
import { useTTS } from "@/hooks/useTTS";
import BrandLogo from "@/components/BrandLogo";
import { Volume2, VolumeX, Play, ChevronRight, Check, RotateCcw, ArrowLeft } from "lucide-react";
const universalVideo = "";

const fadeInStyle = { animation: "fadeIn 0.3s ease" };

// --- AREAS --------------------------------------------------------------------
const AREA_CONFIG = {
  LB:    { label: "Lower Back",   icon: "◎", color: "#4A7B6F", crossoverTo: null   },
  HIP:   { label: "Hip",          icon: "⟳", color: "#7B4A6F", crossoverTo: "LB"   },
  KNEE:  { label: "Knee",         icon: "↓", color: "#6F7B4A", crossoverTo: "HIP"  },
  ANKLE: { label: "Ankle & Foot", icon: "⌇", color: "#4A6F7B", crossoverTo: "KNEE" },
  NECK:  { label: "Neck",         icon: "↑", color: "#7B6F4A", crossoverTo: "UBACK"},
  UBACK: { label: "Upper Back",   icon: "⊞", color: "#4A6B7B", crossoverTo: "LB"  },
  WRIST: { label: "Wrist & Hand", icon: "✋", color: "#6B4A7B", crossoverTo: "NECK"},
  SHLDR: { label: "Shoulder",     icon: "⟂", color: "#7B4A4A", crossoverTo: "NECK"},
};

// AREA_DESC moved into area_select phase as AREA_DESCRIPTORS

// --- PROFILE DEFINITIONS (plain English names + descriptions) -----------------
const PROFILE_DISPLAY = {
  FL: { name: "Flexion-Sensitive", description: "Your back responds best to extension movements and tends to feel worse with prolonged sitting or forward bending. Your sessions will prioritise gentle backbends, prone positions, and hip extension — the movements that give your spine the most relief." },
  EX: { name: "Extension-Sensitive", description: "Your back prefers neutral or gently rounded positions and tends to feel worse with arching or standing for long periods. Your sessions will focus on decompression, supported flexion, and spinal lengthening — the positions that settle your symptoms fastest." },
  NE: { name: "Neural", description: "There's some nerve involvement in your pattern — you may notice sensations that travel toward your buttock or leg. Your sessions are designed to reduce nerve irritation with gentle neural glides and positions that give the nerve space to settle." },
  LI: { name: "Load-Sensitive", description: "Your body responds quickly to load and benefits from a gentle, progressive approach. Your sessions start easy and build gradually — short, regular practice beats occasional intense sessions. Consistency is your best tool." },
  ST: { name: "Stiffness-Dominant", description: "Stiffness rather than acute pain is your primary finding — movement is genuinely the medicine here. Your sessions focus on restoring range of motion through regular, gentle mobility work. You'll likely feel better after moving." },
  AN: { name: "Anterior Overload", description: "Pain at the front of the joint suggests the structures there are being overloaded. Your sessions avoid deep flexion under load and focus on decompression and strengthening the supporting muscles." },
  LA: { name: "Lateral Overload", description: "Pain on the outer side of the joint is typically a tendon or band involvement. Your sessions focus on strengthening and graded lateral loading — the treatment is progressive strength, not rest." },
  PO: { name: "Posterior", description: "Pain in the buttock or back of the thigh suggests hamstring or deep rotator involvement. Your sessions address hip rotation and posterior chain flexibility with targeted release work." },
  PA: { name: "Patellofemoral", description: "Pain around the kneecap is very common and very addressable. Your sessions focus on quad control and step-down exercises — the therapeutic foundation for kneecap recovery." },
  ME: { name: "Medial Stress", description: "Inner joint pain suggests medial ligament or meniscus involvement. Your sessions focus on alignment, hip strength, and reducing the medial load through better movement patterns." },
  AC: { name: "Achilles / Posterior", description: "Back-of-ankle pain is an Achilles tendinopathy pattern. Your sessions use graded loading and eccentric work — the gold standard approach for Achilles recovery." },
  PF: { name: "Plantar Fascia", description: "Heel or sole-of-foot pain is a plantar fasciitis pattern — very common and very manageable. Your sessions include calf release, intrinsic foot strength, and graded loading." },
  MO: { name: "Mobility-First", description: "Restricted range without sharp pain means mobility work is safe and beneficial. Your sessions focus on restoring movement through progressive, never forced, range of motion work." },
  RO: { name: "Rotational Restriction", description: "Rotation is more restricted on one side — your practice restores symmetrical rotation through progressive twisting and mobilisation postures." },
  CO: { name: "Compression / Postural", description: "Pain accumulates with sustained posture and is relieved by movement. Your sessions use traction and decompression postures alongside movement breaks." },
  NN: { name: "Neural Component", description: "Tingling or numbness suggests nerve involvement. Your practice avoids compression and includes gentle nerve gliding in neutral positions." },
  IM: { name: "Anterior Impingement", description: "Front-of-shoulder pain during overhead movements suggests subacromial impingement. Your practice focuses on scapular control and rotator cuff strengthening." },
  RC: { name: "Rotator Cuff", description: "Catching, clicking, or pain with rotation points to rotator cuff involvement. Progressive loading — not rest alone — is the most effective recovery path." },
  FR: { name: "Frozen / Restricted", description: "Restriction in all shoulder directions suggests adhesive capsulitis. Gentle, pain-free range of motion maintains mobility while the capsule heals." },
};

// --- PROFILE DATA (for scoring/insights) --------------------------------------
const PROFILE_DATA = {
  LB: {
    FL: {
      name: "Flexion Sensitive",
      sub: "Your back prefers neutral or slightly extended positions",
      tag: "Most common pattern",
      insights: [
        "Forward bending tends to aggravate your back — the most common lower back pattern.",
        "Your practice prioritises neutral spine postures and gradual, supported extension.",
        "Deep forward folds are introduced later, once your back has settled and strengthened.",
      ],
    },
    EX: {
      name: "Extension Sensitive",
      sub: "Your back prefers neutral or gently rounded positions",
      tag: "Facet / stenosis pattern",
      insights: [
        "Arching your back tends to aggravate your symptoms — a facet joint or stenosis pattern.",
        "Your practice avoids strong backbends and builds on decompression and neutral spine.",
        "Supported forward bending and spinal lengthening form your foundation.",
      ],
    },
    NE: {
      name: "Neural Component",
      sub: "There may be some nerve involvement in your pattern",
      tag: "Nerve involvement",
      insights: [
        "We noticed sensations suggesting your sciatic nerve or nerve roots may be involved.",
        "Your practice is designed to reduce nerve irritation — no strong flexion or compression early on.",
        "If leg sensations persist outside practice, mention this to a healthcare provider.",
      ],
    },
    LI: {
      name: "Load Intolerant",
      sub: "Your back responds best to gentle, progressive loading",
      tag: "Very addressable pattern",
      insights: [
        "Your back muscles fatigue or respond quickly to load — a very common and addressable pattern.",
        "Your practice starts gently and builds load progressively as your tolerance grows.",
        "Short, regular sessions beat occasional intense ones — consistency is your best tool here.",
      ],
    },
    ST: {
      name: "Stiff & Hypomobile",
      sub: "Your back needs movement and circulation more than rest",
      tag: "Movement is the medicine",
      insights: [
        "Your back is stiff rather than acutely painful — movement is genuinely the medicine here.",
        "Your practice focuses on restoring range of motion through regular, gentle mobility work.",
        "You'll likely feel better after moving — the key is keeping that cycle going daily.",
      ],
    },
  },
  HIP: {
    AN: { name: "Anterior Hip Overload", sub: "Front-of-hip or groin pain under load", tag: "Hip joint / flexor pattern", insights: ["Pain at the front of your hip suggests the joint, hip flexor, or labrum are being overloaded.", "Your practice avoids deep hip flexion under load and focuses on decompression and glute strength.", "Strengthening the glutes reduces the demand placed on the anterior hip structures."] },
    LA: { name: "Lateral Hip / Gluteal Overload", sub: "Outer-hip pain — gluteal or IT band", tag: "Gluteal pattern", insights: ["Pain on the outside of the hip is typically gluteal tendinopathy or IT band involvement.", "Avoid hip adduction (crossing legs) — this compresses the gluteal tendons.", "Gluteal strengthening is the priority. Graded lateral loading is the treatment, not rest."] },
    PO: { name: "Posterior Hip", sub: "Buttock or back-of-thigh pain", tag: "Hamstring / piriformis", insights: ["Pain in the buttock or back of the thigh suggests proximal hamstring or piriformis involvement.", "Avoid sustained sitting on hard surfaces and heavy stretching of the hamstring insertion.", "Hip external rotation work and piriformis release form the foundation of your practice."] },
    NE: { name: "Neural Component", sub: "Symptoms spreading toward the leg", tag: "Neural involvement", insights: ["Sensations spreading toward the leg suggest neural tension from the hip or lower back.", "Your practice avoids slump positions and sustained hip flexion with knee extension.", "Neural glides in hip-friendly positions are a core part of your program."] },
    ST: { name: "Hip Needs Strength", sub: "Instability and weakness under load", tag: "Stability first", insights: ["Instability and weakness are the primary finding — the hip needs progressive loading.", "Single-leg stability work is essential. You'll progress from bilateral to unilateral.", "Balance training supports all hip work and prevents re-injury."] },
    MO: { name: "Hip Needs Mobility", sub: "Restricted range without sharp pain", tag: "Mobility first", insights: ["Restricted range without sharp pain means mobility work is safe and beneficial.", "Internal and external rotation need equal attention — stiffness is often asymmetrical.", "Hip mobility directly supports lower back health and overall movement quality."] },
  },
  KNEE: {
    PA: { name: "Patellofemoral Overload", sub: "Anterior knee pain — kneecap area", tag: "Kneecap pattern", insights: ["Pain around the kneecap is a patellofemoral pattern — very common and very addressable.", "Avoid deep knee flexion under load while the kneecap settles. VMO activation is key.", "Step-down exercises and quad control are the therapeutic foundation of your program."] },
    ME: { name: "Medial Knee Stress", sub: "Inner knee pain", tag: "MCL / meniscus pattern", insights: ["Inner knee pain suggests MCL, medial meniscus, or pes anserinus involvement.", "Avoid valgus knee positions — hip abductor and glute strength reduces medial load.", "Foot position and alignment strongly influence medial knee stress."] },
    LA: { name: "Lateral Knee Stress", sub: "Outer knee pain", tag: "IT band / LCL pattern", insights: ["Outer knee pain suggests IT band syndrome, LCL, or lateral meniscus involvement.", "Hip abductor flexibility and lateral glute strength are the key levers.", "IT band mobility work before loading is the approach — not foam rolling alone."] },
    PO: { name: "Posterior Knee / Hamstring", sub: "Back-of-knee pain", tag: "Hamstring / Baker's cyst", insights: ["Back-of-knee pain suggests Baker's cyst, hamstring insertion, or posterior capsule.", "Avoid hyperextension. Hamstring loading at longer lengths is therapeutic.", "Terminal knee extension exercises are a key part of your recovery."] },
    ST: { name: "Knee Needs Strength", sub: "Instability and weakness under load", tag: "Stability first", insights: ["Instability and weakness under load are the primary finding. Strengthening is the treatment.", "Single-leg work is the focus — progress slowly through range of motion.", "Proprioception training is essential and often the missing piece in knee recovery."] },
    MO: { name: "Knee Needs Mobility", sub: "Stiffness without sharp pain", tag: "Mobility first", insights: ["Restricted range and stiffness without sharp pain — mobility work is safe and beneficial.", "Posterior chain flexibility is a major contributor to knee mobility.", "Gradual, progressive flexion is the approach — never forced."] },
  },
  ANKLE: {
    AN: { name: "Anterior Ankle Impingement", sub: "Front-of-ankle pinching in dorsiflexion", tag: "Impingement pattern", insights: ["Front-of-ankle pinching in dorsiflexion suggests a bone spur or capsule restriction.", "Avoid deep dorsiflexion under load while the joint settles.", "Ankle joint mobilisation and posterior chain flexibility reduce the anterior demand."] },
    AC: { name: "Achilles / Posterior Overload", sub: "Back-of-ankle or Achilles pain", tag: "Achilles pattern", insights: ["Back-of-ankle pain is an Achilles tendinopathy pattern — graded loading is the treatment.", "Avoid prolonged passive stretching of the Achilles, especially when irritated.", "Eccentric heel lowering is the gold standard exercise for Achilles recovery."] },
    PF: { name: "Plantar Fascia Involvement", sub: "Heel or sole-of-foot pain", tag: "Plantar fascia pattern", insights: ["Heel or sole-of-foot pain is a plantar fasciitis pattern — very common and very manageable.", "Morning first steps are often the worst — this is characteristic of plantar fascia loading.", "Calf release, intrinsic foot strength, and graded loading are the therapeutic tools."] },
    LA: { name: "Lateral Ankle Instability", sub: "Outer ankle giving way or unstable", tag: "Instability pattern", insights: ["Outer ankle instability suggests chronic lateral ankle sprains or peroneal weakness.", "Single-leg balance training is the priority — proprioception is the key deficit.", "Peroneal strengthening and progressive loading prevent re-injury."] },
    ST: { name: "Ankle Needs Strength", sub: "Weakness and poor single-leg stability", tag: "Strength first", insights: ["Weakness and instability on single-leg tasks are the primary findings.", "Heel raise progressions from bilateral to single-leg are the foundation.", "Ankle strength affects knee and hip mechanics — improving it benefits the whole chain."] },
    MO: { name: "Ankle Needs Mobility", sub: "Restricted range — stiffness without sharp pain", tag: "Mobility first", insights: ["Restricted dorsiflexion or plantarflexion stiffness — mobility work is safe and beneficial.", "Calf stretching and ankle circles address the most common restrictions.", "Ankle mobility directly affects knee and hip movement quality."] },
  },
};

PROFILE_DATA.NECK = {
  FL: { name: "Flexion-Sensitive", sub: "Forward bending tends to increase neck discomfort", color: "#B84838", bg: "#FDF0EE", tag: "Disc / anterior load", insights: ["Pain or pressure at the back of your neck increases when you bend forward — a classic disc or anterior osteophyte pattern.", "Your practice avoids deep cervical flexion and prioritises neutral and gently extended positions.", "Supported extension postures are your foundation — forward bending is introduced gradually as you settle."] },
  EX: { name: "Extension-Sensitive", sub: "Looking up or arching back tends to increase discomfort", color: "#B87028", bg: "#FDF4EE", tag: "Facet / foraminal pattern", insights: ["Pain increases when you tilt your head back — this points to facet joint loading or foraminal narrowing.", "Your practice avoids sustained extension and prioritises neutral and gently flexed positions.", "Decompression, traction-friendly postures, and cervical flexion form your therapeutic foundation."] },
  NE: { name: "Neural / Cervicogenic", sub: "Radiation, tingling, or arm symptoms detected", color: "#5840B0", bg: "#F2EFFE", tag: "Nerve root involvement", insights: ["We noticed signals suggesting nerve root involvement — tingling, pulling, or radiation toward the arm.", "Your practice is designed to reduce nerve irritation — no compression, minimal strong flexion or extension early on.", "If arm symptoms persist outside practice, please mention this to a healthcare provider."] },
  LA: { name: "Lateral / Rotational", sub: "One-sided restriction or pain on turning and side-bending", color: "#207890", bg: "#EEF5FD", tag: "Unilateral facet / disc", insights: ["Restriction or pain is more pronounced on one side — suggesting a unilateral facet joint or lateral disc pattern.", "Your practice focuses on symmetry: restoring equal rotation and lateral flexion to both sides.", "Gentle, progressive rotation work is the cornerstone of your program."] },
  ST: { name: "Neck Needs Strength", sub: "Postural fatigue, forward-head weakness, or poor endurance", color: "#B83858", bg: "#FDF0F3", tag: "Postural weakness", insights: ["Your neck muscles fatigue quickly under load — a forward-head posture or endurance deficit pattern.", "Your practice focuses on deep cervical flexor activation and postural endurance to support the head.", "Short, consistent sessions build the control your neck needs — intensity comes later."] },
  MO: { name: "Neck Needs Mobility", sub: "Bilateral stiffness without sharp pain", color: "#3A7080", bg: "#EDF8FA", tag: "Mobility first", insights: ["Stiffness in multiple directions without sharp pain is your primary finding — mobility work is safe and beneficial.", "Your practice focuses on restoring rotation, lateral flexion, and flexion range progressively.", "Daily gentle movement is more effective than occasional intensive stretching for cervical stiffness."] },
};

PROFILE_DATA.UBACK = {
  EX: { name: "Extension-Blocked", sub: "Chest opening and arching the upper back is restricted", color: "#B84838", bg: "#FDF0EE", tag: "Thoracic kyphosis pattern", insights: ["You struggle to open your chest and extend your thoracic spine — a postural kyphosis or facet compression pattern.", "Your practice prioritises thoracic extension and chest opening through supported and active extension postures.", "Consistent thoracic extension work reduces neck strain, shoulder tension, and lumbar compensations."] },
  RO: { name: "Rotational Restriction", sub: "Asymmetric twist — one side is more restricted", color: "#B87028", bg: "#FDF4EE", tag: "Unilateral rib / facet", insights: ["Rotation is more restricted on one side — suggesting unilateral facet, rib joint, or asymmetric tightness.", "Your practice focuses on restoring symmetrical thoracic rotation through progressive twisting postures.", "Even a small rotation deficit on one side can drive neck, shoulder, and lower back compensations."] },
  CO: { name: "Compression / Postural", sub: "Pain with sustained sitting or posture, relieved by movement", color: "#5840B0", bg: "#F2EFFE", tag: "Postural / disc load", insights: ["Pain accumulates with sustained sitting or static posture and is relieved by movement — a disc or postural loading pattern.", "Your practice uses traction and decompression postures to reduce compression and restore fluid mechanics.", "Movement breaks and postural resets are as important as formal practice sessions."] },
  NE: { name: "Neural / Referred", sub: "Intercostal, rib, or arm referred sensation detected", color: "#207890", bg: "#EEF5FD", tag: "T-spine nerve root", insights: ["We noticed signals suggesting intercostal or referred pain — possibly a thoracic nerve root contributing.", "Your practice avoids positions that increase ribcage or thoracic compression.", "If band-like chest or rib sensations persist outside practice, mention this to a healthcare provider."] },
  ST: { name: "Upper Back Needs Strength", sub: "Mid-back fatigue, scapular winging, or poor postural endurance", color: "#B83858", bg: "#FDF0F3", tag: "Scapular weakness", insights: ["Weakness and fatigue in the mid-back, scapular area, or postural muscles are your primary finding.", "Your practice focuses on scapular stabilisation, rhomboid and lower trapezius strength, and postural endurance.", "Building thoracic strength is one of the most effective ways to permanently reduce upper back and neck pain."] },
  MO: { name: "Upper Back Needs Mobility", sub: "Generalised thoracic stiffness in multiple directions", color: "#3A7080", bg: "#EDF8FA", tag: "Thoracic mobility first", insights: ["Stiffness through the thoracic spine without sharp pain — mobility work is safe and highly effective here.", "Your practice systematically restores flexion, extension, and rotation range through progressive mobilisation.", "Thoracic mobility directly improves shoulder range of motion, neck comfort, and lower back health."] },
};

PROFILE_DATA.WRIST = {
  EX: { name: "Extension Overload", sub: "Weight-bearing wrist extension is the primary trigger", color: "#B84838", bg: "#FDF0EE", tag: "Dorsal impingement / TFCC", insights: ["Loading your wrist in extension — like Downward Dog or Table Top — triggers your symptoms.", "Your practice uses fist modifications, forearm support, and reduced wrist extension loading while your wrist settles.", "Gradually reintroducing extension under load is the therapeutic goal — we'll get there progressively."] },
  FL: { name: "Flexor / Volar Strain", sub: "Wrist flexion or gripping is the primary trigger", color: "#B87028", bg: "#FDF4EE", tag: "Flexor tendinopathy", insights: ["Pain on the palm side of your wrist suggests flexor tendinopathy or volar plate involvement.", "Your practice avoids sustained gripping and wrist flexion loading while the flexors settle.", "Eccentric loading and progressive strengthening at manageable ranges are the therapeutic tools."] },
  LA: { name: "Lateral / Radial-Ulnar", sub: "Thumb-side or pinky-side outer wrist pain", color: "#5840B0", bg: "#F2EFFE", tag: "De Quervain's / TFCC", insights: ["Pain on the radial (thumb) or ulnar (pinky) side suggests De Quervain's tendinopathy or TFCC involvement.", "Your practice avoids rotational wrist loading and positions that stress the radial or ulnar structures.", "Gentle tendon gliding and gradual lateral loading are the therapeutic approach."] },
  NN: { name: "Neural Component", sub: "Tingling, numbness, or nerve-related hand symptoms", color: "#207890", bg: "#EEF5FD", tag: "Carpal / cervical neural", insights: ["Tingling or numbness in the hand or fingers suggests carpal tunnel, cubital tunnel, or cervical referral.", "Your practice avoids positions that compress the wrist canal and includes nerve gliding in neutral positions.", "If symptoms persist or worsen at night, mention this to a healthcare provider — it's very treatable."] },
  ST: { name: "Wrist Needs Strength", sub: "Instability, weakness, or poor wrist/forearm control", color: "#B83858", bg: "#FDF0F3", tag: "Wrist instability", insights: ["Instability and weakness under load are your primary finding — the wrist needs progressive strengthening.", "Your practice starts with low-load wrist stability work and progressively builds load tolerance.", "Forearm strength and proprioception training are as important as wrist strengthening exercises."] },
  MO: { name: "Wrist Needs Mobility", sub: "Restricted range without sharp pain", color: "#3A7080", bg: "#EDF8FA", tag: "Mobility first", insights: ["Restricted extension or flexion range without sharp pain — mobility work is safe and beneficial.", "Your practice systematically restores wrist range through progressive loaded and unloaded mobility.", "Wrist mobility directly affects grip strength, shoulder position, and upper limb movement quality."] },
};

PROFILE_DATA.SHLDR = {
  IM: { name: "Anterior Impingement", sub: "Front-of-shoulder pain overhead or when reaching", color: "#B84838", bg: "#FDF0EE", tag: "Subacromial / rotator cuff", insights: ["Pain at the front of your shoulder during overhead movements suggests subacromial impingement or rotator cuff involvement.", "Your practice avoids the painful arc (60–120°) and focuses on scapular stabilisation and rotator cuff strengthening.", "Restoring scapular control is the foundation — it creates more space and reduces impingement forces."] },
  RC: { name: "Rotator Cuff", sub: "Pain with rotation, reaching behind, or catching sensation", color: "#B87028", bg: "#FDF4EE", tag: "Rotator cuff strain", insights: ["Catching, clicking, or pain with rotation or reaching behind your back points to rotator cuff involvement.", "Your practice uses sub-maximal isometric and rhythmic stabilisation to allow the tendon to settle.", "Progressive rotator cuff loading — not rest alone — is the most effective path to recovery."] },
  FR: { name: "Frozen / Restricted", sub: "Significantly restricted in all directions — possible adhesive capsulitis", color: "#5840B0", bg: "#F2EFFE", tag: "Adhesive capsulitis", insights: ["Restriction in all shoulder directions, especially rotation and overhead reach, suggests adhesive capsulitis.", "Your practice uses gentle, pain-free range of motion to maintain mobility while the capsule heals — no forced stretching.", "Gentle consistency is more effective than aggressive stretching for frozen shoulder. Warmth before practice helps."] },
  PO: { name: "Posterior Capsule", sub: "Pain behind the shoulder, limited internal rotation", color: "#207890", bg: "#EEF5FD", tag: "Posterior capsule tightness", insights: ["Tightness or pain behind the shoulder with internal rotation restriction points to posterior capsule tightness.", "Your practice focuses on posterior capsule stretching and internal rotation recovery in pain-free ranges.", "Posterior capsule tightness is extremely common in athletes and desk workers — and very responsive to the right exercises."] },
  ST: { name: "Shoulder Needs Strength", sub: "Instability, scapular winging, or poor shoulder girdle control", color: "#B83858", bg: "#FDF0F3", tag: "Scapular instability", insights: ["Instability, scapular winging, or poor control under load are your primary findings.", "Your practice focuses on scapular stabilisation, lower and middle trapezius strength, and progressive shoulder girdle loading.", "Stable shoulders come from strong postural muscles — the rotator cuff is only part of the picture."] },
  MO: { name: "Shoulder Needs Mobility", sub: "Restricted range without sharp pain — early capsule or stiffness", color: "#3A7080", bg: "#EDF8FA", tag: "Mobility first", insights: ["Restricted shoulder range without sharp pain — mobility work is safe and beneficial here.", "Your practice restores flexion, rotation, and horizontal abduction progressively through the pain-free range.", "Shoulder mobility is closely linked to thoracic mobility — improving both together produces the fastest results."] },
};

// --- LB POSTURES --------------------------------------------------------------
const LB_POSTURES = [
  {
    id: "knee-hug", name: "Supine Knee Hug", subtitle: "Apanasana",
    grad: ["#A8CCCA", "#6AA8A4"], time: "~45 sec", conditional: false, double_score: false, videoId: null,
    how: "Lie on your back, knees bent. Gently draw both knees toward your chest, hands resting on your shins. Hold for 5 slow breaths.",
    qs: [
      { id: "lb_p1q1", text: "With your knees drawn toward your chest, how does your lower back feel?", opts: [{ t: "The position relieved the pain", sig: { EX: 1 } }, { t: "Neutral — no change", sig: {} }, { t: "Mild discomfort", sig: { FL: 1 } }, { t: "Pain or pressure", sig: { FL: 1 } }] },
      { id: "lb_p1q2", text: "Does the sensation stay in your back, or do you feel anything toward the buttock or leg?", opts: [{ t: "Stays in the back only", sig: {} }, { t: "Also feel it in the buttock", sig: { NE: 1 } }, { t: "Also feel it in the leg", sig: { NE: 1 } }, { t: "No sensation at all", sig: {} }] },
    ],
  },
  {
    id: "pelvic-tilt", name: "Pelvic Tilts", subtitle: "",
    grad: ["#B4D0B0", "#80B07C"], time: "~60 sec", conditional: false, double_score: false, videoId: null,
    how: "Lie on your back, knees bent. Gently flatten your lower back (posterior tilt), then allow a small arch (anterior tilt). 8 easy cycles.",
    qs: [
      { id: "lb_p2q1", text: "Which direction felt better for your back?", opts: [{ t: "Back flat / rounded (posterior tilt)", sig: { EX: 1 } }, { t: "Back arched / curved (anterior tilt)", sig: { FL: 1 } }, { t: "Neutral — both felt similar", sig: {} }, { t: "Both caused discomfort", sig: { LI: 1 } }] },
      { id: "lb_p2q2", text: "How free was the movement?", opts: [{ t: "Fully free — no limitation", sig: {} }, { t: "Slightly limited — didn't reach full range", sig: { ST: 1 } }, { t: "Very limited — felt real stiffness", sig: { ST: 1 } }, { t: "Movement was painful", sig: { LI: 1 } }] },
    ],
  },
  {
    id: "cat-cow", name: "Cat–Cow", subtitle: "Marjaryasana / Bitilasana",
    grad: ["#C4B8D4", "#9880B4"], time: "~60 sec", conditional: false, double_score: false, videoId: null,
    how: "On hands and knees. Inhale — belly drops, head lifts (Cow). Exhale — round spine, tuck chin (Cat). 6 slow cycles.",
    qs: [
      { id: "lb_p3q1", text: "What did you feel during the transitions?", opts: [{ t: "One direction felt better than the other", sig: {} }, { t: "Both directions fine — movement was free", sig: {} }, { t: "Both directions limited — difficult to move", sig: { ST: 1 } }, { t: "The transition itself was painful", sig: { LI: 1 } }] },
      { id: "lb_p3q2", text: "Did the discomfort change as you continued moving?", opts: [{ t: "Improved with movement", sig: { ST: 1 } }, { t: "Stayed the same", sig: {} }, { t: "Worsened with movement", sig: { LI: 1 } }, { t: "No discomfort", sig: {} }] },
    ],
  },
  {
    id: "sphinx", name: "Sphinx", subtitle: "Salamba Bhujangasana",
    grad: ["#D0BCA8", "#B09880"], time: "~45 sec", conditional: true, double_score: true, videoId: null,
    how: "Lie face-down. Forearms on floor, elbows under shoulders. Press forearms to lift chest — pelvis stays on floor. 5 slow breaths.",
    qs: [
      { id: "lb_p4q1", text: "How did your back respond to resting on your forearms?", opts: [{ t: "Felt relief — back relaxed", sig: { FL: 1 } }, { t: "No change", sig: {} }, { t: "Felt pressure or pain in the back", sig: { EX: 1, LI: 1 } }, { t: "Felt a sensation traveling into the leg or buttock", sig: { NE: 1 } }] },
    ],
  },
  {
    id: "bird-dog", name: "Bird-Dog", subtitle: "Parsva Balasana",
    grad: ["#B8CCDC", "#84A4C0"], time: "~60 sec", conditional: false, double_score: false, videoId: null,
    how: "On hands and knees. Slowly extend right arm and left leg simultaneously — hips level. 3 breaths. Switch sides.",
    qs: [
      { id: "lb_p5q1", text: "What did you feel during the movement?", opts: [{ t: "Stable on both sides", sig: {} }, { t: "Muscle effort only, no pain", sig: {} }, { t: "One side was noticeably harder", sig: { LI: 1 } }, { t: "Back pain or difficulty holding", sig: { LI: 1 } }, { t: "Quick muscle fatigue", sig: { LI: 1 } }] },
    ],
  },
  {
    id: "bridge", name: "Bridge", subtitle: "Setu Bandhasana",
    grad: ["#DCC8B0", "#C0A484"], time: "~75 sec", conditional: false, double_score: false, videoId: null,
    how: "Lie on back, knees bent. Press feet into floor and lift hips. Squeeze glutes at top. Hold 3 breaths. Lower slowly. Repeat 3×.",
    qs: [
      { id: "lb_p6q1", text: "How did your back feel while lifting your pelvis?", opts: [{ t: "Stable — smooth lift", sig: {} }, { t: "Muscle effort only, no pain", sig: {} }, { t: "Pain or pressure in the back", sig: { EX: 1, LI: 1 } }, { t: "Difficult to stabilize or lift", sig: { LI: 1 } }] },
    ],
  },
  {
    id: "trikonasana", name: "Triangle Pose", subtitle: "Trikonasana",
    grad: ["#B4D4C4", "#7CB898"], time: "~60 sec", conditional: true, double_score: false, videoId: null,
    how: "Stand feet wide. Right foot out 90°. Reach right hand toward shin, left arm up. 4 breaths each side.",
    qs: [
      { id: "lb_p7q1", text: "Was there a difference between the right and left sides?", opts: [{ t: "Both sides similar — free movement", sig: {} }, { t: "Both sides similar — limited range", sig: { ST: 1 } }, { t: "One side was clearly more free", sig: { ST: 1 } }, { t: "One side caused pain or a leg sensation", sig: { NE: 1 } }] },
    ],
  },
  {
    id: "hip-hinge", name: "Hip Hinge → Forward Fold", subtitle: "Uttanasana",
    grad: ["#C8B8DC", "#A090C0"], time: "~60 sec", conditional: false, double_score: true, videoId: null,
    how: "Stand feet hip-width, knees soft. Slowly hinge forward from hips — arms and upper body hang. 4 breaths. Roll back up slowly.",
    qs: [
      { id: "lb_p8q1", text: "When you folded forward, what did you feel?", opts: [{ t: "Pleasant stretch in the back or legs", sig: {} }, { t: "Limited — couldn't reach far", sig: { ST: 1 } }, { t: "Pain in the back", sig: { FL: 1 } }, { t: "Sensation traveling down the leg (tingling, numbness, or pain)", sig: { NE: 1 } }] },
      { id: "lb_p8q2", text: "How far could you comfortably reach?", opts: [{ t: "Knees or below — good range", sig: {} }, { t: "Mid-shin", sig: { ST: 1 } }, { t: "Only to the knees", sig: { ST: 1 } }, { t: "Barely able to bend forward", sig: { ST: 1, LI: 1 } }] },
    ],
  },
  {
    id: "supine-twist", name: "Supine Twist", subtitle: "Supta Matsyendrasana",
    grad: ["#B4D0C0", "#7CB898"], time: "~60 sec", conditional: false, double_score: false, videoId: null,
    how: "Lie on back. Draw right knee to chest, guide across body to the left. Shoulders stay on floor. 4 breaths. Repeat other side.",
    qs: [
      { id: "lb_p9q1", text: "How did your back feel during the rotation?", opts: [{ t: "Relief — back relaxed into it", sig: {} }, { t: "Neutral", sig: {} }, { t: "Discomfort in the back", sig: { LI: 1 } }, { t: "Sensation in the buttock or hip", sig: { NE: 1 } }] },
      { id: "lb_p9q2", text: "Was there a difference rotating right vs. left?", opts: [{ t: "Both directions felt similar", sig: {} }, { t: "One direction was more free", sig: { ST: 1 } }, { t: "One direction caused discomfort", sig: { NE: 1 } }, { t: "Both directions caused discomfort", sig: { LI: 1 } }] },
    ],
  },
];

// --- HIP POSTURES -------------------------------------------------------------
const HIP_POSTURES = [
  { id: "hip_p1", name: "Bridge", subtitle: "Setu Bandha", grad: ["#DCC8B0", "#C0A484"], time: "~75 sec", conditional: false, double_score: false, videoId: null, how: "Lie on your back, knees bent, feet hip-width. Press feet into the floor and slowly lift your hips. Hold 3 breaths. Lower one vertebra at a time. Repeat 3×.", qs: [{ id: "hip_p1q1", text: "How did your hips and back of thigh feel during Bridge?", opts: [{ t: "Strong and stable", sig: {} }, { t: "Muscle effort only", sig: {} }, { t: "Tightness in buttock or back of thigh", sig: { PO: 1 } }, { t: "Pain in lower back or pelvis", sig: {}, xover: true }, { t: "Pain in hip", sig: { LA: 1, PO: 1, ST: 1 } }] }] },
  { id: "hip_p2", name: "Supta Padangusthasana", subtitle: "Reclined Hand-to-Foot", grad: ["#A8CCCA", "#6AA8A4"], time: "~60 sec", conditional: false, double_score: false, videoId: null, how: "Lie on your back. Lift one leg straight up, holding behind your thigh. Keep the other leg flat. Hold 4 breaths each side.", qs: [{ id: "hip_p2q1", text: "How did your leg feel during Supta Padangusthasana?", opts: [{ t: "Comfortable stretch", sig: {} }, { t: "Tightness limiting movement", sig: { MO: 1 } }, { t: "Pain in buttock or back of thigh", sig: { PO: 1 } }, { t: "Pulling sensation down the leg", sig: { NE: 1 } }, { t: "Pain in lower back", sig: {}, xover: true }] }] },
  { id: "hip_p3", name: "Reclined Figure-4", subtitle: "Supta Kapotasana  ★ ×2", grad: ["#C4B8D4", "#9880B4"], time: "~60 sec", conditional: false, double_score: true, videoId: null, how: "Lie on your back, cross one ankle over the opposite knee. Gently draw both legs toward your chest. Hold 5 breaths each side.", qs: [{ id: "hip_p3q1", text: "How did your hip feel in Reclined Figure-4?", opts: [{ t: "Stretch in hip / buttock", sig: {} }, { t: "Tight deep hip", sig: { MO: 2 } }, { t: "Pain in hip joint", sig: { AN: 2 } }, { t: "Pain spreading toward leg", sig: { NE: 2 } }, { t: "Pain in lower back", sig: {}, xover: true }] }] },
  { id: "hip_p4", name: "Half Locust", subtitle: "Ardha Salabhasana", grad: ["#B8CCDC", "#84A4C0"], time: "~60 sec", conditional: false, double_score: false, videoId: null, how: "Lie face-down, arms alongside your body. Lift one leg at a time off the floor, keeping it straight. Hold 3 breaths. Repeat each side.", qs: [{ id: "hip_p4q1", text: "How did your buttock and back of thigh feel during Half Locust?", opts: [{ t: "Smooth and controlled", sig: {} }, { t: "Muscle effort only", sig: {} }, { t: "Hard to lift or hold", sig: { ST: 1 } }, { t: "Pain in buttock or back of thigh", sig: { PO: 1 } }, { t: "Pain in lower back", sig: {}, xover: true }] }] },
  { id: "hip_p5", name: "Chair Pose", subtitle: "Utkatasana  ★ ×2", grad: ["#D0BCA8", "#B09880"], time: "~45 sec", conditional: false, double_score: true, videoId: null, how: "Stand feet hip-width. Bend knees and lower hips as if sitting into a chair. Hold 4 breaths. Come up slowly.", qs: [{ id: "hip_p5q1", text: "How did your hips feel in Chair Pose?", opts: [{ t: "Strong and stable", sig: {} }, { t: "Tight hips", sig: { MO: 2 } }, { t: "Pain in front of hip or groin", sig: { AN: 2 } }, { t: "Pain in knees", sig: {} }, { t: "Pain in lower back", sig: {}, xover: true }] }] },
  { id: "hip_p6", name: "Low Lunge", subtitle: "Anjaneyasana", grad: ["#B4D0B0", "#80B07C"], time: "~60 sec", conditional: false, double_score: false, videoId: null, how: "Step one foot forward into a lunge, back knee on the floor. Gently lower hips toward the floor. Hold 4 breaths each side.", qs: [{ id: "hip_p6q1", text: "How did your front hip feel in Low Lunge?", opts: [{ t: "Stretch front of hip", sig: {} }, { t: "Tight front of hip", sig: { MO: 1 } }, { t: "Deep groin pain", sig: { AN: 1 } }, { t: "Lower back pain", sig: {}, xover: true }, { t: "Sharp pain in front of hip", sig: { AN: 1 } }] }] },
  { id: "hip_p7", name: "Prasarita Padottanasana", subtitle: "Wide-Leg Forward Fold", grad: ["#B4D4C4", "#7CB898"], time: "~60 sec", conditional: false, double_score: false, videoId: null, how: "Stand with feet wide apart. Hinge forward from your hips, letting your upper body hang. Hold 4 breaths.", qs: [{ id: "hip_p7q1", text: "How did your hips feel in the wide-leg forward fold?", opts: [{ t: "Stretch in the inner thighs", sig: {} }, { t: "Tight movement", sig: { MO: 1 } }, { t: "One hip tighter than the other", sig: { MO: 1 } }, { t: "Pain in one hip joint", sig: { AN: 1 } }, { t: "Pain in lower back", sig: {}, xover: true }] }] },
  { id: "hip_p8", name: "Tree Pose", subtitle: "Vrksasana", grad: ["#C8B8DC", "#A090C0"], time: "~60 sec", conditional: false, double_score: false, videoId: null, how: "Stand on one leg. Place foot on inner calf or inner thigh (never on the knee). Hold 4 breaths each side.", qs: [{ id: "hip_p8q1", text: "How did your standing hip feel during Tree Pose?", opts: [{ t: "Stable", sig: {} }, { t: "Slight wobble", sig: { ST: 1 } }, { t: "One side weaker", sig: { ST: 1 } }, { t: "Pain on outside of hip", sig: { LA: 1 } }, { t: "Could not keep balance", sig: { ST: 1 } }] }] },
  { id: "hip_p9", name: "Warrior I → Warrior III", subtitle: "Virabhadrasana", grad: ["#DCC8B0", "#C0A484"], time: "~75 sec", conditional: false, double_score: false, videoId: null, how: "From Warrior I, slowly shift weight forward and extend back leg into Warrior III. Hands on wall for balance if needed. Both sides.", qs: [{ id: "hip_p9q1", text: "How did your hip respond to Warrior?", opts: [{ t: "Smooth and controlled", sig: {} }, { t: "Hard to control", sig: { ST: 1 } }, { t: "Tightness in hip", sig: { MO: 1 } }, { t: "Pain in hip or buttock", sig: { LA: 1, PO: 1 } }, { t: "Could not maintain balance", sig: { ST: 1 } }] }] },
];

// --- KNEE POSTURES ------------------------------------------------------------
const KNEE_POSTURES = [
  { id: "knee_p1", name: "Supine Knee Hug", subtitle: "Single Leg", grad: ["#A8CCCA", "#6AA8A4"], time: "~45 sec", conditional: false, double_score: false, videoId: null, how: "Lie on your back. Draw one knee toward your chest. Keep the other leg flat on the floor. Hold 4 breaths. Switch sides.", qs: [{ id: "knee_p1q1", text: "How does your knee feel when drawn toward your chest?", opts: [{ t: "Comfortable stretch", sig: {} }, { t: "Tightness behind the knee", sig: { PO: 1, MO: 1 } }, { t: "Pain behind the knee", sig: { PO: 1 } }, { t: "Pain in front of the knee", sig: { PA: 1 } }, { t: "Pain in hip or lower back", sig: {}, xover: true }, { t: "No sensation", sig: {} }] }] },
  { id: "knee_p2", name: "Standing Knee Extension", subtitle: "Terminal Extension Screen", grad: ["#B4D0B0", "#80B07C"], time: "~45 sec", conditional: false, double_score: false, videoId: null, how: "Stand with soft knees. Slowly straighten one leg fully. Hold 3 seconds. Release. Repeat 3× each side.", qs: [{ id: "knee_p2q1", text: "How does the knee feel at full extension?", opts: [{ t: "Easy and comfortable", sig: {} }, { t: "Tightness behind the knee", sig: { PO: 1, MO: 1 } }, { t: "Pain behind the knee", sig: { PO: 1 } }, { t: "Pain in front of the knee", sig: { PA: 1 } }, { t: "Hyperextension sensation", sig: { PO: 1 } }, { t: "Could not fully straighten", sig: { MO: 1 } }] }] },
  { id: "knee_p3", name: "Chair Pose", subtitle: "Utkatasana  ★ ×2", grad: ["#D0BCA8", "#B09880"], time: "~60 sec", conditional: false, double_score: true, videoId: null, how: "Round 1: feet together. Round 2: feet hip-width. Lower hips as far as comfortable — stop immediately if sharp pain. Hold 3 breaths each round.", qs: [{ id: "knee_p3q1", text: "How did your knees feel in the squat, and did they cave inward in round 2?", opts: [{ t: "Strong and stable", sig: {} }, { t: "Pain behind or around the kneecap", sig: { PA: 2 } }, { t: "Knees felt unstable or shaky", sig: { ST: 2 } }, { t: "Trembling in the front of the knee", sig: { ST: 2 } }, { t: "Knees caved inward (round 2)", sig: { ST: 2 } }, { t: "Knees stayed aligned (round 2)", sig: {} }, { t: "Pain in hip or groin", sig: {}, xover: true }] }] },
  { id: "knee_p4", name: "Low Lunge", subtitle: "Anjaneyasana", grad: ["#C4B8D4", "#9880B4"], time: "~75 sec", conditional: false, double_score: false, videoId: null, how: "Step one foot forward into a deep lunge, back knee on the floor. Front knee at 90°. Hold 4 breaths each side.", qs: [{ id: "knee_p4q1", text: "How did your front knee feel in the deep bend?", opts: [{ t: "Comfortable", sig: {} }, { t: "Pain on the inner side of the knee", sig: { ME: 1 } }, { t: "Pain on the outer side of the knee", sig: { LA: 1 } }, { t: "Pain in front of the knee", sig: { PA: 1 } }, { t: "Tightness limiting the bend", sig: { MO: 1 } }, { t: "Pain in hip or groin", sig: {}, xover: true }] }, { id: "knee_p4q2", text: "How did your back knee feel on the ground?", opts: [{ t: "No issue", sig: {} }, { t: "Pressure on kneecap", sig: { PA: 1 } }, { t: "Pain behind the knee", sig: { PO: 1 } }, { t: "Trembling or instability", sig: { ST: 1 } }, { t: "General discomfort", sig: {} }] }] },
  { id: "knee_p5", name: "Supported Virasana", subtitle: "Graduated — stop if sharp pain", grad: ["#B8CCDC", "#84A4C0"], time: "~60 sec", conditional: false, double_score: false, videoId: null, how: "Stand in 6-point stance (hands, knees, shins). Slowly sit hips back toward heels only as far as comfortable — stop immediately if sharp pain or pressure in the knee.", qs: [{ id: "knee_p5q1", text: "How far could you lower your hips comfortably?", opts: [{ t: "Hips to heels — no pain", sig: {} }, { t: "Hips to heels — with pain or pressure in the knee", sig: { ME: 1, LA: 1 } }, { t: "Halfway — stopped due to knee pain", sig: { ME: 1, LA: 1, MO: 1 } }, { t: "Limited by ankle position, not knee", sig: { MO: 1 } }, { t: "Significant knee pain prevented movement", sig: { ME: 1, LA: 1, ST: 1 } }] }] },
  { id: "knee_p6", name: "Standing Forward Fold", subtitle: "", grad: ["#B4D4C4", "#7CB898"], time: "~45 sec", conditional: false, double_score: false, videoId: null, how: "Stand feet hip-width. Slowly fold forward, knees slightly bent if needed. Let arms hang. Hold 4 breaths. Roll back up slowly.", qs: [{ id: "knee_p6q1", text: "What did you notice behind your knees or around the kneecap?", opts: [{ t: "Pleasant stretch — no pain", sig: {} }, { t: "Tightness behind the knee — limiting movement", sig: { MO: 1 } }, { t: "Pain behind the knee", sig: { PO: 1 } }, { t: "Pain behind or around the kneecap", sig: { PA: 1 } }, { t: "No sensation", sig: {} }] }] },
  { id: "knee_p7", name: "High Lunge", subtitle: "Loaded Single-Leg  ★ ×2", grad: ["#C8B8DC", "#A090C0"], time: "~60 sec", conditional: false, double_score: true, videoId: null, how: "Step one foot forward. Front knee bends to 90°, back leg straight. Hold 4 breaths under load. Both sides.", qs: [{ id: "knee_p7q1", text: "How did your front knee feel under load?", opts: [{ t: "Strong and stable", sig: {} }, { t: "Pain behind or around the kneecap", sig: { PA: 2 } }, { t: "Knee felt unstable or gave way", sig: { ST: 2 } }, { t: "Trembling or instability", sig: { ST: 2 } }, { t: "Pain in hip or groin", sig: {}, xover: true }] }] },
  { id: "knee_p8", name: "Tree Pose", subtitle: "Vrksasana", grad: ["#A8CCCA", "#6AA8A4"], time: "~60 sec", conditional: false, double_score: false, videoId: null, how: "Stand on one leg. Place other foot on inner calf or ankle. Hold 4 breaths each side.", qs: [{ id: "knee_p8q1", text: "How did your standing knee feel during balance?", opts: [{ t: "Stable", sig: {} }, { t: "Wobble or instability", sig: { ST: 1 } }, { t: "Pain on inner knee", sig: { ME: 1 } }, { t: "Pain on outer knee", sig: { LA: 1 } }] }] },
  { id: "knee_p9", name: "Single Leg Mini Squat", subtitle: "Dynamic Stability", grad: ["#B4D0C0", "#7CB898"], time: "~45 sec", conditional: false, double_score: false, videoId: null, how: "Stand on one leg. Slowly bend knee to a comfortable depth — hands on wall if needed. 5 controlled reps each side.", qs: [{ id: "knee_p9q1", text: "How did the knee behave during the movement?", opts: [{ t: "Deep and controlled — knee stayed aligned", sig: {} }, { t: "Moderate bend — knee stayed aligned", sig: {} }, { t: "Knee caved inward", sig: { ST: 1 } }, { t: "Trembling or weakness limited the movement", sig: { ST: 1 } }, { t: "Pain prevented the movement", sig: { ME: 1, LA: 1, ST: 1 } }] }] },
  { id: "knee_p10", name: "Warrior III", subtitle: "Virabhadrasana III", grad: ["#A8CCCA", "#6AA8A4"], time: "~60 sec", conditional: false, double_score: false, videoId: null, how: "Stand on one leg. Hinge forward and extend back leg behind you — hands on wall if needed. Hold 3 breaths. Both sides.", qs: [{ id: "knee_p10q1", text: "How did your standing knee respond to the forward lean?", opts: [{ t: "Smooth and controlled", sig: {} }, { t: "Hard to control", sig: { ST: 1 } }, { t: "Pain on outer knee", sig: { LA: 1 } }, { t: "Could not maintain balance", sig: { ST: 1 } }] }] },
  { id: "knee_summary", name: "Session Check-in", subtitle: "", grad: ["#E4DDD6", "#C4B8B0"], time: "", conditional: false, double_score: false, videoId: null, isSummary: true, how: "", qs: [{ id: "knee_summary_q", text: "Compared to before the session, how does your knee feel now?", opts: [{ t: "Better — less pain or more comfortable", sig: {} }, { t: "No change", sig: {} }, { t: "Slightly worse — more discomfort", sig: {} }, { t: "Significantly worse — pain increased", sig: {} }, { t: "I had no pain to begin with", sig: {} }] }] },
];

// --- ANKLE POSTURES -----------------------------------------------------------
const ANKLE_POSTURES = [
  { id: "ankle_p1", name: "Downward Dog", subtitle: "Adho Mukha Svanasana", grad: ["#A8CCCA", "#6AA8A4"], time: "~60 sec", conditional: false, double_score: false, videoId: null, how: "From hands and knees, tuck toes and lift hips to form an inverted V. Press heels gently toward the floor. Hold 5 breaths.", qs: [{ id: "ankle_p1q1", text: "When pressing your heels toward the floor, what did you feel?", opts: [{ t: "Heels reached the floor comfortably", sig: {} }, { t: "Tightness in calves — heels stayed up", sig: { AC: 1, MO: 1 } }, { t: "Pain in Achilles or back of ankle", sig: { AC: 1 } }, { t: "Pain under the heel or sole of foot", sig: { PF: 1 } }, { t: "No sensation", sig: {} }] }] },
  { id: "ankle_p2", name: "Chair Pose", subtitle: "Utkatasana  ★ ×2", grad: ["#D0BCA8", "#B09880"], time: "~45 sec", conditional: false, double_score: true, videoId: null, how: "Stand feet hip-width. Bend knees and lower hips. Focus attention on the front of your ankles. Hold 4 breaths. Stop if sharp pain.", qs: [{ id: "ankle_p2q1", text: "How did the front of your ankles feel in the squat?", opts: [{ t: "No issue", sig: {} }, { t: "Pinching or blocking at front of ankle", sig: { AN: 2 } }, { t: "Tightness or stiffness in the front of the ankle", sig: { MO: 2 } }, { t: "Tightness limiting depth", sig: { MO: 2 } }, { t: "Pain in knees instead", sig: {}, xover: true }] }] },
  { id: "ankle_p3", name: "Low Lunge", subtitle: "Anjaneyasana", grad: ["#B4D0B0", "#80B07C"], time: "~60 sec", conditional: false, double_score: false, videoId: null, how: "Step one foot forward into a lunge. Shift your front knee forward past your toes — feel the deep stretch in the front of the ankle. Hold 4 breaths each side.", qs: [{ id: "ankle_p3q1", text: "When your front knee moved past your toes, what did you feel in that ankle?", opts: [{ t: "Comfortable — no restriction", sig: {} }, { t: "Pinching at front of ankle", sig: { AN: 1 } }, { t: "Tightness limiting depth", sig: { MO: 1 } }, { t: "Pain in sole of foot", sig: { PF: 1 } }, { t: "Pain in back of ankle or Achilles", sig: { AC: 1 } }] }] },
  { id: "ankle_p4", name: "Single-Leg Heel Raise", subtitle: "Calf Strength Test", grad: ["#C4B8D4", "#9880B4"], time: "~60 sec", conditional: false, double_score: false, videoId: null, how: "Stand near a wall. Rise onto one foot's toes as high as possible. Lower slowly. Try up to 10 repetitions. If single leg is too difficult, perform on both feet.", qs: [{ id: "ankle_p4q1", text: "Standing on one leg, what happened when you rose onto your toes?", opts: [{ t: "Easy and controlled", sig: {} }, { t: "Pain in Achilles or back of ankle", sig: { AC: 1 } }, { t: "Pain under the heel", sig: { PF: 1 } }, { t: "Could not lift fully — weakness", sig: { AC: 1, ST: 1 } }, { t: "Ankle felt unstable", sig: { LA: 1, ST: 1 } }] }, { id: "ankle_p4q2", text: "How many raises could you complete before stopping?", opts: [{ t: "10 or more — single leg", sig: {} }, { t: "5–9 — single leg", sig: {} }, { t: "1–4 — single leg", sig: { AC: 1, ST: 1 } }, { t: "Performed on both legs (single leg too difficult)", sig: { AC: 1, ST: 1 } }, { t: "Could not complete any", sig: { AC: 1, ST: 1 } }] }] },
  { id: "ankle_p5", name: "Tree Pose", subtitle: "Vrksasana", grad: ["#B8CCDC", "#84A4C0"], time: "~60 sec", conditional: false, double_score: false, videoId: null, how: "Stand on one leg. Place other foot on inner calf or ankle. Hold 4 breaths. Switch sides. Focus on the ankle of the standing leg.", qs: [{ id: "ankle_p5q1", text: "How did your standing ankle feel during balance?", opts: [{ t: "Stable", sig: {} }, { t: "Ankle rolling outward or feeling like it might give way", sig: { LA: 1, ST: 1 } }, { t: "Wobble — hard to stabilize", sig: { ST: 1 } }, { t: "Felt stable but required effort", sig: { ST: 1 } }, { t: "Pain on outer ankle", sig: { LA: 1 } }, { t: "Pain in knee", sig: {}, xover: true }] }] },
  { id: "ankle_p6", name: "Warrior III", subtitle: "Virabhadrasana III", grad: ["#C8B8DC", "#A090C0"], time: "~60 sec", conditional: false, double_score: false, videoId: null, how: "Stand on one leg, hinge forward and extend back leg. Hands on wall if needed. Hold 3 breaths. Both sides.", qs: [{ id: "ankle_p6q1", text: "How did your standing ankle respond to the forward lean?", opts: [{ t: "Smooth and controlled", sig: {} }, { t: "Ankle felt unstable", sig: { LA: 1, ST: 1 } }, { t: "Felt stable but required effort", sig: { ST: 1 } }, { t: "Pain on outer ankle", sig: { LA: 1 } }, { t: "Could not maintain balance", sig: { ST: 1 } }, { t: "Pain in knee", sig: {}, xover: true }] }] },
  { id: "ankle_p7a", name: "Eyes-Closed Balance", subtitle: "Optional Stability Challenge", grad: ["#D0BCA8", "#B09880"], time: "~30 sec", conditional: true, double_score: false, videoId: null, how: "Stand on one leg and gently close your eyes for 5 seconds. Focus on ankle control. Open eyes if needed. Both sides.", qs: [{ id: "ankle_p7aq1", text: "How did your ankle feel with your eyes closed?", opts: [{ t: "Stable", sig: {} }, { t: "Slight wobble but controlled", sig: { ST: 1 } }, { t: "Significant wobble", sig: { LA: 1, ST: 1 } }, { t: "Could not maintain balance", sig: { LA: 1, ST: 1 } }, { t: "Pain on outer ankle", sig: { LA: 1 } }] }] },
  { id: "ankle_p7b", name: "Unstable Surface Balance", subtitle: "Optional Stability Challenge", grad: ["#B4D0C0", "#7CB898"], time: "~30 sec", conditional: true, double_score: false, videoId: null, how: "Stand on one leg on a folded blanket, cushion, or soft mat. Hold 5 seconds. Both sides.", qs: [{ id: "ankle_p7bq1", text: "How did your ankle feel on the unstable surface?", opts: [{ t: "Stable", sig: {} }, { t: "Slight wobble but controlled", sig: { ST: 1 } }, { t: "Significant wobble", sig: { LA: 1, ST: 1 } }, { t: "Could not maintain balance", sig: { LA: 1, ST: 1 } }, { t: "Pain on outer ankle", sig: { LA: 1 } }] }] },
  { id: "ankle_summary", name: "Session Check-in", subtitle: "", grad: ["#E4DDD6", "#C4B8B0"], time: "", conditional: false, double_score: false, videoId: null, isSummary: true, how: "", qs: [{ id: "ankle_summary_q", text: "Compared to before the session, how does your ankle feel now?", opts: [{ t: "Better — less pain or more comfortable", sig: {} }, { t: "No change", sig: {} }, { t: "Slightly worse — more discomfort", sig: {} }, { t: "Significantly worse — pain increased", sig: {} }, { t: "I had no pain to begin with", sig: {} }] }] },
];

// --- NECK POSTURES ------------------------------------------------------------
const NECK_POSTURES = [
  { id:"neck_p1", name:"Gentle Neck Rotation", subtitle:"Bilateral Baseline", grad:["#A8CCCA","#6AA8A4"], time:"~60 sec", conditional:false, double_score:false, videoId:null, how:"Slowly rotate your head to look over each shoulder. Both directions. Observe restriction, asymmetry, or any pain before provocation postures.", qs:[{ id:"neck_p1q1", text:"Slowly rotate your head to each side. How does the movement feel?", opts:[{t:"Free and symmetrical on both sides", sig:{}},{t:"Slightly restricted but no pain", sig:{MO:1}},{t:"One side is more restricted than the other", sig:{LA:1, MO:1}},{t:"One side causes pain or discomfort", sig:{LA:1}},{t:"Both sides cause pain or discomfort", sig:{MO:1}},{t:"Pulling sensation toward the shoulder", sig:{NE:1}},{t:"Pain spreads toward the temple or jaw", sig:{NE:1}}]}] },
  { id:"neck_p2", name:"Chin-In Test", subtitle:"Cervical Retraction", grad:["#B4D0B0","#80B07C"], time:"~30 sec", conditional:false, double_score:false, videoId:null, how:"Sitting tall, gently draw your chin straight backward — as if making a double chin — without tilting your head up or down. Hold 3 seconds, repeat 3×.", qs:[{ id:"neck_p2q1", text:"How did your neck feel during this movement?", opts:[{t:"Neck felt more supported or stable", sig:{ST:1}},{t:"Movement felt difficult to control", sig:{ST:1}},{t:"Pain increased at the back of the neck", sig:{EX:1}},{t:"Pulling sensation toward shoulder or arm", sig:{NE:1}},{t:"No change", sig:{}}]}] },
  { id:"neck_p3", name:"Chin to Chest", subtitle:"Cervical Flexion ★ ×2", grad:["#C4B8D4","#9880B4"], time:"~30 sec", conditional:false, double_score:true, videoId:null, how:"Draw your chin toward your chest as far as comfortably possible. Hold 4 slow breaths.", qs:[{ id:"neck_p3q1", text:"Draw your chin toward your chest. How does your neck feel in this position?", opts:[{t:"Comfortable stretch — no pain", sig:{}},{t:"Tightness at the back of the neck", sig:{MO:1}},{t:"Pain at the back of the neck", sig:{FL:1}},{t:"Pulling sensation or radiation toward the arm", sig:{NE:1}},{t:"Pain in the upper back — not the neck", sig:{}, xover:true},{t:"No sensation", sig:{}},{t:"Pressure or pain at the base of the skull", sig:{EX:1}}]}] },
  { id:"neck_p4", name:"Seated Neck Extension", subtitle:"Cervical Extension", grad:["#D0BCA8","#B09880"], time:"~30 sec", conditional:false, double_score:false, videoId:null, how:"Slowly tilt your head back to look toward the ceiling. Stop immediately if dizziness occurs. Hold 3 seconds if comfortable.", qs:[{ id:"neck_p4q1", text:"Slowly tilt your head back, looking toward the ceiling. How does your neck respond?", opts:[{t:"Comfortable — no pain", sig:{}},{t:"Mild tightness only", sig:{MO:1}},{t:"Pain at the back of the neck or base of skull", sig:{EX:1}},{t:"Pulling sensation into the shoulder or arm", sig:{EX:1, NE:1}},{t:"Dizziness or light-headedness — had to stop", sig:{}, dizziness:true}]}] },
  { id:"neck_p5", name:"Seated Side Bend", subtitle:"Lateral Cervical Flexion", grad:["#B8CCDC","#84A4C0"], time:"~45 sec", conditional:false, double_score:false, videoId:null, how:"Sitting tall, let your right ear drop toward your right shoulder. Hold 2 breaths. Repeat on the left side.", qs:[{ id:"neck_p5q1", text:"Sitting tall, let your right ear drop toward your right shoulder. Repeat left. How does each side feel?", opts:[{t:"Comfortable on both sides", sig:{}},{t:"Restricted on one side — couldn't reach fully", sig:{LA:1, MO:1}},{t:"Pain or discomfort on one side", sig:{LA:1}},{t:"Pulling sensation down the arm on one side", sig:{NE:1}},{t:"Restricted and tight on both sides", sig:{MO:1}}]}] },
  { id:"neck_p6", name:"Thread the Needle", subtitle:"Thoracic Rotation + Cervical Torsion", grad:["#B4D4C4","#7CB898"], time:"~60 sec", conditional:false, double_score:false, videoId:null, how:"From hands and knees, slide one arm under your body and rotate your trunk fully. Look under your arm. Both sides.", qs:[{ id:"neck_p6q1", text:"From hands and knees, slide one arm under your body — how does the cervical rotation feel on each side?", opts:[{t:"Free and equal on both sides", sig:{}},{t:"Restricted on one side — couldn't rotate fully", sig:{LA:1, MO:1}},{t:"Pain or discomfort on one side", sig:{LA:1}},{t:"Pain at the back of the neck on both sides", sig:{MO:1}},{t:"Pulling sensation into the arm on one side", sig:{NE:1}}]}] },
  { id:"neck_p7", name:"Eagle Arms", subtitle:"Garudasana Arms ★ ×2", grad:["#C8B8DC","#A090C0"], time:"~45 sec", conditional:false, double_score:true, videoId:null, how:"Wrap your arms in eagle position — one elbow over the other, forearms crossed. Hold 4 breaths.", qs:[{ id:"neck_p7q1", text:"Wrap your arms in eagle position. How does your neck feel with the shoulders under load?", opts:[{t:"Comfortable — no neck effect", sig:{}},{t:"Neck fatigue or effort to hold head up", sig:{ST:1}},{t:"Pain or pressure at the back of the neck", sig:{EX:1}},{t:"Pulling sensation or tingling into the arm", sig:{NE:1}},{t:"Pain on one side of the neck", sig:{LA:1}},{t:"Jaw or temple tension increased", sig:{LA:1}}]}] },
  { id:"neck_p8", name:"Puppy Pose", subtitle:"Anahatasana", grad:["#DCC8B0","#C0A484"], time:"~45 sec", conditional:false, double_score:false, videoId:null, how:"From hands and knees, walk your hands forward and lower your chest toward the floor. Hips remain over knees. Hold 4 breaths.", qs:[{ id:"neck_p8q1", text:"Walk hands forward, lower chest toward the floor — how does your neck feel in this position?", opts:[{t:"Comfortable — pleasant stretch", sig:{}},{t:"Tightness at the back of the neck", sig:{MO:1}},{t:"Pain at the back of the neck", sig:{FL:1}},{t:"Relief — felt like decompression", sig:{FL:1}},{t:"Neck pain worsened in this position", sig:{FL:1}},{t:"Pain in the upper back — not the neck", sig:{}, xover:true}]}] },
  { id:"neck_p9", name:"Supported Fish", subtitle:"Matsyasana", grad:["#A8CCCA","#6AA8A4"], time:"~45 sec", conditional:false, double_score:false, videoId:null, how:"Lie on your back with a rolled blanket or block under your mid-back (T5–T8). Let your head rest back passively. Hold 4 breaths.", qs:[{ id:"neck_p9q1", text:"Lie with support under your thoracic spine — head rests back. How does your neck respond to this passive extension?", opts:[{t:"Comfortable — pleasant stretch", sig:{}},{t:"Manageable — mild neck discomfort that settled", sig:{}},{t:"Pain or pressure at the back of the neck", sig:{EX:1}},{t:"Pulling sensation or tingling into the arm", sig:{NE:1}},{t:"Strong discomfort or dizziness — had to come out", sig:{EX:1}, dizziness:true},{t:"Neck weakness — difficulty sustaining position", sig:{ST:1}}]}] },
  { id:"neck_p10", name:"Child's Pose", subtitle:"Balasana", grad:["#B4D0C0","#7CB898"], time:"~45 sec", conditional:false, double_score:false, videoId:null, how:"From kneeling, walk your hands forward and lower your forehead toward the floor. Arms extended. Hold 4 breaths.", qs:[{ id:"neck_p10q1", text:"From kneeling, walk hands forward and lower forehead toward the floor. How does the neck feel?", opts:[{t:"Comfortable — full relaxation", sig:{}},{t:"Tightness at the back of the neck", sig:{MO:1}},{t:"Pain at the back of the neck", sig:{FL:1}},{t:"Neck weakness — hard to sustain position", sig:{ST:1}},{t:"Pulling sensation into the shoulder or arm", sig:{NE:1}}]}] },
  { id:"neck_summary", name:"Session Check-in", subtitle:"", grad:["#E4DDD6","#C4B8B0"], time:"", conditional:false, double_score:false, videoId:null, isSummary:true, how:"", qs:[{ id:"neck_summary_q", text:"Compared to before the session, how does your neck feel now?", opts:[{t:"Better — less pain or more comfortable", sig:{}},{t:"No change", sig:{}},{t:"Slightly worse — more discomfort", sig:{}},{t:"Significantly worse — pain increased", sig:{}},{t:"I had no pain to begin with", sig:{}}]}] },
];

// --- UBACK POSTURES -----------------------------------------------------------
const UBACK_POSTURES = [
  { id:"ub_p1", name:"Cat-Cow", subtitle:"Thoracic Flex / Ext Baseline", grad:["#A8CCCA","#6AA8A4"], time:"~60 sec", conditional:false, double_score:false, videoId:null, how:"On hands and knees, move through Cat-Cow slowly — 5 cycles. Focus on thoracic spine movement. Inhale to arch (Cow), exhale to round (Cat).", qs:[{ id:"ub_p1q1", text:"Move through Cat-Cow slowly. How does your upper and mid back respond?", opts:[{t:"Free and comfortable in both directions", sig:{}},{t:"Easier to round (cat) than to arch (cow)", sig:{EX:1}},{t:"Easier to arch (cow) than to round (cat)", sig:{MO:1}},{t:"Both directions feel stiff or restricted", sig:{MO:1}},{t:"Movement was painful in one direction", sig:{EX:1, CO:1}},{t:"Pulling sensation around the ribs", sig:{NE:1}},{t:"Pain in the lower back — not upper back", sig:{}, xover:true}]}] },
  { id:"ub_p2", name:"Supine Twist", subtitle:"Thoracic Rotation Baseline", grad:["#B4D0B0","#80B07C"], time:"~60 sec", conditional:false, double_score:false, videoId:null, how:"Lie on your back. Drop both knees to one side, arms out wide. Hold 3 breaths. Repeat other side.", qs:[{ id:"ub_p2q1", text:"Lie on your back, drop both knees to one side, then the other. How does each direction feel?", opts:[{t:"Free and comfortable — both sides", sig:{}},{t:"One side more restricted than the other", sig:{RO:1, MO:1}},{t:"One side caused pain or discomfort", sig:{RO:1}},{t:"Pulling sensation to ribs, chest, or arm", sig:{NE:1}},{t:"Both sides restricted", sig:{MO:1}},{t:"Pain in lower back — not upper back", sig:{}, xover:true}]}] },
  { id:"ub_p3", name:"Supported Fish", subtitle:"Matsyasana ★ ×2", grad:["#C4B8D4","#9880B4"], time:"~45 sec", conditional:false, double_score:true, videoId:null, how:"Place a rolled blanket or block under your thoracic spine at shoulder blade level (T5–T8). Arms wide. Let your chest open toward the ceiling. Hold 4 breaths.", qs:[{ id:"ub_p3q1", text:"With support under your thoracic spine, let your chest open toward the ceiling. How does your upper back respond?", opts:[{t:"Comfortable — chest opens freely", sig:{}},{t:"Tight — chest resisted opening", sig:{EX:1, MO:1}},{t:"Pain or pressure in the upper/mid back", sig:{EX:1}},{t:"Pulling sensation to ribs or arm", sig:{NE:1}},{t:"Strong discomfort — had to come out", sig:{EX:1}},{t:"Relief — felt like decompression", sig:{CO:1}}]}] },
  { id:"ub_p4", name:"Thread the Needle", subtitle:"Thoracic Rotation", grad:["#D0BCA8","#B09880"], time:"~60 sec", conditional:false, double_score:false, videoId:null, how:"From hands and knees, slide one arm under your body and rotate to look under. Both sides. Focus on upper back movement.", qs:[{ id:"ub_p4q1", text:"From hands and knees, slide one arm under your body and rotate. How does each side feel?", opts:[{t:"Free and equal on both sides", sig:{}},{t:"One side more restricted than the other", sig:{RO:1, MO:1}},{t:"One side caused pain in upper/mid back", sig:{RO:1}},{t:"Pulling or tingling sensation to ribs or arm", sig:{NE:1}},{t:"Both sides restricted equally", sig:{MO:1}}]}] },
  { id:"ub_p5", name:"Puppy Pose", subtitle:"Anahatasana — Thoracic Traction", grad:["#B8CCDC","#84A4C0"], time:"~45 sec", conditional:false, double_score:false, videoId:null, how:"From hands and knees, walk your hands forward and lower your chest toward the floor. Hips stay above the knees. Hold 4 breaths.", qs:[{ id:"ub_p5q1", text:"Walk hands forward, lower chest toward the floor. How does the upper and mid back respond?", opts:[{t:"Pleasant stretch", sig:{}},{t:"Tight — difficult to lower chest", sig:{EX:1, MO:1}},{t:"Relief — felt like decompression", sig:{}},{t:"Pain in mid/upper back", sig:{EX:1}},{t:"Pulling sensation to chest or ribs", sig:{NE:1}},{t:"Pain in lower back — not upper", sig:{}, xover:true}]}] },
  { id:"ub_p6", name:"Seated Twist", subtitle:"Ardha Matsyendrasana ★ ×2", grad:["#C8B8DC","#A090C0"], time:"~60 sec", conditional:false, double_score:true, videoId:null, how:"Sit cross-legged or in a chair. Place one hand on the opposite knee. Twist fully — hold 4 breaths each side.", qs:[{ id:"ub_p6q1", text:"Sitting tall, twist to the right then left. How does the thoracic spine respond on each side?", opts:[{t:"Equal on both sides", sig:{}},{t:"One side significantly more restricted", sig:{RO:1, MO:1}},{t:"Pain in upper back on one side", sig:{RO:1}},{t:"Pulling or discomfort into ribs or arm", sig:{NE:1}},{t:"Pain in upper back on both sides", sig:{CO:1}},{t:"Pain in lower back — not upper", sig:{}, xover:true}]}] },
  { id:"ub_p7", name:"Prone Cobra", subtitle:"Bhujangasana — Active Extension", grad:["#DCC8B0","#C0A484"], time:"~45 sec", conditional:false, double_score:false, videoId:null, how:"Lie on your stomach, hands under shoulders. Lift your chest off the floor using your back muscles — elbows slightly bent. Hold 3 breaths.", qs:[{ id:"ub_p7q1", text:"From lying on your stomach, lift your chest using your back muscles. How does the upper back feel?", opts:[{t:"Strong and controlled — good lift", sig:{}},{t:"Muscle effort — managed to lift", sig:{ST:1}},{t:"Fatigued quickly — couldn't hold position", sig:{ST:1}},{t:"Pain or pressure in the mid/upper back", sig:{CO:1}},{t:"Relief — felt like decompression", sig:{}}]}] },
  { id:"ub_p8", name:"Wide-Legged Forward Fold", subtitle:"Prasarita Padottanasana", grad:["#B4D4C4","#7CB898"], time:"~60 sec", conditional:false, double_score:false, videoId:null, how:"Stand with wide legs and fold forward from your hips, letting your upper body hang. Hold 4 breaths.", qs:[{ id:"ub_p8q1", text:"Stand with wide legs and fold forward. How does your upper and mid back respond?", opts:[{t:"Pleasant decompression", sig:{}},{t:"Tight upper/mid back — difficult to fold", sig:{MO:1}},{t:"One side tighter or more restricted", sig:{RO:1, MO:1}},{t:"Pain in upper/mid back", sig:{CO:1}},{t:"Pain in lower back — not upper", sig:{}, xover:true}]}] },
  { id:"ub_p9", name:"Eagle Arms", subtitle:"Garudasana Arms", grad:["#A8CCCA","#6AA8A4"], time:"~45 sec", conditional:false, double_score:false, videoId:null, how:"Wrap your arms in eagle position. Draw your elbows forward and away from your chest. Hold 4 breaths.", qs:[{ id:"ub_p9q1", text:"Wrap your arms in eagle position and draw elbows away from chest. How does the upper back and between the shoulder blades feel?", opts:[{t:"Comfortable — good stretch between shoulder blades", sig:{}},{t:"Tight between shoulder blades", sig:{MO:1}},{t:"Pain or pressure between shoulder blades", sig:{CO:1}},{t:"One shoulder significantly higher or tighter", sig:{RO:1}},{t:"Weakness or fatigue holding the position", sig:{ST:1}}]}] },
  { id:"ub_summary", name:"Session Check-in", subtitle:"", grad:["#E4DDD6","#C4B8B0"], time:"", conditional:false, double_score:false, videoId:null, isSummary:true, how:"", qs:[{ id:"ub_summary_q", text:"Compared to before the session, how does your upper back feel now?", opts:[{t:"Better — less pain or more comfortable", sig:{}},{t:"No change", sig:{}},{t:"Slightly worse — more discomfort", sig:{}},{t:"Significantly worse — pain increased", sig:{}},{t:"I had no pain to begin with", sig:{}}]}] },
];

// --- WRIST POSTURES -----------------------------------------------------------
const WRIST_POSTURES = [
  { id:"wr_p1", name:"Wrist Rotation", subtitle:"Circumduction ROM Baseline", grad:["#A8CCCA","#6AA8A4"], time:"~45 sec", conditional:false, double_score:false, videoId:null, how:"Make slow, large circles with each wrist — both clockwise and counterclockwise. Both wrists separately. Observe range and smoothness.", qs:[{ id:"wr_p1q1", text:"Make slow circles with each wrist. What do you notice about the range and quality of movement?", opts:[{t:"Full and smooth — both wrists equal", sig:{}},{t:"One wrist slightly more restricted", sig:{MO:1}},{t:"Clicking or catching on one side", sig:{LA:1}},{t:"Pain on the outer side of the wrist (thumb or pinky side)", sig:{LA:1}},{t:"Both wrists restricted", sig:{MO:1}},{t:"No sensation", sig:{}},{t:"Pain at the end of the circular range", sig:{LA:1}}]}] },
  { id:"wr_p2", name:"Prayer Hands", subtitle:"Anjali Mudra — Passive Extension", grad:["#B4D0B0","#80B07C"], time:"~30 sec", conditional:false, double_score:false, videoId:null, how:"Press your palms together in front of your chest, fingers pointing up. Both wrists in passive extension. Note range and any symptoms.", qs:[{ id:"wr_p2q1", text:"Press your palms together in front of your chest, fingers pointing up. How far can the wrists extend and how do they feel?", opts:[{t:"Comfortable — full extension", sig:{}},{t:"Mild tightness — manageable", sig:{MO:1}},{t:"Pain at the back of the wrist", sig:{EX:1}},{t:"Could not fully flatten palms — limited extension", sig:{EX:1, MO:1}},{t:"Tingling or numbness in the fingers", sig:{NN:1}}]}] },
  { id:"wr_p3", name:"Table Top", subtitle:"Bharmanasana — Loaded Extension", grad:["#C4B8D4","#9880B4"], time:"~45 sec", conditional:false, double_score:false, videoId:null, how:"Come to hands and knees, wrists directly under shoulders, fingers spread wide. Moderate weight-bearing. Hold 4 breaths.", qs:[{ id:"wr_p3q1", text:"On hands and knees, with wrists under shoulders — how do your wrists feel under this load?", opts:[{t:"Comfortable — stable and strong", sig:{}},{t:"Mild pressure — manageable", sig:{}},{t:"Pain at the back of the wrist", sig:{EX:1}},{t:"Wrist instability or wobbling", sig:{ST:1}},{t:"Could not hold — wrist weakness or pain", sig:{ST:1}}]}] },
  { id:"wr_p4", name:"Downward Dog", subtitle:"Adho Mukha Svanasana ★ ×2", grad:["#D0BCA8","#B09880"], time:"~45 sec", conditional:false, double_score:true, videoId:null, how:"From hands and knees, tuck toes and lift hips to full Downward Dog. Press through the base of the fingers. Hold 4 breaths.", qs:[{ id:"wr_p4q1", text:"Hold Downward Dog for 4 breaths, pressing through the base of the fingers. How do the wrists respond under this load?", opts:[{t:"Comfortable and stable", sig:{}},{t:"Mild discomfort — manageable", sig:{EX:1}},{t:"Pain at the back of the wrist", sig:{EX:1}},{t:"Wrist instability or shaking", sig:{ST:1}},{t:"Sharp pain — had to come out of position", sig:{EX:1}}]}] },
  { id:"wr_p5", name:"Reverse Prayer", subtitle:"Paschima Anjali Mudra — Wrist Flexion", grad:["#B8CCDC","#84A4C0"], time:"~30 sec", conditional:false, double_score:false, videoId:null, how:"Bring your hands behind your back, fingers pointing down, pressing palms together if possible. Tests wrist flexion range.", qs:[{ id:"wr_p5q1", text:"With hands behind your back, fingers pointing down, press palms together. How does this position feel in the wrists?", opts:[{t:"Comfortable — full flexion", sig:{}},{t:"Mild tightness at the front of the wrist", sig:{MO:1}},{t:"Pain at the front of the wrist (palm side)", sig:{FL:1}},{t:"Could not fully flex — limited range", sig:{FL:1, MO:1}},{t:"Tingling or numbness in the fingers", sig:{NN:1}}]}] },
  { id:"wr_p6", name:"Fist to Extension", subtitle:"Tendon Glide + Neural Screen ★ ×2", grad:["#C8B8DC","#A090C0"], time:"~45 sec", conditional:false, double_score:true, videoId:null, how:"Slowly make a full fist, then fully extend and spread your fingers wide. Repeat 5 times smoothly.", qs:[{ id:"wr_p6q1", text:"Slowly make a full fist, then extend and spread your fingers wide. Repeat 5 times. How do your hands and wrists feel?", opts:[{t:"Smooth and pain-free throughout", sig:{}},{t:"Stiffness on opening or closing", sig:{MO:1}},{t:"Pain on the thumb side of the wrist", sig:{LA:1}},{t:"Pain on the pinky side of the wrist", sig:{LA:1}},{t:"Tingling or numbness with repeated movement", sig:{NN:1}}]}] },
  { id:"wr_p7", name:"Modified Plank on Fists", subtitle:"Neutral Wrist Load Test", grad:["#DCC8B0","#C0A484"], time:"~45 sec", conditional:false, double_score:false, videoId:null, how:"Hold a plank position on closed fists — wrists in neutral. Compare comfort to the flat-hand Downward Dog.", qs:[{ id:"wr_p7q1", text:"Hold a plank on closed fists. How do your wrists feel compared to the flat-hand positions?", opts:[{t:"More comfortable on fists — wrists feel relieved", sig:{EX:1}},{t:"Similar to flat hands — no difference", sig:{}},{t:"Still painful even on fists", sig:{FL:1}},{t:"Instability or weakness even on fists", sig:{ST:1}},{t:"Could not maintain the position", sig:{ST:1}}]}] },
  { id:"wr_p8", name:"Wrist-Free Cat-Cow", subtitle:"Forearm Support — Unloaded Screen", grad:["#B4D4C4","#7CB898"], time:"~45 sec", conditional:false, double_score:false, videoId:null, how:"Perform Cat-Cow resting on your forearms instead of your palms, completely unloading the wrists. Note any residual symptoms.", qs:[{ id:"wr_p8q1", text:"Perform Cat-Cow resting on your forearms instead of your palms. How do the wrists and hands feel when completely unloaded?", opts:[{t:"Complete relief — no symptoms when unloaded", sig:{}},{t:"Mild residual tingling or numbness", sig:{NN:1}},{t:"No change — symptoms persist even unloaded", sig:{NN:1}},{t:"Pain persists even without wrist loading", sig:{LA:1}},{t:"Better but not fully resolved", sig:{}}]}] },
  { id:"wr_p9", name:"Wrist Traction Test", subtitle:"Passive Decompression", grad:["#A8CCCA","#6AA8A4"], time:"~30 sec", conditional:false, double_score:false, videoId:null, how:"Option A: Gently hang from a pull-up bar for 5–10 seconds. Option B: Extend one arm forward, gently pull the hand backward with the other hand for mild traction.", qs:[{ id:"wr_p9q1", text:"When the wrist is gently tractioned, how do the symptoms change?", opts:[{t:"Symptoms improve or feel relieved", sig:{EX:1}},{t:"No change", sig:{}},{t:"Pain increases during traction", sig:{FL:1}},{t:"Tingling or numbness increases", sig:{NN:1}},{t:"Feels weak or unstable", sig:{ST:1}}]}] },
  { id:"wr_summary", name:"Session Check-in", subtitle:"", grad:["#E4DDD6","#C4B8B0"], time:"", conditional:false, double_score:false, videoId:null, isSummary:true, how:"", qs:[{ id:"wr_summary_q", text:"Compared to before the session, how does your wrist feel now?", opts:[{t:"Better — less pain or more comfortable", sig:{}},{t:"No change", sig:{}},{t:"Slightly worse — more discomfort", sig:{}},{t:"Significantly worse — pain increased", sig:{}},{t:"I had no pain to begin with", sig:{}}]}] },
];

// --- SHLDR POSTURES -----------------------------------------------------------
const SHLDR_POSTURES = [
  { id:"sh_p1", name:"Mountain Pose — Arm Raise", subtitle:"Overhead Flexion Baseline", grad:["#A8CCCA","#6AA8A4"], time:"~45 sec", conditional:false, double_score:false, videoId:null, how:"Standing. Slowly raise both arms overhead — go as far as comfortable. Observe any asymmetry, pain arc between 60–120°, or end-range restriction.", qs:[{ id:"sh_p1q1", text:"Slowly raise both arms overhead. How do your shoulders feel at full reach?", opts:[{t:"Smooth and pain-free — both sides", sig:{}},{t:"One arm reaches higher than the other", sig:{MO:1}},{t:"Pain in front of shoulder during the lift", sig:{IM:1}},{t:"Pain at the top — couldn't fully reach", sig:{IM:1}},{t:"Both arms restricted — couldn't reach fully", sig:{FR:1, MO:1}}]}] },
  { id:"sh_p2", name:"Shoulder Circles", subtitle:"Circumduction ROM Screen", grad:["#B4D0B0","#80B07C"], time:"~45 sec", conditional:false, double_score:false, videoId:null, how:"Make large, slow circles with each arm — forward and backward. Both directions. Focus on smooth movement and any catching or pain arc.", qs:[{ id:"sh_p2q1", text:"Make large slow circles with each arm in both directions. What do you notice about the full range?", opts:[{t:"Full and smooth in both directions", sig:{}},{t:"Catching or clicking in one shoulder", sig:{RC:1}},{t:"Restricted in a portion of the arc", sig:{FR:1, MO:1}},{t:"Pain at a specific point in the arc", sig:{IM:1, RC:1}},{t:"Significantly restricted — couldn't complete", sig:{FR:1, MO:1}}]}] },
  { id:"sh_p3", name:"Doorway Stretch", subtitle:"Anterior Capsule Screen", grad:["#C4B8D4","#9880B4"], time:"~30 sec", conditional:false, double_score:false, videoId:null, how:"Stand in a doorway with forearms on the frame at shoulder height. Gently lean forward slightly. Alternative: fingers interlaced behind the back, gently lift arms away from body.", qs:[{ id:"sh_p3q1", text:"With forearms on a doorframe, gently lean forward. How does the front of your shoulder feel?", opts:[{t:"Comfortable stretch across the chest", sig:{}},{t:"Tightness across front of shoulder", sig:{MO:1}},{t:"Pain at the front of the shoulder", sig:{IM:1}},{t:"Sharp or catching sensation", sig:{IM:1}},{t:"Could not achieve this position", sig:{FR:1, MO:1}}]}] },
  { id:"sh_p4", name:"Wall Slide", subtitle:"Overhead Scapular Stability", grad:["#D0BCA8","#B09880"], time:"~45 sec", conditional:false, double_score:false, videoId:null, how:"Back against a wall, arms at 90° (goalpost position). Slide both arms overhead while maintaining full back/arm contact with the wall.", qs:[{ id:"sh_p4q1", text:"With your back against a wall, slide both arms overhead. How do your shoulders respond?", opts:[{t:"Smooth and controlled — full contact", sig:{}},{t:"One arm lifts off the wall earlier", sig:{ST:1, MO:1}},{t:"Both arms lift off — couldn't maintain contact", sig:{ST:1}},{t:"Pain at the front of shoulder on the way up", sig:{IM:1}},{t:"Shoulder instability or giving way", sig:{ST:1}}]}] },
  { id:"sh_p5", name:"Cow Face Arms", subtitle:"Gomukhasana Arms ★ ×2", grad:["#B8CCDC","#84A4C0"], time:"~60 sec", conditional:false, double_score:true, videoId:null, how:"Reach one arm up and behind your head (external rotation). Reach the other arm behind your lower back (internal rotation). Try to clasp or bring fingers close. Both sides.", qs:[{ id:"sh_p5q1", text:"Reaching your upper arm behind your head — how does the shoulder feel at the top?", opts:[{t:"Comfortable — full reach behind head", sig:{}},{t:"Restricted — couldn't reach far behind head", sig:{FR:1, MO:1}},{t:"Pain at front of shoulder", sig:{IM:1}},{t:"Catching or clicking sensation", sig:{RC:1}},{t:"Pain behind the shoulder", sig:{PO:1}}]},{ id:"sh_p5q2", text:"Reaching your lower arm behind your back — how does the shoulder feel?", opts:[{t:"Comfortable — hand reaches between shoulder blades", sig:{}},{t:"Restricted — couldn't reach far up the back", sig:{PO:1, MO:1}},{t:"Pain behind the shoulder", sig:{PO:1}},{t:"Pain at front of shoulder", sig:{IM:1}},{t:"Significant asymmetry between sides", sig:{FR:1}}]}] },
  { id:"sh_p6", name:"Side-Lying External Rotation", subtitle:"Rotator Cuff Screen", grad:["#C8B8DC","#A090C0"], time:"~45 sec", conditional:false, double_score:false, videoId:null, how:"Lie on your side, top arm bent to 90° at the elbow, elbow at your waist. Rotate your forearm upward toward the ceiling. Both sides.", qs:[{ id:"sh_p6q1", text:"Lying on your side, rotate your forearm toward the ceiling. How does the shoulder respond?", opts:[{t:"Smooth and pain-free", sig:{}},{t:"Weakness — difficult to control", sig:{RC:1, ST:1}},{t:"Pain on rotation", sig:{RC:1}},{t:"Catching or clicking", sig:{RC:1}},{t:"Pain behind the shoulder", sig:{PO:1}}]}] },
  { id:"sh_p7", name:"Eagle Arms", subtitle:"Garudasana Arms", grad:["#DCC8B0","#C0A484"], time:"~45 sec", conditional:false, double_score:false, videoId:null, how:"Wrap your arms in eagle position — one elbow over the other, forearms crossed. Draw elbows forward and slightly up. Hold 4 breaths.", qs:[{ id:"sh_p7q1", text:"With arms in eagle position, how do your shoulders feel?", opts:[{t:"Comfortable stretch", sig:{}},{t:"Restricted — couldn't wrap fully", sig:{FR:1, MO:1}},{t:"Pain at front of shoulder", sig:{IM:1}},{t:"Pain behind shoulder or between blades", sig:{PO:1}},{t:"Significant asymmetry between sides", sig:{MO:1}}]}] },
  { id:"sh_p8", name:"Warrior II Arms", subtitle:"Virabhadrasana II — Sustained Abduction", grad:["#B4D4C4","#7CB898"], time:"~45 sec", conditional:false, double_score:false, videoId:null, how:"Stand with arms extended out to the sides at shoulder height, palms down. Hold 30 seconds. Focus on shoulder fatigue and scapular control.", qs:[{ id:"sh_p8q1", text:"With arms extended at shoulder height for 30 seconds, how do your shoulders respond?", opts:[{t:"Comfortable — held easily", sig:{}},{t:"Muscle fatigue — arms dropped early", sig:{ST:1}},{t:"Pain in front of shoulder", sig:{IM:1}},{t:"Pain at top of shoulder", sig:{IM:1, RC:1}},{t:"One side significantly weaker", sig:{ST:1}}]}] },
  { id:"sh_p9", name:"Prone Y-Raise", subtitle:"Lower Trapezius Activation", grad:["#A8CCCA","#6AA8A4"], time:"~45 sec", conditional:false, double_score:false, videoId:null, how:"Lie face down, arms in a Y-position overhead. Slowly lift both arms off the floor using your mid-back muscles. Hold 3 seconds. Repeat 5×.", qs:[{ id:"sh_p9q1", text:"Lying face down, lift both arms in a Y-position. How do your shoulders and mid-back respond?", opts:[{t:"Strong and controlled", sig:{}},{t:"Fatigued quickly — couldn't hold", sig:{ST:1}},{t:"Pain at front of shoulder on lifting", sig:{IM:1}},{t:"Couldn't lift arms off the floor", sig:{ST:1}},{t:"Pain between shoulder blades", sig:{}, xover:true}]}] },
  { id:"sh_summary", name:"Session Check-in", subtitle:"", grad:["#E4DDD6","#C4B8B0"], time:"", conditional:false, double_score:false, videoId:null, isSummary:true, how:"", qs:[{ id:"sh_summary_q", text:"Compared to before the session, how does your shoulder feel now?", opts:[{t:"Better — less pain or more comfortable", sig:{}},{t:"No change", sig:{}},{t:"Slightly worse — more discomfort", sig:{}},{t:"Significantly worse — pain increased", sig:{}},{t:"I had no pain to begin with", sig:{}}]}] },
];

// --- CROSSOVER MINI-SEQUENCES -------------------------------------------------
const LB_MINI_IDS = ["knee-hug", "sphinx", "hip-hinge", "bridge", "supine-twist"];
const HIP_MINI_IDS = ["hip_p1", "hip_p3", "hip_p5", "hip_p6", "hip_p8"];
const KNEE_MINI_IDS = ["knee_p3", "knee_p4", "knee_p5", "knee_p8", "knee_p7"];
const ANKLE_MINI_IDS = ["ankle_p2", "ankle_p3", "ankle_p4", "ankle_p5", "ankle_p6"];
const NECK_MINI_IDS = ["neck_p1", "neck_p3", "neck_p5", "neck_p7", "neck_p10"];
const UBACK_MINI_IDS = ["ub_p1", "ub_p3", "ub_p4", "ub_p6", "ub_p9"];
const WRIST_MINI_IDS = ["wr_p2", "wr_p4", "wr_p5", "wr_p6", "wr_p7"];
const SHLDR_MINI_IDS = ["sh_p1", "sh_p3", "sh_p5", "sh_p6", "sh_p8"];

function getCrossoverPostures(fromArea) {
  // Phase 2 uses the SAME body area's postures, not the adjacent area
  if (fromArea === "LB") return LB_POSTURES.filter((p) => LB_MINI_IDS.includes(p.id));
  if (fromArea === "HIP") return HIP_POSTURES.filter((p) => HIP_MINI_IDS.includes(p.id));
  if (fromArea === "KNEE") return KNEE_POSTURES.filter((p) => KNEE_MINI_IDS.includes(p.id));
  if (fromArea === "ANKLE") return ANKLE_POSTURES.filter((p) => ANKLE_MINI_IDS.includes(p.id));
  if (fromArea === "NECK") return NECK_POSTURES.filter((p) => NECK_MINI_IDS.includes(p.id));
  if (fromArea === "UBACK") return UBACK_POSTURES.filter((p) => UBACK_MINI_IDS.includes(p.id));
  if (fromArea === "WRIST") return WRIST_POSTURES.filter((p) => WRIST_MINI_IDS.includes(p.id));
  if (fromArea === "SHLDR") return SHLDR_POSTURES.filter((p) => SHLDR_MINI_IDS.includes(p.id));
  return [];
}

// --- ENGINE -------------------------------------------------------------------
function emptyScores(area) {
  if (area === "LB") return { FL: 0, EX: 0, NE: 0, LI: 0, ST: 0 };
  if (area === "HIP") return { AN: 0, LA: 0, PO: 0, NE: 0, ST: 0, MO: 0 };
  if (area === "KNEE") return { PA: 0, ME: 0, LA: 0, PO: 0, ST: 0, MO: 0 };
  if (area === "ANKLE") return { AN: 0, AC: 0, PF: 0, LA: 0, ST: 0, MO: 0 };
  if (area === "NECK") return { FL: 0, EX: 0, NE: 0, LA: 0, ST: 0, MO: 0 };
  if (area === "UBACK") return { EX: 0, RO: 0, CO: 0, NE: 0, ST: 0, MO: 0 };
  if (area === "WRIST") return { EX: 0, FL: 0, LA: 0, NN: 0, ST: 0, MO: 0 };
  if (area === "SHLDR") return { IM: 0, RC: 0, FR: 0, PO: 0, ST: 0, MO: 0 };
  return {};
}

function calculateScores(sessionAnswers, postures) {
  const scores = {};
  for (const posture of postures) {
    const mult = posture.double_score ? 2 : 1;
    for (const q of posture.qs) {
      const ans = sessionAnswers[q.id];
      if (!ans) continue;
      const opt = q.opts.find((o) => o.t === ans);
      if (!opt || !opt.sig) continue;
      for (const [profile, pts] of Object.entries(opt.sig)) {
        scores[profile] = (scores[profile] || 0) + pts * mult;
      }
    }
  }
  return scores;
}

function resolveProfile(area, rawScores, sessionAnswers, irritabilityLevel) {
  const s = { ...emptyScores(area), ...rawScores };
  if (area === "LB" && irritabilityLevel >= 3) s.LI = (s.LI || 0) + 1;

  // --- Decision tree for NECK ---
  if (area === "NECK") {
    let dizziness_flag = false;
    // Check dizziness in any posture
    const allPostures = getPosturesForArea("NECK");
    for (const p of allPostures) {
      for (const q of p.qs) {
        const ans = sessionAnswers[q.id];
        if (!ans) continue;
        const opt = q.opts.find(o => o.t === ans);
        if (opt && opt.dizziness) dizziness_flag = true;
      }
    }

    // NE check
    const neSignals = Object.values(s).length; // count from scores
    if (s.NE >= 4) return _finalize(s, "NE", area, sessionAnswers);

    // FL: neck_p3, neck_p8, neck_p10
    const flSigs = [
      sessionAnswers["neck_p3q1"] === "Pain at the back of the neck",
      sessionAnswers["neck_p8q1"] === "Pain at the back of the neck" || sessionAnswers["neck_p8q1"] === "Neck pain worsened in this position",
      sessionAnswers["neck_p10q1"] === "Pain at the back of the neck",
    ].filter(Boolean).length;
    if (flSigs >= 2) return _finalize(s, "FL", area, sessionAnswers, dizziness_flag);

    // EX
    const exSigs = [
      sessionAnswers["neck_p4q1"] === "Pain at the back of the neck or base of skull" || sessionAnswers["neck_p4q1"] === "Pulling sensation into the shoulder or arm",
      sessionAnswers["neck_p7q1"] === "Pain or pressure at the back of the neck",
      sessionAnswers["neck_p9q1"] === "Pain or pressure at the back of the neck" || sessionAnswers["neck_p9q1"] === "Strong discomfort or dizziness — had to come out",
    ].filter(Boolean).length;
    if (exSigs >= 2) return _finalize(s, "EX", area, sessionAnswers, dizziness_flag);

    // LA
    const laSigs = [
      sessionAnswers["neck_p1q1"] === "One side is more restricted than the other" || sessionAnswers["neck_p1q1"] === "One side causes pain or discomfort",
      sessionAnswers["neck_p5q1"] === "Restricted on one side — couldn't reach fully" || sessionAnswers["neck_p5q1"] === "Pain or discomfort on one side",
      sessionAnswers["neck_p6q1"] === "Restricted on one side — couldn't rotate fully" || sessionAnswers["neck_p6q1"] === "Pain or discomfort on one side",
    ].filter(Boolean).length;
    if (laSigs >= 2) return _finalize(s, "LA", area, sessionAnswers, dizziness_flag);

    // ST
    const stSigs = [
      sessionAnswers["neck_p7q1"] === "Neck fatigue or effort to hold head up",
      sessionAnswers["neck_p9q1"] === "Neck weakness — difficulty sustaining position",
      sessionAnswers["neck_p10q1"] === "Neck weakness — hard to sustain position",
      sessionAnswers["neck_p2q1"] === "Movement felt difficult to control",
    ].filter(Boolean).length;
    if (stSigs >= 2) return _finalize(s, "ST", area, sessionAnswers, dizziness_flag);

    // MO — no sharp pain
    const hasSharpPain = s.FL >= 2 || s.EX >= 2 || s.NE >= 2;
    const moSigs = [
      sessionAnswers["neck_p1q1"] === "Slightly restricted but no pain" || sessionAnswers["neck_p1q1"] === "Both sides cause pain or discomfort",
      sessionAnswers["neck_p5q1"] === "Restricted and tight on both sides",
      sessionAnswers["neck_p6q1"] === "Restricted on one side — couldn't rotate fully" || sessionAnswers["neck_p6q1"] === "Pain at the back of the neck on both sides",
      sessionAnswers["neck_p3q1"] === "Tightness at the back of the neck",
    ].filter(Boolean).length;
    if (moSigs >= 2 && !hasSharpPain) return _finalize(s, "MO", area, sessionAnswers, dizziness_flag);

    // Fallback
    const fallbackProfile = s.ST >= s.MO ? (s.ST > s.MO ? "ST" : "MO") : "MO";
    return _finalize(s, fallbackProfile, area, sessionAnswers, dizziness_flag);
  }

  // --- Decision tree for UBACK ---
  if (area === "UBACK") {
    if (s.NE >= 4) return _finalize(s, "NE", area, sessionAnswers);

    const exSigs = [
      sessionAnswers["ub_p1q1"] === "Easier to round (cat) than to arch (cow)" || sessionAnswers["ub_p1q1"] === "Movement was painful in one direction",
      sessionAnswers["ub_p3q1"] === "Tight — chest resisted opening" || sessionAnswers["ub_p3q1"] === "Pain or pressure in the upper/mid back" || sessionAnswers["ub_p3q1"] === "Strong discomfort — had to come out",
      sessionAnswers["ub_p5q1"] === "Tight — difficult to lower chest" || sessionAnswers["ub_p5q1"] === "Pain in mid/upper back",
      sessionAnswers["ub_p7q1"] === "Pain or pressure in the mid/upper back",
    ].filter(Boolean).length;
    if (exSigs >= 2) return _finalize(s, "EX", area, sessionAnswers);

    const roSigs = [
      sessionAnswers["ub_p2q1"] === "One side more restricted than the other" || sessionAnswers["ub_p2q1"] === "One side caused pain or discomfort",
      sessionAnswers["ub_p4q1"] === "One side more restricted than the other" || sessionAnswers["ub_p4q1"] === "One side caused pain in upper/mid back",
      sessionAnswers["ub_p6q1"] === "One side significantly more restricted" || sessionAnswers["ub_p6q1"] === "Pain in upper back on one side",
      sessionAnswers["ub_p9q1"] === "One shoulder significantly higher or tighter",
    ].filter(Boolean).length;
    if (roSigs >= 2) return _finalize(s, "RO", area, sessionAnswers);

    const coSigs = [
      sessionAnswers["ub_p1q1"] === "Movement was painful in one direction",
      sessionAnswers["ub_p6q1"] === "Pain in upper back on both sides",
      sessionAnswers["ub_p8q1"] === "Pain in upper/mid back",
      sessionAnswers["ub_p9q1"] === "Pain or pressure between shoulder blades",
    ].filter(Boolean).length;
    if (coSigs >= 2) return _finalize(s, "CO", area, sessionAnswers);

    const stSigs = [
      sessionAnswers["ub_p7q1"] === "Muscle effort — managed to lift" || sessionAnswers["ub_p7q1"] === "Fatigued quickly — couldn't hold position",
      sessionAnswers["ub_p9q1"] === "Weakness or fatigue holding the position",
    ].filter(Boolean).length;
    if (stSigs >= 2) return _finalize(s, "ST", area, sessionAnswers);

    const hasSharpPain = s.EX >= 2 || s.NE >= 2 || s.CO >= 2;
    const moSigs = [
      sessionAnswers["ub_p1q1"] === "Both directions feel stiff or restricted",
      sessionAnswers["ub_p4q1"] === "Both sides restricted equally",
      sessionAnswers["ub_p3q1"] === "Tight — chest resisted opening",
      sessionAnswers["ub_p6q1"] === "One side significantly more restricted",
    ].filter(Boolean).length;
    if (moSigs >= 2 && !hasSharpPain) return _finalize(s, "MO", area, sessionAnswers);

    const fb = s.ST >= s.MO ? (s.ST > s.MO ? "ST" : "MO") : "MO";
    return _finalize(s, fb, area, sessionAnswers);
  }

  // --- Decision tree for WRIST ---
  if (area === "WRIST") {
    // NN neural check
    const nnSigs = [
      sessionAnswers["wr_p2q1"]?.includes("Tingling") || sessionAnswers["wr_p2q1"]?.includes("numbness"),
      sessionAnswers["wr_p5q1"]?.includes("Tingling") || sessionAnswers["wr_p5q1"]?.includes("numbness"),
      sessionAnswers["wr_p6q1"]?.includes("Tingling") || sessionAnswers["wr_p6q1"]?.includes("numbness"),
      sessionAnswers["wr_p8q1"]?.includes("Tingling") || sessionAnswers["wr_p8q1"]?.includes("numbness") || sessionAnswers["wr_p8q1"]?.includes("symptoms persist"),
      sessionAnswers["wr_p9q1"]?.includes("Tingling") || sessionAnswers["wr_p9q1"]?.includes("numbness"),
    ].filter(Boolean).length;
    if (nnSigs >= 2) return _finalize(s, "NN", area, sessionAnswers);

    const exSigs = [
      sessionAnswers["wr_p2q1"] === "Pain at the back of the wrist",
      sessionAnswers["wr_p3q1"] === "Pain at the back of the wrist",
      sessionAnswers["wr_p4q1"] === "Mild discomfort — manageable" || sessionAnswers["wr_p4q1"] === "Pain at the back of the wrist" || sessionAnswers["wr_p4q1"] === "Sharp pain — had to come out of position",
      sessionAnswers["wr_p7q1"] === "More comfortable on fists — wrists feel relieved",
    ].filter(Boolean).length;
    if (exSigs >= 2) return _finalize(s, "EX", area, sessionAnswers);

    const flSigs = [
      sessionAnswers["wr_p5q1"] === "Pain at the front of the wrist (palm side)" || sessionAnswers["wr_p5q1"] === "Could not fully flex — limited range",
      sessionAnswers["wr_p7q1"] === "Still painful even on fists",
    ].filter(Boolean).length;
    if (flSigs >= 2) return _finalize(s, "FL", area, sessionAnswers);

    const laSigs = [
      sessionAnswers["wr_p1q1"] === "Clicking or catching on one side" || sessionAnswers["wr_p1q1"] === "Pain on the outer side of the wrist (thumb or pinky side)" || sessionAnswers["wr_p1q1"] === "Pain at the end of the circular range",
      sessionAnswers["wr_p6q1"] === "Pain on the thumb side of the wrist" || sessionAnswers["wr_p6q1"] === "Pain on the pinky side of the wrist",
    ].filter(Boolean).length;
    if (laSigs >= 2) return _finalize(s, "LA", area, sessionAnswers);

    const stSigs = [
      sessionAnswers["wr_p3q1"] === "Wrist instability or wobbling" || sessionAnswers["wr_p3q1"] === "Could not hold — wrist weakness or pain",
      sessionAnswers["wr_p4q1"] === "Wrist instability or shaking",
      sessionAnswers["wr_p7q1"] === "Instability or weakness even on fists" || sessionAnswers["wr_p7q1"] === "Could not maintain the position",
    ].filter(Boolean).length;
    if (stSigs >= 2) return _finalize(s, "ST", area, sessionAnswers);

    const hasSharpPain = s.EX >= 2 || s.NN >= 2 || s.FL >= 2;
    const moSigs = [
      sessionAnswers["wr_p1q1"] === "One wrist slightly more restricted" || sessionAnswers["wr_p1q1"] === "Both wrists restricted",
      sessionAnswers["wr_p2q1"] === "Mild tightness — manageable" || sessionAnswers["wr_p2q1"] === "Could not fully flatten palms — limited extension",
      sessionAnswers["wr_p5q1"] === "Mild tightness at the front of the wrist" || sessionAnswers["wr_p5q1"] === "Could not fully flex — limited range",
    ].filter(Boolean).length;
    if (moSigs >= 2 && !hasSharpPain) return _finalize(s, "MO", area, sessionAnswers);

    // Fallback: 3+ profiles → ST (conservative)
    const highProfiles = Object.values(s).filter(v => v >= 3).length;
    if (highProfiles >= 3) return _finalize(s, "ST", area, sessionAnswers);
    const fb = s.ST >= s.MO ? (s.ST > s.MO ? "ST" : "MO") : "MO";
    return _finalize(s, fb, area, sessionAnswers);
  }

  // --- Decision tree for SHLDR ---
  if (area === "SHLDR") {
    let frozen_flag = false;

    // FR — threshold: 3+ signals
    const frSigs = [
      sessionAnswers["sh_p1q1"] === "Both arms restricted — couldn't reach fully",
      sessionAnswers["sh_p2q1"] === "Significantly restricted — couldn't complete",
      sessionAnswers["sh_p5q1"]?.includes("Could not reach behind the head"),
      sessionAnswers["sh_p5q2"]?.includes("Could not reach behind the back"),
      sessionAnswers["sh_p6q1"]?.includes("Could not achieve"),
    ].filter(Boolean).length;
    if (frSigs >= 1) frozen_flag = true;
    if (frSigs >= 3) return _finalize(s, "FR", area, sessionAnswers, false, frozen_flag);

    // IM
    const imSigs = [
      sessionAnswers["sh_p1q1"] === "Pain in front of shoulder during the lift" || sessionAnswers["sh_p1q1"] === "Pain at the top — couldn't fully reach",
      sessionAnswers["sh_p3q1"] === "Pain at the front of the shoulder" || sessionAnswers["sh_p3q1"] === "Sharp or catching sensation",
      sessionAnswers["sh_p4q1"] === "Pain at the front of shoulder on the way up",
      sessionAnswers["sh_p5q1"]?.includes("Pain at front of shoulder"),
      sessionAnswers["sh_p7q1"]?.includes("Front of shoulder pain"),
      sessionAnswers["sh_p8q1"]?.includes("Front of shoulder pain"),
    ].filter(Boolean).length;
    if (imSigs >= 2) return _finalize(s, "IM", area, sessionAnswers, false, frozen_flag);

    // RC
    const rcSigs = [
      sessionAnswers["sh_p2q1"] === "Catching or clicking in one shoulder",
      sessionAnswers["sh_p5q1"]?.includes("Sharp or catching"),
      sessionAnswers["sh_p5q2"]?.includes("Sharp or catching") || sessionAnswers["sh_p5q2"]?.includes("Pain behind the shoulder"),
      sessionAnswers["sh_p9q1"]?.includes("Pain behind one shoulder"),
    ].filter(Boolean).length;
    if (rcSigs >= 2) return _finalize(s, "RC", area, sessionAnswers, false, frozen_flag);

    // PO
    const poSigs = [
      sessionAnswers["sh_p6q1"]?.includes("Pain behind"),
      sessionAnswers["sh_p5q2"]?.includes("Pain behind the shoulder") || sessionAnswers["sh_p5q2"]?.includes("Could not reach behind the back"),
      sessionAnswers["sh_p9q1"]?.includes("Tightness behind one shoulder") || sessionAnswers["sh_p9q1"]?.includes("Pain behind one shoulder") || sessionAnswers["sh_p9q1"]?.includes("One side significantly more restricted"),
    ].filter(Boolean).length;
    if (poSigs >= 2) return _finalize(s, "PO", area, sessionAnswers, false, frozen_flag);

    // ST
    const stSigs = [
      sessionAnswers["sh_p4q1"] === "One arm lifts off the wall earlier" || sessionAnswers["sh_p4q1"] === "Both arms lift off — couldn't maintain contact" || sessionAnswers["sh_p4q1"] === "Shoulder instability or giving way",
      sessionAnswers["sh_p7q1"]?.includes("instability") || sessionAnswers["sh_p7q1"]?.includes("Could not hold") || sessionAnswers["sh_p7q1"]?.includes("fatigued"),
      sessionAnswers["sh_p8q1"]?.includes("winging") || sessionAnswers["sh_p8q1"]?.includes("One shoulder more stable") || sessionAnswers["sh_p8q1"]?.includes("Trembling"),
    ].filter(Boolean).length;
    if (stSigs >= 2) return _finalize(s, "ST", area, sessionAnswers, false, frozen_flag);

    // MO
    const hasSharpPain = s.IM >= 2 || s.RC >= 2 || s.FR >= 2;
    const moSigs = [
      sessionAnswers["sh_p1q1"] === "Both arms restricted — couldn't reach fully",
      sessionAnswers["sh_p2q1"] === "Restricted in a portion of the arc",
      sessionAnswers["sh_p5q1"]?.includes("Tightness but manageable"),
      sessionAnswers["sh_p5q2"]?.includes("Tightness but manageable"),
      sessionAnswers["sh_p3q1"] === "Tightness across front of shoulder",
    ].filter(Boolean).length;
    if (moSigs >= 2 && !hasSharpPain) return _finalize(s, "MO", area, sessionAnswers, false, frozen_flag);

    // Fallback: 3+ profiles → ST
    const highProfiles = Object.values(s).filter(v => v >= 3).length;
    if (highProfiles >= 3) return _finalize(s, "ST", area, sessionAnswers, false, frozen_flag);
    const fb = s.ST >= s.MO ? (s.ST > s.MO ? "ST" : "MO") : "MO";
    return _finalize(s, fb, area, sessionAnswers, false, frozen_flag);
  }

  // --- Existing LB / HIP / KNEE / ANKLE logic ---
  const ranked = Object.entries(s).sort(([, a], [, b]) => b - a);
  const [top, topScore] = ranked[0];
  const [, secondScore] = ranked[1] ?? [null, 0];
  const isTie = secondScore === topScore && topScore > 0;
  const allZero = topScore === 0;
  const fallback = area === "LB" ? "LI" : "ST";
  let primary;
  if (allZero) { primary = fallback; }
  else if (isTie) {
    const tied = ranked.filter(([, v]) => v === topScore).map(([p]) => p);
    if (area === "LB" && tied.includes("LI") && tied.includes("ST")) primary = "LI";
    else if (area === "LB" && tied.includes("LI")) primary = "LI";
    else primary = top;
  } else { primary = top; }
  const highProfiles = ranked.filter(([, v]) => v >= 3).length;
  if (!allZero && highProfiles >= 3) primary = area === "LB" ? "LI" : "ST";
  let secondary = null;
  for (const [p, sc] of ranked) {
    if (p === primary) continue;
    if (sc >= 3) { secondary = p; break; }
  }
  if (area === "LB") {
    const neuralQ = [
      ["lb_p1q2", ["Also feel it in the buttock", "Also feel it in the leg"]],
      ["lb_p4q1", ["Felt a sensation traveling into the leg or buttock"]],
      ["lb_p7q1", ["One side caused pain or a leg sensation"]],
      ["lb_p8q1", ["Sensation traveling down the leg (tingling, numbness, or pain)"]],
      ["lb_p9q1", ["Sensation in the buttock or hip"]],
    ];
    const neSigs = neuralQ.filter(([id, vals]) => vals.includes(sessionAnswers[id])).length;
    if (neSigs >= 1 && primary !== "NE" && secondary !== "NE" && (s.NE || 0) > 0) secondary = "NE";
  }
  const summaryAns = sessionAnswers["knee_summary_q"] || sessionAnswers["ankle_summary_q"] || sessionAnswers["neck_summary_q"] || sessionAnswers["ub_summary_q"] || sessionAnswers["wr_summary_q"] || sessionAnswers["sh_summary_q"];
  let reassess = isTie || allZero;
  
  const totalSignal = Object.values(s).reduce((sum, v) => sum + v, 0);
  let confidence;
  if (totalSignal >= 5 && !isTie) confidence = "High";
  else if (totalSignal >= 3) confidence = "Medium";
  else confidence = "Low";
  
  if (summaryAns === "Significantly worse — pain increased") { reassess = true; confidence = "Low"; }
  if (summaryAns === "Better — less pain or more comfortable" && confidence === "Medium") confidence = "High";
  return { primary, secondary, confidence, reassess, scores: s };
}

// Helper to finalize profile resolution with consistent confidence scoring
function _finalize(scores, primary, area, sessionAnswers, dizziness_flag = false, frozen_flag = false) {
  const ranked = Object.entries(scores).sort(([, a], [, b]) => b - a);
  const [topKey, topScore] = ranked[0];
  const [, secondScore] = ranked[1] ?? [null, 0];
  const isTie = secondScore === topScore && topScore > 0;
  const margin = topScore - secondScore;
  
  let secondary = null;
  for (const [p, sc] of ranked) {
    if (p === primary) continue;
    if (sc >= 3) { secondary = p; break; }
  }

  // Confidence: tree + score agree with margin ≥ 2 → High
  const treeMatchesScore = primary === topKey;
  let confidence;
  if (treeMatchesScore && margin >= 2) confidence = "High";
  else if (treeMatchesScore || topScore >= 3) confidence = "Medium";
  else confidence = "Low";

  const summaryKey = area === "NECK" ? "neck_summary_q" : area === "UBACK" ? "ub_summary_q" : area === "WRIST" ? "wr_summary_q" : "sh_summary_q";
  const summaryAns = sessionAnswers[summaryKey];
  let reassess = isTie || topScore === 0;
  if (summaryAns === "Significantly worse — pain increased") { reassess = true; confidence = "Low"; }
  if (summaryAns === "Better — less pain or more comfortable" && confidence === "Medium") confidence = "High";

  return { primary, secondary, confidence, reassess, scores, dizziness_flag, frozen_flag };
}

function checkCrossover(area, sessionAnswers) {
  const vals = Object.values(sessionAnswers);
  if (area === "HIP") {
    const backPainPostures = { hip_p1q1: "Pain in lower back or pelvis", hip_p5q1: "Pain in lower back", hip_p6q1: "Lower back pain" };
    const backCount = Object.entries(backPainPostures).filter(([k, v]) => sessionAnswers[k] === v).length;
    const neural = vals.some((a) => a === "Pulling sensation down the leg" || a === "Pain spreading toward leg");
    const hipPain = ["Pain in hip joint", "Pain in front of hip or groin", "Pain in hip", "Pain in hip or buttock", "Pain on outside of hip"];
    const noHip = !vals.some((a) => hipPain.includes(a));
    const met = [backCount >= 2, neural, noHip].filter(Boolean).length;
    return met >= 2 ? "LB" : null;
  }
  if (area === "KNEE") {
    const hipQ = { knee_p3q1: "Pain in hip or groin", knee_p4q1: "Pain in hip or groin", knee_p7q1: "Pain in hip or groin" };
    const hipCount = Object.entries(hipQ).filter(([k, v]) => sessionAnswers[k] === v).length;
    const kneePainTerms = ["Pain behind or around the kneecap", "Pain on the inner side of the knee", "Pain on the outer side of the knee", "Pain in front of the knee", "Pain on inner knee", "Pain on outer knee"];
    const noKnee = !vals.some((a) => kneePainTerms.includes(a));
    const limitTerms = ["Tightness limiting the bend", "Could not fully straighten", "Halfway — stopped due to knee pain"];
    const fullROM = !vals.some((a) => limitTerms.includes(a));
    const met = [hipCount >= 2, noKnee, fullROM].filter(Boolean).length;
    return met >= 2 ? "HIP" : null;
  }
  if (area === "ANKLE") {
    const kneeQ = { ankle_p2q1: "Pain in knees instead", ankle_p5q1: "Pain in knee", ankle_p6q1: "Pain in knee" };
    const kneeCount = Object.entries(kneeQ).filter(([k, v]) => sessionAnswers[k] === v).length;
    const anklePain = ["Pinching or blocking at front of ankle", "Pinching at front of ankle", "Pain on outer ankle", "Pain in Achilles or back of ankle", "Pain in back of ankle or Achilles", "Pain under the heel"];
    const noAnkle = !vals.some((a) => anklePain.includes(a));
    const limitTerms = ["Tightness in calves — heels stayed up", "Tightness or stiffness in the front of the ankle", "Tightness limiting depth"];
    const fullROM = !vals.some((a) => limitTerms.includes(a));
    const met = [kneeCount >= 2, noAnkle, fullROM].filter(Boolean).length;
    return met >= 2 ? "KNEE" : null;
  }
  // NECK → crossover to UBACK
  if (area === "NECK") {
    const ubackXover = ["neck_p3q1", "neck_p8q1"].filter(id => {
      const a = sessionAnswers[id];
      return a && (a.includes("upper back") || a.includes("Pain in the upper back"));
    }).length;
    const neckPain = ["Pain at the back of the neck", "Pain or pressure at the back of the neck", "Pain on one side of the neck"];
    const noNeck = !vals.some(a => neckPain.includes(a));
    return ubackXover >= 2 && noNeck ? "UBACK" : null;
  }
  // UBACK → crossover to LB
  if (area === "UBACK") {
    const lbXover = ["ub_p1q1", "ub_p5q1", "ub_p6q1", "ub_p8q1"].filter(id => {
      const a = sessionAnswers[id];
      return a && (a.includes("lower back") || a.includes("Pain in lower back"));
    }).length;
    const ubPain = ["Pain or pressure in the upper/mid back", "Pain in upper back on one side", "Pain in upper back on both sides", "Pain in mid/upper back"];
    const noUB = !vals.some(a => ubPain.includes(a));
    return lbXover >= 2 && noUB ? "LB" : null;
  }
  // WRIST → crossover to NECK (neural referral)
  if (area === "WRIST") {
    const neuralCount = ["wr_p2q1", "wr_p5q1", "wr_p6q1", "wr_p8q1"].filter(id => {
      const a = sessionAnswers[id];
      return a && (a.includes("Tingling") || a.includes("numbness"));
    }).length;
    const wristPain = ["Pain at the back of the wrist", "Pain at the front of the wrist", "Pain on the thumb side", "Pain on the pinky side"];
    const noWrist = !vals.some(a => wristPain.some(wp => a && a.includes(wp)));
    return neuralCount >= 2 && noWrist ? "NECK" : null;
  }
  // SHLDR → crossover to NECK
  if (area === "SHLDR") {
    const neckRef = vals.filter(a => a && (a.includes("neck") || a.includes("between shoulder blades"))).length;
    const shoulderPain = ["Pain in front of shoulder", "Pain at front of shoulder", "Pain behind the shoulder", "Catching or clicking"];
    const noShoulder = !vals.some(a => shoulderPain.some(sp => a && a.includes(sp)));
    return neckRef >= 2 && noShoulder ? "NECK" : null;
  }
  return null;
}

function buildActivePostures(area, allPostures, sessionAnswers, irritabilityLevel) {
  return allPostures.filter((p) => {
    if (p.isSummary) return true;
    if (!p.conditional) return true;
    if (area === "LB" && p.id === "sphinx") return sessionAnswers["lb_p3q2"] !== "Worsened with movement";
    if (area === "LB" && p.id === "trikonasana") return irritabilityLevel <= 1;
    if (area === "ANKLE" && (p.id === "ankle_p7a" || p.id === "ankle_p7b")) {
      const treeAns = sessionAnswers["ankle_p5q1"];
      const warrAns = sessionAnswers["ankle_p6q1"];
      const stableTree = treeAns === "Stable" || treeAns === "Felt stable but required effort";
      const stableWarr = warrAns === "Smooth and controlled" || warrAns === "Felt stable but required effort";
      return stableTree && stableWarr;
    }
    return true;
  });
}

function getPosturesForArea(area) {
  if (area === "LB") return LB_POSTURES;
  if (area === "HIP") return HIP_POSTURES;
  if (area === "KNEE") return KNEE_POSTURES;
  if (area === "ANKLE") return ANKLE_POSTURES;
  if (area === "NECK") return NECK_POSTURES;
  if (area === "UBACK") return UBACK_POSTURES;
  if (area === "WRIST") return WRIST_POSTURES;
  if (area === "SHLDR") return SHLDR_POSTURES;
  return [];
}

// --- RED FLAGS for pre-diagnostic safety check (body-area-specific) -----------
const RED_FLAGS_BY_AREA = {
  LB: [
    "Loss of bladder or bowel control",
    "Progressive weakness in your leg(s)",
    "Numbness in the groin or inner thighs",
    "Fever combined with back pain",
    "Unexplained weight loss",
    "History of cancer with new onset back pain",
    "Pain that consistently wakes you at night",
    "Rapidly worsening symptoms",
    "Severe pain following a fall or accident",
  ],
  KNEE: [
    "Sudden severe swelling of the knee (not caused by activity)",
    "Inability to bear weight on the leg",
    "Knee feels locked or unable to straighten fully",
    "Joint gives way suddenly and completely",
    "Fever with joint swelling and warmth",
    "Severe pain or visible deformity following a fall or accident",
    "Rapidly worsening symptoms without a clear cause",
  ],
  HIP: [
    "Inability to bear weight on the leg following a fall",
    "Severe groin or hip pain following trauma (possible fracture)",
    "Sudden and complete loss of hip movement",
    "Fever with hip pain and swelling",
    "Rapidly worsening leg weakness or numbness",
  ],
  ANKLE: [
    "Inability to bear weight (possible fracture)",
    "Severe swelling or bruising appearing immediately after an injury",
    "Visible deformity of the ankle or foot",
    "Complete loss of ankle movement after injury",
    "Numbness or tingling in the foot following trauma",
    "Severe pain following a fall or accident",
  ],
  NECK: [
    "Sudden severe weakness or paralysis in the arm or hand",
    "Loss of bladder or bowel control (possible cervical myelopathy)",
    "Progressive numbness spreading down both arms or into the body",
    "Severe neck pain following a fall or trauma (possible fracture)",
    "Fever with neck stiffness and severe headache",
    "Difficulty swallowing, speaking, or coordinating movement",
    "Rapidly worsening neurological symptoms in the arms",
  ],
  UBACK: [
    "Sudden severe upper back pain following a fall, impact, or trauma (possible fracture)",
    "Progressive weakness, numbness, or tingling spreading into both arms or legs",
    "Loss of bladder or bowel control",
    "Unexplained weight loss with back pain",
    "Fever with upper back pain",
    "History of osteoporosis with new onset upper back pain",
    "Chest pain or shortness of breath accompanying upper back pain",
    "Rapidly worsening neurological symptoms",
  ],
  WRIST: [
    "Visible deformity of the wrist or hand following a fall or impact (possible fracture)",
    "Inability to grip or move fingers following a trauma",
    "Severe swelling or bruising immediately following an injury",
    "Progressive numbness spreading into the hand from the forearm or above",
    "Sudden complete loss of wrist or hand movement",
    "Fever with wrist pain and swelling (possible septic joint)",
    "Rapidly worsening neurological symptoms (spreading numbness, weakness)",
    "Suspected scaphoid fracture — wrist pain after fall onto outstretched hand, tenderness in the anatomical snuffbox",
  ],
  SHLDR: [
    "Sudden severe shoulder pain or inability to move arm following a fall or impact",
    "Visible deformity of the shoulder joint or collarbone",
    "Complete sudden loss of shoulder movement with severe pain (possible dislocation)",
    "Numbness or progressive weakness spreading down the arm",
    "Fever with shoulder pain and swelling (possible septic joint)",
    "Unexplained weight loss with shoulder pain",
    "Cancer history with new onset shoulder pain",
    "Rapidly worsening neurological symptoms in the arm",
  ],
};

function getRedFlagsForArea(areaKey) {
  return RED_FLAGS_BY_AREA[areaKey] || RED_FLAGS_BY_AREA.LB;
}

// --- AFFIRMATIONS -------------------------------------------------------------
// Calibrated encouragement microcopy — one per posture (1..8).
// Indexed by completed posture number (postureIdx + 1).
const AFFIRMATIONS = [
  "Good. We're calibrating.",                  // after Posture 1
  "That's helpful. Keep going.",               // after Posture 2
  "Three down. We're seeing your pattern.",    // after Posture 3
  "Halfway. The next ones are shorter.",       // after Posture 4
  "Five done. Three to go.",                   // after Posture 5
  "You're past the hardest part.",             // after Posture 6
  "One more after this.",                      // after Posture 7
  "Last one. Take it easy here.",              // after Posture 8
];

const Shell = ({ children, className = "" }) => (
  <div className={`min-h-screen bg-background flex justify-center items-start ${className}`} style={fadeInStyle}>
    <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    <div className="w-full max-w-[460px] px-5 py-9">
      {children}
    </div>
  </div>
);

// --- MAIN COMPONENT -----------------------------------------------------------
export default function VinysDiagnostic({ onComplete, initialArea = null }) {
  const [phase, setPhase] = useState(initialArea ? "red_flags" : "intro");
  const [area, setArea] = useState(initialArea);
  const [originalArea, setOriginalArea] = useState(null);
  const [crossoverTriggered, setCrossoverTriggered] = useState(false);
  const [crossoverTarget, setCrossoverTarget] = useState(null);
  const [irritability, setIrritability] = useState(0);
  const [acuity, setAcuity] = useState("unknown");
  const [intakeStep, setIntakeStep] = useState(0);
  const [postureIdx, setPostureIdx] = useState(0);
  const [qIdx, setQIdx] = useState(0);
  const [activePostures, setActivePostures] = useState([]);
  const [sessionAnswers, setSessionAnswers] = useState({});
  const [selected, setSelected] = useState(null);
  const [diagnosticOutput, setDiagnosticOutput] = useState(null);
  const [showingVideo, setShowingVideo] = useState(true);
  const [feelingOverlay, setFeelingOverlay] = useState(false);
  const [calibrationLevel, setCalibrationLevel] = useState(null); // pain pill on summary screen
  // Red flags
  const [redFlagsChecked, setRedFlagsChecked] = useState([]);
  const [noneChecked, setNoneChecked] = useState(false);
  // Clarification questions
  const [clarifyStep, setClarifyStep] = useState(0);
  const [clarifyAnswers, setClarifyAnswers] = useState({});

  const { speak, stop: stopTTS, isPlaying: ttsPlaying, isLoading: ttsLoading, isMuted, setMuted } = useTTS();

  const [videoPlaying, setVideoPlaying] = useState(false);
  const transitioningRef = useRef(false);

  const areaLabel = area ? AREA_CONFIG[area].label.toLowerCase() : "this area";

  const INTAKE = [
    {
      id: "irritability", label: "1 of 2",
      q: `How does your ${areaLabel} respond to movement?`,
      opts: [
        "Almost not reactive — I can move quite freely",
        "Slightly reactive — some movements are uncomfortable",
        "Reactive — many movements cause pain",
        "Very reactive — even small movement worsens the pain",
      ],
    },
    {
      id: "recovery", label: "2 of 2",
      q: "When pain appears, how long does it usually take to settle?",
      opts: ["A few seconds", "A few minutes", "An hour or more", "Hard to say"],
    },
  ];

  function getIrritabilityFromAnswer(ans) {
    if (ans === "Almost not reactive — I can move quite freely") return 1;
    if (ans === "Slightly reactive — some movements are uncomfortable") return 2;
    if (ans === "Reactive — many movements cause pain") return 3;
    return 4;
  }

  function getAcuityFromAnswer(ans) {
    if (ans === "A few seconds") return "high";
    if (ans === "A few minutes") return "medium";
    if (ans === "An hour or more") return "low";
    return "unknown";
  }

  function getModeFromIrritability(irr) {
    if (irr <= 2) return "normal";
    if (irr === 3) return "easier";
    return "flare";
  }

  function startPostures(chosenArea, irr) {
    const postures = getPosturesForArea(chosenArea);
    const active = buildActivePostures(chosenArea, postures, {}, irr);
    setActivePostures(active);
    setPostureIdx(0);
    setQIdx(0);
    setShowingVideo(true);
    setPhase("postures");
  }

  useEffect(() => { setVideoPlaying(true); setFeelingOverlay(false); }, [postureIdx]);

  // Auto-speak posture instructions when video screen loads, and loop TTS
  const ttsTextRef = useRef("");
  const showingVideoRef = useRef(showingVideo);
  useEffect(() => { showingVideoRef.current = showingVideo; }, [showingVideo]);

  useEffect(() => {
    if (phase === "postures" && showingVideo && activePostures[postureIdx]?.how && !isMuted) {
      const p = activePostures[postureIdx];
      ttsTextRef.current = `${p.name}. ${p.how}`;
      speak(ttsTextRef.current);
    } else {
      ttsTextRef.current = "";
      stopTTS();
    }
    return () => { ttsTextRef.current = ""; stopTTS(); };
  }, [phase, showingVideo, postureIdx, isMuted]);

  // Re-trigger TTS when it finishes (loop audio while on video screen)
  useEffect(() => {
    if (phase === "postures" && showingVideo && !isMuted && !ttsPlaying && !ttsLoading && ttsTextRef.current) {
      const timer = setTimeout(() => {
        // Double-check we're still on video screen when timer fires
        if (ttsTextRef.current && showingVideoRef.current) speak(ttsTextRef.current);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [ttsPlaying, ttsLoading, phase, showingVideo, isMuted]);

  // Auto-speak question text when question screen loads
  useEffect(() => {
    if (phase === "postures" && !showingVideo && activePostures[postureIdx]?.qs?.[qIdx]?.text && !isMuted) {
      // Small delay to ensure video TTS has fully stopped
      const timer = setTimeout(() => {
        if (!showingVideoRef.current) {
          speak(activePostures[postureIdx].qs[qIdx].text);
        }
      }, 200);
      return () => { clearTimeout(timer); stopTTS(); };
    }
    return () => stopTTS();
  }, [phase, showingVideo, postureIdx, qIdx, isMuted]);

  // Stop TTS on unmount
  useEffect(() => () => stopTTS(), []);

  // Shell wrapper moved outside component — see DiagnosticShell above

  const totalPostures = activePostures.length > 0 ? activePostures.filter(p => !p.isSummary).length : getPosturesForArea("LB").filter(p => !p.isSummary).length;

  // ==========================================================================
  // PHASE: INTRO
  // ==========================================================================
  if (phase === "intro") {
    return (
      <Shell>
        <div className="flex flex-col items-center text-center pt-8">
          <div className="mb-10">
            <BrandLogo size="lg" linkToHome={false} />
          </div>

          <h2 className="text-[28px] sm:text-[34px] font-bold leading-[1.15] text-foreground mb-5">
            Let's find your starting point
          </h2>

          <p className="text-[16px] leading-[1.7] text-muted-foreground max-w-[380px] mb-10">
            Before we build your plan, we need to understand how your body actually moves — not just what hurts.
            This 3-minute movement screen tests a few key positions so we can match you to the right therapeutic approach.
            There are no wrong answers.
          </p>

          <button
            onClick={() => setPhase("area_select")}
            className="w-full max-w-[320px] h-[52px] rounded-full bg-primary text-primary-foreground font-semibold text-base hover:bg-orange-hover active:bg-orange-active transition-all press-scale shadow-premium"
          >
            Start Assessment
          </button>

          <p className="text-xs text-muted-foreground mt-4">Takes about 3 minutes · {totalPostures} postures</p>
        </div>
      </Shell>
    );
  }

  // ==========================================================================
  // PHASE: AREA SELECTION
  // ==========================================================================
  if (phase === "area_select") {
    const AREA_ICONS = {
      NECK:  <path d="M8 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm0 5c-2 0-3 1-3 2v5h6V9c0-1-1-2-3-2z" fill="currentColor"/>,
      SHLDR: <path d="M4 7h8M4 7c-2 1-3 3-3 5h14c0-2-1-4-3-5M8 7V3" stroke="currentColor" fill="none" strokeWidth="1.2"/>,
      UBACK: <path d="M8 1v14M5 5l3-3 3 3M5 11l3 3 3-3M4 8h8" stroke="currentColor" fill="none" strokeWidth="1.2"/>,
      WRIST: <path d="M3 10h10v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3zm1-4c0-2.2 1.8-4 4-4s4 1.8 4 4v4H4V6z" fill="currentColor"/>,
      LB:    <path d="M8 1C5 1 3 3 3 6v3c0 3 2 5 5 5s5-2 5-5V6c0-3-2-5-5-5zm0 7v4" stroke="currentColor" fill="none" strokeWidth="1.2"/>,
      HIP:   <><path d="M2 10c0-4 3-7 6-7s6 3 6 7" stroke="currentColor" fill="none" strokeWidth="1.5"/><circle cx="5" cy="10" r="1.5" fill="currentColor"/><circle cx="11" cy="10" r="1.5" fill="currentColor"/></>,
      KNEE:  <path d="M6 2v5l-3 3h10l-3-3V2h-4zm2 9v5" stroke="currentColor" fill="none" strokeWidth="1.2"/>,
      ANKLE: <path d="M4 4c0-1 1-2 4-2s4 1 4 2v5c0 2-1 3-4 3s-4-1-4-3V4zm0 5l-2 6h12l-2-6" stroke="currentColor" fill="none" strokeWidth="1.2"/>,
    };
    const AREA_DESCRIPTORS = {
      NECK:  "Pain, stiffness, or headaches",
      SHLDR: "Pain or restricted movement",
      UBACK: "Mid-back tightness or aching",
      WRIST: "Pain, tingling, or grip issues",
      LB:    "Lumbar pain or stiffness",
      HIP:   "Pain or restricted range",
      KNEE:  "Knee pain or instability",
      ANKLE: "Ankle pain or balance issues",
    };
    const upperBody = ["NECK", "SHLDR", "UBACK", "WRIST"];
    const lowerBody = ["LB", "HIP", "KNEE", "ANKLE"];

    const AreaCard = ({ id }) => {
      const cfg = AREA_CONFIG[id];
      const accent = cfg.color;
      return (
        <button
          onClick={() => { setArea(id); setPhase("red_flags"); }}
          style={{
            padding: "14px 14px 12px",
            borderRadius: 16,
            border: `1.5px solid #E4DDD6`,
            background: "#FFFFFF",
            textAlign: "left",
            cursor: "pointer",
            position: "relative",
            overflow: "hidden",
            transition: "all 0.15s ease",
            WebkitTapHighlightColor: "transparent",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            display: "flex",
            flexDirection: "column",
            gap: 6,
            minHeight: 90,
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = accent; e.currentTarget.style.background = `${accent}15`; e.currentTarget.style.transform = "scale(1.02)"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "#E4DDD6"; e.currentTarget.style.background = "#FFFFFF"; e.currentTarget.style.transform = "scale(1)"; }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: `${accent}1A`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color: accent }}>
                {AREA_ICONS[id]}
              </svg>
            </div>
            <span style={{ fontSize: 15, fontWeight: 700, color: "#1C2B26", lineHeight: 1.2 }}>{cfg.label}</span>
          </div>
          <span style={{ fontSize: 12, color: "#7A8E89", lineHeight: 1.35 }}>{AREA_DESCRIPTORS[id]}</span>
        </button>
      );
    };

    return (
      <div style={{ minHeight: "100vh", background: "#F6F3EE" }}>
        <div style={{ position: "sticky", top: 0, background: "#F6F3EE", zIndex: 10, padding: "20px 20px 12px" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#4A7B6F", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6 }}>VINYS</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#1C2B26", lineHeight: 1.25, marginBottom: 4 }}>Where would you like to focus today?</div>
          <div style={{ fontSize: 13, color: "#7A8E89", lineHeight: 1.5 }}>Select the area you want to assess. We'll guide you through a movement session to understand your pattern.</div>
        </div>
        <div style={{ padding: "8px 16px 32px" }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: "#7A8E89", textTransform: "uppercase", marginBottom: 10, marginTop: 8 }}>UPPER BODY</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
            {upperBody.map(id => <AreaCard key={id} id={id} />)}
          </div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: "#7A8E89", textTransform: "uppercase", marginBottom: 10 }}>LOWER BODY</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {lowerBody.map(id => <AreaCard key={id} id={id} />)}
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // PHASE: RED FLAGS SAFETY CHECK (FIX 1)
  // ==========================================================================
  if (phase === "red_flags") {
    const hasSelection = noneChecked || redFlagsChecked.length > 0;
    const hasRedFlag = redFlagsChecked.length > 0 && !noneChecked;

    return (
      <Shell>
        <div className="mb-6">
          <h2 className="text-[22px] font-bold text-foreground leading-snug mb-2">
            Before we continue — a quick safety check
          </h2>
          <p className="text-[15px] text-muted-foreground leading-[1.65]">
            Please let us know if you are currently experiencing any of the following
          </p>
        </div>

        <div className="space-y-2">
          {getRedFlagsForArea(area).map((flag) => {
            const isChecked = redFlagsChecked.includes(flag);
            return (
              <button
                key={flag}
                onClick={() => {
                  setNoneChecked(false);
                  setRedFlagsChecked(prev =>
                    prev.includes(flag) ? prev.filter(f => f !== flag) : [...prev, flag]
                  );
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-[12px] border-2 transition-all text-left ${
                  isChecked ? "border-destructive bg-destructive/5" : "border-border bg-card"
                }`}
              >
                <div className={`w-5 h-5 rounded-[4px] border-2 flex items-center justify-center shrink-0 transition-all ${
                  isChecked ? "border-destructive bg-destructive" : "border-border bg-card"
                }`}>
                  {isChecked && <Check size={12} className="text-white" strokeWidth={3} />}
                </div>
                <span className="text-[14px] font-medium text-foreground">{flag}</span>
              </button>
            );
          })}

          {/* None of the above */}
          <button
            onClick={() => {
              setNoneChecked(true);
              setRedFlagsChecked([]);
              // Auto-advance since this is a "clear all" action
              setTimeout(() => setPhase("intake"), 300);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-[12px] border-2 transition-all text-left ${
              noneChecked ? "border-secondary bg-secondary/10" : "border-border bg-card"
            }`}
          >
            <div className={`w-5 h-5 rounded-[4px] border-2 flex items-center justify-center shrink-0 transition-all ${
              noneChecked ? "border-secondary bg-secondary" : "border-border bg-card"
            }`}>
              {noneChecked && <Check size={12} className="text-white" strokeWidth={3} />}
            </div>
            <span className="text-[14px] font-medium text-foreground">None of the above</span>
          </button>
        </div>

        {/* Only show Continue if red flags are checked (not "None") */}
        {redFlagsChecked.length > 0 && (
          <div className="mt-6">
            <PrimaryButton
              label="Continue"
              onClick={() => {
                if (hasRedFlag) {
                  setPhase("red_flag_stop");
                } else {
                  setPhase("intake");
                }
              }}
            />
          </div>
        )}
      </Shell>
    );
  }

  // ==========================================================================
  // PHASE: RED FLAG STOP SCREEN
  // ==========================================================================
  if (phase === "red_flag_stop") {
    return (
      <Shell>
        <div className="flex flex-col items-center text-center pt-12">
          <div className="w-20 h-20 rounded-full bg-destructive/8 flex items-center justify-center mb-6">
            <span className="text-4xl">⚠️</span>
          </div>
          <h2 className="text-[24px] font-bold text-foreground leading-snug mb-4">
            Please see a healthcare provider before continuing
          </h2>
          <p className="text-[15px] text-muted-foreground leading-[1.7] max-w-[380px] mb-8">
            One or more of your answers suggests a condition that should be evaluated by a doctor or physiotherapist before beginning a movement program. Vinys is not suitable as a first response to these symptoms.
          </p>
          <PrimaryButton
            label="I understand"
            onClick={() => {
              // Navigate back to landing — call onComplete with null to signal abort
              if (typeof window !== "undefined") window.location.href = "/";
            }}
          />
        </div>
      </Shell>
    );
  }

  // ==========================================================================
  // PHASE: INTAKE
  // ==========================================================================
  if (phase === "intake") {
    const q = INTAKE[intakeStep];
    if (!q) return <Shell><p className="text-center text-muted-foreground pt-12">Loading…</p></Shell>;
    return (
      <Shell>
        <div className="flex items-center justify-between mb-8">
          <span className="inline-block px-3.5 py-1 rounded-full bg-muted text-xs font-bold uppercase tracking-wider" style={{ color: "#888" }}>
            {AREA_CONFIG[area].label} · Setup
          </span>
          <span className="text-[13px] font-semibold" style={{ color: "#888" }}>{q.label}</span>
        </div>

        <h2 className="text-[22px] font-bold text-foreground leading-snug mb-2 text-center">{q.q}</h2>
        <p className="italic text-[14px] text-stone-500 mb-7 text-center">There's no wrong answer.</p>

        <div className="space-y-2.5">
          {q.opts.map((opt, i) => (
            <OptionTile key={i} label={opt} selected={selected === opt} onClick={() => {
              if (transitioningRef.current) return;
              transitioningRef.current = true;
              setSelected(opt);
              setTimeout(() => {
                if (intakeStep === 0) {
                  const irr = getIrritabilityFromAnswer(opt);
                  setIrritability(irr);
                }
                if (intakeStep === 1) {
                  const ac = getAcuityFromAnswer(opt);
                  setAcuity(ac);
                }
                if (intakeStep < INTAKE.length - 1) {
                  setIntakeStep((s) => s + 1);
                  setSelected(null);
                } else {
                  setSelected(null);
                  startPostures(area, irritability);
                }
                transitioningRef.current = false;
              }, 250);
            }} />
          ))}
        </div>
      </Shell>
    );
  }

  // ==========================================================================
  // PHASE: POSTURES
  // ==========================================================================
  if (phase === "postures") {
    const posture = activePostures[postureIdx];
    if (!posture) return <Shell><p className="text-center text-muted-foreground pt-12">Loading…</p></Shell>;
    const q = posture.qs?.[qIdx];
    if (!q && !showingVideo) return <Shell><p className="text-center text-muted-foreground pt-12">Loading…</p></Shell>;
    const isLastQ = qIdx === posture.qs.length - 1;
    const isLastP = postureIdx === activePostures.length - 1;
    const progressTotal = activePostures.filter((p) => !p.isSummary).length;

    function handleAnswer(ansText) {
      const newAnswers = { ...sessionAnswers, [q.id]: ansText };
      setSessionAnswers(newAnswers);

      if (isLastQ && !crossoverTriggered) {
        const target = checkCrossover(area, newAnswers);
        if (target) {
          setCrossoverTriggered(true);
          setOriginalArea(area);
          setCrossoverTarget(area); // Phase 2 stays in the same body area
          const miniPostures = getCrossoverPostures(area);
          setActivePostures(miniPostures);
          setPostureIdx(0);
          setQIdx(0);
          setSelected(null);
          setShowingVideo(true);
          return;
        }
      }

      if (!isLastQ) {
        setQIdx((qi) => qi + 1);
        setSelected(null);
        return;
      }

      const effectiveArea = crossoverTriggered ? crossoverTarget : area;
      const allPostures = crossoverTriggered ? getCrossoverPostures(area) : getPosturesForArea(effectiveArea);
      const rebuilt = buildActivePostures(effectiveArea, allPostures, newAnswers, irritability);

      if (!isLastP) {
        const nextIdx = rebuilt.findIndex((p, i) => i > postureIdx) !== -1 ? postureIdx + 1 : postureIdx;
        setActivePostures(rebuilt);
        setPostureIdx(nextIdx);
        setQIdx(0);
        setSelected(null);
        setShowingVideo(true);
      } else {
        const resolveArea = crossoverTriggered ? crossoverTarget : area;
        const scores = calculateScores(newAnswers, allPostures);
        const output = resolveProfile(resolveArea, scores, newAnswers, irritability);
        const result = {
          ...output,
          area: resolveArea,
          originalArea: crossoverTriggered ? area : null,
          crossoverTriggered,
          irritability,
          acuity,
          mode: getModeFromIrritability(irritability),
          redFlagsPassed: true,
        };
        setDiagnosticOutput(result);

        // Check for secondary profile confirmation
        const resultScores = result.scores || {};
        const ranked = Object.entries(resultScores).sort(([, a], [, b]) => b - a);
        const primaryScore = resultScores[result.primary] || 0;
        const secondEntry = ranked.find(([p]) => p !== result.primary && resultScores[p] > 0);
        const secondScore = secondEntry ? secondEntry[1] : 0;
        const shouldAskSecondary = secondEntry && secondScore > 0 && secondScore < primaryScore;

        if (shouldAskSecondary) {
          setPhase("secondary_confirm");
        } else if (result.confidence === "High") {
          setPhase("summary");
        } else {
          setClarifyStep(0);
          setClarifyAnswers({});
          setSelected(null);
          setPhase("clarify");
        }
      }
    }

    // --- Summary posture (final check-in) ---
    if (posture.isSummary) {
      return (
        <Shell>
          <span className="inline-block px-3.5 py-1 rounded-full bg-muted text-xs font-bold uppercase tracking-wider mb-6" style={{ color: "#888" }}>
            Final check-in
          </span>
          <h2 className="text-[22px] font-bold text-foreground leading-snug mb-7">{q.text}</h2>
          <div className="space-y-2.5">
            {q.opts.map((opt, i) => (
              <OptionTile key={i} label={opt.t} selected={selected === opt.t} onClick={() => {
                if (transitioningRef.current) return;
                transitioningRef.current = true;
                setSelected(opt.t);
                setTimeout(() => { handleAnswer(opt.t); transitioningRef.current = false; }, 250);
              }} />
            ))}
          </div>
        </Shell>
      );
    }

    // --- VIDEO / INSTRUCTIONS sub-phase ---
    if (showingVideo) {
      const cleanSubtitle = posture.subtitle ? posture.subtitle.replace(/★.*/, "").trim() : "";
      return (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "#000", display: "flex", flexDirection: "column" }}>
          {/* Full-viewport video */}
          <video
            src={posture.videoSrc || universalVideo}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            onError={(e) => {
              const t = e.target;
              if (!t.src.includes('universal-fallback')) {
                t.src = universalVideo;
              }
            }}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center center" }}
          />

          {/* Top overlay: progress + name */}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 10, padding: "16px 20px 24px", background: "linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 100%)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.7)", letterSpacing: 1 }}>
                Posture {postureIdx + 1} of {progressTotal}
              </span>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => setMuted(!isMuted)}
                  disabled={ttsLoading}
                  style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.15)", backdropFilter: "blur(6px)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}
                  aria-label={isMuted ? "Unmute" : "Mute"}
                >
                  {ttsLoading ? <RotateCcw className="w-4 h-4 animate-spin" /> : isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div style={{ width: "100%", height: 3, borderRadius: 2, background: "rgba(255,255,255,0.2)", overflow: "hidden", marginBottom: 12 }}>
              <div style={{ height: "100%", borderRadius: 2, background: "white", transition: "width 0.3s", width: `${((postureIdx + 1) / progressTotal) * 100}%` }} />
            </div>
            <span
              style={{
                fontFamily: "Fraunces, serif",
                fontSize: 48,
                fontWeight: 400,
                color: "#F5F0E6",
                lineHeight: 1.1,
                display: "block",
                marginTop: 4,
              }}
            >
              {posture.name}
            </span>
            {cleanSubtitle && (
              <span
                style={{
                  fontSize: 14,
                  fontStyle: "italic",
                  color: "rgba(245,240,230,0.5)",
                  letterSpacing: "0.05em",
                  display: "block",
                  marginTop: 6,
                }}
              >
                {cleanSubtitle}
              </span>
            )}
          </div>

          {crossoverTriggered && (
            <div style={{ position: "absolute", top: 120, left: 20, right: 20, zIndex: 10, padding: "10px 14px", borderRadius: 12, background: "rgba(255,200,50,0.15)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,200,50,0.3)", color: "rgba(255,255,255,0.9)", fontSize: 13 }}>
              We're checking a few more things to give you the most accurate result.
            </div>
          )}

          {/* Instruction overlay (minimal, bottom area above CTA) */}
          {posture.how && (
            <div style={{ position: "absolute", bottom: 100, left: 20, right: 20, zIndex: 10, padding: "12px 16px", borderRadius: 14, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(10px)", color: "rgba(255,255,255,0.85)", fontSize: 14, lineHeight: 1.6 }}>
              {posture.how}
              <div style={{ marginTop: 10, fontSize: 14, fontStyle: "italic", color: "rgba(245,240,230,0.6)", lineHeight: 1.5 }}>
                Take it at your pace. We'll ask how it felt right after.
              </div>
            </div>
          )}

          {/* Bottom overlay: I'm ready CTA */}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 10, padding: "20px 20px 40px", background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 100%)", display: "flex", justifyContent: "center" }}>
            <button
              onClick={() => { ttsTextRef.current = ""; stopTTS(); setFeelingOverlay(true); }}
              style={{ width: "100%", maxWidth: 340, height: 52, borderRadius: 26, background: "hsl(var(--primary))", color: "white", fontSize: 16, fontWeight: 700, border: "none", cursor: "pointer", transition: "transform 0.1s", boxShadow: "0 4px 20px rgba(0,0,0,0.3)" }}
              onMouseDown={e => e.currentTarget.style.transform = "scale(0.97)"}
              onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
            >
              I'm ready
            </button>
          </div>

          {/* "How did that feel?" overlay */}
          {feelingOverlay && (
            <div
              style={{
                position: "absolute", inset: 0, zIndex: 60,
                background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)",
                display: "flex", alignItems: "center", justifyContent: "center",
                animation: "fadeInOverlay 0.25s ease-out",
              }}
            >
              <style>{`@keyframes fadeInOverlay { from { opacity: 0; } to { opacity: 1; } }`}</style>
              <div style={{ width: "100%", maxWidth: 340, padding: "0 20px" }}>
                <h3 style={{ color: "white", fontSize: 22, fontWeight: 800, textAlign: "center", marginBottom: 8 }}>
                  How did that feel?
                </h3>
                <p style={{ color: "rgba(245,240,230,0.7)", fontStyle: "italic", fontSize: 14, textAlign: "center", marginBottom: 20, lineHeight: 1.5 }}>
                  Honest answers — even "it hurt" — make your plan better.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {[
                    { value: "no-pain", label: "Felt fine — no pain" },
                    { value: "some-discomfort", label: "Some discomfort" },
                    { value: "it-hurt", label: "That hurt" },
                    { value: "not-sure", label: "Not sure — felt mixed" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        setFeelingOverlay(false);
                        setShowingVideo(false);
                      }}
                      style={{
                        width: "100%", padding: "14px 20px", borderRadius: 14,
                        background: "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)",
                        border: "1.5px solid rgba(255,255,255,0.2)",
                        color: "white", fontSize: 16, fontWeight: 600,
                        cursor: "pointer", transition: "all 0.15s",
                        textAlign: "center",
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.22)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.4)"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    // --- QUESTIONS sub-phase ---
    return (
      <Shell>
        {/* Posture progress */}
        <p className="text-xs mb-1.5" style={{ color: "#888" }}>Posture {postureIdx + 1} of {progressTotal}</p>
        <div className="w-full h-1 rounded-full bg-border mb-5 overflow-hidden">
          <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${((postureIdx + 1) / progressTotal) * 100}%` }} />
        </div>

        {/* Mini posture header */}
        <div className="flex items-center gap-3 mb-5 p-3.5 rounded-2xl bg-card border border-border">
          <div
            className="w-10 h-10 rounded-xl flex-shrink-0"
            style={{ background: `linear-gradient(135deg, ${posture.grad[0]}, ${posture.grad[1]})` }}
          />
          <div className="flex-1 min-w-0">
            <div className="text-[15px] font-bold text-foreground">{posture.name}</div>
            {posture.subtitle && (
              <div className="text-[12px] text-muted-foreground">{posture.subtitle.replace(/★.*/, "").trim()}</div>
            )}
          </div>
          <button
            onClick={() => setShowingVideo(true)}
            className="text-[12px] font-semibold px-2.5 py-1 rounded-lg transition-colors"
            style={{ color: "#888", background: "rgba(136,136,136,0.08)" }}
          >
            <ArrowLeft className="w-3.5 h-3.5 inline mr-1" />
            Back
          </button>
        </div>

        {/* Question card */}
        <div className="p-5 rounded-2xl bg-card border border-border shadow-calm mb-5">
          {posture.qs.length > 1 && (
            <span className="text-[11px] font-bold uppercase tracking-wider block mb-2" style={{ color: "#888" }}>
              Question {qIdx + 1} of {posture.qs.length}
            </span>
          )}
          <h3 className="text-[17px] font-bold text-foreground leading-snug">{q.text}</h3>
        </div>

        <div className="space-y-2.5">
          {q.opts.map((opt, i) => (
            <OptionTile key={i} label={opt.t} selected={selected === opt.t} onClick={() => {
              if (transitioningRef.current) return;
              transitioningRef.current = true;
              setSelected(opt.t);
              setTimeout(() => { handleAnswer(opt.t); setSelected(null); transitioningRef.current = false; }, 250);
            }} />
          ))}
        </div>

        {postureIdx >= 0 && (
          <>
            <div style={{ height: 1, background: "rgba(245,240,230,0.15)", margin: "20px 0 14px" }} />
            <p
              className="text-center italic"
              style={{ fontSize: 14, color: "rgba(245,240,230,0.7)" }}
            >
              {AFFIRMATIONS[Math.min(postureIdx, AFFIRMATIONS.length - 1)]}
            </p>
          </>
        )}
      </Shell>
    );
  }

  // ==========================================================================
  // PHASE: SECONDARY PROFILE CONFIRMATION
  // ==========================================================================
  if (phase === "secondary_confirm" && diagnosticOutput) {
    const resultScores = diagnosticOutput.scores || {};
    const ranked = Object.entries(resultScores).sort(([, a], [, b]) => b - a);
    const secondEntry = ranked.find(([p]) => p !== diagnosticOutput.primary && resultScores[p] > 0);
    const secondCode = secondEntry ? secondEntry[0] : null;
    const secondDisplay = secondCode ? (PROFILE_DISPLAY[secondCode] || { name: secondCode, description: "" }) : null;

    const proceedAfterSecondary = () => {
      if (diagnosticOutput.confidence === "High") {
        setPhase("summary");
      } else {
        setClarifyStep(0);
        setClarifyAnswers({});
        setSelected(null);
        setPhase("clarify");
      }
    };

    return (
      <Shell>
        <div className="mb-8">
          <h2 className="text-[22px] font-bold text-foreground leading-snug mb-2">We noticed a second movement pattern</h2>
          <p className="text-[16px] text-foreground leading-[1.65] font-medium mb-1">Does this also affect you?</p>
        </div>

        {secondDisplay && (
          <div className="p-5 rounded-2xl bg-card border border-border shadow-calm mb-6">
            <span className="text-[15px] font-bold text-secondary block mb-1">{secondDisplay.name}</span>
            <span className="text-[14px] text-muted-foreground leading-relaxed">{secondDisplay.description}</span>
          </div>
        )}

        <div className="space-y-3">
          <PrimaryButton
            label="Yes, this also affects me"
            onClick={() => {
              setDiagnosticOutput(prev => ({ ...prev, secondaryProfile: secondCode }));
              proceedAfterSecondary();
            }}
          />
          <SecondaryButton
            label="No, just the first"
            onClick={() => {
              setDiagnosticOutput(prev => ({ ...prev, secondaryProfile: null }));
              proceedAfterSecondary();
            }}
          />
        </div>
      </Shell>
    );
  }

  // ==========================================================================
  // PHASE: CLARIFICATION QUESTIONS (FIX 8)
  // ==========================================================================
  if (phase === "clarify" && diagnosticOutput) {
    const isLow = diagnosticOutput.confidence === "Low";
    const totalClarifyQs = isLow ? 2 : 1;

    const CLARIFY_QS = [
      {
        heading: "One quick follow-up",
        text: "How strong was the discomfort during the movement test overall?",
        opts: [
          "No pain — I moved freely",
          "Mild discomfort — manageable",
          "Moderate pain — I had to be careful",
          "Strong pain — I stopped or modified most movements",
        ],
      },
      {
        heading: "One more question",
        text: "Did the movement test change your pain afterwards?",
        opts: [
          "Pain improved after moving",
          "No change",
          "Pain increased after moving",
        ],
      },
    ];

    const currentQ = CLARIFY_QS[clarifyStep];
    if (!currentQ) { setPhase("summary"); return <Shell><p className="text-center text-muted-foreground pt-12">Loading…</p></Shell>; }

    return (
      <Shell>
        <div className="mb-8">
          <h2 className="text-[22px] font-bold text-foreground leading-snug mb-2">{currentQ.heading}</h2>
          <p className="text-[16px] text-foreground leading-[1.65] font-medium">{currentQ.text}</p>
        </div>

        <div className="space-y-2.5">
          {currentQ.opts.map((opt, i) => (
            <OptionTile key={i} label={opt} selected={selected === opt} onClick={() => {
              if (transitioningRef.current) return;
              transitioningRef.current = true;
              setSelected(opt);

              // Auto-advance after brief highlight
              setTimeout(() => {
                const newAnswers = { ...clarifyAnswers, [`clarify_${clarifyStep}`]: opt };
                setClarifyAnswers(newAnswers);

                // Update profile based on clarification
                if (clarifyStep === 0) {
                  const painMap = {
                    "No pain — I moved freely": 1,
                    "Mild discomfort — manageable": 2,
                    "Moderate pain — I had to be careful": 3,
                    "Strong pain — I stopped or modified most movements": 4,
                  };
                  const clarifiedIrr = painMap[opt] || irritability;
                  const newIrr = Math.round((irritability + clarifiedIrr) / 2);
                  setIrritability(newIrr);
                  setDiagnosticOutput(prev => ({
                    ...prev,
                    irritability: newIrr,
                    mode: getModeFromIrritability(newIrr),
                  }));
                }

                if (clarifyStep < totalClarifyQs - 1) {
                  setClarifyStep(s => s + 1);
                  setSelected(null);
                } else {
                  setSelected(null);
                  setPhase("summary");
                }
                transitioningRef.current = false;
              }, 250);
            }} />
          ))}
        </div>
      </Shell>
    );
  }

  // ==========================================================================
  // PHASE: SUMMARY (profile summary before calling onComplete)
  // ==========================================================================
  if (phase === "summary" && diagnosticOutput) {
    const { primary, secondary, confidence, reassess, area: resultArea, originalArea: origArea, crossoverTriggered: crossed } = diagnosticOutput;
    const prof = PROFILE_DATA[resultArea]?.[primary];
    const displayInfo = prof ? { name: prof.name, description: prof.sub } : (PROFILE_DISPLAY[primary] || { name: primary, description: "" });
    if (!prof) return <div className="p-6 text-muted-foreground">No profile resolved.</div>;

    const confBadgeClass =
      confidence === "High" ? "bg-secondary/10 text-secondary" :
      confidence === "Medium" ? "bg-primary/10 text-primary" :
      "bg-destructive/10 text-destructive";

    const calibrationOptions = [
      { value: "feels_good", label: "Feels good" },
      { value: "tender", label: "A little tender" },
      { value: "painful", label: "Painful today" },
      { value: "very_sensitive", label: "Very sensitive" },
    ];

    return (
      <Shell>
        {/* Section label — Global B spec */}
        <div
          style={{
            fontSize: "10px",
            textTransform: "uppercase",
            letterSpacing: "0.22em",
            color: "#8A8378",
            fontWeight: 600,
            marginBottom: "20px",
          }}
        >
          CALIBRATION
        </div>

        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-secondary/10 mb-6">
            <Check className="w-4 h-4 text-secondary" />
            <span className="text-[13px] font-bold text-secondary uppercase tracking-wider">Assessment complete</span>
          </div>

          {crossed && (
            <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-[14px] text-amber-800 leading-relaxed text-left">
              <strong>Note:</strong> Your symptoms appear to originate in your{" "}
              {AREA_CONFIG[AREA_CONFIG[origArea]?.crossoverTo || "LB"]?.label}. Your practice plan is designed accordingly.
            </div>
          )}

          <h2 className="text-[26px] sm:text-[30px] font-bold text-foreground leading-[1.15] mb-3">
            Your movement profile
          </h2>

          <div className="mb-1">
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Primary</span>
          </div>
          <div className="text-[28px] sm:text-[34px] font-extrabold text-primary leading-tight mb-2">
            {displayInfo.name}
          </div>

          {diagnosticOutput.secondaryProfile && (() => {
            const secDisplay = PROFILE_DISPLAY[diagnosticOutput.secondaryProfile] || { name: diagnosticOutput.secondaryProfile };
            return (
              <div className="mb-4">
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Secondary</span>
                <div className="text-[20px] sm:text-[24px] font-bold text-secondary leading-tight mt-0.5">
                  {secDisplay.name}
                </div>
              </div>
            );
          })()}

          <span className={`inline-block px-3 py-1 rounded-full text-[12px] font-bold ${confBadgeClass} mb-6`}>
            {confidence === "High" ? "High confidence profile" : confidence === "Medium" ? "Good confidence — may refine over first sessions" : "Initial profile — will refine over your first sessions"}
          </span>

          <p className="text-[16px] text-foreground leading-[1.7] text-left max-w-[400px] mx-auto mb-2">
            {displayInfo.description}
          </p>

          {reassess && (
            <p className="text-[14px] text-muted-foreground leading-relaxed text-left max-w-[400px] mx-auto mt-4 p-4 rounded-2xl bg-card border border-border">
              We'll keep an eye on your progress and refine this over time.
            </p>
          )}
        </div>

        {/* Insights */}
        <div className="p-5 rounded-2xl bg-card border border-border shadow-calm mb-6">
          <span className="text-[11px] font-bold text-foreground uppercase tracking-widest block mb-4">
            What this means for your body
          </span>
          <div className="space-y-3">
            {prof.insights.map((insight, i) => (
              <div key={i} className="flex gap-3 items-start">
                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <ChevronRight className="w-3 h-3 text-primary" />
                </div>
                <span className="text-[14px] text-foreground leading-[1.65]">{insight}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ─── ONE LAST THING — Final calibration ─── */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "32px 0 20px" }}>
          <div style={{ flex: 1, height: "1px", background: "rgba(138,131,120,0.3)" }} />
          <span style={{ fontSize: "13px", fontStyle: "italic", color: "#8A8378", whiteSpace: "nowrap" }}>
            — ONE LAST THING —
          </span>
          <div style={{ flex: 1, height: "1px", background: "rgba(138,131,120,0.3)" }} />
        </div>

        <h3
          className="font-display"
          style={{ fontSize: "20px", color: "#191715", fontWeight: 500, lineHeight: 1.3, marginTop: "24px", marginBottom: "10px" }}
        >
          How does your back feel right now — at this moment?
        </h3>
        <p style={{ fontSize: "15px", color: "rgba(25,23,21,0.65)", lineHeight: 1.55, marginBottom: "20px" }}>
          This adjusts the intensity of today's session. Be honest — even on tough days, we have a version of the practice for you.
        </p>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "8px" }}>
          {calibrationOptions.map((opt) => {
            const isSel = calibrationLevel === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setCalibrationLevel(opt.value)}
                style={{
                  flex: "1 1 auto",
                  padding: "12px 16px",
                  borderRadius: "100px",
                  border: isSel ? "1px solid #B8472D" : "1px solid rgba(25,23,21,0.15)",
                  background: isSel ? "#B8472D" : "#EDE8DC",
                  color: isSel ? "#FFFFFF" : "#191715",
                  fontSize: "14px",
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  whiteSpace: "nowrap",
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {/* Inline save prompt */}
        <div
          style={{
            border: "1px dashed #4A6741",
            background: "#EDE8DC",
            borderRadius: "6px",
            padding: "16px",
            marginTop: "24px",
            marginBottom: "24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontSize: "14px", color: "#191715", flex: "1 1 200px" }}>
            Save your profile so it's here next time?
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {/* TODO: wire to real signup flow */}
            <button
              onClick={() => { /* TODO: open signup modal */ }}
              style={{
                background: "transparent",
                color: "#191715",
                border: "1px solid #191715",
                borderRadius: "100px",
                padding: "6px 14px",
                fontSize: "13px",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Sign up · 30s
            </button>
            <button
              onClick={() => { /* continue as guest = same as Build my plan */ }}
              style={{
                background: "transparent",
                color: "#8A8378",
                border: "none",
                fontSize: "13px",
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              Continue as guest
            </button>
          </div>
        </div>

        <PrimaryButton
          label="Build my plan →"
          onClick={() => onComplete && onComplete({ ...diagnosticOutput, calibrationLevel })}
        />

        <div className="mt-3">
          <SecondaryButton
            label="Retake assessment"
            onClick={() => {
              setPhase("intro");
              setArea(null);
              setOriginalArea(null);
              setCrossoverTriggered(false);
              setCrossoverTarget(null);
              setIrritability(0);
              setAcuity("unknown");
              setIntakeStep(0);
              setPostureIdx(0);
              setQIdx(0);
              setActivePostures([]);
              setSessionAnswers({});
              setSelected(null);
              setDiagnosticOutput(null);
              setShowingVideo(true);
              setRedFlagsChecked([]);
              setNoneChecked(false);
              setClarifyStep(0);
              setClarifyAnswers({});
            }}
          />
        </div>
      </Shell>
    );
  }

  return null;
}

// =============================================================================
// UI PRIMITIVES (using design system)
// =============================================================================
function PrimaryButton({ label, onClick, disabled = false }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full h-[52px] rounded-full font-semibold text-[15px] transition-all press-scale ${
        disabled
          ? "bg-muted text-muted-foreground cursor-default"
          : "bg-primary text-primary-foreground hover:bg-orange-hover active:bg-orange-active shadow-premium cursor-pointer"
      }`}
    >
      {label}
    </button>
  );
}

function SecondaryButton({ label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full h-[48px] rounded-full border-2 border-foreground text-foreground font-semibold text-[15px] hover:border-secondary hover:text-secondary active:bg-beige active:border-beige active:text-white transition-all press-scale cursor-pointer bg-transparent"
    >
      {label}
    </button>
  );
}

function OptionTile({ label, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full p-4 rounded-2xl text-left flex items-start gap-3.5 transition-all press-scale cursor-pointer ${
        selected
          ? "border-l-4 border-primary bg-[#FFF8F3] text-foreground font-semibold shadow-sm"
          : "border-l-4 border-transparent bg-card text-foreground hover:bg-card/80 border border-border rounded-2xl"
      }`}
      style={selected ? { borderTop: '1px solid hsl(var(--border))', borderRight: '1px solid hsl(var(--border))', borderBottom: '1px solid hsl(var(--border))' } : {}}
    >
      <span
        className={`w-[22px] h-[22px] rounded-full flex-shrink-0 mt-0.5 border-[2.5px] flex items-center justify-center transition-all ${
          selected ? "border-primary bg-primary" : "border-muted bg-transparent"
        }`}
      >
        {selected && <span className="w-2 h-2 rounded-full bg-white block" />}
      </span>
      <span className={`flex-1 text-[14.5px] leading-snug ${selected ? "text-foreground" : ""}`}>{label}</span>
    </button>
  );
}
