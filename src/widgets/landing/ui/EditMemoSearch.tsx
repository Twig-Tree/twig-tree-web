import type { ReactNode } from "react";
import { MemoIcon, PencilIcon, SearchIcon } from "./icons";
import { Reveal, REVEAL_STAGGER } from "./Reveal";
import { CONTAINER_CLASS, EYEBROW_CLASS, SECTION_TITLE_CLASS } from "./styles";

interface FeatureHeadingProps {
  icon: ReactNode;
  iconClassName: string; // 카드 바탕에 맞춘 아이콘 상자의 바탕·글자색
  title: string;
  description: string;
  descriptionClassName: string;
}

function FeatureHeading({
  icon,
  iconClassName,
  title,
  description,
  descriptionClassName,
}: FeatureHeadingProps) {
  return (
    <div className="flex flex-col gap-2.5">
      <span
        className={`flex h-12 w-12 items-center justify-center rounded-[14px] ${iconClassName}`}
      >
        {icon}
      </span>
      <h3 className="m-0 text-[22px] font-bold">{title}</h3>
      <p className={`m-0 text-base leading-[1.6] ${descriptionClassName}`}>
        {description}
      </p>
    </div>
  );
}

/*
카드 너비는 flex-wrap과 flex-basis로 정한다.
grid의 auto-fit과 span 2를 쓰면 중간 폭에서 메모 카드만 좁은 칸에 남는다.
*/
export function EditMemoSearch() {
  return (
    <section>
      <div
        className={`${CONTAINER_CLASS} flex flex-col gap-12 pt-24 pb-20 md:pt-28 md:pb-24`}
      >
        <Reveal className="flex flex-col gap-3">
          <span className={EYEBROW_CLASS}>내 트리로 만들기</span>
          <h2 className={SECTION_TITLE_CLASS}>
            AI가 만든 트리를,
            <br />내 방식대로 키워요
          </h2>
        </Reveal>

        <div className="flex flex-wrap gap-5">
          <Reveal
            as="article"
            className="flex min-w-0 flex-[2_1_520px] flex-col gap-6 rounded-landing-panel bg-landing-surface-muted p-7 md:p-9"
          >
            <FeatureHeading
              icon={<PencilIcon />}
              iconClassName="bg-landing-surface text-landing-brand"
              title="트리 편집"
              description="노드를 추가·삭제하고, 끌어다 놓아 구조를 바꿔요."
              descriptionClassName="text-landing-muted"
            />
            <div
              className="flex flex-wrap items-center gap-4 rounded-landing-card bg-landing-surface p-6"
              aria-hidden="true"
            >
              <span className="rounded-full bg-landing-ink px-3.5 py-2 text-sm font-bold text-landing-on-brand">
                데이터베이스
              </span>
              <svg
                width="28"
                height="12"
                viewBox="0 0 28 12"
                className="stroke-landing-edge"
              >
                <path d="M0 6h26" strokeWidth="2" />
              </svg>
              <span className="rounded-full bg-landing-leaf-soft px-3.5 py-2 text-sm font-semibold text-landing-brand-strong">
                정규화
              </span>
              <span className="-rotate-3 rounded-full border-2 border-dashed border-landing-leaf bg-landing-surface px-3 py-1.5 text-sm font-semibold text-landing-brand-strong shadow-landing-lift">
                트랜잭션 · 이동 중
              </span>
              <span className="rounded-full border border-dashed border-landing-border-dashed px-3.5 py-2 text-sm font-semibold text-landing-subtle">
                + 노드 추가
              </span>
            </div>
          </Reveal>

          <Reveal
            as="article"
            delay={REVEAL_STAGGER}
            className="flex min-w-0 flex-[1_1_300px] flex-col gap-6 rounded-landing-panel bg-landing-ink p-7 text-landing-on-brand md:p-9"
          >
            <FeatureHeading
              icon={<MemoIcon />}
              iconClassName="bg-landing-brand text-landing-on-brand"
              title="노드 메모"
              description="노드마다 내 생각과 질문을 덧붙여요."
              descriptionClassName="text-landing-night-muted"
            />
            <p className="m-0 rotate-[1.5deg] rounded-[14px] bg-landing-memo p-4 text-sm leading-[1.6] text-landing-on-memo">
              정규화 단계별 예시 다시 보기 — 시험 범위!
            </p>
          </Reveal>

          <Reveal
            as="article"
            className="flex min-w-0 flex-[1_1_100%] flex-wrap items-center gap-8 rounded-landing-panel border border-landing-border p-7 md:p-9"
          >
            <div className="flex-[1_1_280px]">
              <FeatureHeading
                icon={<SearchIcon />}
                iconClassName="bg-landing-leaf-soft text-landing-brand"
                title="트리 검색"
                description="트리 전체에서 개념을 찾고, 그 노드로 바로 이동해요."
                descriptionClassName="text-landing-muted"
              />
            </div>
            {/*
            검색 예시는 동작하지 않으므로 입력창 모양만 그린다. 실제 input이면 포커스되어 쓸 수 있는 것처럼 보인다.
            */}
            <div className="flex min-w-0 flex-[2_1_420px] flex-col gap-2.5">
              <span className="text-[13px] font-semibold text-landing-subtle">
                검색 예시
              </span>
              <div className="flex h-[52px] items-center rounded-[14px] border-2 border-landing-leaf px-[18px] text-base text-landing-ink">
                교착 상태
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-[10px] bg-landing-leaf-soft px-3 py-2 text-sm text-landing-brand-strong">
                  운영체제 › 프로세스 › <strong>교착 상태</strong>
                </span>
                <span className="rounded-[10px] bg-landing-surface-muted px-3 py-2 text-sm text-landing-muted">
                  메모 1개 · <strong>교착 상태</strong> 회피 조건
                </span>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
