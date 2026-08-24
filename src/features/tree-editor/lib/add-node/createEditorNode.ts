import { CustomEditorNode } from "../../model/types";

type CreateEditorNodeParams = {
  clientId: string; // 편집기가 정한 노드 신원, React Flow의 Node.id가 된다
  serverId: string | null; // 서버가 확정한 노드 ID, 저장 전이면 null
  label: string;
  orderIndex: number;
  x: number;
  y: number;
};

/*
함수 이름 : createEditorNode
기능 : editor store에 넣을 React Flow 노드를 만든다. 서버 저장 전에 만들어지는 노드도 있으므로
serverId를 인자로 받아 저장 여부를 노드 자신이 들고 있게 한다.
인자 : CreateEditorNodeParams
반환값 : React Flow 노드
*/
export const createEditorNode = ({
  clientId,
  serverId,
  label,
  orderIndex,
  x,
  y,
}: CreateEditorNodeParams): CustomEditorNode => {
  return {
    id: clientId,
    type: "custom",
    data: {
      serverId,
      label,
      orderIndex,
      memo: null, // 새 노드는 메모 없이 만들어진다.
    },
    position: {
      x,
      y,
    },
  };
};
