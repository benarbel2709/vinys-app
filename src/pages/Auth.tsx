import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthContext } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { lovable } from "@/integrations/lovable/index";
import BrandLogo from "@/components/BrandLogo";
import { Mail, Lock, ArrowRight, Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

type AuthMode = "signin" | "signup" | "forgot";

export default function Auth() {
  const { signIn, signUp, continueAsGuest, resetPassword, user, loading: authLoading } = useAuthContext();
  const { state, resetAll } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const intent = searchParams.get("intent"); // "new_program" | "continue" | null

  // Redirect authenticated users based on intent
  useEffect(() => {
    if (!authLoading && user) {
      if (intent === "new_program") {
        // New program: reset everything and go to onboarding
        resetAll();
        navigate("/onboarding", { replace: true });
      } else {
        // Continue / default: go to existing plan or onboarding
        if (state.currentPlan) {
          navigate("/plan", { replace: true });
        } else {
          navigate("/onboarding", { replace: true });
        }
      }
    }
  }, [user, authLoading, navigate, intent, state.currentPlan, resetAll]);

  // Default mode: signup for new_program intent, signin for continue
  const [mode, setMode] = useState<AuthMode>(intent === "new_program" ? "signup" : "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      if (mode === "forgot") {
        const { error: err } = await resetPassword(email);
        if (err) setError(err.message);
        else setMessage("Check your email for a password reset link.");
      } else if (mode === "signup") {
        const { error: err } = await signUp(email, password);
        if (err) setError(err.message);
        else setMessage("Check your email to confirm your account.");
      } else {
        const { error: err } = await signIn(email, password);
        if (err) setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);
    try {
      const redirectUrl = intent
        ? `${window.location.origin}/auth?intent=${intent}`
        : window.location.origin;
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: redirectUrl,
      });
      if (result.error) {
        setError(result.error instanceof Error ? result.error.message : String(result.error));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleContinueAsGuest = () => {
    continueAsGuest();
    navigate("/onboarding");
  };

  const headlineText = intent === "new_program"
    ? "Create your account"
    : "Welcome back";
  const subtitleText = intent === "new_program"
    ? "Sign up to save your plan and track progress."
    : "Sign in to continue your practice.";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <BrandLogo size="lg" linkToHome={false} />
          </div>
          <h1 className="text-[24px] font-bold text-foreground">{headlineText}</h1>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-[280px] mx-auto">
            {subtitleText}
          </p>
        </div>

        <div className="card-premium p-6 space-y-5">
          <h2 className="text-lg font-bold text-foreground text-center">
            {mode === "signin" ? "Sign in" : mode === "signup" ? "Create your account" : "Reset password"}
          </h2>

          {mode !== "forgot" && (
            <>
              <Button
                variant="outline-calm"
                className="w-full gap-2"
                onClick={handleGoogleSignIn}
                disabled={loading}
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </Button>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">or</span>
                <div className="flex-1 h-px bg-border" />
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="pl-10" required />
            </div>
            {mode !== "forgot" && (
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="pl-10" required minLength={6} />
              </div>
            )}

            {mode === "signup" && (
              <label className="flex items-start gap-2 cursor-pointer">
                <Checkbox checked={agreedToTerms} onCheckedChange={(v) => setAgreedToTerms(v === true)} className="mt-0.5" />
                <span className="text-xs text-muted-foreground leading-relaxed">
                  I agree to the{" "}
                  <Link to="/terms" className="text-accent hover:underline" target="_blank">Terms of Service</Link>
                  {" "}and{" "}
                  <Link to="/privacy" className="text-accent hover:underline" target="_blank">Privacy Policy</Link>
                </span>
              </label>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}
            {message && <p className="text-sm text-secondary">{message}</p>}

            <Button variant="hero" className="w-full" disabled={loading || (mode === "signup" && !agreedToTerms)} type="submit">
              {loading && <Loader2 size={16} className="animate-spin" />}
              {mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Send reset link"}
            </Button>
          </form>

          <div className="text-center space-y-2 text-sm">
            {mode === "signin" && (
              <>
                <button onClick={() => { setMode("forgot"); setError(""); setMessage(""); }} className="text-accent hover:underline block mx-auto">
                  Forgot password?
                </button>
                <p className="text-muted-foreground">
                  No account?{" "}
                  <button onClick={() => { setMode("signup"); setError(""); setMessage(""); }} className="text-accent hover:underline">Sign up</button>
                </p>
              </>
            )}
            {mode === "signup" && (
              <p className="text-muted-foreground">
                Already have an account?{" "}
                <button onClick={() => { setMode("signin"); setError(""); setMessage(""); }} className="text-accent hover:underline">Sign in</button>
              </p>
            )}
            {mode === "forgot" && (
              <button onClick={() => { setMode("signin"); setError(""); setMessage(""); }} className="text-accent hover:underline">
                Back to sign in
              </button>
            )}
          </div>
        </div>

        <div className="text-center">
          <button onClick={handleContinueAsGuest} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Continue as guest <ArrowRight size={14} className="inline ml-1" />
          </button>
          <p className="text-xs text-muted-foreground mt-1.5">Your data will only be saved on this device</p>
        </div>

        <footer className="text-center pt-6 space-y-1">
          <p className="text-xs text-muted-foreground">© 2026 Vinys — Adaptive Therapeutic Yoga</p>
          <a href="mailto:info@vinys.app" className="text-xs text-muted-foreground hover:text-foreground transition-colors">info@vinys.app</a>
        </footer>
      </div>
    </div>
  );
}
