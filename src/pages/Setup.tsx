import { useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";
import PageIllustration from "@/components/illustrations/PageIllustration";

const MINUTES_OPTIONS = [10, 15, 20, 30, 45, 60];

function SetupLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-[15px] font-semibold text-foreground border-l-2 border-accent pl-2.5 block">{children}</label>
  );
}

export default function Setup() {
  const { state, updateProfile } = useApp();
  const navigate = useNavigate();
  const { minutesPerSession } = state.profile;

  return (
    <Layout>
      <div className="space-y-6 max-w-lg mx-auto">
        {/* Progress: Step 3 of 4 */}
        <div className="space-y-2">
          <div className="w-full h-[3px] bg-surface-soft rounded-full overflow-hidden">
            <div className="h-full bg-accent rounded-full" style={{ width: "75%", transition: "width 400ms ease" }} />
          </div>
          <p className="text-xs text-muted-foreground text-center">Step 3 of 5</p>
        </div>

        <PageIllustration theme="settings" />
        <h1 className="text-foreground text-center">How long should each session be?</h1>
        <p className="text-sm text-muted-foreground text-center -mt-3">This helps us build the right plan for you.</p>

        {/* Minutes per session */}
        <div className="card-premium p-6 space-y-3">
          <SetupLabel>Minutes per session</SetupLabel>
          <div className="flex flex-wrap gap-2">
            {MINUTES_OPTIONS.map((n) => (
              <button key={n} onClick={() => updateProfile({ minutesPerSession: n })}
                className={`flex-1 min-w-[48px] py-3 rounded-[16px] border-2 text-sm font-bold transition-all ${
                  minutesPerSession === n
                    ? "border-accent bg-accent/10 text-foreground shadow-sm"
                    : "border-border bg-card text-foreground hover:border-accent/30"
                }`}>
                {n === 10 || n === 15 ? (
                  <span>{n} <span className="text-[10px] text-accent font-normal">Quick</span></span>
                ) : n}
              </button>
            ))}
          </div>
        </div>

        <Button variant="hero" size="lg" onClick={() => navigate("/questionnaire")} className="w-full">
          Continue
        </Button>
      </div>
    </Layout>
  );
}
