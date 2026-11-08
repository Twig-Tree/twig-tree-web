import {
  MAX_LECTURE_REQUEST_LENGTH,
  MAX_LECTURE_TREE_OUTLINE_LENGTH,
} from "@/src/entities/lecture";

/*
함수 이름 : validateLectureRequest
기능 : 사용자가 입력한 강의 요청 문장이 보낼 수 있는 길이인지 검사한다.
인자 : string request -> 사용자가 입력한 요청 문장
반환값 : 오류 안내 문구, 통과하면 null
*/
export const validateLectureRequest = (request: string): string | null => {
  const trimmedRequest = request.trim(); // 서버에도 앞뒤 공백을 뺀 값을 보내므로 같은 값으로 검사한다.

  if (!trimmedRequest) return "어떤 강의를 원하는지 입력해 주세요.";

  if (trimmedRequest.length > MAX_LECTURE_REQUEST_LENGTH) {
    return `강의 요청은 최대 ${MAX_LECTURE_REQUEST_LENGTH}자까지 입력할 수 있습니다.`;
  }

  return null;
};

/*
함수 이름 : validateLectureTreeOutline
기능 : 트리 outline이 모델에 보낼 수 있는 크기인지 검사한다. 사용자가 입력으로 고칠 수 없는 조건이라 요청 문장과 따로 검사한다.
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
