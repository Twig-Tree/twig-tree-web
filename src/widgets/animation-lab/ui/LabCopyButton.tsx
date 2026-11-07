import { useState } from "react";
import { Button } from "@/src/shared/ui/button";

type LabCopyButtonProps = {
  label: string; // 버튼 이름. 예: "대본 복사"
  text: string | null; // 복사할 내용. null이면 복사할 것이 없어 버튼을 끈다
};

/*
함수 이름 : LabCopyButton
기능 : 내용을 클립보드에 복사하고, 결과를 잠시 버튼 이름으로 알린다.
인자 : LabCopyButtonProps
반환값 : 복사 버튼
*/
export function LabCopyButton({ label, text }: LabCopyButtonProps) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");

  const handleCopy = async () => {
    if (text === null) return;

    try {
      await navigator.clipboard.writeText(text);
      setStatus("copied");
    } catch {
      setStatus("failed"); // 권한이 없거나 창에 포커스가 없으면 실패한다
    }

    window.setTimeout(() => setStatus("idle"), 1200);
  };

  return (
    <Button
      className="!h-8 !px-3 text-xs"
      disabled={text === null}
      onClick={() => void handleCopy()}
    >
      {status === "copied"
        ? "복사됨"
        : status === "failed"
          ? "복사 실패"
          : label}
    </Button>
  );
}
