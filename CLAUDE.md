@AGENTS.md
@docs/conventions/fsd-layers.md
@docs/conventions/api-type-boundaries.md
@docs/conventions/typescript-comments.md

## Git / GitHub 작업 규칙

- `git push`는 사용자가 명시적으로 push를 요청했을 때만 실행한다. 커밋에 대한 승인이 push 승인을 포함하지 않는다 — 커밋과 push는 항상 따로 확인받는다.
- `github-pr` skill로 PR을 생성하는 흐름처럼 push가 그 작업 자체에 필수로 포함되는 경우는 예외다. 이때는 PR 생성 승인 시점에 push 여부를 함께 안내하고, 승인 후 별도로 다시 묻지 않는다.
