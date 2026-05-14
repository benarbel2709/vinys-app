import { useState } from "react";
import { MASTER_EXERCISES, MasterExercise } from "@/data/masterExercises";
import { CONDITIONS, type ConditionKey, CONDITION_SAFETY_TAG, CONDITION_LABELS } from "@/constants/conditions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, FileText, Grid3X3 } from "lucide-react";

function generateCSV(): string {
  const headers = [
    "ID", "Title", "Category", "Duration (min)", "Intensity",
    "Instructions", "Breathing", "Reps", "Range", "Why", "Safety", "Coaching Cue",
    "Equipment", "Contraindications",
    "universalSafe", "pregnancySafe", "discSafe", "kneeSafe", "oaSafe", "shoulderSafe", "flareSafe",
  ];

  const rows = MASTER_EXERCISES.map((ex) => [
    ex.id,
    ex.title,
    ex.category,
    ex.durationMin,
    ex.intensityTarget,
    ex.instructions.join(" | "),
    ex.breathing,
    ex.reps,
    ex.range,
    ex.why,
    ex.safety,
    ex.cue,
    (ex.equipment || []).join(", "),
    (ex.contraindications || []).join(", "),
    ex.tags.universalSafe ? "✓" : "",
    ex.tags.pregnancySafe ? "✓" : "",
    ex.tags.discSafe ? "✓" : "",
    ex.tags.kneeSafe ? "✓" : "",
    ex.tags.oaSafe ? "✓" : "",
    ex.tags.shoulderSafe ? "✓" : "",
    ex.tags.flareSafe ? "✓" : "",
  ]);

  const escape = (val: unknown) => {
    const s = String(val ?? "");
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  return [headers.map(escape).join(","), ...rows.map((r) => r.map(escape).join(","))].join("\n");
}

function downloadFile(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const CATEGORY_COLORS: Record<string, string> = {
  "breath": "bg-surface-soft text-accent",
  "mobility": "bg-surface-sage text-secondary",
  "stability": "bg-surface-gold text-accent",
  "release": "bg-surface-warm text-foreground",
};

type Tab = "matrix" | "export";

export default function ExpertReview() {
  const [tab, setTab] = useState<Tab>("matrix");

  const conditions = CONDITIONS.map(c => c.key);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-[1400px] mx-auto space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold text-foreground">Expert Review — Exercise Library</h1>
          <p className="text-muted-foreground">
            {MASTER_EXERCISES.length} exercises | {conditions.length} supported conditions
          </p>
        </div>

        {/* Tab buttons */}
        <div className="flex gap-2">
          <Button
            variant={tab === "matrix" ? "default" : "outline"}
            onClick={() => setTab("matrix")}
          >
            <Grid3X3 className="mr-2 h-4 w-4" />
            Compatibility Matrix
          </Button>
          <Button
            variant={tab === "export" ? "default" : "outline"}
            onClick={() => setTab("export")}
          >
            <FileText className="mr-2 h-4 w-4" />
            Export Content
          </Button>
        </div>

        {tab === "export" && (
          <Card>
            <CardHeader>
              <CardTitle>Export Exercise Library</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Download all content for {MASTER_EXERCISES.length} exercises as a CSV file for Google Sheets or Excel.
                Includes: title, category, full instructions, breathing, reps, range, rationale, safety, cues, equipment, safety tags.
              </p>
              <Button
                onClick={() => downloadFile(generateCSV(), "exercises-library.csv", "text/csv;charset=utf-8")}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Download CSV
              </Button>
            </CardContent>
          </Card>
        )}

        {tab === "matrix" && (
          <Card>
            <CardHeader>
              <CardTitle>Exercises × Conditions Matrix</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                ✓ = exercise is recommended/safe for this condition. Empty = not included.
              </p>
              <div className="overflow-auto max-h-[70vh]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="sticky left-0 bg-background z-10 min-w-[200px]">Exercise</TableHead>
                      <TableHead className="min-w-[80px]">Category</TableHead>
                      <TableHead className="min-w-[60px]">Min</TableHead>
                      <TableHead className="min-w-[60px]">Flare</TableHead>
                      {conditions.map((c) => (
                        <TableHead key={c} className="min-w-[80px] text-xs whitespace-nowrap">
                          {CONDITION_LABELS[c]}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {MASTER_EXERCISES.map((ex) => (
                      <TableRow key={ex.id}>
                        <TableCell className="sticky left-0 bg-background z-10 font-medium">
                          {ex.title}
                        </TableCell>
                        <TableCell>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${CATEGORY_COLORS[ex.category] || ""}`}>
                            {ex.category}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">{ex.durationMin}</TableCell>
                        <TableCell className="text-center">
                          {ex.tags.flareSafe ? "✓" : ""}
                        </TableCell>
                        {conditions.map((c) => {
                          const tag = CONDITION_SAFETY_TAG[c];
                          const safe = tag ? ex.tags[tag as keyof MasterExercise["tags"]] : false;
                          return (
                            <TableCell key={c} className="text-center">
                              {safe ? (
                                <span className="text-green-600 font-bold">✓</span>
                              ) : (
                                <span className="text-muted-foreground/30">—</span>
                              )}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Summary stats */}
              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                {(["breath", "mobility", "stability", "release"] as const).map((cat) => {
                  const count = MASTER_EXERCISES.filter((e) => e.category === cat).length;
                  return (
                    <div key={cat} className={`rounded-lg p-3 text-center ${CATEGORY_COLORS[cat]}`}>
                      <div className="text-2xl font-bold">{count}</div>
                      <div className="text-sm capitalize">{cat}</div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
