"use client";

import { motion, useReducedMotion } from "motion/react";
import type { CSSProperties, ReactNode } from "react";

const MOTION_TAGS = {
  div: motion.div,
  li: motion.li,
  article: motion.article,
  figure: motion.figure,
};

interface RevealProps {
  children: ReactNode;
  as?: keyof typeof MOTION_TAGS; // 목록 항목처럼 감싸는 요소의 태그가 의미를 가질 때 그 태그로 그린다
  delay?: number; // 같은 줄의 카드를 순서대로 보이게 하는 초 단위 지연
  className?: string;
  style?: CSSProperties;
  "aria-label"?: string;
}

/*
함수 이름 : Reveal
기능 : 소개 페이지의 제목과 카드가 화면에 처음 들어올 때 아래에서 올라오며 나타나게 한다.
인자 : RevealProps
반환값 : 등장 애니메이션을 가진 요소
*/
export function Reveal({
  children,
  as = "div",
  delay = 0,
  className,
  style,
  "aria-label": ariaLabel,
}: RevealProps) {
  const shouldReduceMotion = useReducedMotion();
  const MotionTag = MOTION_TAGS[as];

  /*
  움직임을 줄인 사용자에게도 initial은 그대로 두고 전환 시간만 없앤다.
  initial을 바꾸면 서버가 그린 투명 상태와 클라이언트 값이 어긋나 요소가 보이지 않은 채 남을 수 있다.
  */
  return (
    <MotionTag
      className={className}
      style={style}
      aria-label={ariaLabel}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={
        shouldReduceMotion
          ? { duration: 0 }
          : { duration: 0.6, ease: "easeOut", delay }
      }
    >
      {children}
    </MotionTag>
  );
}

/*
같은 줄에 놓인 카드 사이의 등장 간격(초)이다.
*/
export const REVEAL_STAGGER = 0.08;
