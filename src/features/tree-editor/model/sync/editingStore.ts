import { create } from "zustand";

interface EditingState {
  nameEditingClientIds: ReadonlySet<string>; // 이름 입력창이 열려 있는 노드. 충돌 안내가 뜬 입력창은 닫히지 않아 여러 개일 수 있다
  isMemoDirty: boolean; // 메모 패널에 저장하지 않은 입력이 있는지

  setNodeNameEditing: (clientId: string, isEditing: boolean) => void;
  setMemoDirty: (isDirty: boolean) => void;
}

/*
입력 중인 내용은 각 입력 컴포넌트의 로컬 상태에 있다. 다른 곳의 변경을 반영해도 되는지 판단하는 쪽은 그 컴포넌트들과 떨어져 있어, 입력 중이라는 사실만 여기에 모은다.
서버와 무관하고 undo 대상도 아니므로 editor store와 따로 둔다.
*/
export const useEditingStore = create<EditingState>()((set) => ({
  nameEditingClientIds: new Set(),
  isMemoDirty: false,

  setNodeNameEditing: (clientId, isEditing) => {
    set((state) => {
      const nameEditingClientIds = new Set(state.nameEditingClientIds);

      if (isEditing) {
        nameEditingClientIds.add(clientId);
      } else {
        nameEditingClientIds.delete(clientId);
      }

      return { nameEditingClientIds };
    });
  },

  setMemoDirty: (isDirty) => {
    set({ isMemoDirty: isDirty });
  },
}));
