import { AiTreeFeature } from "./AiTreeFeature";
import { EditMemoSearch } from "./EditMemoSearch";
import { FinalCta } from "./FinalCta";
import { Footer } from "./Footer";
import { Hero } from "./Hero";
import { LectureDemo } from "./LectureDemo";
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
        <LectureDemo />
        <EditMemoSearch />
        <UserTestStats />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
