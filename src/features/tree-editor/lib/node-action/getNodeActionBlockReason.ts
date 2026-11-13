import { type NodeNameEditorLocation } from "../../model/sync/editingStore";
import { type NodeActionId } from "../shortcuts/nodeActionShortcuts";

const NAME_EDITING_ELSEWHERE_MESSAGES: Record<NodeNameEditorLocation, string> =
  {
    canvas: "캔버스에서 이름을 편집하는 중입니다.",
    panel: "메모 패널에서 이름을 편집하는 중입니다.",
  };

type GetNodeActionBlockReasonParams = {
  actionId: NodeActionId; // 실행하려는 동작
  isRoot: boolean; // 대상 노드가 루트인지
  isSaved: boolean; // 대상 노드가 서버에 저장되어 serverId가 있는지
  isMutating: boolean; // 노드 추가·삭제·이동이나 undo/redo 요청을 처리하는 중인지
  nameEditorLocation?: NodeNameEditorLocation | null; // 대상 노드의 이름 입력창이 다른 곳에 열려 있으면 그곳. 없으면 null
};

/*
함수 이름 : getNodeActionBlockReason
기능 : 노드에 동작을 실행할 수 없는 이유를 돌려준다. 버튼과 단축키가 handler를 부르기 전에 막고 툴팁에 이유를 보여 주는 데 쓴다.
인자 : GetNodeActionBlockReasonParams
반환값 : 막힌 이유 문구, 실행할 수 있으면 null

handler도 같은 조건에서 alert을 띄우고 멈추지만, 버튼을 누른 뒤에 알게 되는 것보다 누르기 전에 이유가 보이는 편이 낫다.
요청 중에는 구조 편집만 막는다. 제목 편집과 메모는 구조 편집 요청과 함께 진행해도 서로 덮어쓰지 않는다(actions README의 "실패 복구 규칙").
한 노드의 이름 입력창은 하나만 열므로, 다른 곳에 열려 있으면 이름 편집을 막는다. 노드 아래 버튼과 메모 패널 제목이 함께 쓴다.
*/
export const getNodeActionBlockReason = ({
  actionId,
  isRoot,
  isSaved,
  isMutating,
  nameEditorLocation = null,
}: GetNodeActionBlockReasonParams): string | null => {
  if (actionId === "openMemo") return null;

  if (actionId === "rename" && nameEditorLocation !== null) {
    return NAME_EDITING_ELSEWHERE_MESSAGES[nameEditorLocation];
  }

  if (actionId === "delete" && isRoot) return "루트 노드는 삭제할 수 없습니다.";

  if (!isSaved) return "아직 서버에 저장되지 않은 노드입니다.";

  if (actionId !== "rename" && isMutating) {
    return "다른 편집을 저장하는 중입니다.";
  }

  return null;
};
