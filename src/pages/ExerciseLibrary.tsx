import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MASTER_EXERCISES, MasterExercise } from "@/data/masterExercises";
import ExerciseAnimationV8 from "@/components/animations/ExerciseAnimationV8";
import { Wind, Move, Shield, Heart, Clock, ArrowLeft, ChevronRight, X } from "lucide-react";
import { Exercise } from "@/types";
import { motion, AnimatePresence } from "framer-motion";

/* ─── Convert MasterExercise → Exercise for V8 animation ─── */
function toExercise(m: MasterExercise): Exercise {
  return {
    id: m.id,
    name_he: m.title,
    category: m.category,
    why_he: m.why,
    steps_he: m.instructions,
    safety_he: m.safety,
    minutes_default: m.durationMin,
    lottie_url_normal: null,
    lottie_url_easier: null,
    lottie_url_flare: null,
    equipment: m.equipment || [],
  };
}

const TABS = ["By Type", "By Area"] as const;
type Tab = (typeof TABS)[number];

const CAT_ICONS: Record<string, typeof Wind> = {
  breath: Wind, mobility: Move, stability: Shield, release: Heart,
};

const CAT_LABELS: Record<string, string> = {
  breath: "Breath", mobility: "Mobility", stability: "Stability", release: "Release",
};

const CAT_COLORS: Record<string, string> = {
  breath: "bg-secondary/15 text-secondary",
  mobility: "bg-primary/15 text-primary",
  stability: "bg-secondary/10 text-secondary",
  release: "bg-primary/10 text-primary",
};

const AREA_MAP: Record<string, string[]> = {
  "Back": ["back", "spine", "lumbar"],
  "Neck": ["neck", "cervical"],
  "Shoulder": ["shoulder"],
  "Hip": ["hip", "pelvis", "pelvic"],
  "Knee": ["knee"],
  "Ankle": ["ankle", "foot"],
  "Whole Body": ["whole", "universal", "full"],
};

function getExercisesByArea(): Record<string, MasterExercise[]> {
  const result: Record<string, MasterExercise[]> = {};
  for (const area of Object.keys(AREA_MAP)) result[area] = [];

  for (const ex of MASTER_EXERCISES) {
    const targetStr = [
      ...(ex.targets || []),
      ...(ex.movementPattern || []),
      ex.poseSet || "",
    ].join(" ").toLowerCase();

    let matched = false;
    for (const [area, keywords] of Object.entries(AREA_MAP)) {
      if (area === "Whole Body") continue;
      if (keywords.some(k => targetStr.includes(k))) {
        result[area].push(ex);
        matched = true;
      }
    }
    // Universal/flare-safe exercises go to Whole Body
    if (!matched || ex.tags.universalSafe) {
      result["Whole Body"].push(ex);
    }
  }
  return result;
}

function ExerciseCard({ master, onClick }: { master: MasterExercise; onClick: () => void }) {
  const exercise = useMemo(() => toExercise(master), [master]);
  const Icon = CAT_ICONS[master.category] || Wind;

  return (
    <button
      onClick={onClick}
      aria-label={master.title}
      className="rounded-2xl overflow-hidden text-left transition-shadow hover:shadow-md w-full"
      style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
    >
      <ExerciseAnimationV8 exercise={exercise} />
      <div className="p-4 space-y-2">
        <h3 className="font-display font-semibold text-foreground text-[15px] leading-tight">
          {master.title}
        </h3>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${CAT_COLORS[master.category]}`}>
            <Icon size={10} />
            {CAT_LABELS[master.category]}
          </span>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock size={11} /> {master.durationMin} min
          </span>
        </div>
      </div>
    </button>
  );
}

function ExerciseDetailSheet({ master, onClose }: { master: MasterExercise; onClose: () => void }) {
  const navigate = useNavigate();
  const exercise = useMemo(() => toExercise(master), [master]);

  const handleStart = () => {
    // Store solo exercise session in localStorage and navigate to workout
    const soloSession = {
      id: `solo_${master.id}_${Date.now()}`,
      dayIndex: 0,
      title_he: master.title,
      mode: "normal" as const,
      durationMinutes: master.durationMin,
      exerciseIds: [master.id],
      status: "planned" as const,
      isSoloExercise: true,
    };
    localStorage.setItem("vinys_solo_session", JSON.stringify(soloSession));
    navigate(`/workout/${soloSession.id}`);
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      
      {/* Sheet */}
      <motion.div
        className="relative w-full max-w-lg max-h-[85vh] rounded-t-3xl flex flex-col"
        style={{ background: "hsl(var(--card))" }}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
      >
        {/* Handle */}
        <div className="sticky top-0 z-10 flex justify-center pt-3 pb-1 flex-shrink-0" style={{ background: "hsl(var(--card))" }}>
          <div className="w-10 h-1 rounded-full bg-muted-foreground/25" />
        </div>

        <button onClick={onClose} className="absolute top-3 right-3 p-2 rounded-full hover:bg-foreground/5 text-muted-foreground z-10" aria-label="Close">
          <X size={18} />
        </button>

        <div className="overflow-y-auto flex-1 min-h-0">
          <div className="px-5 pb-6 space-y-5">
            <ExerciseAnimationV8 exercise={exercise} large />

            <div>
              <h2 className="font-display font-bold text-foreground text-xl">{master.title}</h2>
              <div className="flex items-center gap-2 mt-2">
                <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${CAT_COLORS[master.category]}`}>
                  {CAT_LABELS[master.category]}
                </span>
                <span className="text-xs text-muted-foreground">{master.durationMin} min</span>
              </div>
            </div>

            {/* Why */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-1">Benefits</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">{master.why}</p>
            </div>

            {/* Instructions */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-1">Instructions</h4>
              <ol className="text-sm text-muted-foreground leading-relaxed space-y-1.5 list-decimal list-inside">
                {master.instructions.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </div>

            {/* Breathing */}
            {master.breathing && (
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-1">Breathing</h4>
                <p className="text-sm text-muted-foreground">{master.breathing}</p>
              </div>
            )}

            {/* Safety */}
            {master.safety && (
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-1">Safety</h4>
                <p className="text-sm text-muted-foreground">{master.safety}</p>
              </div>
            )}

            {/* Contraindications */}
            {master.contraindications && master.contraindications.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-1">Contraindications</h4>
                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-0.5">
                  {master.contraindications.map((c, i) => <li key={i}>{c}</li>)}
                </ul>
              </div>
            )}

            {/* Equipment */}
            {master.equipment && master.equipment.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-1">Equipment</h4>
                <p className="text-sm text-muted-foreground">{master.equipment.join(", ")}</p>
              </div>
            )}

            {/* Start button */}
            <button
              onClick={handleStart}
              className="w-full h-12 rounded-2xl font-semibold text-[15px] flex items-center justify-center gap-2 transition-colors"
              style={{ background: "hsl(var(--secondary))", color: "hsl(var(--secondary-foreground))" }}
            >
              Start this exercise
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Bottom gradient fade to hint at scrollable content */}
        <div
          className="pointer-events-none absolute bottom-0 left-0 right-0 h-12 rounded-b-3xl"
          style={{ background: "linear-gradient(to top, hsl(var(--card)), transparent)" }}
        />
      </motion.div>
    </motion.div>
  );
}

function Section({ title, exercises, onSelect }: { title: string; exercises: MasterExercise[]; onSelect: (m: MasterExercise) => void }) {
  if (exercises.length === 0) return null;
  return (
    <div className="space-y-3">
      <h3 className="font-display font-semibold text-foreground text-base">{title} <span className="text-muted-foreground font-normal text-sm">({exercises.length})</span></h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {exercises.map(ex => (
          <ExerciseCard key={ex.id} master={ex} onClick={() => onSelect(ex)} />
        ))}
      </div>
    </div>
  );
}

export default function ExerciseLibrary() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("By Type");
  const [selected, setSelected] = useState<MasterExercise | null>(null);

  useEffect(() => { document.title = "Exercise Library — Vinys"; }, []);
  const byCategory = useMemo(() => ({
    breath: MASTER_EXERCISES.filter(e => e.category === "breath"),
    mobility: MASTER_EXERCISES.filter(e => e.category === "mobility"),
    stability: MASTER_EXERCISES.filter(e => e.category === "stability"),
    release: MASTER_EXERCISES.filter(e => e.category === "release"),
  }), []);

  const byArea = useMemo(getExercisesByArea, []);

  return (
    <div className="min-h-screen" style={{ background: "hsl(var(--background))" }}>
      {/* Header */}
      <header className="sticky top-0 z-40" style={{
        background: "hsla(40, 50%, 96%, 0.82)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: "1px solid hsl(var(--border))",
      }}>
        <div className="vinys-container flex items-center h-14 gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-foreground/5 text-muted-foreground" aria-label="Back">
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-display font-bold text-foreground text-lg">Exercises</h1>
          <span className="text-xs text-muted-foreground ml-1">{MASTER_EXERCISES.length} exercises</span>
        </div>
      </header>

      <main id="main-content" className="vinys-container py-6 space-y-6">
        {/* Tabs */}
        <div className="flex gap-2">
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                tab === t
                  ? "bg-secondary text-secondary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              style={tab !== t ? { background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" } : {}}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Content */}
        {tab === "By Type" && (
          <div className="space-y-8">
            <Section title="Breath" exercises={byCategory.breath} onSelect={setSelected} />
            <Section title="Mobility" exercises={byCategory.mobility} onSelect={setSelected} />
            <Section title="Stability" exercises={byCategory.stability} onSelect={setSelected} />
            <Section title="Release" exercises={byCategory.release} onSelect={setSelected} />
          </div>
        )}

        {tab === "By Area" && (
          <div className="space-y-8">
            {Object.entries(byArea).map(([area, exercises]) => (
              <Section key={area} title={area} exercises={exercises} onSelect={setSelected} />
            ))}
          </div>
        )}
      </main>

      {/* Detail bottom sheet */}
      <AnimatePresence>
        {selected && (
          <ExerciseDetailSheet master={selected} onClose={() => setSelected(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
