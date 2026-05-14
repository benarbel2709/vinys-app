import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { useAuthContext } from "@/context/AuthContext";
import { adaptNextSession } from "@/lib/planGenerator";
import { Checkin as CheckinType } from "@/types";
import { supabase } from "@/integrations/supabase/client";

const INK_PRIMARY = "#1A1815";
const INK_SOFT = "#5C5852";
const CREAM = "#F5F2ED";
const RUST = "#B8472D";
const HAIRLINE = "rgba(26,24,21,0.12)";

type BackFeel = "better" | "same" | "a_bit_worse" | "much_worse";
type PainLevel = "none" | "mild" | "real" | "push_through";

const Q1_OPTIONS: { val: BackFeel; label: string }[] = [
  { val: "better", label: "Better" },
  { val: "same", label: "About the same" },
  { val: "a_bit_worse", label: "A bit worse" },
  { val: "much_worse", label: "Much worse" },
];

const Q2_OPTIONS: { val: PainLevel; label: string }[] = [
  { val: "none", label: "No, nothing" },
  { val: "mild", label: "Mild discomfort during one or two exercises" },
  { val: "real", label: "Real pain during one or more exercises" },
  { val: "push_through", label: "Real pain that I had to push through" },
];

const BODY_REGIONS = ["Lower back", "Mid-back", "Neck", "Shoulder", "Hip", "Knee", "Other"];

const pillBase: React.CSSProperties = {
  fontFamily: "'Fraunces', serif",
  fontWeight: 400,
  fontSize: 15,
  padding: "10px 18px",
  borderRadius: 999,
  border: `1px solid ${HAIRLINE}`,
  background: "transparent",
  color: INK_PRIMARY,
  cursor: "pointer",
  transition: "all 0.15s ease",
  textAlign: "left",
};

const pillSelected: React.CSSProperties = {
  ...pillBase,
  background: RUST,
  color: CREAM,
  border: "1px solid transparent",
};

const labelStyle: React.CSSProperties = {
  fontFamily: "'Fraunces', serif",
  fontWeight: 500,
  fontSize: 17,
  color: INK_PRIMARY,
  display: "block",
  marginBottom: 12,
};

export default function CheckinPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { state, updateState } = useApp();
  const { user } = useAuthContext();
  const navigate = useNavigate();

  // Resolve the session's exercises (for severe-pain followup chips)
  const sessionExercises = useMemo(() => {
    const session = state.currentPlan?.sessions.find((s) => s.id === sessionId);
    if (!session) return [];
    return session.exerciseIds
      .map((id) => state.exerciseLibrary.find((e) => e.id === id))
      .filter(Boolean)
      .map((e) => ({ id: e!.id, name: e!.name_he }));
  }, [sessionId, state.currentPlan, state.exerciseLibrary]);

  const [backFeel, setBackFeel] = useState<BackFeel | null>(null);
  const [painLevel, setPainLevel] = useState<PainLevel | null>(null);
  const [severePainExercises, setSeverePainExercises] = useState<string[]>([]);
  const [severePainRegion, setSeverePainRegion] = useState<string | null>(null);
  const [energyTouched, setEnergyTouched] = useState(false);
  const [energy, setEnergy] = useState(5);

  const showSevereFollowups = painLevel === "push_through";
  const canSubmit =
    backFeel !== null &&
    painLevel !== null &&
    (!showSevereFollowups || severePainRegion !== null);

  const handleSave = async () => {
    if (!canSubmit || !sessionId) return;

    // Map back-feel to pain delta for legacy adaptNextSession
    const painDelta = backFeel === "much_worse" ? 3 : backFeel === "a_bit_worse" ? 1 : backFeel === "same" ? 0 : -1;
    const tooMuch = painLevel === "push_through";

    const checkin: CheckinType = {
      id: `checkin_${Date.now()}`,
      sessionId,
      createdAt: new Date().toISOString(),
      painBefore: 0,
      painAfter: Math.max(0, Math.min(10, 5 + painDelta)),
      fatigueBefore: 0,
      fatigueAfter: energyTouched ? 10 - energy : 5,
      tooMuch,
      helpedMost: "breath",
    };

    let plan = state.currentPlan;
    if (plan) {
      plan = adaptNextSession(
        plan,
        sessionId,
        tooMuch,
        painDelta,
        state.profile.flareToday,
        state.profile.minutesPerSession,
        state.exerciseLibrary,
        state.profile.conditions,
      );
    }

    updateState({ checkins: [...state.checkins, checkin], currentPlan: plan });

    if (user) {
      // TODO: Engineering needs to extend the post-session data schema for back-feel, pain-level, severe-pain followups, and energy fields.
      await supabase.from("user_checkins").insert({
        user_id: user.id,
        source: "end_of_practice",
        pain_before: 0,
        pain_after: checkin.painAfter,
        fatigue_before: 0,
        fatigue_after: checkin.fatigueAfter,
      });
    }

    navigate("/complete");
  };

  return (
    <div style={{ background: CREAM, minHeight: "100vh" }}>
      <div className="mx-auto" style={{ maxWidth: 560, padding: "40px 24px 60px" }}>
        {/* TODO: Engineering needs to extend the post-session data schema for back-feel, pain-level, severe-pain followups, and energy fields. */}

        <h1 style={{
          fontFamily: "'Fraunces', serif",
          fontWeight: 400,
          color: INK_PRIMARY,
          fontSize: "clamp(26px, 3.4vw, 32px)",
          lineHeight: 1.15,
          margin: 0,
        }}>
          How did that go?
        </h1>
        <p style={{
          fontFamily: "'Fraunces', serif",
          fontWeight: 400,
          fontSize: 16,
          color: INK_SOFT,
          marginTop: 12,
          lineHeight: 1.5,
        }}>
          Two quick questions before you go. Your answers shape what we send next time.
        </p>

        {/* Q1 */}
        <div style={{ marginTop: 32 }}>
          <span style={labelStyle}>How does your back feel right now, compared to before the practice?</span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {Q1_OPTIONS.map((o) => (
              <button
                key={o.val}
                onClick={() => setBackFeel(o.val)}
                style={backFeel === o.val ? pillSelected : pillBase}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        {/* Q2 */}
        <div style={{ marginTop: 32 }}>
          <span style={labelStyle}>Did anything during the practice cause pain?</span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {Q2_OPTIONS.map((o) => (
              <button
                key={o.val}
                onClick={() => setPainLevel(o.val)}
                style={painLevel === o.val ? pillSelected : pillBase}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        {/* Conditional severe-pain followups */}
        {/* TODO: Engineering needs to extend the post-session data schema for back-feel, pain-level, severe-pain followups, and energy fields. */}
        {showSevereFollowups && (
          <div style={{ marginTop: 24 }}>
            {sessionExercises.length > 0 && (
              <div>
                <span style={labelStyle}>Which exercise(s)?</span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {sessionExercises.map((ex) => {
                    const isSel = severePainExercises.includes(ex.id);
                    return (
                      <button
                        key={ex.id}
                        onClick={() => {
                          setSeverePainExercises((prev) =>
                            prev.includes(ex.id) ? prev.filter((x) => x !== ex.id) : [...prev, ex.id],
                          );
                        }}
                        style={isSel ? pillSelected : pillBase}
                      >
                        {ex.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div style={{ marginTop: 24 }}>
              <span style={labelStyle}>Where in your body?</span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {BODY_REGIONS.map((r) => (
                  <button
                    key={r}
                    onClick={() => setSeverePainRegion(r)}
                    style={severePainRegion === r ? pillSelected : pillBase}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Q3 — optional energy slider, no default thumb */}
        <div style={{ marginTop: 32 }}>
          <span style={labelStyle}>How's your energy now?</span>
          <div style={{ padding: "12px 0" }}>
            <input
              type="range"
              min={0}
              max={10}
              value={energyTouched ? energy : 0}
              onChange={(e) => { setEnergyTouched(true); setEnergy(Number(e.target.value)); }}
              onMouseDown={() => setEnergyTouched(true)}
              onTouchStart={() => setEnergyTouched(true)}
              onKeyDown={() => setEnergyTouched(true)}
              className={energyTouched ? "vinys-energy-slider touched" : "vinys-energy-slider"}
              style={{
                width: "100%",
                accentColor: RUST,
              }}
              aria-label="Energy level"
            />
            <style>{`
              .vinys-energy-slider::-webkit-slider-thumb { opacity: 0; }
              .vinys-energy-slider::-moz-range-thumb { opacity: 0; border-color: transparent; background: transparent; }
              .vinys-energy-slider.touched::-webkit-slider-thumb { opacity: 1; }
              .vinys-energy-slider.touched::-moz-range-thumb { opacity: 1; }
            `}</style>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              fontFamily: "'Fraunces', serif",
              fontSize: 12,
              color: INK_SOFT,
              marginTop: 4,
            }}>
              <span>Exhausted</span>
              <span>{energyTouched ? energy : "—"}</span>
              <span>Energised</span>
            </div>
          </div>
        </div>

        {/* Submit */}
        <button
          onClick={canSubmit ? handleSave : undefined}
          disabled={!canSubmit}
          style={{
            marginTop: 32,
            width: "100%",
            padding: "14px 0",
            background: RUST,
            color: CREAM,
            fontFamily: "'Fraunces', serif",
            fontWeight: 500,
            fontSize: 17,
            borderRadius: 8,
            border: "none",
            opacity: canSubmit ? 1 : 0.4,
            cursor: canSubmit ? "pointer" : "not-allowed",
          }}
        >
          Save and finish →
        </button>
      </div>
    </div>
  );
}
