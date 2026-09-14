/*
함수 이름 : getAvailableName
기능 : 이미 쓰이고 있는 이름들과 겹치지 않는 기본 이름을 만든다. 기본 이름이 비어 있으면 그대로, 이미 있으면 뒤에 2부터 번호를 붙인다.
인자 : string baseName -> 번호 없이 먼저 시도할 이름
string[] existingNames -> 같은 위치에 이미 있는 이름 목록
반환값 : "Folder", "Folder 2"처럼 겹치지 않는 이름

폴더와 워크스페이스가 같은 규칙으로 기본 이름을 정하므로 shared에 둔다.
도메인 객체가 아니라 이름 목록을 받아, shared가 어떤 도메인의 이름인지 몰라도 되게 한다.

번호는 서버가 아니라 넘겨받은 목록만 보고 정한다. 목록이 오래됐으면 이미 있는 이름을 만들 수
있고, 백엔드가 같은 위치의 이름 중복을 거절하므로 그때는 생성이 실패한다. 따라서 목록을
확인하지 못한 상태에서 이 함수를 부르지 않는 것은 호출부의 책임이다.
*/
export const getAvailableName = (
  baseName: string,
  existingNames: string[],
): string => {
  const takenNames = new Set(existingNames);

  if (!takenNames.has(baseName)) {
    return baseName;
  }

  let suffix = 2;
  while (takenNames.has(`${baseName} ${suffix}`)) {
    suffix += 1;
  }

  return `${baseName} ${suffix}`;
};
