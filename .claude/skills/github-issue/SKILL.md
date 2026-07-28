---
name: github-issue
description: Draft and (after user confirmation) create a GitHub issue using this repo's issue template, optionally as a sub-issue of a larger parent issue. Use when Claude notices a bug/problem worth tracking while working and wants to propose an issue, or when the user asks to create/open an issue for something.
---

# GitHub Issue

@.github/ISSUE_TEMPLATE/twig-tree-issue-template.md

이슈 생성은 GitHub에 공개로 게시되는 행동이라 **사용자의 명시적인 확인 없이는 절대 `gh issue create`를 실행하지 않는다.** 초안을 작성하고 보여주는 것과 실제로 올리는 것은 항상 분리된 단계다.

## 언제 시작하는가

두 가지 경로가 있다.

1. **Claude가 작업 중 문제를 발견했을 때**: 버그, 컨벤션 위반, 막힌 지점 등을 발견하면 바로 초안을 쓰지 말고 "이거 이슈로 남길까요?" 정도로 한 문장 제안만 한다. 사용자가 동의하면 아래 초안 작성 단계로 넘어간다.
2. **사용자가 이슈 생성을 요청했을 때**: 바로 초안 작성 단계로 넘어간다.

## 초안 작성

1. 위에서 import한 템플릿의 frontmatter(`name`/`about`/`title`/`labels`/`assignees`)는 실제 이슈 본문에 포함하지 않는다. 본문은 `## 🚀 ISSUE`, `## ✅ TODO` 두 섹션 구조만 따른다.
2. 제목은 템플릿의 `[FEAT] ...` 형식을 따르되, 내용에 맞는 태그를 고른다 (`[FEAT]`, `[FIX]`, `[CHORE]` 등 — 이 repo의 커밋 컨벤션과 동일한 톤).
3. `## 🚀 ISSUE`: 무슨 문제/기능인지, 왜 필요한지 대화 맥락과 코드에서 관찰한 내용을 바탕으로 적는다. 추측성 원인 분석은 확실하지 않으면 단정하지 않는다.
4. `## ✅ TODO`: 실제로 처리해야 할 작업을 체크리스트로 쪼갠다.
5. 라벨을 붙일 근거가 명확하면 제안하고, 애매하면 비워두고 사용자에게 맡긴다.

## 서브 이슈 여부 확인

작업 범위가 크거나 사용자가 명시하면, 새 이슈를 특정 부모 이슈의 서브 이슈로 만들지 물어본다.

- 부모 이슈 번호를 모르면 `gh issue list`로 후보를 찾아 사용자에게 확인받는다.
- 서브 이슈로 만들기로 하면, 이슈 본문에도 `상위 이슈: #<parent_number>` 같은 참조를 한 줄 추가해 GitHub sub-issue 링크가 실패해도 맥락이 남게 한다.

## 확인 요청

작성한 제목 + 라벨(있다면) + 본문 전체를 사용자에게 그대로 보여주고, 이대로 올릴지 명시적으로 물어본다. "네", "올려줘" 같은 명확한 승인이 있을 때만 다음 단계로 진행한다. 수정 요청이 오면 반영 후 다시 확인받는다.

## 실제 생성 (승인 후에만)

1. 본문을 임시 파일에 써서 `gh issue create --title "<title>" --body-file <tmpfile>` 로 생성한다 (따옴표/이모지 깨짐 방지를 위해 인라인 `--body`보다 `--body-file`을 우선한다). 라벨이 있으면 `--label`을 추가한다.
2. 서브 이슈로 만들기로 했다면, 부모/자식 이슈의 내부 id를 조회해 GitHub sub-issues API로 연결한다.

   ```bash
   gh issue view <parent_number> --json id --jq .id
   gh issue view <child_number> --json id --jq .id
   gh api --method POST repos/{owner}/{repo}/issues/<parent_number>/sub_issues -F sub_issue_id=<child_internal_id>
   ```

   `sub_issue_id`는 반드시 `-F`(타입 추론)로 보낸다. `-f`로 보내면 문자열로 직렬화되어 GitHub API가 `integer` 타입이 아니라고 거부한다.

   이 API 호출이 실패하면(권한, 버전 등) 억지로 재시도하지 않고 사용자에게 알린 뒤, 부모 이슈 본문에 자식 이슈 링크를 수동으로 추가할지 물어본다.
3. 생성된 이슈 URL을 사용자에게 보여준다.
