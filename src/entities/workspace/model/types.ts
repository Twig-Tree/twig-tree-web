export type WorkspaceItem = {
  id: string;
  name: string;
  updatedAt: string; // 서버가 준 ISO 문자열. 표시 형식은 UI 경계에서 만든다
};
