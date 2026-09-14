/*
함수 이름 : validateNameLength
기능 : 사용자가 입력한 이름이 저장 가능한 길이인지 검사한다. 빈 값 거부와 안내 문구 조립이 도메인마다 같아 한곳에 모은다.
인자 : string name -> 사용자가 입력한 이름
string label -> 안내 문구에 넣을 대상 이름. "노드", "폴더"처럼 뒤에 "이름"이 이어지는 형태로 넘긴다
number maxLength -> 허용할 최대 글자 수
반환값 : 오류 안내 문구, 통과하면 null

상한값은 인자로 받는다. 길이 제한은 백엔드 계약이라 각 entity가 소유하고,
shared는 도메인을 몰라야 하므로 세는 규칙만 갖는다.
*/
export function validateNameLength(
  name: string,
  label: string,
  maxLength: number,
): string | null {
  const trimmedName = name.trim(); // 서버에도 앞뒤 공백을 제거한 값을 보내므로 같은 값으로 검사한다.

  if (!trimmedName) {
    return `${label} 이름을 입력해 주세요.`;
  }

  /*
  백엔드의 길이 제한은 Java String 길이(UTF-16 코드 단위) 기준이다.
  JavaScript의 String.length도 같은 단위를 세므로 한글과 이모지 모두 서버와 동일하게 판정된다.
  */
  if (trimmedName.length > maxLength) {
    return `${label} 이름은 최대 ${maxLength}자까지 입력할 수 있습니다.`;
  }

  return null;
}
