import { create } from "zustand";
import type { TreeTag } from "@/src/entities/tree";

interface TreeTagState {
  tags: TreeTag[]; // 지금 열린 트리의 태그 목록. 만든 순서대로 둔다

  addTag: (tag: TreeTag) => void;
  deleteTag: (tagId: string) => void;
  resetTags: () => void;
}

/*
트리 태그 API(#106)를 붙이기 전까지 트리 태그 목록을 대신 들고 있는 임시 store다.
화면은 이 store를 직접 읽지 않고 useTreeTags만 쓴다. API를 붙이면 useTreeTags의 내부를
트리 태그 query와 mutation으로 바꾸고 이 store를 지운다.
메모리에만 있으므로 새로고침하면 사라진다. 노드의 tagIds도 초기화 때 비워지므로 둘이 어긋나지 않는다.
*/
export const useTreeTagStore = create<TreeTagState>()((set) => ({
  tags: [],

  addTag: (tag) => {
    set((state) => ({ tags: [...state.tags, tag] }));
  },

  deleteTag: (tagId) => {
    set((state) => ({ tags: state.tags.filter((tag) => tag.id !== tagId) }));
  },

  resetTags: () => {
    set({ tags: [] });
  },
}));
