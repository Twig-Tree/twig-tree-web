import type { ReactNode } from "react";
import { BranchIcon, PlayIcon, UploadIcon } from "./icons";
import { CONTAINER_CLASS, EYEBROW_CLASS, SECTION_TITLE_CLASS } from "./styles";

interface Step {
  number: string;
  title: string;
  description: string;
  icon: ReactNode;
  isHighlighted: boolean; // 마지막 단계는 시그니처 기능이라 어두운 카드로 강조한다
}

const STEPS: Step[] = [
  {
    number: "01",
    title: "문서 업로드",
    description: "공부할 문서를 올리기만 하면 돼요.",
    icon: <UploadIcon />,
    isHighlighted: false,
  },
  {
    number: "02",
    title: "AI가 트리 생성",
    description: "핵심 개념과 상하위 관계를 뽑아 트리로 정리해요.",
    icon: <BranchIcon />,
    isHighlighted: false,
  },
  {
    number: "03",
    title: "트리 강의로 학습",
    description: "트리를 따라가며 해설을 듣고, 직접 다듬어요.",
    icon: <PlayIcon size={24} />,
    isHighlighted: true,
  },
];

export function HowItWorks() {
  return (
    <section id="features">
      <div
        className={`${CONTAINER_CLASS} flex flex-col gap-12 pt-24 pb-20 md:pt-28 md:pb-24`}
      >
        <div className="flex flex-col gap-3">
          <span className={EYEBROW_CLASS}>HOW IT WORKS</span>
          <h2 className={SECTION_TITLE_CLASS}>세 단계면 충분해요</h2>
        </div>
        <ol className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-5 p-0">
          {STEPS.map(({ number, title, description, icon, isHighlighted }) => (
            <li
              key={number}
              className={`flex flex-col gap-4 rounded-landing-window border p-8 ${
                isHighlighted
                  ? "border-landing-ink bg-landing-ink text-landing-on-brand"
                  : "border-landing-border"
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`flex h-[52px] w-[52px] items-center justify-center rounded-2xl ${
                    isHighlighted
                      ? "bg-landing-brand text-landing-on-brand"
                      : "bg-landing-leaf-soft text-landing-brand"
                  }`}
                >
                  {icon}
                </span>
                <span
                  className={`text-[32px] font-extrabold ${
                    isHighlighted
                      ? "text-landing-night-control"
                      : "text-landing-step-number"
                  }`}
                  aria-hidden="true"
                >
                  {number}
                </span>
              </div>
              <h3 className="m-0 text-xl font-bold">{title}</h3>
              <p
                className={`m-0 text-base leading-[1.6] ${
                  isHighlighted
                    ? "text-landing-night-muted"
                    : "text-landing-muted"
                }`}
              >
                {description}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
