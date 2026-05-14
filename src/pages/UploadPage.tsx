import { useEffect, useMemo, useState } from "react";
import { useApp } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { invalidateExerciseVideoCache } from "@/lib/exerciseVideoUrl";
import { Loader2, Upload, CheckCircle2, Search, Trash2, Lock, LogOut } from "lucide-react";

type VideoRow = {
  id: string;
  exercise_id: string;
  bunny_video_guid: string;
  duration_seconds: number | null;
  quality: string | null;
  is_active: boolean;
  created_at: string;
};

const MAX_BYTES = 600 * 1024 * 1024; // 600 MB
const SS_KEY = "vinys_upload_code";

const FN_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;
const ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

function fnHeaders(code: string, json = true): HeadersInit {
  const h: Record<string, string> = {
    apikey: ANON,
    "x-upload-code": code,
  };
  if (json) h["Content-Type"] = "application/json";
  return h;
}

export default function UploadPage() {
  const { state } = useApp();
  const [code, setCode] = useState<string>(() => localStorage.getItem(SS_KEY) ?? "");
  const [unlocked, setUnlocked] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [rows, setRows] = useState<VideoRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const [statuses, setStatuses] = useState<
    Record<string, { status: number; label: string; encodeProgress: number }>
  >({});

  // Auto-verify if a stored code is present
  useEffect(() => {
    if (code && !unlocked) verify(code, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const verify = async (c: string, silent = false) => {
    setVerifying(true);
    try {
      const r = await fetch(`${FN_BASE}/upload-verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: ANON },
        body: JSON.stringify({ code: c }),
      });
      const data = await r.json().catch(() => ({}));
      if (r.ok && data?.ok) {
        localStorage.setItem(SS_KEY, c);
        setUnlocked(true);
        await refresh(c);
      } else {
        localStorage.removeItem(SS_KEY);
        setUnlocked(false);
        if (!silent) {
          toast({
            title: "Wrong passcode",
            description: data?.error ?? "Try again.",
            variant: "destructive",
          });
        }
      }
    } catch (e: any) {
      if (!silent) {
        toast({
          title: "Verification failed",
          description: e?.message ?? "Network error",
          variant: "destructive",
        });
      }
    } finally {
      setVerifying(false);
    }
  };

  const refresh = async (c = code) => {
    setLoading(true);
    try {
      const r = await fetch(`${FN_BASE}/bunny-list`, {
        method: "POST",
        headers: fnHeaders(c),
        body: "{}",
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data?.error ?? "Failed to load");
      setRows((data.rows ?? []) as VideoRow[]);
    } catch (e: any) {
      toast({ title: "Failed to load videos", description: e?.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const exerciseMap = useMemo(() => {
    const m = new Map<string, { id: string; name_he: string; category: string }>();
    for (const ex of state.exerciseLibrary) {
      m.set(ex.id, { id: ex.id, name_he: ex.name_he, category: ex.category });
    }
    return m;
  }, [state.exerciseLibrary]);

  const uploadedByExercise = useMemo(() => {
    const m = new Map<string, VideoRow>();
    for (const r of rows) if (r.is_active) m.set(r.exercise_id, r);
    return m;
  }, [rows]);

  const exercises = useMemo(() => {
    const list = Array.from(exerciseMap.values());
    if (!search.trim()) return list;
    const q = search.trim().toLowerCase();
    return list.filter(
      (e) => e.id.toLowerCase().includes(q) || e.name_he.toLowerCase().includes(q),
    );
  }, [exerciseMap, search]);

  // Poll Bunny encoding status
  useEffect(() => {
    if (!unlocked) return;
    const guids = Array.from(uploadedByExercise.values()).map((r) => r.bunny_video_guid);
    if (guids.length === 0) {
      setStatuses({});
      return;
    }
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const poll = async () => {
      try {
        const r = await fetch(`${FN_BASE}/bunny-status`, {
          method: "POST",
          headers: fnHeaders(code),
          body: JSON.stringify({ guids }),
        });
        if (cancelled) return;
        const data = await r.json().catch(() => ({}));
        if (r.ok && data?.statuses) {
          const next = data.statuses as Record<
            string,
            { status: number; label: string; encodeProgress: number }
          >;
          setStatuses(next);
          const allReady = Object.values(next).every(
            (s) => s.label === "ready" || s.label === "error" || s.label === "upload_failed",
          );
          if (!allReady) timer = setTimeout(poll, 15000);
        }
      } catch {
        /* ignore polling errors */
      }
    };
    poll();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [uploadedByExercise, unlocked, code]);

  const handleUpload = async (exerciseId: string, file: File) => {
    if (!file.name.toLowerCase().endsWith(".mp4")) {
      toast({ title: "MP4 only", description: "Please pick an .mp4 file.", variant: "destructive" });
      return;
    }
    if (file.size > MAX_BYTES) {
      toast({
        title: "File too large",
        description: `Max 600 MB. This file is ${(file.size / 1024 / 1024).toFixed(1)} MB.`,
        variant: "destructive",
      });
      return;
    }
    setUploadingFor(exerciseId);
    try {
      const form = new FormData();
      form.append("exercise_id", exerciseId);
      form.append("file", file);

      const r = await fetch(`${FN_BASE}/bunny-upload`, {
        method: "POST",
        headers: fnHeaders(code, false), // FormData sets its own Content-Type
        body: form,
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok || data?.error) throw new Error(data?.error ?? `HTTP ${r.status}`);

      invalidateExerciseVideoCache();
      toast({ title: "Uploaded", description: `${exerciseId} ✓` });
      await refresh();
    } catch (e: any) {
      toast({
        title: "Upload failed",
        description: e?.message ?? "Unknown error",
        variant: "destructive",
      });
    } finally {
      setUploadingFor(null);
    }
  };

  const handleDelete = async (row: VideoRow) => {
    if (!confirm(`Remove video for ${row.exercise_id}?`)) return;
    try {
      const r = await fetch(`${FN_BASE}/bunny-delete`, {
        method: "POST",
        headers: fnHeaders(code),
        body: JSON.stringify({ row_id: row.id, bunny_video_guid: row.bunny_video_guid }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok || data?.error) throw new Error(data?.error ?? `HTTP ${r.status}`);
      invalidateExerciseVideoCache();
      toast({ title: "Removed", description: row.exercise_id });
      await refresh();
    } catch (e: any) {
      toast({ title: "Delete failed", description: e?.message, variant: "destructive" });
    }
  };

  const signOut = () => {
    localStorage.removeItem(SS_KEY);
    setCode("");
    setUnlocked(false);
    setRows([]);
    setStatuses({});
  };

  // ===== Passcode gate =====
  if (!unlocked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="w-full max-w-sm p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-muted-foreground" />
            <h1 className="text-lg font-medium">Editor access</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Enter the upload passcode to continue.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (code.trim()) verify(code.trim());
            }}
            className="space-y-3"
          >
            <Input
              type="password"
              autoFocus
              placeholder="Passcode"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={verifying}
            />
            <Button type="submit" className="w-full" disabled={verifying || !code.trim()}>
              {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : "Unlock"}
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  // ===== Loading state =====
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const totalUploaded = uploadedByExercise.size;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-10 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-medium">Exercise videos</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Upload one MP4 per exercise. Max 600 MB. Recommended: 1080p H.264, 1.5–6 min, no audio.
            </p>
            <div className="flex items-center gap-3 mt-3 text-sm text-muted-foreground">
              <Badge variant="secondary">
                {totalUploaded} / {exerciseMap.size} uploaded
              </Badge>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={signOut} className="shrink-0">
            <LogOut className="w-4 h-4 mr-1" /> Sign out
          </Button>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by exercise ID or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="space-y-2">
          {exercises.map((ex) => {
            const existing = uploadedByExercise.get(ex.id);
            const isUploading = uploadingFor === ex.id;
            return (
              <Card key={ex.id} className="p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{ex.name_he}</span>
                    {existing && <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />}
                    {existing && (() => {
                      const s = statuses[existing.bunny_video_guid];
                      if (!s) return null;
                      const variant: "default" | "secondary" | "destructive" =
                        s.label === "ready"
                          ? "default"
                          : s.label === "error" || s.label === "upload_failed"
                            ? "destructive"
                            : "secondary";
                      const text =
                        s.label === "ready"
                          ? "ready"
                          : s.encodeProgress > 0 && s.encodeProgress < 100
                            ? `${s.label} ${s.encodeProgress}%`
                            : s.label;
                      return (
                        <Badge variant={variant} className="text-xs">
                          {text}
                        </Badge>
                      );
                    })()}
                  </div>
                  <div className="text-xs text-muted-foreground font-mono mt-0.5">
                    {ex.id} · {ex.category}
                    {existing && (
                      <span className="ml-2 opacity-60">
                        · {existing.bunny_video_guid.slice(0, 8)}…
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Label
                    htmlFor={`up-${ex.id}`}
                    className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded-md border text-sm hover:bg-accent"
                  >
                    {isUploading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    {existing ? "Replace" : "Upload"}
                  </Label>
                  <Input
                    id={`up-${ex.id}`}
                    type="file"
                    accept="video/mp4"
                    className="hidden"
                    disabled={isUploading}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleUpload(ex.id, f);
                      e.target.value = "";
                    }}
                  />
                  {existing && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(existing)}
                      title="Remove video"
                    >
                      <Trash2 className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
          {exercises.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-12">
              No exercises match "{search}".
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
