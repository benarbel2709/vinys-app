import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { CATEGORY_LABELS, EQUIPMENT_LABELS } from "@/constants/conditions";
import type { MasterExercise } from "@/data/masterExercises";

interface Props {
  selectedEx: any | null;
  selectedMaster: MasterExercise | null;
  onClose: () => void;
}

const toTitleCase = (s: string) =>
  (s ?? "").trim().split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");

const SECTION_LABEL: React.CSSProperties = {
  fontFamily: "'Fraunces', serif",
  fontWeight: 500,
  fontSize: 11,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: "hsl(var(--foreground) / 0.6)",
  marginBottom: 4,
};

const BODY_TEXT: React.CSSProperties = {
  fontFamily: "'Fraunces', serif",
  fontWeight: 400,
  fontSize: 15,
  color: "hsl(var(--foreground))",
  lineHeight: 1.55,
};

const SAFETY_EXPLANATIONS: Record<string, string> = {
  Universal: "Safe for nearly everyone. No specific contraindications for this exercise.",
  Pregnancy: "Generally safe through all trimesters. Avoid breath retention if pregnant. Discontinue if anything feels off.",
  "Flare-up days": "Safe to do on bad-pain days. Lower demand than most exercises and unlikely to provoke pain.",
  "Disc conditions": "Considered safe for users with disc-related lower-back conditions. Stop immediately if you feel sharp pain or radiating symptoms.",
};

export default function ExerciseDetailModal({ selectedEx, selectedMaster, onClose }: Props) {
  const [expandedTag, setExpandedTag] = useState<string | null>(null);

  if (!selectedEx) return null;

  const englishName = selectedMaster?.title || selectedEx.name_he;
  const sanskritName: string | undefined = (selectedMaster as any)?.sanskrit || (selectedEx as any)?.sanskrit;
  const equipList: string[] = selectedMaster?.equipment || selectedEx.equipment || [];
  const description = selectedMaster?.why || selectedEx.why_he;
  const safetyText = selectedMaster?.safety || selectedEx.safety_he;
  const instructions: string[] = selectedMaster?.instructions || [];
  const modifications: string[] = (selectedMaster as any)?.modifications || [];

  const safetyTags: { key: string; label: string; on: boolean }[] = selectedMaster?.tags
    ? [
        { key: "Universal", label: "Universal", on: !!selectedMaster.tags.universalSafe },
        { key: "Pregnancy", label: "Pregnancy", on: !!selectedMaster.tags.pregnancySafe },
        { key: "Flare-up days", label: "Flare-up days", on: !!selectedMaster.tags.flareSafe },
        { key: "Disc conditions", label: "Disc conditions", on: !!selectedMaster.tags.discSafe },
      ].filter(t => t.on)
    : [];

  return (
    <Dialog open={!!selectedEx} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-md max-h-[85vh] overflow-y-auto rounded-[20px]"
        style={{ background: "#FFFCF5", border: "1px solid rgba(26,24,21,0.12)" }}
      >
        {/* Name block */}
        <div>
          <h2
            style={{
              fontFamily: "'Fraunces', serif",
              fontWeight: 400,
              fontSize: 24,
              color: "hsl(var(--foreground))",
              lineHeight: 1.2,
            }}
          >
            {englishName}
          </h2>
          {sanskritName && (
            <div
              style={{
                fontFamily: "'Fraunces', serif",
                fontStyle: "italic",
                fontWeight: 400,
                fontSize: 13,
                color: "hsl(var(--foreground) / 0.6)",
                letterSpacing: "0.05em",
                marginTop: 4,
              }}
            >
              {sanskritName}
            </div>
          )}
        </div>

        {/* Type / duration / equipment tags */}
        <div className="flex items-center gap-2 flex-wrap" style={{ marginTop: 12 }}>
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-surface-soft text-accent">
            {CATEGORY_LABELS[selectedEx.category]}
          </span>
          <span className="text-xs text-muted-foreground">{selectedEx.minutes_default} min</span>
          {equipList.length > 0 ? (
            equipList.map(eq => (
              <span key={eq} className="text-xs bg-surface-soft text-foreground px-2.5 py-1 rounded-full">
                {toTitleCase(EQUIPMENT_LABELS[eq] || eq)}
              </span>
            ))
          ) : (
            <span className="text-xs bg-surface-soft text-foreground px-2.5 py-1 rounded-full">No equipment</span>
          )}
        </div>

        {/* Sections */}
        <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 24 }}>
          {/* 1. WHAT IT DOES */}
          {description && (
            <div>
              <div style={SECTION_LABEL}>What it does</div>
              <p style={BODY_TEXT}>{description}</p>
            </div>
          )}

          {/* 2. HOW TO */}
          <div>
            <div style={SECTION_LABEL}>How to</div>
            {instructions.length > 0 ? (
              <ol style={{ ...BODY_TEXT, paddingLeft: 20, listStyle: "decimal", display: "flex", flexDirection: "column", gap: 6 }}>
                {instructions.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            ) : (
              <>
                {/* TODO: Engineering/Aviv to author per-exercise step-by-step instructions in the exercise data model */}
                <p style={BODY_TEXT}>Step-by-step instructions coming soon.</p>
              </>
            )}
          </div>

          {/* 3. IF YOU NEED TO MODIFY */}
          <div>
            <div style={SECTION_LABEL}>If you need to modify</div>
            {modifications.length > 0 ? (
              <ul style={{ ...BODY_TEXT, paddingLeft: 20, listStyle: "disc", display: "flex", flexDirection: "column", gap: 6 }}>
                {modifications.map((m, i) => <li key={i}>{m}</li>)}
              </ul>
            ) : (
              <>
                {/* TODO: Engineering/Aviv to author per-exercise modification options in the exercise data model */}
                <p style={BODY_TEXT}>Modifications coming soon.</p>
              </>
            )}
          </div>

          {/* 4. SAFETY */}
          {safetyText && (
            <div>
              <div style={SECTION_LABEL}>Safety</div>
              <p style={BODY_TEXT}>{safetyText}</p>
            </div>
          )}

          {/* 5. WHEN IT'S SAFE FOR YOU */}
          {safetyTags.length > 0 && (
            <div>
              <div style={SECTION_LABEL}>When it's safe for you</div>
              <div className="flex flex-wrap gap-1.5">
                {safetyTags.map(t => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setExpandedTag(expandedTag === t.key ? null : t.key)}
                    className="text-xs bg-accent/10 text-accent px-2.5 py-1 rounded-full hover:bg-accent/20 transition-colors"
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              {expandedTag && (
                <p
                  style={{
                    fontFamily: "'Fraunces', serif",
                    fontWeight: 400,
                    fontSize: 14,
                    color: "hsl(var(--muted-foreground))",
                    marginTop: 8,
                    lineHeight: 1.5,
                  }}
                >
                  {SAFETY_EXPLANATIONS[expandedTag]}
                </p>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
