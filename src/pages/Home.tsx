import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import Layout from "@/components/Layout";
import MarketingNav from "@/components/home/MarketingNav";
import HomeHero from "@/components/home/HomeHero";
import GuidedWalkthrough from "@/components/home/GuidedWalkthrough";


import WhoVinysIsFor from "@/components/home/WhoVinysIsFor";
import ConditionsSection from "@/components/home/ConditionsSection";
import TestimonialsSection from "@/components/home/TestimonialsSection";

import WhoBuiltVinys from "@/components/home/WhoBuiltVinys";
import ViniyogaSection from "@/components/home/ViniyogaSection";
import WhyVinysIsDifferent from "@/components/home/WhyVinysIsDifferent";
import ConsistencyOverIntensity from "@/components/home/ConsistencyOverIntensity";
import LongTermProgression from "@/components/home/LongTermProgression";
import FAQSection from "@/components/home/FAQSection";
import WaitlistSignup from "@/components/home/WaitlistSignup";
import FinalCTA from "@/components/home/FinalCTA";
import MarketingFooter from "@/components/home/MarketingFooter";

export default function Home() {
  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (hash) {
      setTimeout(() => {
        document.getElementById(hash)?.scrollIntoView({ behavior: "smooth" });
      }, 300);
    }
  }, []);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Vinys",
    "description": "Adaptive therapeutic yoga built around your specific health conditions, energy level, and schedule.",
    "applicationCategory": "HealthApplication",
    "operatingSystem": "Web",
    "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
    "provider": { "@type": "Organization", "name": "Vinys", "url": "https://vinys.app" },
  };

  return (
    <Layout hideHeader hideFooter>
      <Helmet>
        <link
          rel="preload"
          as="image"
          href="https://xyuvmzonhrrjslehggyo.supabase.co/storage/v1/object/public/public-assets/vinys-hero-darkwood-v3.png"
        />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>
      <div className="flex flex-col items-center">
        <MarketingNav />
        <HomeHero />
        <GuidedWalkthrough />
        
        <WhoVinysIsFor />
        <ConditionsSection />
        <TestimonialsSection />
        <WhyVinysIsDifferent />
        <WhoBuiltVinys />
        <ViniyogaSection />
        <ConsistencyOverIntensity />
        <LongTermProgression />
        <FAQSection />
        <WaitlistSignup />
        <FinalCTA />
        <MarketingFooter />
      </div>
    </Layout>
  );
}
