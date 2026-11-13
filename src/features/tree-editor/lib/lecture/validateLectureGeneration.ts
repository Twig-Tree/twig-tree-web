import { MAX_LECTURE_TREE_OUTLINE_LENGTH } from "@/src/entities/lecture";

/*
함수 이름 : validateLectureTreeOutline
기능 : 트리 outline이 모델에 보낼 수 있는 크기인지 검사한다.
인자 : string treeOutline -> getEditorLectureTreeOutline으로 만든 outline
반환값 : 오류 안내 문구, 통과하면 null
*/
export const validateLectureTreeOutline = (
  treeOutline: string,
): string | null => {
  /*
  서버 ID가 없는 노드는 outline에서 빠진다. 저장된 노드가 하나도 없으면 강의가 가리킬 노드가 없다.
  */
  if (!treeOutline) return "저장된 노드가 없어 강의를 만들 수 없습니다.";

  if (treeOutline.length > MAX_LECTURE_TREE_OUTLINE_LENGTH) {
    return "트리가 너무 커서 강의를 만들 수 없습니다.";
  }

  return null;
};
