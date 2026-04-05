import { Handle, Node, NodeProps, Position } from "@xyflow/react";

export type CustomNode = Node<{ label: string }, "custom">;

export function CustomNode({ data }: NodeProps<CustomNode>) {
  return (
    <div className="custom-node">
      <Handle type="target" position={Position.Left} id="input" />
      <label htmlFor="text">{data.label}</label>
      <Handle type="source" position={Position.Right} id="output" />
    </div>
  );
}
