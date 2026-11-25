import Image from "next/image";
import { GITHUB_URL } from "../model/links";
import { CONTAINER_CLASS, FOCUS_RING_CLASS } from "./styles";
import logo from "./Twig-Tree-logo.png";

export function Footer() {
  return (
    <footer className="border-t border-landing-border">
      <div
        className={`${CONTAINER_CLASS} flex flex-wrap items-center justify-between gap-4 py-8`}
      >
        <Image src={logo} alt="Twig Tree" className="-ml-3 h-12 w-auto" />
        <span className="text-sm text-landing-muted">
          팀 백색소음 · 홍익대학교 컴퓨터공학과 졸업 프로젝트
        </span>
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
