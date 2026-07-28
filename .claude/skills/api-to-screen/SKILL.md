---
name: api-to-screen
description: Guides adding a new backend-API-backed feature end to end — entity API function, mapper, query/mutation hook, feature handler hook, and wiring into a widget or page — following this project's FSD layering and API type-boundary conventions. Use when the user asks to add/connect a new API to a screen, e.g. "OO API 만들고 화면에 연결해줘", "새 기능 추가해줘 (백엔드 붙여서)", "이 엔드포인트로 CRUD 붙여줘".
---

# API → 화면 연결

@docs/conventions/fsd-layers.md
@docs/conventions/api-type-boundaries.md
@docs/conventions/typescript-comments.md

이 skill은 위 컨벤션 문서를 그대로 따라 새 API 기능을 entity부터 화면까지 계층별로 만든다. 템플릿을 그대로 찍어내지 말고, 매번 실제 도메인과 화면 요구사항에 맞게 코드를 작성한다.

## 진행 전 확인할 것

시작하기 전에 아래가 불명확하면 사용자에게 먼저 물어본다.

- 어떤 도메인(entity)에 속하는 API인가? 기존 entity(`src/entities/*`)에 추가하는 건지, 새 entity를 만드는 건지.
- 엔드포인트 스펙(method, URL, request/response 필드, ID 타입)은 무엇인가?
- 조회(query)인가 변경(mutation)인가?
- 어떤 화면(widget/page)에 연결하는가? 기존 화면에 붙이는 건지, 새 화면인지.
- 사용자 입력 검증이나 화면 전용 상태(버튼 비활성화 조건 등)가 필요한 feature 계층까지 필요한가, entity만으로 충분한가?

## 계층별 작업 순서

`docs/conventions/fsd-layers.md`의 판단 기준을 따라 아래 순서로 만든다.

### 1. Entity 계층 (`src/entities/<domain>/`)

- `api/types.ts`: 백엔드 요청·응답 DTO. ID는 `number | null`.
- `model/types.ts`: 프론트 도메인 모델. ID는 `string | null`.
- `lib/mappers.ts`: DTO → 도메인 모델 mapper.
- `api/<domain>Api.ts`: API 함수. 인자는 이미 변환된 백엔드 타입만 받는다. URL 문자열 ID를 함수 내부에서 변환하지 않는다.
- `model/queryKeys.ts`: query key. 프론트 ID 타입 유지.
- `model/queries.ts` 또는 `model/mutations/use<Action><Domain>Mutation.ts`: 프론트 타입을 받아 API 호출 직전에 백엔드 타입으로 변환. 여기서 이 entity의 캐시 갱신·optimistic update·rollback을 처리한다.
- `index.ts`에 공개 API를 export한다.

### 2. Feature 계층 (`src/features/<domain>/<use-case>/`) — 필요한 경우만

entity query/mutation만으로 화면에서 바로 못 쓰고, 검증·조합·파생 상태가 필요하면 feature를 만든다. 단순 CRUD 노출이면 이 계층을 생략하고 entity hook을 바로 widget/page에서 쓴다.

- `model/use<UseCase>.ts`: entity mutation/query를 조합하고, 입력 검증·중복 실행 방지·버튼 비활성화 조건 같은 파생 상태를 만든다. ID를 API 요청 타입으로 변환하는 책임은 여기가 아니라 entity mutation에 둔다.
- `lib/`: React나 서버 요청에 의존하지 않는 이 유스케이스 전용 순수 함수.
- 하나의 feature 안에 여러 사용자 행동이 얽혀 있으면(예: optimistic update + undo 복구가 있는 편집 기능) `model` 하위를 책임별로 나누고, 선택한 구조와 이유를 feature 내부 README에 남긴다. `src/features/tree-editor/model/actions/README.md`가 이런 구조의 실제 예시다 — optimistic update, mutation hook과 action hook의 책임 분리, `undo()` 기반 실패 복구 패턴을 참고할 수 있다. 다만 이 패턴은 store 기반 optimistic 편집 기능에만 해당하니, 단순 CRUD에 그대로 옮겨오지 않는다.

### 3. 화면 연결 (`src/widgets/*` 또는 `src/app/*`)

- widget 또는 page에서 entity/feature hook을 호출하고, 그 결과(데이터·핸들러·로딩/비활성화 상태)를 props로 넘긴다.
- widget/page가 API 함수를 직접 호출하거나 query/mutation을 새로 만들지 않는다.
- 서버 데이터를 다시 `useState`로 복사하지 않는다 — TanStack Query 결과를 그대로 단일 원본으로 쓴다.

## 주석

공개 hook과 store action에는 `docs/conventions/typescript-comments.md`의 함수 주석 형식(함수 이름/기능/인자/반환값)을 적용한다. object parameter는 필드 옆 문장 주석으로, optimistic update나 rollback처럼 맥락이 필요한 부분은 블록 주석으로 설명한다. 타입이 이미 표현하는 내용은 반복하지 않는다.

## 마무리

파일을 다 만든 뒤에는 계층 경계(entity가 feature를 import하지 않는지), ID 타입 변환 위치(entity mutation/query 직전인지), 화면이 API를 직접 호출하지 않는지를 스스로 점검하고 사용자에게 결과를 요약한다.
