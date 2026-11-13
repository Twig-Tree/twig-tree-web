import { create } from "zustand";

/*
노드 이름 입력창이 열린 곳. 캔버스 노드와 메모 패널이 같은 노드의 이름을 편집할 수 있다.
*/
export type NodeNameEditorLocation = "canvas" | "panel";

/*
노드 밖에서 보낸 이름 편집 시작 요청. 요청마다 새 객체를 만들어, 같은 노드에 다시 요청해도 바뀐 요청으로 알아본다.
*/
export type NodeNameEditRequest = {
  clientId: string; // 이름 입력창을 열 노드의 편집기 노드 ID
};

interface EditingState {
  nameEditors: ReadonlyMap<string, NodeNameEditorLocation>; // 이름 입력창이 열려 있는 노드와 그 입력창이 열린 곳. 충돌 안내가 뜬 입력창은 닫히지 않아 여러 노드일 수 있다
  nameEditRequest: NodeNameEditRequest | null; // 가장 최근의 이름 편집 시작 요청
  isMemoDirty: boolean; // 메모 패널에 저장하지 않은 입력이 있는지

  startNodeNameEditing: (
    clientId: string,
    location: NodeNameEditorLocation,
  ) => void;
  endNodeNameEditing: (
    clientId: string,
    location: NodeNameEditorLocation,
  ) => void;
  requestNodeNameEdit: (clientId: string) => void;
  setMemoDirty: (isDirty: boolean) => void;
}

/*
입력 중인 내용은 각 입력 컴포넌트의 로컬 상태에 있다. 다른 곳의 변경을 반영해도 되는지 판단하는 쪽은 그 컴포넌트들과 떨어져 있어, 입력 중이라는 사실만 여기에 모은다.
서버와 무관하고 undo 대상도 아니므로 editor store와 따로 둔다.
*/
export const useEditingStore = create<EditingState>()((set) => ({
  nameEditors: new Map(),
  nameEditRequest: null,
  isMemoDirty: false,

  /*
  함수 이름 : startNodeNameEditing
  기능 : 노드의 이름 입력창이 어디에서 열렸는지 기록한다.
  인자 : string clientId -> 이름 입력창을 연 노드의 편집기 노드 ID
  NodeNameEditorLocation location -> 입력창이 열린 곳
  반환값 : 없음

  한 노드에는 입력창을 하나만 연다. 다른 곳에서 이미 열려 있으면 기록을 바꾸지 않는다. 입력창을 열기 전에 호출부가 nameEditors로 먼저 확인한다.
  */
  startNodeNameEditing: (clientId, location) => {
    set((state) => {
      if (state.nameEditors.has(clientId)) return state;

      const nameEditors = new Map(state.nameEditors);
      nameEditors.set(clientId, location);

      return { nameEditors };
    });
  },

  /*
  함수 이름 : endNodeNameEditing
  기능 : 노드의 이름 입력창이 닫혔음을 기록한다.
  인자 : string clientId -> 이름 입력창을 닫은 노드의 편집기 노드 ID
  NodeNameEditorLocation location -> 입력창이 열렸던 곳
  반환값 : 없음

  자기가 연 기록만 지운다. 다른 곳의 기록까지 지우면 아직 입력 중인 그 입력창을 다른 곳의 변경이 덮어쓸 수 있다.
  */
  endNodeNameEditing: (clientId, location) => {
    set((state) => {
      if (state.nameEditors.get(clientId) !== location) return state;

      const nameEditors = new Map(state.nameEditors);
      nameEditors.delete(clientId);

      return { nameEditors };
    });
  },

  /*
  함수 이름 : requestNodeNameEdit
  기능 : 노드 옆 버튼·단축키·메뉴처럼 노드 밖에서 그 노드의 이름 입력창을 열도록 요청한다.
  인자 : string clientId -> 이름 입력창을 열 노드의 편집기 노드 ID
  반환값 : 없음

  입력창을 여닫는 상태는 각 CustomNode가 가지므로, 여기서는 요청만 남기고 노드가 요청을 받아 입력창을 연다.
  요청은 받는 순간에만 쓰고 지우지 않는다. 그 노드가 접혀 그려지지 않았다면 요청은 버려지고, 나중에 펼쳐도 입력창이 열리지 않는다.
  */
  requestNodeNameEdit: (clientId) => {
    set({ nameEditRequest: { clientId } });
  },

  setMemoDirty: (isDirty) => {
    set({ isMemoDirty: isDirty });
  },
}));
