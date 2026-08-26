export const MAX_NAME_LENGTH = 30;

/*
함수 이름 : validateNameLength
기능 : 사용자가 입력한 이름이 저장 가능한 길이인지 검사한다. 노드·폴더·워크스페이스가 모두 같은 30자 정책을 따르므로 검사와 안내 문구를 한곳에서 만든다.
인자 : string name -> 사용자가 입력한 이름
string label -> 안내 문구에 넣을 대상 이름. "노드", "폴더"처럼 뒤에 "이름"이 이어지는 형태로 넘긴다
반환값 : 오류 안내 문구, 통과하면 null
*/
export function validateNameLength(name: string, label: string): string | null {
  const trimmedName = name.trim(); // 서버에도 앞뒤 공백을 제거한 값을 보내므로 같은 값으로 검사한다.

  if (!trimmedName) {
    return `${label} 이름을 입력해 주세요.`;
  }

  /*
  백엔드의 30자 제한은 Java String 길이(UTF-16 코드 단위) 기준이다.
  JavaScript의 String.length도 같은 단위를 세므로 한글과 이모지 모두 서버와 동일하게 판정된다.
  */
  if (trimmedName.length > MAX_NAME_LENGTH) {
    return `${label} 이름은 최대 ${MAX_NAME_LENGTH}자까지 입력할 수 있습니다.`;
  }

  return null;
}
