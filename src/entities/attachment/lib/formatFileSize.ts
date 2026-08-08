const BYTES_PER_UNIT = 1024;
const UNITS = ["B", "KB", "MB", "GB", "TB"] as const;

/*
함수 이름 : formatFileSize
기능 : 바이트 크기를 화면에 표시할 단위 문자열로 변환한다.
인자 : number sizeInBytes -> 파일 크기
반환값 : "2.4 MB"처럼 단위가 붙은 문자열

소수점 첫째 자리까지만 표시하고, "512.0 KB"처럼 의미 없는 0은 남기지 않는다.
크기를 알 수 없는 값은 "0 B"로 처리해 화면에 NaN이 노출되지 않게 한다.
*/
export const formatFileSize = (sizeInBytes: number) => {
  if (!Number.isFinite(sizeInBytes) || sizeInBytes <= 0) return "0 B";

  /*
  단위 배열을 넘어서는 크기는 마지막 단위로 고정해 UNITS[unitIndex]가 undefined가 되지 않게 한다.
  */
  const unitIndex = Math.min(
    Math.floor(Math.log(sizeInBytes) / Math.log(BYTES_PER_UNIT)),
    UNITS.length - 1,
  );

  const size = sizeInBytes / BYTES_PER_UNIT ** unitIndex;
  const roundedSize = Number.parseFloat(size.toFixed(1)); // 소수점 뒤 0을 제거하기 위해 다시 숫자로 변환한다.

  return `${roundedSize} ${UNITS[unitIndex]}`;
};
