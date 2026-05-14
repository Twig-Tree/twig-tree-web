import { Handle, NodeProps, Position } from "@xyflow/react";
import { CustomEditorNode } from "@/src/features/tree-editor/model/types";

export function CustomNode({
  data,
  parentId,
  targetPosition,
  sourcePosition,
}: NodeProps<CustomEditorNode>) {
  const isRoot = parentId === null;

  return (
    <div className="custom-node">
      <Handle
        type="target"
        position={targetPosition ?? Position.Top}
        id="input"
        style={{ visibility: isRoot ? "hidden" : "visible" }}
      />
      <label htmlFor="text">{data.label}</label>
      <Handle
        type="source"
        position={sourcePosition ?? Position.Bottom}
        id="output"
      />
    </div>
  );
}
