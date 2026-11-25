/*
시안의 스트로크 아이콘이다. 모두 장식이라 aria-hidden이고, 색은 부모의 글자색(currentColor)을 따른다.
*/
interface IconProps {
  size?: number;
  className?: string;
}

const strokeProps = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

export function UploadIcon({ size = 26, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      {...strokeProps}
    >
      <path d="M12 15V4M7 9l5-5 5 5M4 15v5h16v-5" />
    </svg>
  );
}

export function BranchIcon({ size = 26, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      {...strokeProps}
    >
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="18" cy="5" r="2.5" />
      <circle cx="18" cy="19" r="2.5" />
      <path d="M8.5 12h3c2 0 2-7 4-7M11.5 12c2 0 2 7 4 7" />
    </svg>
  );
}

export function PlayIcon({ size = 16, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
    >
      <path d="M7 4l13 8-13 8z" fill="currentColor" />
    </svg>
  );
}

export function PauseIcon({ size = 18, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
    >
      <path d="M6 4h4v16H6zM14 4h4v16h-4z" fill="currentColor" />
    </svg>
  );
}

export function CheckIcon({ size = 20, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      {...strokeProps}
      strokeWidth={2.5}
    >
      <path d="M5 12l5 5 9-10" />
    </svg>
  );
}

export function PencilIcon({ size = 22, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      {...strokeProps}
    >
      <path d="M4 20h4L19 9l-4-4L4 16z" />
    </svg>
  );
}

export function MemoIcon({ size = 22, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      {...strokeProps}
    >
      <path d="M5 3h10l4 4v14H5zM9 12h6M9 16h4" />
    </svg>
  );
}

export function SearchIcon({ size = 22, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      {...strokeProps}
    >
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-4-4" />
    </svg>
  );
}

export function ChevronLeftIcon({ size = 18, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      {...strokeProps}
      strokeWidth={2.5}
    >
      <path d="M15 5l-7 7 7 7" />
    </svg>
  );
}

export function ChevronRightIcon({ size = 18, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      {...strokeProps}
      strokeWidth={2.5}
    >
      <path d="M9 5l7 7-7 7" />
    </svg>
  );
}

export function ArrowRightIcon({ className }: IconProps) {
  return (
    <svg
      width="48"
      height="24"
      viewBox="0 0 48 24"
      aria-hidden="true"
      className={className}
      {...strokeProps}
      strokeWidth={3}
    >
      <path d="M2 12h40M34 4l8 8-8 8" />
    </svg>
  );
}
