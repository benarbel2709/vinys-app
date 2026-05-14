import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useApp } from "@/context/AppContext";
import { useState, useRef } from "react";
import { RotateCcw, Settings, Bug, Download, Upload } from "lucide-react";
import { readState, writeState } from "@/lib/storage";

interface Props { open: boolean; onClose: () => void; }

export default function AboutModal({ open, onClose }: Props) {
  const { resetAll } = useApp();
  const [confirmReset, setConfirmReset] = useState(false);
  const [animationsEnabled, setAnimationsEnabled] = useState(!readState<boolean>("vinys_disable_animations", false));
  const [forceAnimate, setForceAnimate] = useState(readState<boolean>("debugForceAnimate", false));
  const [importConfirm, setImportConfirm] = useState(false);
  const [pendingImport, setPendingImport] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showDebug = typeof window !== "undefined" && (
    new URLSearchParams(window.location.search).get("debug") === "1" || readState<boolean>("debugAnimations", false)
  );
  const reducedMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const handleToggleAnimations = (checked: boolean) => { setAnimationsEnabled(checked); writeState("vinys_disable_animations", !checked); };
  const handleReset = () => { resetAll(); setConfirmReset(false); onClose(); window.location.href = "/"; };

  const handleExportData = () => {
    const data: Record<string, unknown> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith("pranva") || key.startsWith("yael") || key.startsWith("yogacare") || key === "debugForceAnimate" || key === "debugAnimations")) {
        try { data[key] = JSON.parse(localStorage.getItem(key) || "null"); } catch { data[key] = localStorage.getItem(key); }
      }
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a");
    a.href = url; a.download = `vinys-backup-${new Date().toISOString().slice(0, 10)}.json`; a.click(); URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { const text = ev.target?.result as string; try { const d = JSON.parse(text); if (typeof d === "object" && d !== null) { setPendingImport(text); setImportConfirm(true); } } catch { alert("Invalid file"); } };
    reader.readAsText(file); e.target.value = "";
  };

  const confirmImport = () => {
    if (!pendingImport) return;
    try { const data = JSON.parse(pendingImport); Object.entries(data).forEach(([key, value]) => { localStorage.setItem(key, typeof value === "string" ? value : JSON.stringify(value)); }); setImportConfirm(false); setPendingImport(null); window.location.reload(); } catch { alert("Import error"); }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto rounded-[20px]">
        <DialogHeader><DialogTitle className="text-xl font-bold text-foreground">About Vinys</DialogTitle></DialogHeader>
        <div className="space-y-5 text-[15px] leading-relaxed text-foreground">
          <div className="space-y-3">
            <h3 className="font-bold text-lg">Adaptive Yoga for Modern Bodies</h3>
            <p className="text-sm italic text-muted-foreground leading-relaxed">
              The name Vinys comes from Viniyoga — a lineage of individualized therapeutic yoga designed to meet each person exactly where they are.
            </p>
            <p>Vinys builds structured, adaptive yoga sessions designed around your body's current needs.</p>
            <p className="text-muted-foreground text-sm">
              Designed with a supportive, therapeutic-minded approach informed by years of clinical teaching experience.
            </p>
          </div>
          <hr className="border-border" />
          <div className="space-y-2">
            <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">Contact</h3>
            <p className="text-sm text-muted-foreground">Questions or feedback? Reach us at <a href="mailto:info@vinys.app" className="text-foreground underline underline-offset-2 hover:text-accent transition-colors">info@vinys.app</a></p>
          </div>
          <hr className="border-border" />
          <div className="space-y-2">
            <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">Disclaimer</h3>
            <p className="text-sm text-muted-foreground">Educational movement content. Not medical advice. Consult a healthcare professional for any medical concerns.</p>
          </div>
          <hr className="border-border" />
          <div className="space-y-4">
            <h3 className="font-bold text-lg flex items-center gap-2"><Settings size={16} />Settings</h3>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Exercise animations</span>
              <Switch checked={animationsEnabled} onCheckedChange={handleToggleAnimations} />
            </div>
            <div className="flex gap-2">
              <Button variant="outline-calm" size="sm" onClick={handleExportData} className="flex-1 gap-1.5 text-xs"><Download size={14} />Export</Button>
              <Button variant="outline-calm" size="sm" onClick={() => fileInputRef.current?.click()} className="flex-1 gap-1.5 text-xs"><Upload size={14} />Import</Button>
              <input ref={fileInputRef} type="file" accept=".json" onChange={handleImportFile} className="hidden" />
            </div>
            {importConfirm && (
              <div className="card-premium p-4 border border-accent/30 space-y-3">
                <p className="text-sm font-medium text-foreground">Import data? This will replace existing data.</p>
                <div className="flex gap-2">
                  <Button variant="hero" size="sm" onClick={confirmImport} className="flex-1">Yes, import</Button>
                  <Button variant="outline" size="sm" onClick={() => { setImportConfirm(false); setPendingImport(null); }} className="flex-1">Cancel</Button>
                </div>
              </div>
            )}
          </div>
          {showDebug && (
            <div className="space-y-3 rounded-[20px] border border-amber-300/50 bg-amber-50/30 p-4">
              <h3 className="font-bold text-sm flex items-center gap-2 text-amber-800"><Bug size={14} />Animation Debug</h3>
              <div className="space-y-1.5 text-xs text-muted-foreground">
                <p>Toggle: <span className="font-mono">{animationsEnabled ? "ON" : "OFF"}</span></p>
                <p>prefers-reduced-motion: <span className="font-mono">{reducedMotion ? "YES" : "NO"}</span></p>
                <p>Force animate: <span className="font-mono">{forceAnimate ? "YES" : "NO"}</span></p>
              </div>
              <Button variant="outline" size="sm" onClick={() => { const next = !forceAnimate; setForceAnimate(next); writeState("debugForceAnimate", next); }} className="w-full text-xs">
                {forceAnimate ? "Remove force animate" : "Force animate (dev)"}
              </Button>
            </div>
          )}
          <hr className="border-border" />
          {!confirmReset ? (
            <div className="mt-4">
              <Button variant="outline-calm" size="sm" onClick={() => setConfirmReset(true)} className="w-full gap-2 text-destructive border-destructive/20 hover:bg-destructive/5"><RotateCcw size={14} />Full reset — start over</Button>
              <p className="text-[11px] text-muted-foreground text-center mt-1.5">This will permanently delete your plan and all session history.</p>
            </div>
          ) : (
            <div className="card-premium p-4 border border-destructive/30 space-y-3">
              <p className="text-destructive text-sm font-medium">This will delete all data. Are you sure?</p>
              <div className="flex gap-2">
                <Button variant="stop" size="sm" onClick={handleReset} className="flex-1">Yes, delete all</Button>
                <Button variant="outline" size="sm" onClick={() => setConfirmReset(false)} className="flex-1">Cancel</Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
