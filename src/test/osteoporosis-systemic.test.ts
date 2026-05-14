import { describe, expect, it } from "vitest";
import { buildSession } from "@/engine/engine2_session_builder";
import { sequenceSession } from "@/engine/engine3_sequencer";

function buildOsteoplan() {
  const e2 = buildSession({
    user_profile: [],
    stage: 1,
    experience_level: "beginner",
    duration_minutes: 20,
    conditions: ["osteoporosis"],
  });
  const e3 = sequenceSession(e2.selected_poses, 20, 0, false);
  return { e2, e3 };
}

describe("systemic osteoporosis safety filtering", () => {
  it("E1→E2→E3 osteoporosis plan contains zero Flexion-direction poses", () => {
    const { e3 } = buildOsteoplan();
    expect(e3.sequence.length).toBeGreaterThan(0);

    const flexion = e3.sequence.filter(
      (sp) => sp.exercise.movement_direction === "Flexion"
    );
    expect(flexion.map((sp) => sp.exercise.name)).toEqual([]);
  });

  it("E1→E2→E3 osteoporosis plan contains zero high-impact poses", () => {
    const { e3 } = buildOsteoplan();
    const highImpact = e3.sequence.filter((sp) => {
      const text = `${sp.exercise.name} ${sp.exercise.pose_family} ${sp.exercise.load_type} ${sp.exercise.clinical_rationale} ${sp.exercise.user_benefit}`.toLowerCase();
      return /(high\s*impact|jump|jumping|hop\b|hopping|plyometric)/.test(text);
    });
    expect(highImpact.map((sp) => sp.exercise.name)).toEqual([]);
  });

  it("regression: a body-area (non-systemic) plan still includes diverse movement directions", () => {
    const e2 = buildSession({
      user_profile: [{ area: "LB", primary: "FL", secondary: null }],
      stage: 1,
      experience_level: "beginner",
      duration_minutes: 20,
    });
    expect(e2.selected_poses.length).toBeGreaterThan(0);
    const directions = new Set(e2.selected_poses.map((sp) => sp.exercise.movement_direction));
    expect(directions.size).toBeGreaterThan(1);
  });
});
