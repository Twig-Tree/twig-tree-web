# Workspace Lab 구현 가이드

이 디렉터리는 Workspace 트리 UI를 조합식으로 실험하는 개발 전용 widget이다. Lab의 목적과 제품 코드와의 경계는 [`docs/workspace-ui-lab.md`](../../../docs/workspace-ui-lab.md)를 먼저 참고한다.

## 구조

```text
workspace-lab/
├── model/
│   ├── scenarios.ts       # 재현 가능한 트리 fixture
│   ├── layouts.ts         # 세로·가로·방사형 좌표와 배치 간격
│   ├── edge-routing.ts    # 직각 연결선의 기하학적 제약
│   ├── themes.ts          # 테마 token schema와 registry
│   ├── node-shapes.ts     # 노드 외곽 형태 registry
│   ├── visual-slots.ts    # edge, port, collapse, canvas, density registry
│   └── types.ts           # Lab에서 공유하는 타입
├── ui/
│   ├── WorkspaceLab.tsx           # 상태 조합과 Preview
│   ├── WorkspaceLabInspector.tsx  # 실험 옵션 제어판
│   ├── WorkspaceLabNode.tsx       # Lab 전용 node renderer
│   ├── WorkspaceLabEdge.tsx       # Lab 전용 edge renderer
│   └── WorkspaceLab.module.css    # token 소비와 slot 표현
└── index.ts
```

개발 route는 `app/(dev)/dev/workspace-lab/page.tsx`에 있다. route가 production에서 차단되더라도 Lab 모듈은 운영 기능의 dependency로 사용하지 않는다.

## 상태 흐름

```text
Inspector selection
       ↓
WorkspaceLab state
       ├── scenario fixture
       ├── layout + spacing + measured node size
       ├── theme CSS variables
       └── visual-slot data attributes
                 ↓
         Preview / React Flow
```

Registry 배열에서 literal union 타입과 Inspector 옵션을 파생한다. 새 프리셋을 추가할 때 별도의 문자열 union을 중복 선언하지 않는다.

## 확장 방법

### 테마 추가

1. `themes.ts`에서 기존 token 집합을 펼친 뒤 필요한 값만 덮어쓴다.
2. `workspaceLabThemes` registry에 새 정의를 추가한다.
3. 새 색상이나 표현 책임이 필요하면 `WorkspaceLabThemeTokens`와 `tokenCssVariables`를 함께 확장한다.
4. CSS에서는 직접 색을 추가하기보다 `--lab-*` 변수를 소비한다.
5. theme 테스트에서 모든 token이 CSS 변수로 변환되는지 확인한다.

테마는 한 화면의 시각 언어를 통째로 바꾸는 단위다. 연결선 종류나 노드 형태처럼 독립적으로 비교할 항목을 테마 안에 숨기지 않는다.

### 노드 모양 추가

`node-shapes.ts`의 `workspaceLabNodeShapes`에 프리셋을 추가하고 CSS의 해당 `data-node-shape` 표현을 구현한다. 모양이 실제 크기를 바꾸는 경우 `getWorkspaceLabNodeSize`도 갱신하여 layout 계산과 렌더링 크기를 일치시킨다.

### 배치 방향 추가

`layouts.ts`에 `WorkspaceLabLayoutDefinition`을 만족하는 계산 함수를 작성하고 `workspaceLabLayouts`에 등록한다. 계산 결과에는 다음이 포함되어야 한다.

- 각 노드의 좌표
- source와 target handle 방향
- edge path 종류
- 노드 데이터의 `layoutMode`

빈 시나리오, 여러 root, 깊은 트리에서도 예외 없이 결과를 반환해야 한다.

### 배치 간격 추가

`workspaceLabLayoutSpacings`에 방향별 외부 간격을 정의한다.

- `vertical`: 형제의 가로 간격과 단계의 세로 간격
- `horizontal`: 형제의 세로 간격과 단계의 가로 간격
- `radial`: 깊이별 ring 간격
- `rootGapSlots`: 여러 root 사이의 추가 slot 간격

좌표 간격은 `node size + external gap`으로 계산한다. 노드 padding이나 글자 크기는 여기서 다루지 않는다.

세로·가로의 단계 간격은 `workspaceLabSmoothStepMinimumGap`보다 작아질 수 없다. SmoothStep의 `offset`이나 `centerClearance`를 바꿀 때 `edge-routing.ts`와 관련 테스트를 함께 수정한다.

### Visual slot 추가

연결선, 연결 포인트, 접기 버튼, 캔버스처럼 독립적으로 교체할 요소는 다음 패턴을 따른다.

1. `visual-slots.ts`에 definition과 registry를 둔다.
2. registry에서 ID 타입을 파생한다.
3. `types.ts`에서 UI가 사용할 alias를 export한다.
4. `WorkspaceLab.tsx`에 선택 상태와 기본값을 둔다.
5. Inspector에 제어 항목을 연결한다.
6. renderer에는 의미 있는 prop 또는 `data-*` 값으로 전달한다.
7. CSS와 단위 테스트를 추가한다.

프리셋 정의에는 이름과 설명을 포함해 Inspector가 구현 세부사항 없이 옵션을 그릴 수 있게 한다.

### 노드 밀도 추가

`workspaceLabNodeDensities`는 노드 내부 표현과 실제 크기를 함께 정의한다. CSS 변수는 `getWorkspaceLabNodeDensityStyle`, layout용 크기는 `getWorkspaceLabNodeSize`에서 파생한다.

밀도 프리셋을 추가하거나 필드를 바꾸면 다음 값이 서로 일치하는지 확인한다.

- CSS가 렌더링하는 최소 너비와 높이
- layout이 사용하는 width와 height
- 원형 노드의 지름
- padding과 label font size

밀도 변경으로 노드가 커져도 외부 배치 간격의 의미는 유지되어야 한다.

### 캔버스 추가

React Flow의 `Background`로 표현 가능한 패턴은 `WorkspaceLabCanvasStyleDefinition.background`에 정의한다. 별도 질감이 필요한 프리셋은 root의 `data-canvas-style`과 CSS로 표현한다.

레이어 책임은 다음과 같다.

- React Flow root: 테마의 캔버스 색과 별도 질감
- React Flow `Background`: 도트, 라인, 크로스 패턴
- `.react-flow__renderer`: 투명 유지

renderer에 불투명 배경을 주면 root의 페이퍼 질감이 가려지므로 추가하지 않는다.

### 시나리오 추가

`scenarios.ts`에 최소한의 재현 데이터만 추가한다. 시나리오는 특정 스타일을 고정하지 않고 구조, node state, edge state의 검증 조건만 표현한다.

새 기능에 따라 fixture를 추가하기 전에 기존 `balanced`, `deep`, `dense`, `empty` 시나리오로 재현할 수 있는지 먼저 확인한다.

## 검증 체크리스트

- Inspector에서 새 옵션을 선택하고 다른 옵션과 독립적으로 바뀌는지 확인한다.
- 기본 조합을 새로고침해도 깨지지 않는지 확인한다.
- 세로, 가로, 방사형 배치를 모두 확인한다.
- Compact와 Spacious 밀도에서 노드가 겹치지 않는지 확인한다.
- 세로 + 촘촘하게 + 원형 노드에서 직각 연결선이 불필요하게 여러 번 꺾이지 않는지 확인한다.
- 도트, 라인, 크로스, 페이퍼 캔버스가 실제로 구분되어 보이는지 확인한다.
- 빈 시나리오와 compact viewport를 확인한다.
- registry의 ID 중복과 fallback 동작을 단위 테스트한다.

기본 검증 명령은 다음과 같다.

```bash
pnpm lint
pnpm exec tsc --noEmit
pnpm test -- --run
NEXT_PUBLIC_API_BASE_URL=http://localhost/api \
  NEXT_PUBLIC_AUTH_MODE=optional \
  NEXT_PUBLIC_GOOGLE_CLIENT_ID=local-build-check \
  pnpm build
```

위 환경 변수는 로컬 build 검증용 placeholder이며 실제 credential이 아니다.
