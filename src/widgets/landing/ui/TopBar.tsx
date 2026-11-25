import Image from "next/image";
import Link from "next/link";
import { routes } from "@/src/shared/config/routes";
import { CONTAINER_CLASS, FOCUS_RING_CLASS } from "./styles";
import logo from "./Twig-Tree-logo.png";

export function TopBar() {
  return (
    <header>
      <div
        className={`${CONTAINER_CLASS} flex min-h-12 items-center justify-between gap-4 py-1`}
      >
        <a
          href="#top"
          aria-label="Twig Tree 홈"
          className={`-ml-4 rounded-full ${FOCUS_RING_CLASS}`}
        >
          {/*
          이미지 왼쪽에 투명 여백이 있어 음수 margin으로 컨테이너 왼쪽 선에 맞춘다.
          */}
          <Image src={logo} alt="" loading="eager" className="h-16 w-auto" />
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
