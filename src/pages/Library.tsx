import { useState, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { MASTER_LOOKUP } from "@/data/exerciseAdapter";
import { CATEGORY_LABELS, CONDITION_LABELS, EQUIPMENT_LABELS } from "@/constants/conditions";
import Layout from "@/components/Layout";
import { Search, Wind, Move, Shield, Heart } from "lucide-react";
import ExerciseDetailModal from "@/components/ExerciseDetailModal";

const CATEGORY_ICONS: Record<string, typeof Wind> = {
  breath: Wind, mobility: Move, stability: Shield, release: Heart,
};

const toTitleCase = (s: string) =>
  (s ?? "").trim().split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");

export default function Library() {
  const { state } = useApp();
  const userConditions = state.profile.conditions;
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("For you");
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);

  const exercises = useMemo(() => {
    const seen = new Set<string>();
    return state.exerciseLibrary.filter(ex => {
      const master = MASTER_LOOKUP[ex.id];
      const masterId = master?.id || ex.id;
      if (seen.has(masterId)) return false;
      seen.add(masterId); return true;
    });
  }, [state.exerciseLibrary]);

  const forYouLabel = useMemo(() => {
    if (userConditions.length === 0) return "All";
    // Map condition keys to body area words for "For your <area>" label
    const AREA_WORD: Record<string, string> = {
      back_pain: "back",
      upper_back_pain: "back",
      disc_herniation: "back",
      sciatica: "back",
      neck_pain: "neck",
      shoulder_pain: "shoulder",
      knee_pain: "knee",
      hip_pain: "hip",
      ankle_pain: "ankle",
      wrist_pain: "wrist",
    };
    for (const c of userConditions) {
      if (AREA_WORD[c]) return `For your ${AREA_WORD[c]}`;
    }
    return "For you";
  }, [userConditions]);

  const FILTER_CHIPS = useMemo(() => {
    const chips = [];
    if (userConditions.length > 0) chips.push("For you");
    chips.push("All", "Breath", "Mobility", "Stability", "Release");
    return chips;
  }, [userConditions]);

  const filtered = useMemo(() => {
    return exercises.filter(ex => {
      const master = MASTER_LOOKUP[ex.id];
      const title = master?.title || ex.name_he;
      const searchLower = search.toLowerCase();
      
      const matchesSearch = !search || 
        title.toLowerCase().includes(searchLower) ||
        ex.category.toLowerCase().includes(searchLower) ||
        (ex.equipment || []).some(eq => eq.toLowerCase().includes(searchLower)) ||
        (master?.equipment || []).some(eq => eq.toLowerCase().includes(searchLower));

      if (activeFilter === "For you") return matchesSearch;
      const matchesFilter = activeFilter === "All" || CATEGORY_LABELS[ex.category] === activeFilter;
      return matchesSearch && matchesFilter;
    });
  }, [exercises, search, activeFilter]);

  const selectedEx = selectedExercise ? exercises.find(e => e.id === selectedExercise) : null;
  const selectedMaster = selectedEx ? MASTER_LOOKUP[selectedEx.id] : null;

  return (
    <Layout>
      <div className="space-y-6 pb-8 max-w-3xl mx-auto">
        <div className="text-center space-y-3">
          <h1
            className="text-foreground"
            style={{ fontFamily: "'Fraunces', serif", fontWeight: 400, fontSize: "clamp(28px, 4vw, 36px)" }}
          >
            Exercises
          </h1>
          <p
            className="mx-auto"
            style={{
              fontFamily: "'Fraunces', serif",
              fontWeight: 400,
              fontSize: 17,
              color: "hsl(var(--muted-foreground))",
              maxWidth: 540,
            }}
          >
            Every exercise in Vinys, organized by what it does and where it works.
          </p>
        </div>

        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" placeholder="Search exercises..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full rounded-2xl border-2 border-border bg-card pl-10 pr-4 py-3 text-[15px] focus:border-accent/50 focus:outline-none transition-colors" />
        </div>

        <div className="flex gap-2 flex-wrap">
          {FILTER_CHIPS.map(chip => (
            <button key={chip} onClick={() => setActiveFilter(chip)}
              className={`text-sm px-4 py-2 rounded-full border-2 transition-all font-medium ${
                activeFilter === chip ? "border-accent bg-accent/10 text-foreground" : "border-border bg-card text-muted-foreground hover:border-accent/30"
              }`}>{chip === "For you" ? forYouLabel : chip}</button>
          ))}
        </div>

        

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(ex => {
            const master = MASTER_LOOKUP[ex.id];
            const title = master?.title || ex.name_he;
            const Icon = CATEGORY_ICONS[ex.category] || Wind;
            const intentLine = master?.why?.split(".")[0] || "";
            const equipList = master?.equipment || ex.equipment || [];

            return (
              <div key={ex.id} className="card-premium p-5 space-y-3 cursor-pointer hover:shadow-premium-lg transition-shadow"
                onClick={() => setSelectedExercise(ex.id)}>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-surface-soft flex items-center justify-center flex-shrink-0">
                    <Icon size={16} className="text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-foreground text-[14px] leading-snug truncate">{title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-surface-soft text-accent">{CATEGORY_LABELS[ex.category]}</span>
                      <span className="text-xs text-muted-foreground">{ex.minutes_default} min</span>
                    </div>
                  </div>
                </div>
                {intentLine && <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{intentLine}</p>}
                {/* Equipment tag strings normalized to title case at render time */}
                <div className="flex flex-wrap gap-1">
                  {equipList.length > 0 ? equipList.slice(0, 2).map(eq => (
                    <span key={eq} className="text-xs bg-muted/20 text-muted-foreground rounded-full px-2 py-0.5">
                      {toTitleCase(EQUIPMENT_LABELS[eq] || eq)}
                    </span>
                  )) : (
                    <span className="text-xs bg-muted/10 text-muted-foreground rounded-full px-2 py-0.5">No equipment</span>
                  )}
                </div>
                <button className="text-xs text-accent hover:underline mt-1">View details</button>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && search.trim() !== "" && (
          <div className="text-center" style={{ paddingTop: 80, paddingBottom: 80 }}>
            <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 500, fontSize: 11, letterSpacing: "0.18em", color: "#8A8378", textTransform: "uppercase" }}>
              No match
            </div>
            <h2 style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 400, fontSize: 22, color: "#1A1815", marginTop: 12 }}>
              Nothing matches '{search}' yet.
            </h2>
            <p className="mx-auto" style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 400, fontSize: 15, color: "#2D2A24", marginTop: 12, maxWidth: 360 }}>
              Try a different word, or browse the categories above.
            </p>
            <button
              onClick={() => setSearch("")}
              style={{ marginTop: 16, background: "transparent", border: "none", color: "#8A8378", fontFamily: "'Fraunces', Georgia, serif", fontSize: 14, cursor: "pointer", padding: 0 }}
            >
              Clear search
            </button>
          </div>
        )}

        {filtered.length === 0 && search.trim() === "" && activeFilter !== "All" && activeFilter !== "For you" && (
          <div className="text-center" style={{ paddingTop: 80, paddingBottom: 80 }}>
            <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 500, fontSize: 11, letterSpacing: "0.18em", color: "#8A8378", textTransform: "uppercase" }}>
              Empty category
            </div>
            <h2 style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 400, fontSize: 22, color: "#1A1815", marginTop: 12 }}>
              No {activeFilter} exercises in your library yet.
            </h2>
            <p className="mx-auto" style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 400, fontSize: 15, color: "#2D2A24", marginTop: 12, maxWidth: 360 }}>
              Tap All to see everything available.
            </p>
          </div>
        )}

      </div>

      {/* Exercise detail modal */}
      <ExerciseDetailModal
        selectedEx={selectedEx}
        selectedMaster={selectedMaster}
        onClose={() => setSelectedExercise(null)}
      />
    </Layout>
  );
}
