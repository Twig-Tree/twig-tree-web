/*
히어로의 예시 트리다. 좌표는 시안의 540×340 캔버스 기준이다.
*/
const EDGES = [
  "M150 170 C190 170 190 95 230 95",
  "M150 170 C190 170 190 245 230 245",
  "M350 95 C380 95 380 55 410 55",
  "M350 95 C380 95 380 135 410 135",
  "M350 245 C380 245 380 205 410 205",
  "M350 245 C380 245 380 285 410 285",
];

const BRANCHES = [
  { label: "선형 구조", y: 73 },
  { label: "비선형 구조", y: 223 },
];

const LEAVES = [
  { label: "스택", y: 36 },
  { label: "큐", y: 116 },
  { label: "트리", y: 186 },
  { label: "그래프", y: 266 },
];

export function HeroTree() {
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
        {EDGES.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>

      <g>
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
      </g>

      {BRANCHES.map(({ label, y }) => (
        <g key={label}>
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
        </g>
      ))}

      {LEAVES.map(({ label, y }) => (
        <g key={label}>
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
        </g>
      ))}
    </svg>
  );
}
