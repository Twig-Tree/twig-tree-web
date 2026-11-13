import { type ToolbarVisibility } from "./config";
import { type NodeActionEntry } from "./nodeActions";

type GetToolbarTargetsParams = {
  visibility: ToolbarVisibility; // 노드 옆 버튼이 보이는 때
  hoveredClientId: string | null; // 마우스가 올라간 노드
  selectedClientId: string | null; // 하나만 선택된 노드. 여럿이거나 없으면 null
  renamingClientId: string | null; // 이름 입력창이 열린 노드. 버튼이 입력창을 가리지 않게 뺀다
};

export type ToolbarTarget = {
  clientId: string;
  entry: Extract<NodeActionEntry, "hoverToolbar" | "selectedToolbar">; // 버튼이 보인 이유. 실행 기록의 진입점이 된다
};

/*
함수 이름 : getToolbarTargets
기능 : 노드 옆 버튼을 붙일 노드와 그 버튼이 보인 이유를 정한다. 선택된 노드와 마우스가 올라간 노드가 같으면 선택으로 본다.
인자 : GetToolbarTargetsParams
반환값 : 버튼을 붙일 노드 목록. 선택된 노드가 먼저 온다
*/
export const getToolbarTargets = ({
  visibility,
  hoveredClientId,
  selectedClientId,
  renamingClientId,
}: GetToolbarTargetsParams): ToolbarTarget[] => {
  const targets: ToolbarTarget[] = [];
  const showsSelected =
    visibility === "selected" || visibility === "hoverOrSelected";
  const showsHovered =
    visibility === "hover" || visibility === "hoverOrSelected";

  if (showsSelected && selectedClientId !== null) {
    targets.push({ clientId: selectedClientId, entry: "selectedToolbar" });
  }

  if (
    showsHovered &&
    hoveredClientId !== null &&
    !targets.some((target) => target.clientId === hoveredClientId)
  ) {
    targets.push({ clientId: hoveredClientId, entry: "hoverToolbar" });
  }

  return targets.filter((target) => target.clientId !== renamingClientId);
};
