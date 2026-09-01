import { NodeDTO } from "@/src/entities/tree/api/types";
import { WorkspaceDTO } from "@/src/entities/workspace/api/types";

export const RAW_TREE_DATA: NodeDTO[] = [
  { nodeId: 1, name: "node 1", memo: null, parentId: null, orderId: 0 },
  { nodeId: 2, name: "node 2", memo: null, parentId: 1, orderId: 1 },
  { nodeId: 3, name: "node 3", memo: null, parentId: 1, orderId: 6 },
  { nodeId: 21, name: "node 2a", memo: null, parentId: 2, orderId: 2 },
  { nodeId: 22, name: "node 2b", memo: null, parentId: 2, orderId: 3 },
  { nodeId: 23, name: "node 2c", memo: null, parentId: 2, orderId: 4 },
  { nodeId: 24, name: "node 2d", memo: null, parentId: 23, orderId: 5 },
  { nodeId: 4, name: "node 4", memo: null, parentId: null, orderId: 7 },
  { nodeId: 5, name: "node 5", memo: null, parentId: 4, orderId: 8 },
  { nodeId: 6, name: "output", memo: null, parentId: 5, orderId: 9 },
  { nodeId: 7, name: "output", memo: null, parentId: 5, orderId: 10 },
];

export const RAW_TREE_DATA_WITH_CYCLE: NodeDTO[] = [
  { nodeId: 100, name: "Cycle 1", memo: null, parentId: 101, orderId: 1 },
  { nodeId: 101, name: "Cycle 2", memo: null, parentId: 100, orderId: 2 },
];

/*
폴더에 속하지 않은 것과 특정 폴더에 든 것을 함께 두어, folderId 쿼리 파라미터가
제대로 실려 나가는지 핸들러가 걸러내는 것으로 확인할 수 있게 한다.
*/
export const RAW_WORKSPACE_DATA: WorkspaceDTO[] = [
  {
    workspaceId: 1,
    name: "Root Workspace",
    folderId: null,
    updatedAt: "2026-08-31T21:00:00",
  },
  {
    workspaceId: 2,
    name: "Workspace In Folder",
    folderId: 3,
    updatedAt: "2026-08-30T09:00:00",
  },
];
