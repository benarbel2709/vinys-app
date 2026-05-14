import { useState } from "react";
import { useAuthContext } from "@/context/AuthContext";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import SignInModal from "@/components/SignInModal";

/**
 * Banner shown to guest (non-signed-in) users at the top of onboarding.
 * Warns them that their data lives only on this device and offers a save path.
 */
export default function GuestDataWarning() {
  const { user, isGuest } = useAuthContext();
  const [showSignIn, setShowSignIn] = useState(false);

  // Only render for guests (or fully unauthenticated users)
  if (user) return null;
  if (!isGuest && !user) {
    // Unauthenticated and not in guest mode → not in onboarding flow yet
    // (guarded routes will redirect). Still safe to show; bail to keep noise low.
    return null;
  }

  return (
    <div
      role="status"
      className="mx-auto max-w-2xl mt-3 mb-4 rounded-xl border border-amber-300/60 bg-amber-50/80 dark:bg-amber-950/30 px-4 py-3 flex items-start gap-3"
    >
      <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" aria-hidden />
      <div className="flex-1 text-sm text-amber-900 dark:text-amber-100">
        <p className="font-medium">You're continuing as a guest.</p>
        <p className="mt-0.5 text-amber-800/90 dark:text-amber-100/85">
          Your answers are saved only on this device. Clearing your browser, switching
          devices, or losing your phone will erase your plan. Create a free account to
          back it up.
        </p>
        <Button
          variant="outline-calm"
          size="sm"
          className="mt-2"
          onClick={() => setShowSignIn(true)}
        >
          Save my progress
        </Button>
      </div>
      <SignInModal open={showSignIn} onOpenChange={setShowSignIn} />
    </div>
  );
}
