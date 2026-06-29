import { Hero } from "@/components/marketing/Hero";
import { WhatItDoes } from "@/components/marketing/WhatItDoes";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { Pricing } from "@/components/marketing/Pricing";
import { Objections } from "@/components/marketing/Objections";
import { Faq } from "@/components/marketing/Faq";

export default function MarketingPage() {
  return (
    <>
      <Hero />
      <WhatItDoes />
      <HowItWorks />
      <Pricing />
      <Objections />
      <Faq />
    </>
  );
}
