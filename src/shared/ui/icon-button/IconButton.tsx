import type { ButtonHTMLAttributes } from "react";

const variantStyles = {
  ghost:
    "text-slate-500 hover:bg-slate-100 hover:text-slate-800 disabled:text-slate-300 disabled:hover:bg-transparent",
  primary:
    "bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 disabled:bg-indigo-300",
} as const;

const sizeStyles = {
  sm: "h-8 w-8 [&_svg]:size-4",
  md: "h-10 w-10 [&_svg]:size-5",
} as const;

export interface IconButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "aria-label"> {
  "aria-label": string; // 아이콘만 있는 버튼이므로 스크린 리더용 이름을 반드시 지정한다
  size?: keyof typeof sizeStyles; // 버튼과 내부 아이콘의 크기. 지정하지 않으면 md 사용
  variant?: keyof typeof variantStyles; // 버튼의 색상과 상태 스타일을 선택. 지정하지 않으면 ghost 사용
}

/*
함수 이름 : IconButton
기능 : 아이콘 하나만 담는 정사각 버튼 스타일을 적용하고 HTML button의 속성을 실제 버튼 요소에 전달한다.
인자 : IconButtonProps
반환값 : 내부 svg 크기까지 size에 맞춰 조정된 button 요소

사용 예시 :
<IconButton aria-label="파일 첨부" onClick={handleAttach}>
  <Paperclip />
</IconButton>

아이콘에는 크기 class를 직접 지정하지 않는다. size prop이 내부 svg 크기까지 함께 결정한다.
텍스트를 함께 보여줘야 한다면 IconButton 대신 Button을 사용한다.
*/
export function IconButton({
  size = "md",
  variant = "ghost",
  className,
  type = "button",
  ...props
}: IconButtonProps) {
  return (
    <button
      {...props}
      type={type}
      className={`inline-flex shrink-0 items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed ${sizeStyles[size]} ${variantStyles[variant]} ${className ?? ""}`}
    />
  );
}
