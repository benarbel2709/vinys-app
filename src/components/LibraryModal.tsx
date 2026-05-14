import { useState, useMemo, useEffect, useRef } from "react";
import { useApp } from "@/context/AppContext";
import { MASTER_LOOKUP } from "@/data/exerciseAdapter";
import { CATEGORY_LABELS, CONDITION_LABELS, EQUIPMENT_LABELS } from "@/constants/conditions";
import { Search, Wind, Move, Shield, Heart, X, ArrowLeft } from "lucide-react";
import {
  Dialog, DialogContent,
} from "@/components/ui/dialog";

const CATEGORY_ICONS: Record<string, typeof Wind> = {
  breath: Wind, mobility: Move, stability: Shield, release: Heart,
};

interface LibraryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialExerciseId?: string | null;
}

export default function LibraryModal({ open, onOpenChange, initialExerciseId }: LibraryModalProps) {
  const { state } = useApp();
  const userConditions = state.profile.conditions;
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("For you");
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

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
    const names = userConditions.slice(0, 2).map(c => CONDITION_LABELS[c] || c);
    return `For ${names.join(" & ")}`;
  }, [userConditions]);

  const FILTER_CHIPS = useMemo(() => {
    const chips: string[] = [];
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

  // Handle initialExerciseId: scroll to and highlight the exercise
  useEffect(() => {
    if (!open || !initialExerciseId) return;
    // Reset filters so the exercise is visible
    setSearch("");
    setActiveFilter("For you");
    setSelectedExercise(null);

    // Set highlight
    setHighlightedId(initialExerciseId);
    const clearHighlight = setTimeout(() => setHighlightedId(null), 2000);

    // Scroll to the card after render
    const scrollTimeout = setTimeout(() => {
      const el = document.getElementById(`lib-card-${initialExerciseId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 150);

    return () => {
      clearTimeout(clearHighlight);
      clearTimeout(scrollTimeout);
    };
  }, [open, initialExerciseId]);

  const selectedEx = selectedExercise ? exercises.find(e => e.id === selectedExercise) : null;
  const selectedMaster = selectedEx ? MASTER_LOOKUP[selectedEx.id] : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[1100px] w-[90vw] max-h-[80vh] p-0 rounded-[12px] flex flex-col overflow-hidden sm:max-w-[1100px] [&>button.absolute]:hidden">
        {/* ── Detail view ── */}
        {selectedEx ? (
          <div className="flex flex-col h-full max-h-[80vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
              <button onClick={() => setSelectedExercise(null)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft size={16} /> Back to library
              </button>
              <button onClick={() => onOpenChange(false)} className="text-foreground/60 hover:text-foreground transition-colors p-1">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <h2 className="text-xl font-bold text-foreground mb-4">
                {selectedMaster?.title || selectedEx.name_he}
              </h2>
              <div className="space-y-4 text-sm">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-surface-soft text-accent">
                    {CATEGORY_LABELS[selectedEx.category]}
                  </span>
                  <span className="text-xs text-muted-foreground">{selectedEx.minutes_default} min</span>
                </div>
                {(selectedMaster?.why || selectedEx.why_he) && (
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Description</h4>
                    <p className="text-muted-foreground leading-relaxed">{selectedMaster?.why || selectedEx.why_he}</p>
                  </div>
                )}
                {(selectedMaster?.safety || selectedEx.safety_he) && (
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Safety Note</h4>
                    <p className="text-muted-foreground leading-relaxed">{selectedMaster?.safety || selectedEx.safety_he}</p>
                  </div>
                )}
                {selectedMaster?.tags && (
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Safety Tags</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedMaster.tags.universalSafe && <span className="text-xs bg-accent/10 text-accent px-2.5 py-1 rounded-full">Universal safe</span>}
                      {selectedMaster.tags.pregnancySafe && <span className="text-xs bg-accent/10 text-accent px-2.5 py-1 rounded-full">Pregnancy safe</span>}
                      {selectedMaster.tags.flareSafe && <span className="text-xs bg-accent/10 text-accent px-2.5 py-1 rounded-full">Flare safe</span>}
                      {selectedMaster.tags.discSafe && <span className="text-xs bg-accent/10 text-accent px-2.5 py-1 rounded-full">Disc safe</span>}
                    </div>
                  </div>
                )}
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Equipment</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {(selectedMaster?.equipment || selectedEx.equipment || []).length > 0 ? (
                      (selectedMaster?.equipment || selectedEx.equipment || []).map(eq => (
                        <span key={eq} className="text-xs bg-surface-soft text-foreground px-2.5 py-1 rounded-full">
                          {EQUIPMENT_LABELS[eq] || eq}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground">No equipment needed</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ── List view ── */
          <div className="flex flex-col h-full max-h-[80vh]">
            {/* Sticky header + search + chips */}
            <div className="shrink-0 px-6 pt-6 pb-4 space-y-4 border-b border-border bg-background">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-foreground">Exercises library</h2>
                  <p className="text-xs text-muted-foreground">{filtered.length} exercises</p>
                </div>
                <button onClick={() => onOpenChange(false)} className="text-foreground/60 hover:text-foreground transition-colors p-1">
                  <X size={20} />
                </button>
              </div>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search exercises..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full rounded-full border border-border bg-card pl-10 pr-4 py-2.5 text-sm focus:border-accent/50 focus:outline-none transition-colors"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {FILTER_CHIPS.map(chip => (
                  <button key={chip} onClick={() => setActiveFilter(chip)}
                    className={`text-sm px-3.5 py-1.5 rounded-full border-2 transition-all font-medium ${
                      activeFilter === chip ? "border-accent bg-accent/10 text-foreground" : "border-border bg-card text-muted-foreground hover:border-accent/30"
                    }`}>{chip === "For you" ? forYouLabel : chip}</button>
                ))}
              </div>
            </div>

            {/* Scrollable results */}
            <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-6 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map(ex => {
                  const master = MASTER_LOOKUP[ex.id];
                  const title = master?.title || ex.name_he;
                  const Icon = CATEGORY_ICONS[ex.category] || Wind;
                  const intentLine = master?.why?.split(".")[0] || "";
                  const equipList = master?.equipment || ex.equipment || [];
                  const isHighlighted = highlightedId === ex.id;

                  return (
                    <div key={ex.id}
                      id={`lib-card-${ex.id}`}
                      className={`rounded-xl border bg-card p-4 space-y-2.5 cursor-pointer hover:shadow-md transition-all ${
                        isHighlighted ? "border-accent ring-2 ring-accent/30" : "border-border"
                      }`}
                      onClick={() => setSelectedExercise(ex.id)}>
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-surface-soft flex items-center justify-center flex-shrink-0">
                          <Icon size={14} className="text-accent" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-foreground text-[13px] leading-snug truncate">{title}</h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-surface-soft text-accent">{CATEGORY_LABELS[ex.category]}</span>
                            <span className="text-xs text-muted-foreground">{ex.minutes_default} min</span>
                          </div>
                        </div>
                      </div>
                      {intentLine && <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{intentLine}</p>}
                      <div className="flex flex-wrap gap-1">
                        {equipList.length > 0 ? equipList.slice(0, 2).map(eq => (
                          <span key={eq} className="text-xs bg-muted/20 text-muted-foreground rounded-full px-2 py-0.5">
                            {EQUIPMENT_LABELS[eq] || eq}
                          </span>
                        )) : (
                          <span className="text-xs bg-muted/10 text-muted-foreground rounded-full px-2 py-0.5">No equipment</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              {filtered.length === 0 && (
                <div className="text-center py-12"><p className="text-muted-foreground">No exercises match your search.</p></div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
