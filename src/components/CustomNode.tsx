import { Handle, Node, NodeProps, Position } from "@xyflow/react";

export type CustomNode = Node<{ label: string }, "custom">;

export function CustomNode({
  data,
  targetPosition,
  sourcePosition,
}: NodeProps<CustomNode>) {
  return (
    <div className="custom-node">
      <Handle
        type="target"
        position={targetPosition ?? Position.Top}
        id="input"
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
