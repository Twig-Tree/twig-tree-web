import { validateNameLength } from "@/src/shared/lib/validation/validateNameLength";

/*
함수 이름 : validateNodeName
기능 : 노드 제목 입력값이 저장 가능한지 검사한다. 백엔드는 blank를 거부하고 30자를 초과하면 400을 반환하므로, 요청을 보내기 전에 같은 기준으로 걸러 안내 문구를 돌려준다.
인자 : string name -> 사용자가 입력한 노드 제목
반환값 : 오류 안내 문구, 통과하면 null
*/
export function validateNodeName(name: string): string | null {
  return validateNameLength(name, "노드");
}
