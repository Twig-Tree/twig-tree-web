import { Footer } from "./Footer";
import { TopBar } from "./TopBar";

export function LandingPage() {
  return (
    <div className="overflow-x-clip bg-landing-surface text-landing-ink">
      <TopBar />
      <main id="top">{/* 섹션은 다음 단계에서 채운다. */}</main>
      <Footer />
    </div>
  );
}
