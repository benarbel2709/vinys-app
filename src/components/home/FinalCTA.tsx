import { useGetStarted } from "@/hooks/useGetStarted";
import NewProgramModal from "@/components/home/NewProgramModal";

export default function FinalCTA() {
  const { showModal, setShowModal, handleGetStarted, handleConfirmRestart } = useGetStarted();

  return (
    <>
      <section
        className="w-full"
        style={{
          background: "radial-gradient(ellipse at center, #F2EAD3 0%, #EDE5D3 60%, #E5DCC4 100%)",
          padding: "160px 24px",
        }}
      >
        <div className="max-w-[920px] mx-auto text-center">
          <h2
            className="font-display mb-8"
            style={{
              fontSize: "clamp(56px, 11vw, 128px)",
              lineHeight: 0.95,
              letterSpacing: "-0.035em",
              color: "#1A1815",
              fontWeight: 400,
            }}
          >
            Start <em style={{ fontStyle: "italic", color: "#1F3A2E" }}>where</em> you are.
          </h2>
          <p
            className="mx-auto mb-10"
            style={{ fontSize: "clamp(17px, 1.7vw, 20px)", lineHeight: 1.55, color: "#2D2A24", maxWidth: "640px" }}
          >
            No fitness goals. No flexibility test. No "where do you want to be in 90 days." Just a few questions about your body — and a practice that meets you exactly where you are today.
          </p>
          <button
            onClick={handleGetStarted}
            className="hero-cta inline-flex items-center justify-center gap-2 rounded-full transition-all"
            style={{
              backgroundColor: "#B8472D",
              color: "#F5F0E6",
              padding: "20px 40px",
              fontSize: "17px",
              fontWeight: 500,
            }}
          >
            Start my assessment <span aria-hidden="true">→</span>
          </button>
          <p className="mt-5" style={{ fontSize: "13px", color: "rgba(26,24,21,0.55)" }}>
            Free to start  ·  No credit card  ·  60 seconds to your first session
          </p>
        </div>
      </section>
      <NewProgramModal open={showModal} onOpenChange={setShowModal} onConfirm={handleConfirmRestart} />
    </>
  );
}
