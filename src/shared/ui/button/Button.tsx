import type { ButtonHTMLAttributes } from "react";

const variantStyles = {
  primary:
    "bg-accent text-on-accent shadow-control hover:bg-accent-hover disabled:bg-accent-disabled",
  secondary:
    "bg-surface-hover text-content-secondary hover:bg-surface-strong disabled:text-content-disabled",
  /*
  되돌릴 수 없는 작업에 쓴다. 채운 빨강은 다크 테마에서 흰 글자 대비가 모자라므로 옅은 바탕에 빨간 글자를 쓴다.
  */
  danger:
    "border border-danger-line bg-danger-subtle text-danger hover:border-danger disabled:border-line disabled:bg-surface-hover disabled:text-content-disabled",
} as const;

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variantStyles; // 버튼의 색상과 상태 스타일을 선택. 지정하지 않으면 secondary 사용
}

/*
함수 이름 : Button
기능 : 공통 버튼 스타일을 적용하고 HTML button의 속성을 실제 버튼 요소에 전달한다.
인자 : ButtonProps
반환값 : variant 스타일이 적용된 button 요소

사용 예시 :
<Button variant="primary" onClick={handleClick} disabled={isLoading}>
  저장
</Button>

className은 "ml-auto", "w-full"처럼 배치와 여백을 추가하는 용도로 사용한다.
기본 색상이나 크기를 변경해야 한다면 충돌하는 Tailwind 클래스를 전달하지 않고 variant를 확장한다.
*/
export function Button({
  variant = "secondary",
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      type={type}
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-control px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed ${variantStyles[variant]} ${className ?? ""}`}
    />
  );
}
