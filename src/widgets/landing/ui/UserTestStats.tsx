import { CONTAINER_CLASS } from "./styles";

/*
실제 설문 결과가 나오면 교체한다. 그 전까지 임의의 숫자를 넣지 않는다.
*/
const STATS = [
  { value: "[N]%", label: "[설문 문항 결과 — 예: 구조 파악이 쉬워졌다]" },
  {
    value: "[N]%",
    label: "[설문 문항 결과 — 예: 트리 강의가 이해에 도움됐다]",
  },
  { value: "[N]점", label: "[만족도 평균 — 5점 만점]" },
];

export function UserTestStats() {
  return (
    <section className="bg-landing-surface-muted">
      <div className={`${CONTAINER_CLASS} flex flex-col gap-8 py-20`}>
        <h2 className="m-0 text-[clamp(26px,4vw,32px)] leading-[1.3] font-extrabold tracking-[-0.03em]">
          사용자 테스트에서 확인했어요
        </h2>
        <dl className="m-0 grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-5">
          {STATS.map(({ value, label }) => (
            <div
              key={label}
              className="flex flex-col-reverse justify-end gap-2 rounded-landing-card bg-landing-surface p-7"
            >
              <dt className="text-[15px] leading-[1.6] text-landing-muted">
                {label}
              </dt>
              <dd className="m-0 text-[44px] font-extrabold tracking-[-0.03em] text-landing-brand">
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
