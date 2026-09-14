/*
함수 이름 : createFile
기능 : 테스트에서 사용할 빈 File 객체를 만든다.
인자 : string name -> 확장자를 포함한 파일 이름
string type -> mimeType. 확장자로 판단하는 코드를 확인할 때는 비워 둔다
반환값 : File
*/
export const createFile = (name: string, type = "") =>
  new File([], name, { type });

/*
함수 이름 : createFileOfSize
기능 : 지정한 크기를 보고하는 File 객체를 만든다.
인자 : string name -> 확장자를 포함한 파일 이름
number sizeInBytes -> File.size가 보고할 값
반환값 : File

File 생성자에 실제로 10MB를 담으면 테스트가 느려지므로 size만 원하는 값으로 바꾼다.
File.size는 읽기 전용이라 정의를 덮어써야 한다.
*/
export const createFileOfSize = (name: string, sizeInBytes: number) => {
  const file = createFile(name);

  Object.defineProperty(file, "size", { value: sizeInBytes });

  return file;
};
