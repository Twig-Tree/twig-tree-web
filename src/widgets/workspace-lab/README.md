# Workspace Lab 구현 가이드

이 디렉터리는 Workspace 트리 UI를 조합식으로 실험하는 개발 전용 widget이다. Lab의 목적과 제품 코드와의 경계는 [`docs/workspace-ui-lab.md`](../../../docs/workspace-ui-lab.md)를 먼저 참고한다.

## 구조

```text
workspace-lab/
├── model/
│   ├── scenarios.ts       # 재현 가능한 트리 fixture
│   ├── layouts.ts         # 세로·가로·방사형 좌표와 배치 간격
│   ├── edge-routing.ts    # 직각 연결선의 기하학적 제약
│   ├── edge-styles.ts     # 형태, 패턴, 두께, 색상, 투명도, 효과 registry
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
       ├── fallback node size
       ├── theme CSS variables
       └── visual-slot data attributes
                 ↓
         Preview / React Flow
                 ↓ dimensions change
       measured size map (per node)
                 ↓ requestAnimationFrame
       layout + spacing 재계산
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

좌표 간격은 `node size + external gap`으로 계산한다. 최초 배치는 밀도 프리셋의 fallback 크기를 사용하고, 렌더 후에는 React Flow가 측정한 노드별 실제 크기를 사용한다. 노드 padding이나 글자 크기는 여기서 다루지 않는다.

세로·가로 배치는 단계별 최대 실제 크기를 기준으로 다음 단계의 시작 좌표를 계산한다. 단계 간 여백은 `workspaceLabSmoothStepMinimumGap`보다 작아질 수 없다. SmoothStep의 `offset`이나 `centerClearance`를 바꿀 때 `edge-routing.ts`와 관련 테스트를 함께 수정한다.

형제 방향은 고정 slot 크기 대신 각 subtree가 실제로 차지하는 길이를 계산한다. 따라서 콘텐츠가 긴 형제와 짧은 형제를 섞어도 서로 겹치지 않아야 한다.

### Visual slot 추가

연결 포인트, 접기 버튼, 캔버스처럼 독립적으로 교체할 요소는 다음 패턴을 따른다.

1. `visual-slots.ts`에 definition과 registry를 둔다.
2. registry에서 ID 타입을 파생한다.
3. `types.ts`에서 UI가 사용할 alias를 export한다.
4. `WorkspaceLab.tsx`에 선택 상태와 기본값을 둔다.
5. Inspector에 제어 항목을 연결한다.
6. renderer에는 의미 있는 prop 또는 `data-*` 값으로 전달한다.
7. CSS와 단위 테스트를 추가한다.

프리셋 정의에는 이름과 설명을 포함해 Inspector가 구현 세부사항 없이 옵션을 그릴 수 있게 한다.

연결선은 하나의 묶음 프리셋으로 만들지 않고 `edge-styles.ts`의 원자 슬롯으로 구성한다.

- `line style`: 레이아웃 기본, 직선, 직각, 둥근 직각, 곡선
- `pattern`: 실선, 점선, 도트
- `thickness`: Hairline, Regular, Strong
- `color`: 테마 token 기반 색상
- `opacity`: 선 전체의 시각적 강도
- `effect`: 그림자, 대비선, 방향성 fade처럼 별도 SVG 표현이 필요한 효과

새 연결선 옵션은 다른 다섯 속성을 암묵적으로 변경하지 않아야 한다. 상태 표현인 `active`와 `traced`는 선택된 조합 위에 의미 색상과 최소 두께를 덧씌운다.

`workspaceLabEdgeStylePresets`는 위 원자 속성의 추천 조합이다. Inspector의 제안 스타일 dropdown은 preset 값을 한 번에 적용하지만 별도의 preset 상태를 저장하지 않는다. 현재 원자 속성과 일치하는 preset을 매번 역으로 찾으며, 일치하는 항목이 없으면 `custom`으로 표시한다. 커스텀 제어 영역은 기본적으로 접어두어 Inspector의 정보 밀도를 낮춘다.

### 노드 밀도 추가

`workspaceLabNodeDensities`는 노드 내부 표현과 실제 크기를 함께 정의한다. CSS 변수는 `getWorkspaceLabNodeDensityStyle`, layout용 크기는 `getWorkspaceLabNodeSize`에서 파생한다.

밀도 프리셋을 추가하거나 필드를 바꾸면 다음 값이 서로 일치하는지 확인한다.

- CSS가 렌더링하는 최소 너비와 높이
- layout이 사용하는 width와 height
- 원형 노드의 지름
- padding과 label font size

밀도 변경으로 노드가 커져도 외부 배치 간격의 의미는 유지되어야 한다.

`getWorkspaceLabNodeSize`의 결과는 실제 렌더 크기가 아니라 측정 전 fallback이다. 콘텐츠 변경과 줄바꿈은 `onNodesChange`의 `dimensions` 신호로 수집하며, 같은 프레임의 여러 측정은 한 번의 layout 갱신으로 합친다.

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
