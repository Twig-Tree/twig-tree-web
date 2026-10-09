export type WorkspaceItem = {
  id: string;
  name: string;
  folderId: string | null; // 속한 폴더 ID. 루트에 있으면 null
  updatedAt: string; // 서버가 준 ISO 문자열. 표시 형식은 UI 경계에서 만든다
};

/*
워크스페이스 화면이 쓰는 모델. 목록 카드는 트리를 열지 않으므로 treeId를 WorkspaceItem에 두지 않는다.
*/
export type WorkspaceDetail = WorkspaceItem & {
  treeId: string | null; // 트리가 없는 워크스페이스는 null
};

/*
최신순 목록의 한 페이지. 커서는 서버가 만든 불투명 문자열이라 ID처럼 변환하거나 검증하지 않는다.
*/
export type RecentWorkspacePage = {
  workspaces: WorkspaceItem[];
  nextCursor: string | null; // 다음 페이지 요청에 그대로 돌려보낼 값. 마지막 페이지는 null
  hasNext: boolean;
};
