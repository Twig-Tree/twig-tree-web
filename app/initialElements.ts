import { CustomEdgeType, type CustomNodeType } from "@/src/types/custom-node";

const position = { x: 0, y: 0 };

export const initialNodes: CustomNodeType[] = [
  {
    id: "1",
    type: "custom",
    data: { label: "node 1", isRoot: true },
    position,
  },
  {
    id: "2",
    type: "custom",
    data: { label: "node 2" },
    position,
  },
  {
    id: "2a",
    type: "custom",
    data: { label: "node 2a" },
    position,
  },
  {
    id: "2b",
    type: "custom",
    data: { label: "node 2b" },
    position,
  },
  {
    id: "2c",
    type: "custom",
    data: { label: "node 2c" },
    position,
  },
  {
    id: "2d",
    type: "custom",
    data: { label: "node 2d" },
    position,
  },
  {
    id: "3",
    type: "custom",
    data: { label: "node 3" },
    position,
  },
  {
    id: "4",
    type: "custom",
    data: { label: "node 4", isRoot: true },
    position,
  },
  {
    id: "5",
    type: "custom",
    data: { label: "node 5" },
    position,
  },
  {
    id: "6",
    type: "custom",
    data: { label: "output" },
    position,
  },
  { id: "7", type: "custom", data: { label: "output" }, position },
];

export const initialEdges: CustomEdgeType[] = [
  { id: "e12", type: "custom", source: "1", target: "2" },
  { id: "e13", type: "custom", source: "1", target: "3" },
  { id: "e22a", type: "custom", source: "2", target: "2a" },
  { id: "e22b", type: "custom", source: "2", target: "2b" },
  { id: "e22c", type: "custom", source: "2", target: "2c" },
  { id: "e2c2d", type: "custom", source: "2c", target: "2d" },
  { id: "e45", type: "custom", source: "4", target: "5" },
  { id: "e56", type: "custom", source: "5", target: "6" },
  { id: "e57", type: "custom", source: "5", target: "7" },
];
