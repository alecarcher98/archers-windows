import { Hero } from "@/components/marketing/Hero";
import { SeeItLive } from "@/components/marketing/SeeItLive";
import { WhatItDoes } from "@/components/marketing/WhatItDoes";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { Pricing } from "@/components/marketing/Pricing";
import { Objections } from "@/components/marketing/Objections";
import { Faq } from "@/components/marketing/Faq";

export default function MarketingPage() {
  return (
    <>
      <Hero />
      <SeeItLive />
      <WhatItDoes />
      <HowItWorks />
      <Pricing />
      <Objections />
      <Faq />
    </>
  );
}
