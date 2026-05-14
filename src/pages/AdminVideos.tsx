import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { invalidateExerciseVideoCache } from "@/lib/exerciseVideoUrl";
import { Loader2, Upload, CheckCircle2, ShieldAlert, Search, Trash2 } from "lucide-react";

type VideoRow = {
  id: string;
  exercise_id: string;
  bunny_video_guid: string;
  duration_seconds: number | null;
  quality: string | null;
  is_active: boolean;
  created_at: string;
};

const MAX_BYTES = 400 * 1024 * 1024; // 400 MB — fits 6-min 1080p H.264

export default function AdminVideos() {
  const { user } = useAuthContext();
  const { state } = useApp();
  const navigate = useNavigate();

  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [rows, setRows] = useState<VideoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const [statuses, setStatuses] = useState<
    Record<string, { status: number; label: string; encodeProgress: number }>
  >({});

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    (async () => {
      const { data } = await (supabase.rpc as any)("has_role", {
        _user_id: user.id,
        _role: "admin",
      });
      setIsAdmin(!!data);
      if (data) await refresh();
      else setLoading(false);
    })();
  }, [user, navigate]);

  const refresh = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("exercise_videos")
      .select("id, exercise_id, bunny_video_guid, duration_seconds, quality, is_active, created_at")
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Failed to load videos", description: error.message, variant: "destructive" });
    } else {
      setRows((data ?? []) as VideoRow[]);
    }
    setLoading(false);
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
    for (const r of rows) {
      if (r.is_active) m.set(r.exercise_id, r);
    }
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

  // Poll Bunny encoding status for uploaded videos. Refreshes every 15s while
  // any video is not yet 'ready', then stops.
  useEffect(() => {
    const guids = Array.from(uploadedByExercise.values()).map((r) => r.bunny_video_guid);
    if (guids.length === 0) {
      setStatuses({});
      return;
    }
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const poll = async () => {
      const { data, error } = await supabase.functions.invoke("bunny-status", {
        body: { guids },
      });
      if (cancelled) return;
      if (!error && (data as any)?.statuses) {
        const next = (data as any).statuses as Record<
          string,
          { status: number; label: string; encodeProgress: number }
        >;
        setStatuses(next);
        const allReady = Object.values(next).every(
          (s) => s.label === "ready" || s.label === "error" || s.label === "upload_failed",
        );
        if (!allReady) timer = setTimeout(poll, 15000);
      }
    };
    poll();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [uploadedByExercise]);

  const handleUpload = async (exerciseId: string, file: File) => {
    if (file.size > MAX_BYTES) {
      toast({
        title: "File too large",
        description: `Max 400 MB. This file is ${(file.size / 1024 / 1024).toFixed(1)} MB.`,
        variant: "destructive",
      });
      return;
    }
    setUploadingFor(exerciseId);
    try {
      const form = new FormData();
      form.append("exercise_id", exerciseId);
      form.append("file", file);

      const { data, error } = await supabase.functions.invoke("bunny-upload", {
        body: form,
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);

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
    const { data, error } = await supabase.functions.invoke("bunny-delete", {
      body: { row_id: row.id, bunny_video_guid: row.bunny_video_guid },
    });
    if (error || (data as any)?.error) {
      toast({
        title: "Delete failed",
        description: error?.message ?? (data as any)?.error ?? "Unknown error",
        variant: "destructive",
      });
      return;
    }
    invalidateExerciseVideoCache();
    toast({ title: "Removed", description: row.exercise_id });
    await refresh();
  };

  if (isAdmin === null || loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  if (!isAdmin) {
    return (
      <Layout>
        <div className="max-w-md mx-auto py-24 text-center space-y-4">
          <ShieldAlert className="w-10 h-10 mx-auto text-muted-foreground" />
          <h1 className="text-xl font-medium">Admin only</h1>
          <p className="text-sm text-muted-foreground">
            You need an admin role to manage exercise videos.
          </p>
        </div>
      </Layout>
    );
  }

  const totalUploaded = uploadedByExercise.size;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-10 space-y-6">
        <div>
          <h1 className="text-2xl font-medium">Exercise videos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Upload one MP4 per exercise. Max 400 MB. Recommended: 1080p H.264, 1.5–6 min, no audio. Hosted on Bunny Stream.
          </p>
          <div className="flex items-center gap-3 mt-3 text-sm text-muted-foreground">
            <Badge variant="secondary">{totalUploaded} / {exerciseMap.size} uploaded</Badge>
          </div>
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
                        s.label === "ready" ? "default"
                        : s.label === "error" || s.label === "upload_failed" ? "destructive"
                        : "secondary";
                      const text = s.label === "ready"
                        ? "ready"
                        : s.encodeProgress > 0 && s.encodeProgress < 100
                          ? `${s.label} ${s.encodeProgress}%`
                          : s.label;
                      return <Badge variant={variant} className="text-xs">{text}</Badge>;
                    })()}
                  </div>
                  <div className="text-xs text-muted-foreground font-mono mt-0.5">
                    {ex.id} · {ex.category}
                    {existing && <span className="ml-2 opacity-60">· {existing.bunny_video_guid.slice(0, 8)}…</span>}
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
                    accept="video/mp4,video/quicktime,video/webm"
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
    </Layout>
  );
}
