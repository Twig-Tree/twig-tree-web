import { BaseTreeEdge, BaseTreeNode } from "@/src/domains/tree/types";

const position = { x: 0, y: 0 };

export const RAW_TREE_NODE_DATA: BaseTreeNode[] = [
  {
    id: "1",
    data: { label: "node 1", isRoot: true, order_index: 0 },
    position,
  },
  {
    id: "2",
    data: { label: "node 2", order_index: 1 },
    position,
  },
  {
    id: "2a",
    data: { label: "node 2a", order_index: 2 },
    position,
  },
  {
    id: "2b",
    data: { label: "node 2b", order_index: 3 },
    position,
  },
  {
    id: "2c",
    data: { label: "node 2c", order_index: 4 },
    position,
  },
  {
    id: "2d",
    data: { label: "node 2d", order_index: 5 },
    position,
  },
  {
    id: "3",
    data: { label: "node 3", order_index: 6 },
    position,
  },
  {
    id: "4",
    data: { label: "node 4", isRoot: true, order_index: 7 },
    position,
  },
  {
    id: "5",
    data: { label: "node 5", order_index: 8 },
    position,
  },
  {
    id: "6",
    data: { label: "output", order_index: 9 },
    position,
  },
  {
    id: "7",
    data: { label: "output", order_index: 10 },
    position,
  },
];

export const RAW_TREE_EDGE_DATA: BaseTreeEdge[] = [
  { id: "e12", source: "1", target: "2" },
  { id: "e13", source: "1", target: "3" },
  { id: "e22a", source: "2", target: "2a" },
  { id: "e22b", source: "2", target: "2b" },
  { id: "e22c", source: "2", target: "2c" },
  { id: "e2c2d", source: "2c", target: "2d" },
  { id: "e45", source: "4", target: "5" },
  { id: "e56", source: "5", target: "6" },
  { id: "e57", source: "5", target: "7" },
];
