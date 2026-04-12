import { Handle, Node, NodeProps, Position } from "@xyflow/react";

export type CustomNode = Node<{ label: string; isRoot?: boolean }, "custom">;

export function CustomNode({
  data,
  targetPosition,
  sourcePosition,
}: NodeProps<CustomNode>) {
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
