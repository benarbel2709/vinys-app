import { useState, useRef } from "react";
import { useApp } from "@/context/AppContext";
import { useAuthContext } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import Layout from "@/components/Layout";
import SignInModal from "@/components/SignInModal";
import { readState, writeState } from "@/lib/storage";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { RotateCcw, Download, Upload, Settings as SettingsIcon, Info, FileText, UserCircle, LogOut, Trash2, ShieldAlert } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { PracticeTime } from "@/constants/conditions";

const TIME_OPTIONS: { value: PracticeTime; label: string; desc: string }[] = [
  { value: "morning", label: "Morning", desc: "06:00–12:00" },
  { value: "afternoon", label: "Afternoon", desc: "12:00–17:00" },
  { value: "evening", label: "Evening", desc: "17:00–21:00" },
  { value: "night", label: "Night", desc: "21:00+" },
];

const CLOSING_OPTIONS: { value: "savasana" | "meditation" | "body_rest"; label: string; desc: string }[] = [
  { value: "savasana", label: "Savasana", desc: "Classic lying-down rest" },
  { value: "body_rest", label: "Body Rest", desc: "Body scan & integration" },
  { value: "meditation", label: "Meditation", desc: "Guided stillness" },
];

export default function Settings() {
  const navigate = useNavigate();
  const { state, updateProfile, resetAll } = useApp();
  const { user, signOut } = useAuthContext();
  const [showSignIn, setShowSignIn] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [animationsEnabled, setAnimationsEnabled] = useState(
    !readState<boolean>("vinys_disable_animations", false)
  );
  const [importConfirm, setImportConfirm] = useState(false);
  const [pendingImport, setPendingImport] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const NOTIF_DEFAULTS = { dailyReminder: false, checkinReminder: false, weeklyRecap: false, planChanges: true };
  const [notifications, setNotifications] = useState(() => readState("vinys_notifications", NOTIF_DEFAULTS));
  const updateNotif = (key: keyof typeof NOTIF_DEFAULTS, value: boolean) => {
    const next = { ...notifications, [key]: value };
    setNotifications(next);
    writeState("vinys_notifications", next);
  };
  const NOTIF_ROWS: { key: keyof typeof NOTIF_DEFAULTS; label: string; sub: string }[] = [
    { key: "dailyReminder", label: "Daily practice reminder", sub: "A gentle nudge at your chosen Practice Time." },
    { key: "checkinReminder", label: "Post-session check-in reminder", sub: "If you forget to finish your check-in, we'll remind you the next day." },
    { key: "weeklyRecap", label: "Weekly recap email", sub: "A short summary of your week sent to your account email." },
    { key: "planChanges", label: "Plan changes", sub: "Get a heads-up when we adjust your plan based on your check-ins." },
  ];


  // Account-deletion (Danger zone) state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteEmailInput, setDeleteEmailInput] = useState("");
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    if (!user) return;
    if (deleteEmailInput.trim().toLowerCase() !== (user.email ?? "").toLowerCase()) {
      toast({ title: "Email does not match", description: "Type your account email exactly to confirm.", variant: "destructive" });
      return;
    }
    setDeleting(true);
    try {
      const { data, error } = await supabase.functions.invoke("delete-account", { body: {} });
      if (error || !data?.ok) {
        toast({ title: "Could not delete account", description: error?.message ?? "Please try again.", variant: "destructive" });
        setDeleting(false);
        return;
      }
      // Wipe local state and sign out
      try { resetAll(); } catch { /* ignore */ }
      try { localStorage.clear(); } catch { /* ignore */ }
      await signOut();
      window.location.href = "/";
    } catch (e: any) {
      toast({ title: "Could not delete account", description: e?.message ?? "Please try again.", variant: "destructive" });
      setDeleting(false);
    }
  };

  const { practiceTime, closingPreference } = state.profile;
  const closing = closingPreference || "savasana";
  const modificationTier = ((state.profile as any).modificationTier as "floor" | "chair" | "supported") || "floor";

  const POSTURE_OPTIONS: { value: "floor" | "chair" | "supported"; label: string; helper: string }[] = [
    { value: "floor", label: "Floor", helper: "Lying on the floor." },
    { value: "chair", label: "Chair", helper: "Seated, fully supported." },
    { value: "supported", label: "Supported", helper: "Reclined with bolsters or props." },
  ];

  const handleToggleAnimations = (checked: boolean) => {
    setAnimationsEnabled(checked);
    writeState("vinys_disable_animations", !checked);
  };

  const handleReset = () => {
    resetAll();
    setConfirmReset(false);
    window.location.href = "/";
  };

  const handleExportData = () => {
    const data: Record<string, unknown> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith("pranva") || key.startsWith("yael") || key.startsWith("yogacare") || key === "debugForceAnimate" || key === "debugAnimations")) {
        try { data[key] = JSON.parse(localStorage.getItem(key) || "null"); }
        catch { data[key] = localStorage.getItem(key); }
      }
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `vinys-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click(); URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      try { const data = JSON.parse(text); if (typeof data === "object" && data !== null) { setPendingImport(text); setImportConfirm(true); } }
      catch { alert("Invalid file"); }
    };
    reader.readAsText(file); e.target.value = "";
  };

  const confirmImportFn = () => {
    if (!pendingImport) return;
    try {
      const data = JSON.parse(pendingImport);
      Object.entries(data).forEach(([key, value]) => { localStorage.setItem(key, typeof value === "string" ? value : JSON.stringify(value)); });
      setImportConfirm(false); setPendingImport(null); window.location.reload();
    } catch { alert("Import error"); }
  };

  // TODO: Engineering needs to confirm the existing auth check and sign-out method match what is used elsewhere in the app (likely Supabase auth via src/integrations/supabase/client.ts).
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);
  const [showAccountDeleteConfirm, setShowAccountDeleteConfirm] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleRestartProgram = () => {
    try {
      const raw = localStorage.getItem("vinys_app_state");
      if (raw) {
        const parsed = JSON.parse(raw);
        delete parsed.currentPlan;
        delete parsed.profile;
        delete parsed.sessions;
        localStorage.setItem("vinys_app_state", JSON.stringify(parsed));
      }
    } catch { /* ignore */ }
    setShowRestartConfirm(false);
    navigate("/onboarding");
  };

  const handleAccountDelete = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("delete-account", { body: {} });
      if (error || !data?.ok) {
        toast({ title: "Could not delete account", description: "Contact support@vinys.app to delete your account.", variant: "destructive" });
        return;
      }
      try { resetAll(); } catch { /* ignore */ }
      try { localStorage.clear(); } catch { /* ignore */ }
      await signOut();
      window.location.href = "/";
    } catch {
      toast({ title: "Could not delete account", description: "Contact support@vinys.app to delete your account.", variant: "destructive" });
    }
  };

  return (
    <Layout>
      <div className="space-y-6 pb-8">
        <div className="text-center space-y-2">
          <h1 className="text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground">Manage your preferences and data.</p>
        </div>

        {/* NEW Account section — first card */}
        <div
          className="p-6 space-y-3 rounded-[20px]"
          style={{ background: "#FFFCF5", border: "1px solid rgba(26,24,21,0.12)" }}
        >
          <h2 className="text-[15px] font-bold text-foreground flex items-center gap-2">
            <UserCircle size={16} className="text-accent" />Account
          </h2>
          {user ? (
            <div className="flex flex-col gap-4 pt-1">
              <div>
                <div
                  style={{
                    fontFamily: "'Fraunces', Georgia, serif",
                    fontWeight: 500,
                    fontSize: 11,
                    letterSpacing: "0.18em",
                    color: "#8A8378",
                    textTransform: "uppercase",
                  }}
                >
                  Signed in as
                </div>
                <div
                  style={{
                    fontFamily: "'Fraunces', Georgia, serif",
                    fontWeight: 400,
                    fontSize: 16,
                    color: "#1A1815",
                    marginTop: 4,
                  }}
                >
                  {user.email}
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="w-full"
                style={{
                  border: "1px solid rgba(26,24,21,0.12)",
                  background: "transparent",
                  color: "#1A1815",
                  padding: "12px 0",
                  borderRadius: 8,
                  fontFamily: "'Fraunces', Georgia, serif",
                  fontWeight: 500,
                  fontSize: 15,
                  cursor: "pointer",
                }}
              >
                Sign out
              </button>
              {!showRestartConfirm ? (
                <button
                  onClick={() => setShowRestartConfirm(true)}
                  className="w-full"
                  style={{
                    border: "1px solid rgba(26,24,21,0.12)",
                    background: "transparent",
                    color: "#1A1815",
                    padding: "12px 0",
                    borderRadius: 8,
                    fontFamily: "'Fraunces', Georgia, serif",
                    fontWeight: 500,
                    fontSize: 15,
                    cursor: "pointer",
                  }}
                >
                  Restart program
                </button>
              ) : (
                <div className="p-4 rounded-[12px] space-y-3" style={{ border: "1px solid rgba(26,24,21,0.12)" }}>
                  <p className="text-sm text-foreground">
                    Restart your program? Your current plan and progress will be cleared. You'll start fresh from the assessment.
                  </p>
                  <div className="flex gap-2">
                    <Button variant="hero" size="sm" onClick={handleRestartProgram} className="flex-1">Confirm</Button>
                    <Button variant="outline" size="sm" onClick={() => setShowRestartConfirm(false)} className="flex-1">Cancel</Button>
                  </div>
                </div>
              )}
              {!showAccountDeleteConfirm ? (
                <button
                  onClick={() => setShowAccountDeleteConfirm(true)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#8A8378",
                    fontFamily: "'Fraunces', Georgia, serif",
                    fontSize: 14,
                    cursor: "pointer",
                    padding: 0,
                    alignSelf: "flex-start",
                  }}
                >
                  Delete my account
                </button>
              ) : (
                <div className="p-4 rounded-[12px] space-y-3" style={{ border: "1px solid rgba(26,24,21,0.12)" }}>
                  <p className="text-sm text-foreground">Delete your account permanently? This cannot be undone.</p>
                  <div className="flex gap-2">
                    <Button variant="stop" size="sm" onClick={handleAccountDelete} className="flex-1">Confirm</Button>
                    <Button variant="outline" size="sm" onClick={() => setShowAccountDeleteConfirm(false)} className="flex-1">Cancel</Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-2 pt-1">
              <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 400, fontSize: 16, color: "#1A1815" }}>
                Save your plan to your account
              </div>
              <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 400, fontSize: 14, color: "#2D2A24" }}>
                You're using Vinys as a guest. Sign in to keep your plan across devices and sessions.
              </div>
              <button
                onClick={() => navigate("/auth")}
                style={{
                  marginTop: 8,
                  background: "#B8472D",
                  color: "#F5F0E6",
                  fontFamily: "'Fraunces', Georgia, serif",
                  fontWeight: 500,
                  fontSize: 15,
                  padding: "12px 24px",
                  borderRadius: 8,
                  border: "none",
                  cursor: "pointer",
                  alignSelf: "flex-start",
                }}
              >
                Sign in
              </button>
            </div>
          )}
        </div>

        <div className="card-premium p-6 space-y-4">

          <h2 className="text-[15px] font-bold text-foreground flex items-center gap-2"><SettingsIcon size={16} className="text-accent" />Preferences</h2>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[15px] font-medium text-foreground">Exercise animations</span>
              <p className="text-xs text-muted-foreground mt-0.5">Show movement demonstrations</p>
            </div>
            <Switch checked={animationsEnabled} onCheckedChange={handleToggleAnimations} />
          </div>
        </div>

        <div className="card-premium p-6 space-y-3">
          <h2 className="text-[15px] font-bold text-foreground flex items-center gap-2"><SettingsIcon size={16} className="text-accent" />Practice Time</h2>
          <div className="grid grid-cols-2 gap-2">
            {TIME_OPTIONS.map((opt) => (
              <button key={opt.value} onClick={() => updateProfile({ practiceTime: opt.value })}
                className={`py-3 px-3 rounded-[16px] border-2 text-center transition-all ${
                  practiceTime === opt.value
                    ? "border-accent bg-accent/10 text-foreground shadow-sm"
                    : "border-border bg-card text-foreground hover:border-accent/30"
                }`}>
                <span className="text-sm font-bold block">{opt.label}</span>
                <span className="text-xs text-muted-foreground">{opt.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* TODO: Engineering needs to wire up actual delivery for these toggles — daily/check-in reminders need browser push or email scheduling, weekly recap and plan changes need transactional email integration (Resend / Postmark / Supabase Edge Function). The toggles save to localStorage today but no real notifications fire yet. */}
        <div
          className="p-6 space-y-3 rounded-[20px]"
          style={{ background: "#FFFCF5", border: "1px solid rgba(26,24,21,0.12)" }}
        >
          <h2 className="text-[15px] font-bold text-foreground flex items-center gap-2">
            <SettingsIcon size={16} className="text-accent" />Notifications
          </h2>
          <div className="flex flex-col gap-4 pt-1">
            {NOTIF_ROWS.map((row) => (
              <div key={row.key} className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 400, fontSize: 16, color: "#1A1815" }}>
                    {row.label}
                  </div>
                  <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 400, fontSize: 13, color: "#8A8378", marginTop: 2 }}>
                    {row.sub}
                  </div>
                </div>
                <Switch checked={notifications[row.key]} onCheckedChange={(v) => updateNotif(row.key, v)} />
              </div>
            ))}
          </div>
          <p style={{ fontFamily: "'Fraunces', Georgia, serif", fontStyle: "italic", fontWeight: 400, fontSize: 13, color: "#8A8378", marginTop: 20 }}>
            Reminders won't include any clinical or sensitive information.
          </p>
        </div>

        <div className="card-premium p-6 space-y-3">
          <h2 className="text-[15px] font-bold text-foreground flex items-center gap-2"><SettingsIcon size={16} className="text-accent" />Practice posture</h2>
          <p className="text-[13px] text-muted-foreground">How you practice today shapes how we close the session. Change anytime.</p>
          <div className="flex flex-col gap-3 pt-1">
            {POSTURE_OPTIONS.map((opt) => (
              <label key={opt.value} className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="modificationTier"
                  value={opt.value}
                  checked={modificationTier === opt.value}
                  onChange={() => updateProfile({ modificationTier: opt.value } as any)}
                  className="mt-1 accent-accent h-4 w-4"
                />
                <span className="flex flex-col">
                  <span className="text-sm font-semibold text-foreground">{opt.label}</span>
                  <span className="text-[13px] text-muted-foreground italic" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>{opt.helper}</span>
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="card-premium p-6 space-y-3">
          <h2 className="text-[15px] font-bold text-foreground flex items-center gap-2"><SettingsIcon size={16} className="text-accent" />Session Closing</h2>
          <div className="flex gap-2">
            {CLOSING_OPTIONS.map((opt) => (
              <button key={opt.value} onClick={() => updateProfile({ closingPreference: opt.value })}
                className={`flex-1 py-3 px-2 rounded-[16px] border-2 text-center transition-all ${
                  closing === opt.value
                    ? "border-accent bg-accent/10 text-foreground shadow-sm"
                    : "border-border bg-card text-foreground hover:border-accent/30"
                }`}>
                <span className="text-sm font-bold block">{opt.label}</span>
                <span className="text-[11px] text-muted-foreground leading-tight">{opt.desc}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="card-premium p-6 space-y-4">
          <h2 className="text-[15px] font-bold text-foreground flex items-center gap-2"><Download size={16} className="text-accent" />Data Management</h2>
          <div className="flex gap-2">
            <Button variant="outline-calm" size="sm" onClick={handleExportData} className="flex-1 gap-1.5 text-xs"><Download size={14} />Export data</Button>
            <Button variant="outline-calm" size="sm" onClick={() => fileInputRef.current?.click()} className="flex-1 gap-1.5 text-xs"><Upload size={14} />Import data</Button>
            <input ref={fileInputRef} type="file" accept=".json" onChange={handleImportFile} className="hidden" />
          </div>
          <Button variant="outline-calm" size="sm" onClick={() => navigate("/clinical-export")} className="w-full gap-1.5 text-xs mt-2">
            <FileText size={14} />Clinical Audit Export (JSON)
          </Button>
          {importConfirm && (
            <div className="card-premium p-4 border border-accent/30 space-y-3">
              <p className="text-sm font-medium text-foreground">Import data? This will replace existing data.</p>
              <div className="flex gap-2">
                <Button variant="hero" size="sm" onClick={confirmImportFn} className="flex-1">Yes, import</Button>
                <Button variant="outline" size="sm" onClick={() => { setImportConfirm(false); setPendingImport(null); }} className="flex-1">Cancel</Button>
              </div>
            </div>
          )}
        </div>

        <SignInModal open={showSignIn} onOpenChange={setShowSignIn} />

        <div className="card-premium p-6 space-y-3">
          <h2 className="text-[15px] font-bold text-foreground flex items-center gap-2"><Info size={16} className="text-accent" />About Vinys</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Vinys builds structured, adaptive therapeutic yoga practices designed around your condition, capacity, and how you feel today.
          </p>
          <p className="text-xs text-muted-foreground">
            Designed with a supportive, therapeutic-minded approach informed by clinical teaching experience.
          </p>
          <hr className="border-border" />
          <p className="text-xs text-muted-foreground">
            Educational movement content. Not medical advice. Consult a healthcare professional for any medical concerns.
          </p>
        </div>

        <div className="card-premium p-6 space-y-4 mt-12">
          {!confirmReset ? (
            <>
              <Button variant="outline-calm" size="sm" onClick={() => setConfirmReset(true)} className="w-full gap-2 text-destructive"><RotateCcw size={14} />Full reset — start over</Button>
              <p className="text-xs text-muted-foreground text-center">This will permanently delete your plan and all session history.</p>
            </>
          ) : (
            <div className="p-4 border border-destructive/30 rounded-2xl space-y-3">
              <p className="text-destructive text-sm font-medium">This will delete all data. Are you sure?</p>
              <div className="flex gap-2">
                <Button variant="stop" size="sm" onClick={handleReset} className="flex-1">Yes, delete all</Button>
                <Button variant="outline" size="sm" onClick={() => setConfirmReset(false)} className="flex-1">Cancel</Button>
              </div>
            </div>
          )}
        </div>

        {/* Danger zone — permanent account deletion (GDPR right to erasure) */}
        {user && (
          <div className="card-premium p-6 space-y-4 mt-6 border border-destructive/30">
            <h2 className="text-[15px] font-bold text-destructive flex items-center gap-2">
              <ShieldAlert size={16} />Danger zone
            </h2>
            <p className="text-sm text-muted-foreground">
              Permanently delete your account and all associated data: profile, check-ins,
              conditions, generated plans, and activity history. <strong>This action is permanent
              and cannot be undone.</strong>
            </p>
            {!showDeleteConfirm ? (
              <Button
                variant="outline-calm"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
                className="gap-1.5 text-xs text-destructive border-destructive/40 hover:bg-destructive/10"
              >
                <Trash2 size={14} />Delete my account
              </Button>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-foreground">
                  Type your email <span className="font-mono font-medium">{user.email}</span> to confirm:
                </p>
                <Input
                  type="email"
                  value={deleteEmailInput}
                  onChange={(e) => setDeleteEmailInput(e.target.value)}
                  placeholder="your-email@example.com"
                  disabled={deleting}
                />
                <div className="flex gap-2">
                  <Button variant="stop" size="sm" onClick={handleDeleteAccount} disabled={deleting} className="flex-1">
                    {deleting ? "Deleting…" : "Yes, permanently delete"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => { setShowDeleteConfirm(false); setDeleteEmailInput(""); }} disabled={deleting} className="flex-1">
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
