import { describe, expect, it } from "vitest";
import { getNodeActionBlockReason } from "./getNodeActionBlockReason";

const SAVED_CHILD = { isRoot: false, isSaved: true, isMutating: false };

describe("getNodeActionBlockReason", () => {
  it("저장된 자식 노드는 모든 동작을 실행할 수 있다", () => {
    (["openMemo", "addChild", "rename", "delete"] as const).forEach(
      (actionId) => {
        expect(
          getNodeActionBlockReason({ actionId, ...SAVED_CHILD }),
        ).toBeNull();
      },
    );
  });

  it("루트는 삭제만 막고 자식 추가는 연다", () => {
    const root = { ...SAVED_CHILD, isRoot: true };

    expect(getNodeActionBlockReason({ actionId: "delete", ...root })).toBe(
      "루트 노드는 삭제할 수 없습니다.",
    );
    expect(
      getNodeActionBlockReason({ actionId: "addChild", ...root }),
    ).toBeNull();
  });

  /*
  serverId가 없으면 추가할 자식의 parentId, 지울 노드, 고칠 노드를 서버에 알려 줄 수 없다.
  */
  it("저장 전 노드는 메모 열기만 연다", () => {
    const unsaved = { ...SAVED_CHILD, isSaved: false };

    expect(
      getNodeActionBlockReason({ actionId: "openMemo", ...unsaved }),
    ).toBeNull();
    (["addChild", "rename", "delete"] as const).forEach((actionId) => {
      expect(getNodeActionBlockReason({ actionId, ...unsaved })).toBe(
        "아직 서버에 저장되지 않은 노드입니다.",
      );
    });
  });

  it("요청 중에는 자식 추가와 삭제만 막는다", () => {
    const mutating = { ...SAVED_CHILD, isMutating: true };

    expect(
      getNodeActionBlockReason({ actionId: "addChild", ...mutating }),
    ).toBe("다른 편집을 저장하는 중입니다.");
    expect(getNodeActionBlockReason({ actionId: "delete", ...mutating })).toBe(
      "다른 편집을 저장하는 중입니다.",
    );
    expect(
      getNodeActionBlockReason({ actionId: "rename", ...mutating }),
    ).toBeNull();
    expect(
      getNodeActionBlockReason({ actionId: "openMemo", ...mutating }),
    ).toBeNull();
  });

  /*
  요청이 끝나도 루트는 지울 수 없으므로, 잠시 뒤 풀리는 이유보다 계속 남는 이유를 보여 준다.
  */
  it("여러 이유가 겹치면 요청이 끝나도 남는 이유를 먼저 보여 준다", () => {
    expect(
      getNodeActionBlockReason({
        actionId: "delete",
        isRoot: true,
        isSaved: true,
        isMutating: true,
      }),
    ).toBe("루트 노드는 삭제할 수 없습니다.");
  });

  /*
  한 노드의 이름 입력창은 하나만 연다. 저장 전 노드여도 다른 곳에서 입력 중이라는 이유가 먼저다.
  */
  it("다른 곳에서 이름을 편집 중이면 이름 편집만 막고 그곳을 알려 준다", () => {
    expect(
      getNodeActionBlockReason({
        actionId: "rename",
        ...SAVED_CHILD,
        nameEditorLocation: "panel",
      }),
    ).toBe("메모 패널에서 이름을 편집하는 중입니다.");
    expect(
      getNodeActionBlockReason({
        actionId: "rename",
        ...SAVED_CHILD,
        isSaved: false,
        nameEditorLocation: "canvas",
      }),
    ).toBe("캔버스에서 이름을 편집하는 중입니다.");
    (["openMemo", "addChild", "delete"] as const).forEach((actionId) => {
      expect(
        getNodeActionBlockReason({
          actionId,
          ...SAVED_CHILD,
          nameEditorLocation: "panel",
        }),
      ).toBeNull();
    });
  });
});
