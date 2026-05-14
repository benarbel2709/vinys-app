// Profile display name lookup table.
// Keys are camelCase clinical profile identifiers produced by the assessment engine.
// Values are the human-readable display names shown to users.
export const PROFILE_DATA: Record<string, Record<string, { name: string }>> = {
  lowerBack: {
    flexionSensitive: { name: "Flexion Sensitive" },
    extensionSensitive: { name: "Extension Sensitive" },
    neuralComponent: { name: "Neural Component" },
    loadIntolerant: { name: "Load Intolerant" },
    stiffHypomobile: { name: "Stiff & Hypomobile" },
  },
  // TODO: profiles pending clinical definition
  knee: {},
  neck: {},
  shoulder: {},
  hip: {},
  ankle: {},
  wrist: {},
  upperBack: {},
};

// Helper: returns the display name for a given area + profile key.
// Falls back gracefully if the profile key has no mapping yet.
export function getProfileDisplayName(area: string, profileKey: string): string | null {
  const areaProfiles = PROFILE_DATA[area];
  if (!areaProfiles) return null;
  return areaProfiles[profileKey]?.name ?? null;
}
