

const ITEMS = [
  { lead: "You were told to try yoga months ago and haven't started.", sub: "A doctor or physio suggested it. Life kept moving." },
  { lead: "You have a sheet of exercises in a drawer somewhere.", sub: "Maybe from a physical therapist or chiropractor. You did them for a week. You're not sure where the sheet is now." },
  { lead: "You tried a YouTube class and felt lost in the first five minutes.", sub: "The teacher kept moving. You weren't sure if a pose was hurting you or just hard. You closed the tab." },
  { lead: "Your body doesn't work like it used to, and most workouts feel like a risk.", sub: "Not injured-injured. But there's something. A back that flares up, a knee that complains, a shoulder you work around." },
  { lead: "You're managing a real condition and 'just be gentle' isn't a plan.", sub: "Chronic pain. A diagnosis. Post-surgical recovery. Perimenopause. You need movement that knows what's actually going on." },
  { lead: "You're tired of being the one who has to figure out what's safe.", sub: "Every class asks you to self-modify. You'd just like someone to tell you with confidence what to do." },
];

const HAIRLINE = "rgba(26,24,21,0.12)";

export default function WhoVinysIsFor() {
  return (
    <section className="w-full vinys-section" style={{ background: "hsl(var(--surface-soft))" }}>
      <div className="vinys-container">
        <div className="max-w-[760px] mx-auto text-center mb-10">
          <h2 className="font-display font-bold text-foreground mb-4" style={{ fontSize: "clamp(24px, 2.8vw, 32px)" }}>
            You've probably tried to <em style={{ fontStyle: "italic", color: "#1F3A2E" }}>start</em> before.
          </h2>
          <p className="mx-auto" style={{ maxWidth: "560px", color: "#5D2A24", fontSize: "clamp(15px, 1.4vw, 17px)", lineHeight: 1.6 }}>
            Most of our members didn't find Vinys because yoga wasn't for them. They found it because nothing else fit. See if any of this sounds familiar.
          </p>
        </div>

        <div
          className="max-w-[960px] mx-auto grid grid-cols-1 md:grid-cols-2"
          style={{ borderTop: `1px solid ${HAIRLINE}` }}
        >
          {ITEMS.map((item, i) => (
            <div
              key={i}
              className="py-8 px-0 md:px-8"
              style={{ borderBottom: `1px solid ${HAIRLINE}` }}
            >
              <h3 className="font-display mb-3 text-[22px] font-medium text-[#1A1815] leading-[1.25]">
                {item.lead}
              </h3>
              <p className="text-base leading-[1.55] text-[#2D2A24]">{item.sub}</p>
            </div>
          ))}
        </div>

        <p className="mx-auto text-center text-[22px] italic text-[#1A1815] max-w-[780px] mt-16 leading-[1.4]">
          If two or three of these sound like you, you're exactly who Vinys was built for.
        </p>
      </div>
    </section>
  );
}
