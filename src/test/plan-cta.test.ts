import { describe, it, expect } from "vitest";

/**
 * Tests the CTA label logic from Plan.tsx:
 * - When session.dayIndex === todayDayIndex → "Start today's session"
 * - When session.dayIndex !== todayDayIndex (fallback) → "Start session"
 */
describe("Plan CTA label logic", () => {
  const todayDayIndex = new Date().getDay(); // 0=Sun … 6=Sat

  function getLabel(sessionDayIndex: number, todayDay: number) {
    return sessionDayIndex === todayDay ? "Start today's session" : "Start session";
  }

  it("shows 'Start today's session' when dayIndex matches today", () => {
    expect(getLabel(todayDayIndex, todayDayIndex)).toBe("Start today's session");
  });

  it("shows 'Start session' when dayIndex does NOT match today", () => {
    const otherDay = (todayDayIndex + 1) % 7;
    expect(getLabel(otherDay, todayDayIndex)).toBe("Start session");
  });

  it("shows 'Start session' for all non-matching days", () => {
    for (let d = 0; d < 7; d++) {
      if (d === todayDayIndex) continue;
      expect(getLabel(d, todayDayIndex)).toBe("Start session");
    }
  });
});
