import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export default function NewProgramModal({ open, onOpenChange, onConfirm }: Props) {
  const navigate = useNavigate();
  const [showSecondaryConfirm, setShowSecondaryConfirm] = useState(false);

  const handleClose = () => {
    setShowSecondaryConfirm(false);
    onOpenChange(false);
  };

  const handleStartFresh = () => {
    setShowSecondaryConfirm(true);
  };

  const handleConfirmFresh = () => {
    setShowSecondaryConfirm(false);
    onConfirm();
  };

  return (
    <>
      <Dialog open={open && !showSecondaryConfirm} onOpenChange={(v) => { if (!v) handleClose(); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>You already have a plan in progress</DialogTitle>
            <DialogDescription>
              Would you like to continue where you left off, or start fresh with a new plan? Starting fresh will reset your progress and weekly targets.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col gap-2 sm:flex-col">
            <Button variant="hero" className="w-full rounded-full" onClick={() => { handleClose(); navigate("/plan"); }}>
              Continue my plan →
            </Button>
            <Button variant="outline" className="w-full rounded-full" onClick={handleStartFresh}>
              Start fresh
            </Button>
            <button onClick={handleClose} className="text-sm text-muted-foreground hover:text-foreground transition-colors mt-1">
              Cancel
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showSecondaryConfirm} onOpenChange={(v) => { if (!v) { setShowSecondaryConfirm(false); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>
              This will clear your current progress and start a new program from scratch.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" className="rounded-full" onClick={() => setShowSecondaryConfirm(false)}>Cancel</Button>
            <Button variant="hero" className="rounded-full" onClick={handleConfirmFresh}>Start fresh</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
