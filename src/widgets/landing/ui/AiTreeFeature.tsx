import { ArrowRightIcon, CheckIcon } from "./icons";
import { CONTAINER_CLASS, EYEBROW_CLASS, SECTION_TITLE_CLASS } from "./styles";

const CHECKS = [
  "핵심 개념 자동 추출",
  "상위·하위 관계로 구조화",
  "생성 후 노드 단위로 검증·수정",
];

const DOCUMENT_LINE_WIDTHS = [
  "100%",
  "92%",
  "96%",
  "60%",
  "100%",
  "88%",
  "94%",
  "40%",
];

const CHIP_CLASS =
  "self-start rounded-full px-[13px] py-[7px] text-sm font-semibold";

const LEAF_CHIP_CLASS =
  "rounded-full border border-landing-edge bg-landing-surface px-[11px] py-[5px] text-[13px] font-semibold text-landing-brand-strong";

export function AiTreeFeature() {
  return (
    <section>
      <div
        className={`${CONTAINER_CLASS} flex flex-wrap items-center gap-16 pt-8 pb-24 md:pb-28`}
      >
        <div className="flex min-w-0 flex-[1_1_400px] flex-col gap-5">
          <span className={EYEBROW_CLASS}>AI 트리 생성</span>
          <h2 className={SECTION_TITLE_CLASS}>
            목차가 아니라,
            <br />
            개념의 관계를 봅니다
          </h2>
          <p className="m-0 text-lg leading-[1.7] text-landing-muted">
            AI가 문서를 읽고 개념을 노드로 나눠 연결해요. 만들어진 트리는 언제든
            직접 확인하고 고칠 수 있어요.
          </p>
          <ul className="m-0 flex list-none flex-col gap-3 p-0">
            {CHECKS.map((check) => (
              <li
                key={check}
                className="flex items-center gap-2.5 text-base font-medium"
              >
                <CheckIcon className="shrink-0 text-landing-brand" />
                {check}
              </li>
            ))}
          </ul>
        </div>

        {/*
        문서가 트리로 바뀌는 과정을 보여주는 그림이다. 내용은 왼쪽 설명이 전하므로 스크린 리더에는 요약만 남긴다.
        */}
        <figure
          className="m-0 flex min-w-0 flex-[1_1_560px] flex-col items-center justify-center gap-5 sm:flex-row sm:flex-wrap"
          aria-label="긴 문서가 개념 트리로 정리되는 예시"
        >
          <div
            className="flex w-[200px] shrink-0 flex-col gap-2.5 rounded-landing-card border border-landing-border bg-landing-surface p-[22px] shadow-landing-card"
            aria-hidden="true"
          >
            <span className="text-[13px] font-semibold text-landing-subtle">
              BEFORE · 문서
            </span>
            <span className="h-2.5 w-[70%] rounded bg-landing-ink" />
            {DOCUMENT_LINE_WIDTHS.map((width, index) => (
              <span
                key={index}
                className="h-2 rounded bg-landing-placeholder"
                style={{ width }}
              />
            ))}
          </div>

          <ArrowRightIcon className="rotate-90 text-landing-leaf sm:rotate-0" />

          <div className="flex w-full max-w-[300px] flex-col gap-2.5 rounded-landing-card bg-landing-surface-muted p-[22px]">
            <span className="text-[13px] font-semibold text-landing-brand">
              AFTER · 지식 트리
            </span>
            <span
              className={`${CHIP_CLASS} bg-landing-ink py-2 font-bold text-landing-on-brand`}
            >
              네트워크
            </span>
            <div className="ml-[18px] flex flex-col gap-2 border-l-2 border-landing-edge pl-4">
              <span
                className={`${CHIP_CLASS} bg-landing-brand text-landing-on-brand`}
              >
                OSI 7계층
              </span>
              <div className="ml-4 flex flex-wrap gap-1.5 border-l-2 border-landing-edge-soft pl-3.5">
                <span className={LEAF_CHIP_CLASS}>전송 계층</span>
                <span className={LEAF_CHIP_CLASS}>응용 계층</span>
              </div>
              <span
                className={`${CHIP_CLASS} bg-landing-brand text-landing-on-brand`}
              >
                TCP / UDP
              </span>
            </div>
          </div>
        </figure>
      </div>
    </section>
  );
}
