import { useNavigate } from "react-router-dom";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQ_ITEMS = [
  {
    q: "Is Vinys safe for people with medical conditions?",
    a: "Vinys is built specifically for people with physical and health conditions. Every session is filtered against your restrictions and adapted to your capacity. That said, Vinys provides educational movement guidance only — it's not a substitute for medical advice. Always check with your healthcare provider before starting a new movement program.",
  },
  {
    q: "Do I need yoga experience?",
    a: "None at all. Vinys is designed for people starting from zero — or returning after a long break, injury, or illness. Every session is matched to where your body is right now.",
  },
  {
    q: "How is this different from yoga videos?",
    a: "A video is the same for everyone who watches it. Vinys generates a session specifically for your condition, energy level, and available time — every single day.",
  },
  {
    q: "Is there a free trial?",
    a: "Yes. You can create your first session right now — no credit card required.",
    cta: true,
  },
  {
    q: "What equipment do I need?",
    a: "Just a mat and a wall. Most sessions need nothing else. You can optionally add a chair, strap, or bolster in your settings.",
  },
  {
    q: "How long are the sessions?",
    a: "You choose: 10, 15, 20, 30, or 45 minutes. The session is built to fit the time you pick.",
  },
];

export default function FAQSection() {
  const navigate = useNavigate();

  return (
    <section className="w-full vinys-section">
      <div className="vinys-container max-w-[720px] mx-auto">
        <h2
          className="font-display font-bold text-foreground text-center mb-8"
          style={{ fontSize: "clamp(24px, 2.8vw, 32px)" }}
        >
          Frequently asked questions
        </h2>
        <Accordion type="single" collapsible className="w-full">
          {FAQ_ITEMS.map((item, i) => (
            <AccordionItem key={i} value={`faq-${i}`}>
              <AccordionTrigger className="text-left text-[15px] font-semibold text-foreground hover:no-underline">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-[15px] leading-relaxed">
                {item.a}
                {item.cta && (
                  <>
                    {" "}
                    <button
                      onClick={() => navigate("/onboarding")}
                      className="text-primary font-semibold underline underline-offset-2 hover:text-primary/80 transition-colors"
                    >
                      Start my assessment →
                    </button>
                  </>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
