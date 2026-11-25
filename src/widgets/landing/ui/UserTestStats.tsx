import { Reveal, REVEAL_STAGGER } from "./Reveal";
import { CONTAINER_CLASS } from "./styles";

/*
사용자 테스트 설문 결과다. 결과가 바뀌면 값과 문항을 함께 고친다.
*/
interface Stat {
  value: string;
  label: string;
  scale?: string; // 값의 만점 기준처럼 숫자 옆에 작게 덧붙이는 설명
}

const STATS: Stat[] = [
  { value: "92%", label: "트리 강의가 내용 이해에 도움이 됐어요" },
  { value: "85%", label: "AI가 만든 트리가 문서를 잘 정리했어요" },
  { value: "83점", label: "사용성 점수(SUS)", scale: "100점 만점" },
];

export function UserTestStats() {
  return (
    <section className="bg-landing-surface-muted">
      <div className={`${CONTAINER_CLASS} flex flex-col gap-8 py-20`}>
        <Reveal>
          <h2 className="m-0 text-[clamp(26px,4vw,32px)] leading-[1.3] font-extrabold tracking-[-0.03em]">
            사용자 테스트에서 확인했어요
          </h2>
        </Reveal>
        <dl className="m-0 grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-5">
          {STATS.map(({ value, label, scale }, index) => (
            <Reveal
              delay={index * REVEAL_STAGGER}
              key={label}
              className="flex flex-col-reverse justify-end gap-2 rounded-landing-card bg-landing-surface p-7"
            >
              <dt className="text-[15px] leading-[1.6] text-landing-muted">
                {label}
              </dt>
              <dd className="m-0 text-[44px] font-extrabold tracking-[-0.03em] text-landing-brand">
                {value}
                {scale && (
                  <span className="ml-2 text-base font-semibold tracking-normal text-landing-subtle">
                    / {scale}
                  </span>
                )}
              </dd>
            </Reveal>
          ))}
        </dl>
        <p className="-mt-3 mb-0 text-sm text-landing-muted">
          2026년 11월 사용자 테스트 참여자 13명 기준
        </p>
      </div>
    </section>
  );
}
