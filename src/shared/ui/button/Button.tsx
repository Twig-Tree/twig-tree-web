import type { ButtonHTMLAttributes } from "react";

const variantStyles = {
  primary:
    "bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 disabled:bg-indigo-300",
  secondary:
    "bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:text-slate-400",
} as const;

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variantStyles; // 버튼의 색상과 상태 스타일을 선택. 지정하지 않으면 secondary 사용
}

/*
함수 이름 : Button
기능 : 공통 버튼 스타일을 적용하고 HTML button의 속성을 실제 버튼 요소에 전달한다.
인자 : ButtonProps
반환값 : primary 또는 secondary 스타일이 적용된 button 요소

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
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed ${variantStyles[variant]} ${className ?? ""}`}
    />
  );
}
