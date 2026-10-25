# 학습 순서 제안 프로토타입 구현 계획

## 문서 목적

이 문서는 [프로토타입 기획](./README.md)을 실제 코드로 옮기기 전에 작업 영역과 브랜치 경계를 정하고, 기존 코드에서 재사용할 수 있는 요소와 분리해야 하는 요소를 기록한다.

첫 프로토타입은 고정된 학습 경로 데이터로 UI 경험을 검증한다. 실제 학습 경로 생성 API와 서버 진행 상태 저장은 다루지 않는다.

## 구현 방향 요약

- 프로토타입 진입점은 `/workspace/[workspaceId]/learning-path` 별도 라우트로 둔다.
- 기존 분석 트리 편집 화면은 그대로 유지한다.
- 학습 그래프와 슬라이드 패널은 같은 화면에 함께 표시한다.
- 학습 그래프는 기존과 같은 `@xyflow/react`를 사용하되 읽기 전용으로 구현한다.
- 학습 경로의 모델, 진행 상태, 노드 UI와 레이아웃은 Tree Editor와 분리한다.
- 진행 상태는 워크스페이스와 학습 경로 단위로 브라우저 `localStorage`에 저장한다.
- 기능 브랜치는 기반, 그래프, 슬라이드, 통합의 네 영역으로 나눈다.

## 라우트와 화면 구조

### 라우트

```text
/workspace/[workspaceId]               기존 분석 트리 편집 화면
/workspace/[workspaceId]/learning-path 학습 경로 프로토타입
```

별도 라우트를 선택하는 이유는 다음과 같다.

- 편집 가능한 분석 트리와 읽기 중심의 학습 그래프가 서로 다른 상태와 동작을 가진다.
- 프로토타입 변경이 기존 편집기 동작을 깨뜨릴 위험을 줄일 수 있다.
- URL만으로 두 화면을 구분하고 새로고침 후에도 현재 모드를 유지할 수 있다.
- 이후 기능을 제거하거나 구조를 바꾸더라도 기존 워크스페이스 라우트에 남는 영향이 작다.

### 화면 배치

```text
┌─────────────────────────────────────────────────────────────┐
│ WorkspaceHeader                 트리 보기 · 학습 경로       │
├──────────────────────────────────────┬──────────────────────┤
│                                      │                      │
│         학습 의존성 그래프           │   학습 슬라이드 패널 │
│                                      │                      │
│         확대·축소·이동 가능          │   설명·진행률·이동   │
│         구조 편집은 불가능            │                      │
│                                      │                      │
└──────────────────────────────────────┴──────────────────────┘
```

- 기존 앱의 전역 Topbar와 좌측 Sidebar는 `(main)` 레이아웃을 통해 그대로 사용한다.
- 학습 화면에서는 기존 `WorkspacePanel`의 노드 검색 영역을 표시하지 않는다. 첫 프로토타입의 핵심 내비게이션은 학습 그래프이기 때문이다.
- 슬라이드 패널은 데스크톱에서 우측 고정 패널로 표시한다.
- 현재 앱의 워크스페이스 화면도 고정 폭 패널을 사용하는 데스크톱 중심 구조이므로, 첫 프로토타입에서는 모바일 전용 레이아웃을 범위에서 제외한다.

## 데이터 모델

학습 경로 데이터와 사용자 진행 상태를 분리한다. 체크포인트 상태를 샘플 데이터에 직접 저장하지 않고 진행 상태로부터 계산해야 새로고침 복원과 상태 전환을 일관되게 처리할 수 있다.

```ts
type LearningCheckpointKind = "core" | "supplemental" | "advanced";

interface LearningCheckpoint {
  id: string;
  title: string;
  summary: string;
  rationale: string;
  kind: LearningCheckpointKind;
  prerequisiteIds: string[];
  sourceNodeIds: string[];
  recommendedNextId: string | null;
}

interface LearningPath {
  id: string;
  version: number;
  title: string;
  checkpoints: LearningCheckpoint[];
}

interface LearningProgress {
  activeCheckpointId: string | null;
  completedCheckpointIds: string[];
}

type LearningCheckpointStatus =
  | "completed"
  | "current"
  | "available"
  | "locked";
```

### 모델 원칙

- `prerequisiteIds`가 학습 의존 관계의 단일 출처다.
- `recommendedNextId`는 슬라이드에서 기본 다음 단계를 안내하는 용도다.
- `kind`는 주 경로와 보충·심화 경로의 시각적 구분에 사용한다.
- `sourceNodeIds`는 향후 분석 트리와 연결할 계약으로 남긴다. 첫 프로토타입에서는 원본 노드 이동을 구현하지 않아도 된다.
- `status`는 선수 체크포인트와 진행 상태로부터 파생한다.
- 저장 데이터에는 `version`을 포함해 샘플 경로가 바뀌었을 때 낡은 진행 상태를 안전하게 무시할 수 있게 한다.

## 진행 상태 규칙

- 선수 체크포인트가 모두 완료된 체크포인트만 `available`이다.
- 사용자가 시작한 체크포인트는 `current`가 된다.
- 완료한 체크포인트는 `completed`가 된다.
- 선수 조건을 충족하지 못한 체크포인트는 `locked`다.
- 완료한 체크포인트는 다시 열어볼 수 있지만 완료 상태는 유지한다.
- 선택 경로를 건너뛰어도 `recommendedNextId`를 따라 주 경로를 계속 진행할 수 있다.
- 주 경로 진행률은 핵심 체크포인트만 기준으로 계산한다. 보충·심화 완료 수는 별도로 표시한다.

저장 키는 다른 기능과 충돌하지 않도록 다음 형식을 사용한다.

```text
twig-tree:learning-progress:{workspaceId}:{learningPathId}:{version}
```

`localStorage` 접근 실패, 잘못된 JSON, 현재 경로에 없는 체크포인트 ID는 진행을 막지 않고 기본 상태로 복구한다.

## 기존 코드 재사용 조사

### 그대로 재사용

| 대상              | 위치                                              | 활용 방식                                                              |
| ----------------- | ------------------------------------------------- | ---------------------------------------------------------------------- |
| 앱 셸             | `app/layout.tsx`, `app/(main)/layout.tsx`         | Topbar, 인증 경계, 좌측 Sidebar, 전체 높이 레이아웃을 그대로 사용한다. |
| 워크스페이스 조회 | `src/entities/workspace/model/queries.ts`         | 학습 라우트에서도 워크스페이스 이름과 존재 여부를 조회한다.            |
| 오류 화면         | `src/widgets/workspace/ui/WorkspaceLoadError.tsx` | 잘못된 ID, 4xx, 일시적 조회 실패 처리를 기존 화면과 동일하게 유지한다. |
| 공용 버튼         | `src/shared/ui/button/Button.tsx`                 | 학습 시작, 완료 및 다음 단계 버튼에 사용한다.                          |
| 공용 아이콘 버튼  | `src/shared/ui/icon-button/IconButton.tsx`        | 패널 닫기, 이전·다음, 그래프 맞춤 등의 아이콘 동작에 사용한다.         |
| 아이콘            | `lucide-react`                                    | 완료, 잠금, 분기, 이전·다음 상태를 기존 아이콘 패키지로 표현한다.      |
| React Flow 패키지 | `@xyflow/react`                                   | 확대·축소·이동, 노드 포커스, edge 렌더링을 학습 그래프에도 사용한다.   |
| ELK 패키지        | `elkjs`                                           | 학습 의존성 그래프의 자동 배치에 사용한다.                             |
| 테스트 환경       | `vitest`, Testing Library, jsdom                  | 상태 계산, 저장 복원, 슬라이드 상호작용과 페이지 분기를 검증한다.      |

### 인터페이스를 작게 확장해 재사용

| 대상                   | 현재 제약                                        | 계획                                                                                                 |
| ---------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| `WorkspaceHeader`      | 워크스페이스 이름만 표시한다.                    | 제목 우측에 화면 전환 내비게이션을 받을 수 있는 선택 prop을 추가한다. 기존 호출부의 출력은 유지한다. |
| `routes`               | 워크스페이스 편집 경로만 제공한다.               | `learningPath(workspaceId)` 경로 생성 함수를 추가한다.                                               |
| React Flow 전역 테마   | 모든 `.react-flow__node`에 기본 모양을 적용한다. | 기본 배경과 그림자는 활용하되 `.learning-path-flow` 아래에서 상태별 테두리·색상을 덮어쓴다.          |
| localStorage 방어 패턴 | 접힘 상태만 저장한다.                            | `collapsedNodesStorage.ts`의 예외 처리와 파싱 방식을 따르되 학습 진행 전용 모듈을 만든다.            |

### 개념과 구현 패턴만 재사용

| 대상                  | 재사용할 부분                                           | 그대로 사용할 수 없는 이유                                                                                                               |
| --------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `MemoSidePanel`       | 우측 고정 패널의 폭, header/content/footer 배치         | 메모 mutation과 선택된 Tree Editor 노드에 직접 결합돼 있다. 복사보다 별도 `LearningSlidePanel`을 만드는 편이 경계를 선명하게 유지한다.   |
| `useEditorLayout`     | 구조가 바뀔 때만 배치하고 첫 배치 후 `fitView`하는 패턴 | Tree Editor store setter와 편집 중 비동기 경합 처리에 결합돼 있다. 학습 데이터는 고정이므로 더 단순한 전용 hook이 적합하다.              |
| `getLayoutedElements` | ELK 입력 변환과 RIGHT 방향 배치 방식                    | `CustomEditorNode` 타입, 트리 전용 `mrtree`, 자식 정렬 규칙에 결합돼 있다. 학습 그래프에는 DAG를 지원하는 `layered` 알고리즘이 필요하다. |
| `NodeResultList`      | 목록 항목의 focus/disabled 스타일과 접근성 패턴         | 검색 결과 타입과 메모 일치 배지에 결합돼 있다. 슬라이드 목차로 바로 재사용하지 않는다.                                                   |
| collapse store        | 별도 Zustand store, 복원 시 검증, 저장 실패 허용        | 접힌 서버 노드 ID라는 다른 생명주기를 가진다. 학습 진행 전용 store와 storage 모듈을 둔다.                                                |

### 재사용하지 않음

| 대상             | 이유                                                                                                            |
| ---------------- | --------------------------------------------------------------------------------------------------------------- |
| `treeStore`      | 노드 편집, 연결 변경, undo/redo와 서버 저장 전 노드 신원을 관리한다. 읽기 전용 학습 진행 상태와 책임이 다르다.  |
| `CustomNode`     | 제목 편집, 메모 선택, 접기 버튼, 서버 ID에 결합돼 있다. 학습 노드는 상태·진행률·종류를 표현해야 한다.           |
| `CustomEdge`     | 단순 직선이며 학습 방향과 주 경로·선택 경로의 차이를 표현하지 않는다.                                           |
| `WorkspacePanel` | 노드 검색 전용이다. 학습 화면에서 그래프와 역할이 중복된다.                                                     |
| `Modal`          | 그래프를 보면서 슬라이드를 진행하는 통합 경험에 맞지 않는다. 전체 화면을 가리는 팝업 대신 고정 패널을 사용한다. |
| `Breadcrumb`     | 폴더 계층을 나타내는 UI다. 학습 선후 관계나 진행 단계에는 의미가 맞지 않는다.                                   |

## React Flow 구현 원칙

학습 그래프는 편집기가 아니라 내비게이션이다.

- `nodesDraggable={false}`
- `nodesConnectable={false}`
- `edgesReconnectable={false}`
- 삭제 및 다중 선택 단축키 비활성화
- 노드는 키보드 포커스가 가능해야 한다.
- 노드의 `ariaLabel`에는 제목, 종류, 진행 상태를 포함한다.
- 노드 클릭과 Enter 선택은 같은 체크포인트 열기 동작으로 연결한다.
- `Controls`의 확대·축소·화면 맞춤은 사용하되 상호작용 토글은 감춘다.
- 처음 렌더할 때 `fitView`하고 최대 배율은 1로 제한한다.
- `MiniMap`은 6~10개 노드 규모에서는 정보보다 화면 복잡도를 늘리므로 첫 프로토타입에서 제외한다.

레이아웃은 `elk.algorithm=layered`, `elk.direction=RIGHT`를 사용한다. 기존 `mrtree`는 부모가 하나인 트리에 최적화되어 있어 여러 선수 관계를 가질 수 있는 학습 경로의 장기 모델과 맞지 않는다.

## UI 상태 표현

노드 상태는 색상만으로 구분하지 않고 아이콘, 라벨, 선 스타일을 함께 사용한다.

| 상태      | 시각 표현                         | 동작                          |
| --------- | --------------------------------- | ----------------------------- |
| 완료      | 체크 아이콘, 낮은 채도, 완료 라벨 | 다시 열기 가능                |
| 현재      | 인디고 강조 테두리, 현재 라벨     | 슬라이드 패널에 표시          |
| 학습 가능 | 기본 카드, 시작 가능 라벨         | 선택 시 현재 단계가 됨        |
| 잠김      | 자물쇠 아이콘, 흐린 카드          | 클릭 시 필요한 선수 단계 안내 |
| 보충·심화 | 종류 배지와 점선 edge             | 선택 가능 시 진입 가능        |

edge에는 진행 방향을 보여 주는 화살표를 사용한다. 주 경로는 실선, 선택 경로는 점선으로 구분한다.

## 기능 브랜치 계획

각 브랜치는 직전 작업을 `prototype/learning-path-suggestions`에 반영한 뒤 최신 기준 브랜치에서 새로 만든다. 그래프와 슬라이드는 기반 브랜치의 모델에 의존하며, 마지막 통합 브랜치에서 하나의 화면으로 결합한다.

### 1. `prototype/learning-path-ui-foundation` — 모델과 진행 상태

현재 브랜치다.

작업 범위:

- `src/features/learning-path` 슬라이스와 공개 API 생성
- 학습 경로, 체크포인트, 진행 상태 타입 정의
- 6~10개 체크포인트를 가진 고정 샘플 데이터 작성
- 선수 조건으로 상태를 계산하는 순수 함수 작성
- 권장 다음 단계와 주 경로 진행률 계산
- 진행 상태 Zustand store 작성
- 방어적인 localStorage 읽기·쓰기 및 경로별 복원
- 모델, 상태 계산, 저장 복원 단위 테스트

완료 조건:

- UI 없이도 샘플 경로를 처음부터 마지막까지 진행할 수 있다.
- 잠금 해제, 선택 경로 건너뛰기, 완료 상태 복원이 테스트로 고정된다.
- 잘못된 저장 데이터가 있어도 기본 상태로 복구된다.

### 2. `prototype/learning-path-graph` — 읽기 전용 의존성 그래프

작업 범위:

- 학습 체크포인트를 React Flow node와 edge로 변환
- `layered` 기반 ELK 자동 배치
- 상태별 `LearningCheckpointNode` 구현
- 주 경로와 선택 경로 edge 표현
- 확대·축소·화면 맞춤 controls
- 키보드 포커스와 접근 가능한 노드 이름
- 노드 선택 callback과 잠금 사유 안내
- 변환·레이아웃 순수 함수와 노드 상태 UI 테스트

완료 조건:

- 전체 경로와 진행 방향, 분기를 한 화면에서 식별할 수 있다.
- 그래프 구조를 수정할 수 없고 내비게이션 동작만 제공한다.
- 상태 변화가 그래프 표현에 즉시 반영된다.

### 3. `prototype/learning-path-slides` — 슬라이드 학습 패널

작업 범위:

- `LearningSlidePanel` header/content/footer 구성
- 제목, 설명, 학습 이유, 종류와 진행률 표시
- 이전 단계, 완료 및 다음 단계 동작
- 선택 경로 진입과 주 경로 복귀 동작
- 잠긴 단계 선택 시 필요한 선수 단계 안내
- 완료한 체크포인트 다시 보기
- 버튼 활성 조건, 진행률, 분기 흐름 컴포넌트 테스트

완료 조건:

- 사용자가 주 경로를 처음부터 끝까지 진행할 수 있다.
- 보충·심화 경로에 들어갔다가 주 경로로 돌아올 수 있다.
- 그래프에서 선택한 단계와 패널 내용이 항상 일치한다.

### 4. `prototype/learning-path-integration` — 라우트 연결과 최종 검증

작업 범위:

- `/workspace/[workspaceId]/learning-path` 페이지 추가
- Next.js 16의 비동기 `params` 계약에 맞춘 라우트 파라미터 처리
- Server Component page와 작은 Client Component 경계로 분리
- 워크스페이스 ID 검증, 조회, 로딩 및 오류 처리 연결
- `WorkspaceHeader`에 트리 보기·학습 경로 전환 UI 추가
- 그래프와 슬라이드 패널 결합
- 워크스페이스별 진행 상태 복원
- 기존 편집 화면 회귀 테스트와 학습 페이지 통합 테스트
- lint, 전체 테스트, production build, 실제 브라우저 상호작용 확인

완료 조건:

- 기존 워크스페이스 화면에서 학습 경로로 진입하고 다시 돌아올 수 있다.
- 그래프 선택, 슬라이드 이동, 진행 상태 저장이 한 흐름으로 동작한다.
- 새로고침 후에도 같은 워크스페이스의 진행 상태가 복원된다.
- 다른 워크스페이스의 진행 상태와 섞이지 않는다.
- 기존 트리 편집·검색·메모 기능이 그대로 동작한다.

## 예상 파일 구조

```text
app/(main)/workspace/[workspaceId]/learning-path/
└─ page.tsx

src/features/learning-path/
├─ index.ts
├─ README.md
├─ lib/
│  ├─ deriveCheckpointStatus.ts
│  ├─ getLearningProgress.ts
│  ├─ layoutLearningPath.ts
│  └─ learningProgressStorage.ts
├─ model/
│  ├─ sampleLearningPath.ts
│  ├─ types.ts
│  └─ useLearningProgressStore.ts
└─ ui/
   ├─ LearningCheckpointNode.tsx
   ├─ LearningPathGraph.tsx
   └─ LearningSlidePanel.tsx

src/widgets/learning-path/
├─ index.ts
└─ ui/
   └─ LearningPathPrototype.tsx
```

Feature는 학습 경로 데이터와 진행 유스케이스를 소유한다. Widget은 그래프와 슬라이드 패널을 화면 단위로 조합한다. Page는 라우트 ID를 검증하고 워크스페이스 데이터를 준비한다.

## 테스트 계획

### 순수 로직

- 선수 조건을 모두 만족해야 `available`이 되는지
- 완료·현재·학습 가능·잠김의 우선순위가 올바른지
- 선택 체크포인트를 건너뛰어도 주 경로의 다음 단계가 유지되는지
- 핵심 체크포인트만 주 경로 진행률에 포함되는지
- 잘못된 prerequisite와 순환 경로를 샘플 검증에서 발견하는지

### 저장과 store

- 저장값이 없을 때 기본 진행 상태를 만드는지
- 같은 워크스페이스와 경로에서 상태를 복원하는지
- 다른 워크스페이스의 상태가 섞이지 않는지
- 잘못된 JSON, 이전 버전, 존재하지 않는 ID를 안전하게 무시하는지
- 저장 실패가 화면 진행을 막지 않는지

### UI

- 상태별 노드의 접근 가능한 이름과 시각 표식
- 잠긴 노드를 선택했을 때 선수 단계 안내
- 완료 버튼 이후 그래프와 슬라이드의 상태 동기화
- 이전·다음 이동과 선택 분기 복귀
- 완료한 체크포인트 다시 보기

React Flow의 실제 좌표 계산과 viewport 동작은 jsdom이 레이아웃을 제공하지 않으므로 순수 변환·배치 함수 테스트와 실제 브라우저 확인으로 나눈다. 컴포넌트 테스트에서는 필요한 경우 React Flow 경계를 mock하고 사용자에게 보이는 동작을 검증한다.

## 구현 중 지켜야 할 경계

- 프로토타입을 위해 기존 Tree Editor store에 학습 상태를 추가하지 않는다.
- 학습 그래프에서 분석 트리의 노드 편집 mutation을 호출하지 않는다.
- 기존 `getLayoutedElements`를 무리하게 범용화해 안정된 편집기 레이아웃을 함께 변경하지 않는다.
- 두 번째 실제 사용처가 확인되기 전에는 `MemoSidePanel`을 공용 패널로 추출하지 않는다.
- 샘플 데이터와 실제 API 계약을 같은 것으로 간주하지 않는다.
- 색상만으로 상태를 전달하지 않는다.
- `localStorage` 복원 전 서버·클라이언트 렌더 결과가 달라지지 않도록 브라우저 상태 접근은 Client Component 안에서 수행한다.

## 프로토타입 완료 후 판단할 사항

- 별도 라우트가 실제 사용 흐름에도 적합한지
- 슬라이드 패널을 전체 화면 모드로도 제공할지
- 선택 경로를 전체 진행률에 포함할지
- 분석 트리의 원본 노드로 이동하는 기능이 필요한지
- 실제 학습 경로 API가 `prerequisiteIds`와 `recommendedNextId`를 제공할지
- 사용자가 추천 순서를 편집할 수 있어야 하는지
- 서버에 진행 상태를 저장하고 여러 기기에서 동기화할지
