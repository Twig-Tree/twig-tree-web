import { Handle, Position, type NodeProps } from "@xyflow/react";
import { AlertCircle, ChevronDown, LoaderCircle } from "lucide-react";
import type { WorkspaceLabNode } from "../model/types";

export function WorkspaceLabNode({ data }: NodeProps<WorkspaceLabNode>) {
  const state = data.state ?? "default";
  const isEditing = state === "editing" || state === "error";
  const layoutMode = data.layoutMode ?? "vertical";
  const activeTargetPosition =
    layoutMode === "horizontal" ? Position.Left : Position.Top;
  const activeSourcePosition =
    layoutMode === "horizontal" ? Position.Right : Position.Bottom;
  const positions = [
    Position.Top,
    Position.Right,
    Position.Bottom,
    Position.Left,
  ];

  return (
    <div
      className="workspace-lab-node"
      data-state={state}
      data-root={data.isRoot || undefined}
      data-layout={layoutMode}
      data-shape={data.nodeShape ?? "rounded"}
      data-collapse-control={data.collapseControlStyle ?? "floating"}
    >
      {positions.map((position) => (
        <Handle
          key={`target-${position}`}
          id={`target-${position}`}
          type="target"
          position={position}
          className="workspace-lab-handle"
          style={{
            visibility:
              layoutMode !== "radial" &&
              position === activeTargetPosition &&
              !data.isRoot
                ? "visible"
                : "hidden",
          }}
        />
      ))}

      <div className="workspace-lab-node__content">
        {isEditing ? (
          <label className="workspace-lab-node__editor">
            <span className="sr-only">노드 제목</span>
            <input
              value={data.label}
              readOnly
              aria-invalid={state === "error"}
              className="nodrag nopan"
            />
            {state === "error" ? (
              <span className="workspace-lab-node__error">
                <AlertCircle aria-hidden="true" /> 제목을 확인해 주세요.
              </span>
            ) : null}
          </label>
        ) : (
          <>
            <span className="workspace-lab-node__label">{data.label}</span>
            {data.description ? (
              <span className="workspace-lab-node__description">
                {data.description}
              </span>
            ) : null}
          </>
        )}

        {state === "loading" ? (
          <LoaderCircle
            className="workspace-lab-node__spinner"
            aria-label="저장 중"
          />
        ) : null}
      </div>

      {positions.map((position) => (
        <Handle
          key={`source-${position}`}
          id={`source-${position}`}
          type="source"
          position={position}
          className="workspace-lab-handle"
          style={{
            visibility:
              layoutMode !== "radial" && position === activeSourcePosition
                ? "visible"
                : "hidden",
          }}
        />
      ))}

      {data.hasChildren ? (
        <button
          type="button"
          className="nodrag nopan workspace-lab-node__collapse"
          aria-label={
            state === "collapsed" ? "하위 노드 펼치기" : "하위 노드 접기"
          }
        >
          <ChevronDown aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}
