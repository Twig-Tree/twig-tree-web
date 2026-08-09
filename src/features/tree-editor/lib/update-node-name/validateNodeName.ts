export const MAX_NODE_NAME_LENGTH = 30;

/*
함수 이름 : validateNodeName
기능 : 노드 제목 입력값이 저장 가능한지 검사한다. 백엔드는 blank를 거부하고 30자를 초과하면 400을 반환하므로, 요청을 보내기 전에 같은 기준으로 걸러 안내 문구를 돌려준다.
인자 : string name -> 사용자가 입력한 노드 제목
반환값 : 오류 안내 문구, 통과하면 null
*/
export function validateNodeName(name: string): string | null {
  const trimmedName = name.trim(); // 서버에도 앞뒤 공백을 제거한 값을 보내므로 같은 값으로 검사한다.

  if (!trimmedName) {
    return "노드 이름을 입력해 주세요.";
  }

  /*
  백엔드의 30자 제한은 Java String 길이(UTF-16 코드 단위) 기준이다.
  JavaScript의 String.length도 같은 단위를 세므로 한글과 이모지 모두 서버와 동일하게 판정된다.
  */
  if (trimmedName.length > MAX_NODE_NAME_LENGTH) {
    return `노드 이름은 최대 ${MAX_NODE_NAME_LENGTH}자까지 입력할 수 있습니다.`;
  }

  return null;
}
