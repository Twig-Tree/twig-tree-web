import Link from "next/link";
import { routes } from "@/src/shared/config/routes";
import { LogoMark, Wordmark } from "./Logo";
import { CONTAINER_CLASS, FOCUS_RING_CLASS } from "./styles";

export function TopBar() {
  return (
    <header>
      <div
        className={`${CONTAINER_CLASS} flex min-h-12 items-center justify-between gap-4 py-3.5`}
      >
        <a
          href="#top"
          aria-label="Twig Tree 홈"
          className={`flex items-center gap-2.5 rounded-full ${FOCUS_RING_CLASS}`}
        >
          <LogoMark />
          <Wordmark className="text-[22px]" />
        </a>
        <Link
          href={routes.login}
          className={`rounded-full px-1 py-3 text-[15px] font-semibold text-landing-muted hover:text-landing-ink ${FOCUS_RING_CLASS}`}
        >
          로그인
        </Link>
      </div>
    </header>
  );
}
