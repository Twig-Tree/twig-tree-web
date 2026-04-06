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
      {!isRoot && (
        <Handle
          type="target"
          position={targetPosition ?? Position.Top}
          id="input"
        />
      )}
      <label htmlFor="text">{data.label}</label>
      <Handle
        type="source"
        position={sourcePosition ?? Position.Bottom}
        id="output"
      />
    </div>
  );
}
