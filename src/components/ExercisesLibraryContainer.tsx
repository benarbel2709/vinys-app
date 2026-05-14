import React from "react";
import { ExternalLink } from "lucide-react";

type Props = {
  onOpenFullLibrary: () => void;
  children: React.ReactNode;
};

export default function ExercisesLibraryContainer({
  onOpenFullLibrary,
  children,
}: Props) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">
          Exercises library
        </h2>
        <button
          onClick={onOpenFullLibrary}
          className="h-[44px] px-5 rounded-full text-[16px] font-semibold text-foreground flex items-center gap-2.5 transition-colors hover:bg-foreground/5"
          style={{
            background: "rgba(255,255,255,0.5)",
            border: "1px solid rgba(0,0,0,0.08)",
          }}
        >
          <ExternalLink size={16} />
          Open full library
        </button>
      </div>
      <div>{children}</div>
    </div>
  );
}
