"use client";

import { motion, useReducedMotion } from "motion/react";

/*
히어로의 예시 트리다. 좌표는 시안의 540×340 캔버스 기준이다.
delay는 연결선이 다 그려지기 전에 다음 단계 노드가 이어서 나타나도록 시안의 값을 그대로 쓴다.
*/
const EDGES = [
  { d: "M150 170 C190 170 190 95 230 95", delay: 0 },
  { d: "M150 170 C190 170 190 245 230 245", delay: 0.15 },
  { d: "M350 95 C380 95 380 55 410 55", delay: 0.5 },
  { d: "M350 95 C380 95 380 135 410 135", delay: 0.6 },
  { d: "M350 245 C380 245 380 205 410 205", delay: 0.7 },
  { d: "M350 245 C380 245 380 285 410 285", delay: 0.8 },
];

const BRANCHES = [
  { label: "선형 구조", y: 73, delay: 0.4 },
  { label: "비선형 구조", y: 223, delay: 0.5 },
];

const LEAVES = [
  { label: "스택", y: 36, delay: 1 },
  { label: "큐", y: 116, delay: 1.1 },
  { label: "트리", y: 186, delay: 1.2 },
  { label: "그래프", y: 266, delay: 1.3 },
];

const EDGE_DURATION = 1.3;
const NODE_DURATION = 0.7;

export function HeroTree() {
  const shouldReduceMotion = useReducedMotion();

  const getTransition = (duration: number, delay: number) =>
    shouldReduceMotion
      ? { duration: 0 }
      : { duration, delay, ease: "easeOut" as const };

  const nodeMotion = (delay: number) => ({
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: getTransition(NODE_DURATION, delay),
  });

  return (
    <svg
      viewBox="0 0 540 340"
      className="block h-auto w-full"
      role="img"
      aria-label="자료구조 문서가 트리로 정리된 예시"
    >
      <g
        fill="none"
        strokeWidth="2.5"
        strokeLinecap="round"
        className="stroke-landing-edge"
      >
        {EDGES.map(({ d, delay }) => (
          <motion.path
            key={d}
            d={d}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={getTransition(EDGE_DURATION, delay)}
          />
        ))}
      </g>

      <motion.g {...nodeMotion(0)}>
        <rect
          x="30"
          y="148"
          width="120"
          height="44"
          rx="22"
          className="fill-landing-ink"
        />
        <text
          x="90"
          y="176"
          textAnchor="middle"
          fontSize="15"
          fontWeight="700"
          className="fill-landing-on-brand"
        >
          자료구조
        </text>
      </motion.g>

      {BRANCHES.map(({ label, y, delay }) => (
        <motion.g key={label} {...nodeMotion(delay)}>
          <rect
            x="230"
            y={y}
            width="120"
            height="44"
            rx="22"
            className="fill-landing-brand"
          />
          <text
            x="290"
            y={y + 28}
            textAnchor="middle"
            fontSize="15"
            fontWeight="600"
            className="fill-landing-on-brand"
          >
            {label}
          </text>
        </motion.g>
      ))}

      {LEAVES.map(({ label, y, delay }) => (
        <motion.g key={label} {...nodeMotion(delay)}>
          <rect
            x="410"
            y={y}
            width="104"
            height="38"
            rx="19"
            className="fill-landing-leaf-soft stroke-landing-edge"
          />
          <text
            x="462"
            y={y + 24}
            textAnchor="middle"
            fontSize="14"
            fontWeight="600"
            className="fill-landing-brand-strong"
          >
            {label}
          </text>
        </motion.g>
      ))}
    </svg>
  );
}
