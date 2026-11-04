import {
  BaseEdge,
  getBezierPath,
  getSmoothStepPath,
  getStraightPath,
  type EdgeProps,
} from "@xyflow/react";
import {
  getWorkspaceLabEdgeColor,
  getWorkspaceLabEdgeEffect,
  getWorkspaceLabEdgeLineStyle,
  getWorkspaceLabEdgeMarker,
  getWorkspaceLabEdgeOpacity,
  getWorkspaceLabEdgePattern,
  getWorkspaceLabEdgeThickness,
} from "../model/edge-styles";
import type { WorkspaceLabEdge } from "../model/types";
import { workspaceLabSmoothStepRouting } from "../model/edge-routing";

export function WorkspaceLabEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}: EdgeProps<WorkspaceLabEdge>) {
  const pathParams = {
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  };
  const lineStyle = getWorkspaceLabEdgeLineStyle(data?.lineStyle ?? "layout");
  const pattern = getWorkspaceLabEdgePattern(data?.pattern ?? "solid");
  const thickness = getWorkspaceLabEdgeThickness(data?.thickness ?? "regular");
  const color = getWorkspaceLabEdgeColor(data?.color ?? "theme");
  const opacity = getWorkspaceLabEdgeOpacity(data?.opacity ?? "full");
  const effect = getWorkspaceLabEdgeEffect(data?.effect ?? "none");
  const marker = getWorkspaceLabEdgeMarker(data?.marker ?? "arrow-closed");
  const state = data?.state ?? "default";
  const effectiveLineStyle =
    lineStyle.id === "layout"
      ? data?.path === "bezier"
        ? "curved"
        : "rounded"
      : lineStyle.id;
  const [path] = (() => {
    switch (effectiveLineStyle) {
      case "straight":
        return getStraightPath(pathParams);
      case "orthogonal":
        return getSmoothStepPath({
          ...pathParams,
          borderRadius: 0,
          offset: workspaceLabSmoothStepRouting.offset,
        });
      case "curved":
        return getBezierPath(pathParams);
      case "rounded":
      default:
        return getSmoothStepPath({
          ...pathParams,
          borderRadius: workspaceLabSmoothStepRouting.borderRadius,
          offset: workspaceLabSmoothStepRouting.offset,
        });
    }
  })();
  const strokeColor =
    state === "active"
      ? "var(--lab-accent)"
      : state === "traced"
        ? "var(--lab-lecture)"
        : color.value;
  const strokeWidth = Math.max(
    thickness.width,
    state === "traced" ? 3 : state === "active" ? 2.5 : 0,
  );
  const strokeDasharray = state === "traced" ? "9 7" : pattern.dashArray;
  const filters = [
    effect.id === "shadow"
      ? "drop-shadow(0 2px 2px color-mix(in srgb, var(--lab-node-text) 24%, transparent))"
      : null,
    state === "traced"
      ? "drop-shadow(0 0 3px color-mix(in srgb, var(--lab-lecture) 55%, transparent))"
      : null,
  ].filter(Boolean);
  const safeId = id.replace(/[^a-zA-Z0-9_-]/g, "-");
  const gradientId = `workspace-lab-edge-fade-${safeId}`;
  const markerId = `workspace-lab-edge-marker-${safeId}`;

  /*
  끝 모양은 선 두께에 맞춰 키우되, 윤곽선은 10×10 좌표계를 늘린 만큼 줄여 화면에서 선과 같은 굵기로 보이게 한다.
  fade 효과의 그라디언트는 끝까지 이어지지 않으므로 끝 모양은 늘 단색으로 칠한다.
  */
  const markerSize = 8 + strokeWidth * 2.4;
  const markerStrokeWidth = (strokeWidth * 10) / markerSize;
  const markerFill =
    marker.fill === "stroke"
      ? strokeColor
      : marker.fill === "canvas"
        ? "var(--lab-canvas)"
        : "none";
  const edgeStyle = {
    stroke: effect.id === "fade" ? `url(#${gradientId})` : strokeColor,
    strokeWidth,
    strokeOpacity: opacity.value,
    strokeDasharray,
    strokeLinecap: pattern.lineCap,
    filter: filters.length > 0 ? filters.join(" ") : undefined,
  } as const;

  return (
    <>
      {marker.d ? (
        <defs>
          <marker
            id={markerId}
            viewBox="0 0 10 10"
            refX={marker.refX}
            refY={5}
            markerWidth={markerSize}
            markerHeight={markerSize}
            markerUnits="userSpaceOnUse"
            orient="auto-start-reverse"
          >
            <path
              d={marker.d}
              style={{
                fill: markerFill,
                stroke: strokeColor,
                strokeWidth: markerStrokeWidth,
                strokeLinecap: "round",
                strokeLinejoin: "round",
                opacity: opacity.value,
              }}
            />
          </marker>
        </defs>
      ) : null}
      {effect.id === "fade" ? (
        <defs>
          <linearGradient
            id={gradientId}
            gradientUnits="userSpaceOnUse"
            x1={sourceX}
            y1={sourceY}
            x2={targetX}
            y2={targetY}
          >
            <stop offset="0%" stopColor={strokeColor} stopOpacity="0.16" />
            <stop offset="100%" stopColor={strokeColor} stopOpacity="1" />
          </linearGradient>
        </defs>
      ) : null}
      {effect.id === "contrast" ? (
        <path
          d={path}
          fill="none"
          stroke="var(--lab-canvas)"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokeWidth + 4}
          className="workspace-lab-edge__contrast"
          aria-hidden="true"
        />
      ) : null}
      <BaseEdge
        id={id}
        path={path}
        markerEnd={marker.d ? `url(#${markerId})` : undefined}
        className="workspace-lab-edge"
        style={edgeStyle}
        data-state={state}
        data-line-style={lineStyle.id}
        data-pattern={pattern.id}
        data-thickness={thickness.id}
        data-color={color.id}
        data-opacity={opacity.id}
        data-effect={effect.id}
        data-marker={marker.id}
      />
    </>
  );
}
