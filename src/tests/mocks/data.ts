import { NodeDTO } from "@/src/entities/tree/api/types";

export const RAW_TREE_DATA: NodeDTO[] = [
  { node_id: 1, title: "node 1", memo: null, parent_id: null, order_id: 0 },
  { node_id: 2, title: "node 2", memo: null, parent_id: 1, order_id: 1 },
  { node_id: 3, title: "node 3", memo: null, parent_id: 1, order_id: 6 },
  { node_id: 21, title: "node 2a", memo: null, parent_id: 2, order_id: 2 },
  { node_id: 22, title: "node 2b", memo: null, parent_id: 2, order_id: 3 },
  { node_id: 23, title: "node 2c", memo: null, parent_id: 2, order_id: 4 },
  { node_id: 24, title: "node 2d", memo: null, parent_id: 23, order_id: 5 },
  { node_id: 4, title: "node 4", memo: null, parent_id: null, order_id: 7 },
  { node_id: 5, title: "node 5", memo: null, parent_id: 4, order_id: 8 },
  { node_id: 6, title: "output", memo: null, parent_id: 5, order_id: 9 },
  { node_id: 7, title: "output", memo: null, parent_id: 5, order_id: 10 },
];

export const RAW_TREE_DATA_WITH_CYCLE: NodeDTO[] = [
  { node_id: 100, title: "Cycle 1", memo: null, parent_id: 101, order_id: 1 },
  { node_id: 101, title: "Cycle 2", memo: null, parent_id: 100, order_id: 2 },
];
