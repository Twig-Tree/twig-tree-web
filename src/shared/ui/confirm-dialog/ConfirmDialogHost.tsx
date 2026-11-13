"use client";

import { Button } from "../button";
import { Modal } from "../modal";
import { useConfirmDialogStore } from "./confirmDialogStore";

/*
함수 이름 : ConfirmDialogHost
기능 : requestConfirm으로 연 확인 요청을 모달로 표시하고, 사용자의 답을 요청한 쪽에 돌려준다. 앱에 한 번만 배치한다.
인자 : 없음
반환값 : 확인 모달

취소 버튼을 확인 버튼보다 앞에 둔다. showModal은 열릴 때 처음 만나는 버튼에 focus를 주므로,
되돌릴 수 없는 작업이 Enter 한 번에 실행되지 않는다.
Esc와 바깥 클릭은 취소와 같다. 답 없이 닫히면 요청한 쪽이 다음 단계로 가지 못한다.
*/
export function ConfirmDialogHost() {
  const request = useConfirmDialogStore((state) => state.request);
  const settleConfirm = useConfirmDialogStore((state) => state.settleConfirm);

  const handleCancel = () => {
    if (request) settleConfirm(request.id, false);
  };

  return (
    <Modal
      isOpen={request !== null}
      onClose={handleCancel}
      title={request?.title ?? ""}
      widthClassName="max-w-sm"
    >
      {request ? (
        <div className="flex flex-col">
          <div className="px-5 pt-5 pb-4">
            <h2 className="text-base font-semibold text-content">
              {request.title}
            </h2>
            {request.description ? (
              <p className="mt-2 text-sm leading-relaxed whitespace-pre-line text-content-secondary">
                {request.description}
              </p>
            ) : null}
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-line-subtle bg-surface-muted px-5 py-3.5">
            <Button onClick={handleCancel}>취소</Button>
            <Button
              variant={request.tone === "danger" ? "danger" : "primary"}
              onClick={() => settleConfirm(request.id, true)}
            >
              {request.confirmLabel}
            </Button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
