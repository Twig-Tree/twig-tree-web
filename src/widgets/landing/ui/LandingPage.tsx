import { AiTreeFeature } from "./AiTreeFeature";
import { EditMemoSearch } from "./EditMemoSearch";
import { FinalCta } from "./FinalCta";
import { Footer } from "./Footer";
import { Hero } from "./Hero";
import { HowItWorks } from "./HowItWorks";
import { Problem } from "./Problem";
import { TopBar } from "./TopBar";
import { UserTestStats } from "./UserTestStats";

export function LandingPage() {
  return (
    <div className="overflow-x-clip bg-landing-surface break-keep text-landing-ink">
      <TopBar />
      <main id="top">
        <Hero />
        <Problem />
        <HowItWorks />
        <AiTreeFeature />
        {/* 트리 강의 데모(#lecture)는 4단계에서 이 자리에 넣는다. */}
        <EditMemoSearch />
        <UserTestStats />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
