import { Handle, NodeProps, Position } from "@xyflow/react";
import { CustomEditorNode } from "@/src/features/editor/types";

export function CustomNode({
  data,
  targetPosition,
  sourcePosition,
}: NodeProps<CustomEditorNode>) {
  const isRoot = data.isRoot ?? false;

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
