/*
함수 이름 : getNormalizedTagName
기능 : 태그 이름을 비교할 때 쓰는 형태로 바꾼다. 앞뒤 공백을 지우고 소문자로 맞춘다.
대소문자를 무시하는 것은 백엔드 제약이 아니라 제품 규칙이다. 백엔드의 이름 유니크 제약(uk_tag_name)은 대소문자를 구분하지만,
같은 개념의 태그가 "React"와 "react"로 갈라지면 태그로 노드를 모으는 의미가 약해지므로 프론트가 같은 이름으로 본다.
인자 : string name -> 태그 이름 또는 사용자 입력
반환값 : 비교용 이름
*/
export const getNormalizedTagName = (name: string) => name.trim().toLowerCase();
