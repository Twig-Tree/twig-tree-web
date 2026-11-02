import { Handle, Position, type NodeProps } from "@xyflow/react";
import { AlertCircle, ChevronDown, LoaderCircle } from "lucide-react";
import type { WorkspaceLabNode } from "../model/types";

export function WorkspaceLabNode({ data }: NodeProps<WorkspaceLabNode>) {
  const state = data.state ?? "default";
  const isEditing = state === "editing" || state === "error";

  return (
    <div
      className="workspace-lab-node"
      data-state={state}
      data-root={data.isRoot || undefined}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="workspace-lab-handle"
        style={{ visibility: data.isRoot ? "hidden" : "visible" }}
      />

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

      <Handle
        type="source"
        position={Position.Bottom}
        className="workspace-lab-handle"
      />

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
