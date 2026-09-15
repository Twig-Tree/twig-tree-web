export type WorkspaceItem = {
  id: string;
  name: string;
  updatedAt: string; // 서버가 준 ISO 문자열. 표시 형식은 UI 경계에서 만든다
};

/*
워크스페이스 화면이 쓰는 모델. 목록 카드는 트리를 열지 않으므로 treeId를 WorkspaceItem에 두지 않는다.
*/
export type WorkspaceDetail = WorkspaceItem & {
  treeId: string | null; // 트리가 없는 워크스페이스는 null
};
