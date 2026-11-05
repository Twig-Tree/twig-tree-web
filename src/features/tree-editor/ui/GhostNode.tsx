import { Handle, NodeProps, Position } from "@xyflow/react";
import { CustomEditorNode } from "@/src/features/tree-editor/model/types";

/*
함수 이름 : GhostNode
기능 : 접혀서 사라지는 노드의 모습만 그린다. 실제 노드는 이미 데이터에서 빠졌으므로 편집과 접기 버튼을 두지 않고 store도 읽지 않는다.
테두리와 바탕은 React Flow가 감싸는 바깥 요소가 그려 실제 노드와 같게 보인다. 핸들은 실제 노드에도 보이는 점이라 모습을 맞추려고 둔다.
인자 : NodeProps<CustomEditorNode>
반환값 : 더미 노드
*/
export function GhostNode({
  data,
  targetPosition,
  sourcePosition,
}: NodeProps<CustomEditorNode>) {
  return (
    <div className="custom-node">
      <Handle
        type="target"
        position={targetPosition ?? Position.Top}
        id="input"
        isConnectable={false}
      />
      <span>{data.label}</span>
      <Handle
        type="source"
        position={sourcePosition ?? Position.Bottom}
        id="output"
        isConnectable={false}
      />
    </div>
  );
}
