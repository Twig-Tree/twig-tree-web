import Link from "next/link";
import { routes } from "@/src/shared/config/routes";
import { HeroTree } from "./HeroTree";
import { PlayIcon } from "./icons";
import {
  CONTAINER_CLASS,
  FOCUS_RING_CLASS,
  PRIMARY_BUTTON_CLASS,
} from "./styles";

export function Hero() {
  return (
    <section className="bg-landing-hero">
      <div
        className={`${CONTAINER_CLASS} flex flex-wrap items-center gap-16 pt-16 pb-20 md:pt-24 md:pb-28`}
      >
        <div className="flex min-w-0 flex-[1_1_460px] flex-col gap-7">
          <span className="self-start rounded-full bg-landing-leaf-soft px-3.5 py-2 text-sm font-semibold text-landing-brand">
            AI 지식 트리 서비스
          </span>
          <h1 className="m-0 text-[clamp(40px,8vw,64px)] leading-[1.12] font-extrabold tracking-[-0.035em]">
            흩어진 지식,
            <br />한 그루의 <span className="text-landing-brand">트리</span>로
          </h1>
          <p className="m-0 max-w-[520px] text-lg leading-[1.6] text-landing-muted md:text-xl">
            문서를 올리면 AI가 개념을 트리로 구조화하고, 그 트리를 따라 강의까지
            들려드려요.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href={routes.login} className={PRIMARY_BUTTON_CLASS}>
              무료로 시작하기
            </Link>
            <a
              href="#lecture"
              className={`flex items-center gap-2 rounded-full border border-landing-border-strong bg-landing-surface px-[26px] py-[15px] text-[17px] font-semibold text-landing-ink hover:bg-landing-surface-muted ${FOCUS_RING_CLASS}`}
            >
              <PlayIcon />
              30초 데모 보기
            </a>
          </div>
        </div>

        <div className="min-w-0 flex-[1_1_520px]">
          <div className="overflow-hidden rounded-landing-window border border-landing-border bg-landing-surface shadow-landing-window">
            <div className="flex items-center gap-2 border-b border-landing-border px-[18px] py-3.5">
              {[0, 1, 2].map((dot) => (
                <span
                  key={dot}
                  className="h-2.5 w-2.5 rounded-full bg-landing-placeholder"
                  aria-hidden="true"
                />
              ))}
              <span className="ml-3 truncate text-[13px] text-landing-subtle">
                자료구조_강의노트.pdf → 지식 트리
              </span>
            </div>
            <HeroTree />
          </div>
        </div>
      </div>
    </section>
  );
}
