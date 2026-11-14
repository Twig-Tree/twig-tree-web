"use client";

import { Button } from "@/src/shared/ui/button";
import { showToast } from "@/src/shared/ui/toast";
import { resetSeenScenarios } from "../model/onboardingStore";

interface ResetOnboardingButtonProps {
  className?: string; // 배치와 여백. 예: 세로로 늘어나는 묶음 안에서 self-start
}

/*
함수 이름 : ResetOnboardingButton
기능 : 닫은 기능 안내를 모두 지워, 각 상황에 다시 도달하면 처음부터 안내가 보이게 한다. 사용자 테스트를 반복할 때 쓴다.
인자 : ResetOnboardingButtonProps
반환값 : 안내 다시 보기 버튼
*/
export function ResetOnboardingButton({
  className,
}: ResetOnboardingButtonProps) {
  const handleClick = () => {
    resetSeenScenarios();
    showToast({ message: "대시보드부터 안내가 다시 보입니다." });
  };

  return (
    <Button onClick={handleClick} className={className}>
      안내 다시 보기
    </Button>
  );
}
