import { MAX_MEMO_LENGTH } from "@/src/entities/tree/model/constants";

/*
함수 이름 : validateMemoContent
기능 : 메모 내용이 저장 가능한 길이인지 검사한다.
인자 : string content -> 사용자가 입력한 메모 내용
반환값 : 오류 안내 문구, 통과하면 null

이름 검증과 달리 빈 내용을 거부하지 않는다. 빈 메모 저장은 메모 삭제로 처리하므로
여기서 막으면 저장된 메모를 지울 수 없다.
*/
export function validateMemoContent(content: string): string | null {
  const trimmedContent = content.trim(); // 서버에도 앞뒤 공백을 제거한 값을 보내므로 같은 값으로 검사한다.

  if (trimmedContent.length > MAX_MEMO_LENGTH) {
    return `메모 내용은 최대 ${MAX_MEMO_LENGTH}자까지 입력할 수 있습니다.`;
  }

  return null;
}
