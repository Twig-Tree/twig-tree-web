/*
함수 이름 : getNormalizedTagName
기능 : 태그 이름을 비교할 때 쓰는 형태로 바꾼다. 앞뒤 공백을 지우고 소문자로 맞춘다.
백엔드의 태그 이름 유니크 제약은 DB collation을 따르는데, 대소문자를 구분하지 않는 collation이면
"React"와 "react"를 같은 이름으로 보고 거절한다. 프론트도 같은 이름으로 보아야 새로 만들다 409가 나지 않는다.
인자 : string name -> 태그 이름 또는 사용자 입력
반환값 : 비교용 이름
*/
export const getNormalizedTagName = (name: string) => name.trim().toLowerCase();
