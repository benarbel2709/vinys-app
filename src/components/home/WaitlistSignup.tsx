import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { Mail, CheckCircle, Loader2 } from "lucide-react";
import { z } from "zod";

const emailSchema = z.string().trim().email("Please enter a valid email address").max(255);

export default function WaitlistSignup() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const result = emailSchema.safeParse(email);
    if (!result.success) {
      setErrorMsg(result.error.errors[0].message);
      return;
    }

    setStatus("loading");
    try {
      const { data, error } = await supabase.functions.invoke("waitlist-signup", {
        body: { email: result.data },
      });
      if (error || !data?.ok) {
        setErrorMsg("Something went wrong. Please try again.");
        setStatus("error");
      } else {
        setStatus("success");
      }
    } catch {
      setErrorMsg("Something went wrong. Please try again.");
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <section className="w-full vinys-section">
        <div className="vinys-container max-w-xl text-center">
          <div className="flex items-center justify-center gap-2 text-secondary mb-2">
            <CheckCircle size={20} />
            <span className="font-semibold">You're on the list!</span>
          </div>
          <p className="text-muted-foreground text-sm">
            We'll let you know when early access opens.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full vinys-section">
      <div className="vinys-container max-w-xl text-center">
        <h2
          className="font-display font-bold text-foreground mb-2"
          style={{ fontSize: "clamp(22px, 2.5vw, 28px)" }}
        >
          Join the waitlist
        </h2>
        <p className="text-muted-foreground mb-6 text-sm leading-relaxed max-w-[420px] mx-auto">
          Be the first to know when Vinys opens for early access. No spam — just one email when we're ready.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
          <div className="relative flex-1">
            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="email"
              placeholder="you@email.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setStatus("idle"); setErrorMsg(""); }}
              className="pl-10"
              required
              disabled={status === "loading"}
            />
          </div>
          <Button type="submit" variant="hero" disabled={status === "loading"} className="shrink-0">
            {status === "loading" ? <Loader2 size={16} className="animate-spin" /> : "Notify me"}
          </Button>
        </form>
        {errorMsg && <p className="text-sm text-destructive mt-2">{errorMsg}</p>}
      </div>
    </section>
  );
}
