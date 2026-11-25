import Image from "next/image";
import Link from "next/link";
import { routes } from "@/src/shared/config/routes";
import { CONTAINER_CLASS, FOCUS_RING_CLASS } from "./styles";
import logo from "./Twig-Tree-logo.png";

export function FinalCta() {
  return (
    <section id="start">
      <div className={`${CONTAINER_CLASS} py-20 md:py-24`}>
        <div className="flex flex-col items-center gap-6 rounded-landing-cta bg-landing-brand bg-landing-cta px-8 py-16 text-center md:py-20">
          {/*
          로고 PNG는 어두운 줄기와 글자라 브랜드 바탕에서 보이지 않으므로 흰색 실루엣으로 바꿔 쓴다.
          */}
          <Image
            src={logo}
            alt=""
            className="h-24 w-auto brightness-0 invert"
          />
          <h2 className="m-0 text-[clamp(32px,6vw,48px)] leading-[1.2] font-extrabold tracking-[-0.035em] text-landing-on-brand">
            첫 번째 트리를 심어보세요
          </h2>
          <p className="m-0 text-lg text-landing-on-brand-muted">
            문서 하나면 지식 트리와 강의가 함께 자라요.
          </p>
          <Link
            href={routes.login}
            className={`rounded-full bg-landing-surface px-8 py-[18px] text-[17px] font-bold text-landing-ink hover:bg-landing-leaf-soft ${FOCUS_RING_CLASS} focus-visible:outline-landing-on-brand`}
          >
            무료로 시작하기
          </Link>
        </div>
      </div>
    </section>
  );
}
