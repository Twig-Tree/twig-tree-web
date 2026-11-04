import { FolderDTO } from "@/src/entities/folder/api/types";
import { WORLD_GEOGRAPHY_NODE_IDS } from "@/src/entities/lecture";
import { NodeDTO, TagDTO } from "@/src/entities/tree/api/types";
import { WorkspaceDTO } from "@/src/entities/workspace/api/types";

export const RAW_TREE_DATA: NodeDTO[] = [
  {
    nodeId: 1,
    name: "node 1",
    memo: null,
    parentId: null,
    orderId: 0,
    tagIds: [],
  },
  {
    nodeId: 2,
    name: "node 2",
    memo: null,
    parentId: 1,
    orderId: 1,
    tagIds: [],
  },
  {
    nodeId: 3,
    name: "node 3",
    memo: null,
    parentId: 1,
    orderId: 6,
    tagIds: [],
  },
  {
    nodeId: 21,
    name: "node 2a",
    memo: null,
    parentId: 2,
    orderId: 2,
    tagIds: [],
  },
  {
    nodeId: 22,
    name: "node 2b",
    memo: null,
    parentId: 2,
    orderId: 3,
    tagIds: [],
  },
  {
    nodeId: 23,
    name: "node 2c",
    memo: null,
    parentId: 2,
    orderId: 4,
    tagIds: [],
  },
  {
    nodeId: 24,
    name: "node 2d",
    memo: null,
    parentId: 23,
    orderId: 5,
    tagIds: [],
  },
  {
    nodeId: 4,
    name: "node 4",
    memo: null,
    parentId: null,
    orderId: 7,
    tagIds: [],
  },
  {
    nodeId: 5,
    name: "node 5",
    memo: null,
    parentId: 4,
    orderId: 8,
    tagIds: [],
  },
  {
    nodeId: 6,
    name: "output",
    memo: null,
    parentId: 5,
    orderId: 9,
    tagIds: [],
  },
  {
    nodeId: 7,
    name: "output",
    memo: null,
    parentId: 5,
    orderId: 10,
    tagIds: [],
  },
];

/*
동적 강의 목대본이 가리키는 세계 지리 트리. 대본과 같은 서버 노드 ID를 사용해
개발용 MSW 환경에서도 이름 경로 없이 serverId 연결을 검증한다.
*/
export const RAW_WORLD_GEOGRAPHY_TREE_DATA: NodeDTO[] = (
  [
    ["world", null, "세계"],
    ["europe", "world", "유럽"],
    ["asia", "world", "아시아"],
    ["france", "europe", "프랑스"],
    ["germany", "europe", "독일"],
    ["euro", "europe", "유로"],
    ["paris", "france", "파리"],
    ["berlin", "germany", "베를린"],
    ["korea", "asia", "대한민국"],
    ["japan", "asia", "일본"],
    ["seoul", "korea", "서울"],
    ["won", "korea", "원"],
    ["tokyo", "japan", "도쿄"],
    ["yen", "japan", "엔"],
  ] as const
).map(([key, parentKey, name], orderId) => ({
  nodeId: Number(WORLD_GEOGRAPHY_NODE_IDS[key]),
  name,
  memo: null,
  parentId:
    parentKey === null ? null : Number(WORLD_GEOGRAPHY_NODE_IDS[parentKey]),
  orderId,
  tagIds: [],
}));

/*
프롬프트로 만들어진 트리의 응답 데이터. 워크스페이스·트리·노드가 한 응답에 함께 온다.
루트와 자식을 하나씩 두어 parentId가 null과 숫자 양쪽으로 변환되는지 확인할 수 있다.
*/
export const RAW_CREATED_TREE_DATA = {
  treeId: 30,
  workspaceId: 31,
  nodes: [
    {
      nodeId: 40,
      name: "컴퓨터 사이언스",
      memo: "전공 기초",
      parentId: null,
      orderId: 1,
      tagIds: [],
    },
    {
      nodeId: 41,
      name: "자료구조",
      memo: null,
      parentId: 40,
      orderId: 1,
      tagIds: [],
    },
  ] satisfies NodeDTO[],
};

export const RAW_TREE_DATA_WITH_CYCLE: NodeDTO[] = [
  {
    nodeId: 100,
    name: "Cycle 1",
    memo: null,
    parentId: 101,
    orderId: 1,
    tagIds: [],
  },
  {
    nodeId: 101,
    name: "Cycle 2",
    memo: null,
    parentId: 100,
    orderId: 2,
    tagIds: [],
  },
];

/*
트리 태그 목록 응답 데이터. 이름 중복 거절을 확인할 수 있도록 생성 핸들러가 이 목록과 이름을 비교한다.
*/
export const RAW_TREE_TAG_DATA: TagDTO[] = [
  { tagId: 1, name: "React" },
  { tagId: 2, name: "TypeScript" },
];

/*
루트에 폴더 하나를 두고 그 안에 다시 하위 폴더를 둔다. 경로를 한 단계 내려갔을 때
목록이 실제로 바뀌는지 확인할 수 있다. 3번 폴더에는 아래 워크스페이스도 들어 있다.
*/
export const RAW_FOLDER_DATA: FolderDTO[] = [
  { folderId: 3, name: "Root Folder", folderParentId: null },
  { folderId: 4, name: "Folder In Folder", folderParentId: 3 },
];

/*
폴더에 속하지 않은 것과 특정 폴더에 든 것을 함께 두어, folderId 쿼리 파라미터가
제대로 실려 나가는지 핸들러가 걸러내는 것으로 확인할 수 있게 한다.
treeId도 있는 것과 없는 것을 하나씩 두어 상세 조회에서 null 변환을 확인한다.
*/
export const RAW_WORKSPACE_DATA: WorkspaceDTO[] = [
  {
    workspaceId: 1,
    name: "Root Workspace",
    folderId: null,
    treeId: 10,
    updatedAt: "2026-08-31T12:00:00.000000Z",
  },
  {
    workspaceId: 2,
    name: "Workspace In Folder",
    folderId: 3,
    treeId: null,
    updatedAt: "2026-08-30T00:00:00.000000Z",
  },
];

/* 목록·최근 항목 수를 바꾸지 않고 URL로 직접 진입하는 강의 전용 목 워크스페이스다. */
export const RAW_WORLD_GEOGRAPHY_WORKSPACE_DATA: WorkspaceDTO = {
  workspaceId: 3,
  name: "세계 지리 강의 데모",
  folderId: null,
  treeId: 30,
  updatedAt: "2026-09-01T00:00:00.000000Z",
};
