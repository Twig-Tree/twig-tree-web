"use client";

import { useState } from "react";
import { Button } from "@/src/shared/ui/button";
import { WithdrawConfirmModal } from "./WithdrawConfirmModal";

interface WithdrawButtonProps {
  className?: string; // 배치와 여백. 예: 세로로 늘어나는 묶음 안에서 self-start
}

/*
함수 이름 : WithdrawButton
기능 : 회원 탈퇴 확인 모달을 여는 버튼을 그리고, 모달의 열림 상태를 관리한다.
인자 : WithdrawButtonProps
반환값 : 회원 탈퇴 버튼과 확인 모달
*/
export function WithdrawButton({ className }: WithdrawButtonProps) {
  /*
  모달 상태는 이 버튼이 있는 설정 페이지와 함께 사라진다.
  탈퇴에 성공하면 로그인 화면으로 넘어가 페이지가 언마운트되므로, 다시 로그인해도 모달이 열린 채로 남지 않는다.
  */
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Button
        variant="danger"
        onClick={() => setIsModalOpen(true)}
        className={className}
      >
        회원 탈퇴
      </Button>
      <WithdrawConfirmModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
