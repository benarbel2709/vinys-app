import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Loader2, CheckCircle } from "lucide-react";

interface SignInModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ModalState = "email" | "sent" | "error";

export default function SignInModal({ open, onOpenChange }: SignInModalProps) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<ModalState>("email");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { error: err } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: window.location.origin + "/plan" },
      });
      if (err) {
        setError(err.message);
        setState("error");
      } else {
        setState("sent");
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong");
      setState("error");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset after close animation
    setTimeout(() => {
      setState("email");
      setEmail("");
      setError("");
    }, 200);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm">
        {state === "sent" ? (
          <div className="text-center space-y-4 py-2">
            <div className="flex justify-center">
              <CheckCircle size={40} className="text-accent" />
            </div>
            <DialogHeader>
              <DialogTitle className="text-center">Check your email</DialogTitle>
              <DialogDescription className="text-center">
                We sent a sign-in link to <strong className="text-foreground">{email}</strong>. Click it to sign in. Expires in 1 hour.
              </DialogDescription>
            </DialogHeader>
            <p className="text-xs text-muted-foreground">Check your spam folder if you don't see it.</p>
            <Button variant="outline-calm" onClick={handleClose} className="w-full">Got it</Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Save your progress</DialogTitle>
              <DialogDescription>
                Enter your email and we'll send you a sign-in link. No password needed.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSend} className="space-y-4">
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (state === "error") setState("email"); }}
                  className="pl-10"
                  required
                  autoFocus
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button variant="hero" className="w-full" disabled={loading} type="submit">
                {loading && <Loader2 size={16} className="animate-spin mr-1" />}
                Send sign-in link
              </Button>
              <button
                type="button"
                onClick={handleClose}
                className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Continue without saving
              </button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
