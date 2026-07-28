---
name: todo
description: Save or list the user's next-task todo list, persisted at .claude/todo.md. Use when the user asks to remember/save what to work on next (e.g. "다음에 이거 해야돼", "할 일로 저장해줘"), or asks what they should do next (e.g. "나 뭐 해야되지", "할 일 목록 보여줘", "다음 작업 뭐였지").
---

# Todo

사용자의 "다음에 할 일"을 `.claude/todo.md`에 저장하고 조회하는 skill이다. 파일이 없으면 새로 만든다.

## 파일 형식

```markdown
# Todo

- [ ] 할 일 설명 (added: YYYY-MM-DD)
- [x] 완료한 일 설명 (added: YYYY-MM-DD, done: YYYY-MM-DD)
```

- 날짜는 시스템 컨텍스트의 현재 날짜를 사용한다.
- 항목은 추가된 순서대로 아래에 append한다.
- 완료 항목은 지우지 않고 `[x]`로 체크하고 `done` 날짜를 붙인다. 히스토리로 남겨둔다.

## 저장 요청 처리

사용자가 할 일을 저장해달라고 하면:

1. `.claude/todo.md`가 없으면 `# Todo` 헤더로 새로 만든다.
2. 사용자가 말한 내용을 한 줄 요약으로 다듬어 `- [ ] ...` 항목으로 append한다. 원래 표현을 과도하게 재해석하지 않는다.
3. 여러 개를 한 번에 말했다면 항목을 나눠서 각각 추가한다.
4. 저장했다는 것과 저장된 문구를 짧게 확인해준다.

## 조회 요청 처리

사용자가 할 일을 물으면:

1. `.claude/todo.md`를 읽는다. 파일이 없거나 미완료 항목이 없으면 그렇게 알려준다.
2. 기본적으로 미완료(`[ ]`) 항목만 추가된 순서대로 보여준다.
3. "완료한 것도 보여줘" 같은 요청이 있을 때만 `[x]` 항목도 포함한다.
4. 목록만 보여주고, 다음에 뭘 해야 할지 임의로 골라 진행하지 않는다 — 어떤 걸 할지는 사용자가 정한다.

## 완료 처리

사용자가 특정 항목을 끝냈다고 하면 해당 줄을 찾아 `[x]`로 바꾸고 `done` 날짜를 추가한다. 항목이 모호하게 여러 개와 매칭되면 사용자에게 어떤 항목인지 확인한다.
