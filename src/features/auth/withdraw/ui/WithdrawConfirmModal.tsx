"use client";

import { Button } from "@/src/shared/ui/button";
import { Modal } from "@/src/shared/ui/modal";
import { useWithdraw } from "../model/useWithdraw";

interface WithdrawConfirmModalProps {
  isOpen: boolean; // 모달 표시 여부
  onClose: () => void; // 취소, Escape, 바깥 클릭으로 닫기를 요청했을 때 실행할 callback
}

/*
함수 이름 : WithdrawConfirmModal
기능 : 회원 탈퇴가 되돌릴 수 없다는 사실을 알리고, 확인하면 탈퇴를 실행한다.
인자 : WithdrawConfirmModalProps
반환값 : 회원 탈퇴 확인 모달
*/
export function WithdrawConfirmModal({
  isOpen,
  onClose,
}: WithdrawConfirmModalProps) {
  const { withdraw, isWithdrawing, isWithdrawFailed, resetWithdrawState } =
    useWithdraw();

  /*
  요청 중에 닫으면 결과를 알릴 곳이 사라진다. 성공하면 화면이 로그인으로 넘어가므로 그때까지 막는다.
  닫을 때 실패 상태를 지워, 다시 열었을 때 지난 실패 문구가 남지 않게 한다.
  */
  const handleClose = () => {
    if (isWithdrawing) return;

    resetWithdrawState();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="회원 탈퇴">
      <div className="flex flex-col">
        <div className="px-5 pt-5 pb-4">
          <h2 className="text-xl font-bold tracking-tight text-content">
            회원 탈퇴
          </h2>
          <p className="mt-3 text-sm leading-relaxed break-keep text-content-secondary">
            탈퇴하면 모든 폴더, 워크스페이스, 트리가 바로 삭제되며 복구할 수
            없습니다. 같은 구글 계정으로 다시 로그인하면 새 계정으로 시작합니다.
          </p>
        </div>

        {isWithdrawFailed ? (
          <p
            role="alert"
            className="mx-5 mb-4 rounded-control bg-danger-subtle px-3.5 py-2.5 text-sm font-medium text-danger"
          >
            탈퇴하지 못했습니다. 잠시 후 다시 시도해 주세요.
          </p>
        ) : null}

        <div className="flex items-center justify-end gap-3 border-t border-line-subtle bg-surface-muted px-5 py-3.5">
          <Button onClick={handleClose} disabled={isWithdrawing}>
            취소
          </Button>
          <Button
            variant="danger"
            onClick={() => void withdraw()}
            disabled={isWithdrawing}
          >
            {isWithdrawing ? "탈퇴하는 중..." : "탈퇴하기"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
