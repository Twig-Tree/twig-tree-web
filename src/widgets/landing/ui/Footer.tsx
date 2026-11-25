import { Logo } from "@/src/shared/ui/logo";
import { GITHUB_URL } from "../model/links";
import { CONTAINER_CLASS, FOCUS_RING_CLASS } from "./styles";

export function Footer() {
  return (
    <footer className="border-t border-landing-border">
      <div
        className={`${CONTAINER_CLASS} flex flex-wrap items-center justify-between gap-4 py-8`}
      >
        <Logo tone="fixed" className="-ml-3 h-12" />

        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={`rounded-full text-sm font-semibold text-landing-brand hover:text-landing-brand-strong ${FOCUS_RING_CLASS}`}
        >
          GitHub
        </a>
      </div>
    </footer>
  );
}
