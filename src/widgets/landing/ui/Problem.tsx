import { Reveal, REVEAL_STAGGER } from "./Reveal";
import { CONTAINER_CLASS, SECTION_TITLE_CLASS } from "./styles";

const PROBLEMS = [
  { title: "긴 문서", description: "전체 흐름이 한눈에 들어오지 않아요." },
  {
    title: "흩어진 필기",
    description: "개념끼리 어떻게 이어지는지 놓치게 돼요.",
  },
  {
    title: "반복 학습",
    description: "복습할 때마다 처음부터 다시 읽어야 해요.",
  },
];

export function Problem() {
  return (
    <section className="bg-landing-surface-muted">
      <div
        className={`${CONTAINER_CLASS} flex flex-col items-center gap-12 py-20 md:py-24`}
      >
        <Reveal className="flex flex-col items-center gap-3.5 text-center">
          <h2 className={SECTION_TITLE_CLASS}>
            PDF 30장, 어디서부터 읽어야 할까요?
          </h2>
          <p className="m-0 text-lg text-landing-muted">
            공부가 막히는 건 양이 아니라 구조가 안 보여서예요.
          </p>
        </Reveal>
        <ul className="m-0 grid w-full list-none grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-5 p-0">
          {PROBLEMS.map(({ title, description }, index) => (
            <Reveal
              as="li"
              key={title}
              delay={index * REVEAL_STAGGER}
              className="flex flex-col gap-2.5 rounded-landing-card bg-landing-surface p-7"
            >
              <h3 className="m-0 text-lg font-bold">{title}</h3>
              <p className="m-0 text-base leading-[1.6] text-landing-muted">
                {description}
              </p>
            </Reveal>
          ))}
        </ul>
        <Reveal>
          <p className="m-0 text-center text-[22px] font-bold text-landing-brand">
            Twig Tree는 문서를 &apos;구조&apos;로 바꿔요.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
