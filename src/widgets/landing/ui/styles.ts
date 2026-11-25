/*
섹션마다 반복되는 폭과 좌우 여백이다. 세로 여백은 섹션마다 달라 각자 정한다.
*/
export const CONTAINER_CLASS = "mx-auto w-full max-w-[1200px] px-6";

export const FOCUS_RING_CLASS =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-landing-brand";

/*
시안의 제목 크기는 데스크톱 기준이라 좁은 화면에서는 clamp로 줄인다.
*/
export const SECTION_TITLE_CLASS =
  "m-0 text-[clamp(30px,5vw,40px)] leading-[1.25] font-extrabold tracking-[-0.03em]";

export const EYEBROW_CLASS =
  "text-sm font-bold tracking-[0.08em] text-landing-brand";

export const PRIMARY_BUTTON_CLASS = `rounded-full bg-landing-brand px-7 py-4 text-[17px] font-semibold text-landing-on-brand hover:bg-landing-brand-strong ${FOCUS_RING_CLASS}`;
