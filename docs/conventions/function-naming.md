# 함수 이름 규칙

함수 이름의 접두사는 반환 타입과 대응한다. 이름만 보고 무엇이 돌아오는지 알 수 있게 한다.

| 접두사       | 반환             | 의미                          |
| ------------ | ---------------- | ----------------------------- |
| `is` / `has` | `boolean`        | 조건을 만족하는지 판단한다    |
| `validate`   | `string \| null` | 위반 시 보여줄 안내 문구      |
| `get`        | 계산된 값        | 입력으로부터 값을 만든다      |
| `create`     | 새 객체          | 새 값을 만들어 돌려준다       |
| `handle`     | 없음             | 이벤트나 콜백 prop에 연결한다 |

`handle` 접두사의 기준은 [tree editor action README](../../src/features/tree-editor/model/actions/README.md)에서 더 자세히 다룬다.

## 검증 함수를 `is`와 `validate` 중 무엇으로 할지

둘 다 검증이지만 호출부가 필요로 하는 것이 다르다.

`validate*`는 안내 문구를 만들어 돌려준다. 입력 하나에 문구 하나를 그 자리에 띄우는 화면에 쓴다.

```ts
const errorMessage = validateFolderName({ folderId, folders, name });

if (errorMessage) setErrorMessage(errorMessage);
```

`is*`는 참·거짓만 돌려주고 그 의미는 호출부가 정한다. 여러 입력을 **분류**해야 하거나, 실패를 문구가 아닌 다른 방식으로 다룰 때 쓴다.

```ts
for (const file of files) {
  if (!isAcceptedFileName(file.name)) {
    rejectedFiles.push({ name: file.name, reason: "extension" });
    continue;
  }

  if (!isAcceptedFileSize(file.size)) {
    rejectedFiles.push({ name: file.name, reason: "size" });
    continue;
  }

  acceptedFiles.push(file);
}
```

위 코드가 문구를 받았다면 사유별로 나누기 위해 문자열을 다시 비교해야 한다. 안내 문구는 사유마다 한 번씩 화면에서 조립하는 편이 낫다.

정리하면, **문구를 그 자리에서 보여줄 것이면 `validate`, 결과를 가지고 분기하거나 분류할 것이면 `is`**를 쓴다.
