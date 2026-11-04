# Workspace Lab 구현 가이드

이 디렉터리는 Workspace 트리 UI를 조합식으로 실험하는 개발 전용 widget이다. Lab의 목적과 제품 코드와의 경계는 [`docs/workspace-ui-lab.md`](../../../docs/workspace-ui-lab.md)를 먼저 참고한다.

## 구조

```text
workspace-lab/
├── model/
│   ├── config.ts          # Inspector가 바꾸는 실험 조합과 reducer
│   ├── scenarios.ts       # 재현 가능한 트리 fixture
│   ├── layouts.ts         # 세로·가로·방사형 좌표와 배치 간격
│   ├── edge-routing.ts    # 직각 연결선의 기하학적 제약
│   ├── edge-styles.ts     # 형태, 패턴, 두께, 색상, 투명도, 효과 registry
│   ├── design-themes.ts   # 여러 슬롯을 묶은 디자인 테마 registry와 적용·수정 판단
│   ├── color-themes.ts    # 컬러 테마 token schema와 registry
│   ├── color-roles.ts     # 컬러 테마 위에 덧씌우는 역할별 색 선택 registry
│   ├── shape-styles.ts    # 곡률과 그림자 registry
│   ├── node-shapes.ts     # 노드 외곽 형태 registry
│   ├── visual-slots.ts    # edge, port, collapse, canvas, density registry
│   ├── panels.ts          # 왼쪽·메모 패널의 배치, 너비, 표면, 경계, 밀도 registry
│   └── types.ts           # Lab에서 공유하는 타입
├── ui/
│   ├── WorkspaceLab.tsx           # 조합 상태와 Preview
│   ├── WorkspaceLabInspector.tsx  # Inspector 탭과 구획 배치
│   ├── inspector/
│   │   ├── InspectorTabs.tsx      # 구조·스타일·화면 영역 탭
│   │   ├── InspectorFields.tsx    # 구획 틀과 공용 입력 컴포넌트
│   │   ├── DesignThemeField.tsx   # 헤더의 디자인 테마 선택기
│   │   ├── types.ts               # 구획 공통 props
│   │   └── *Section.tsx           # 구획별 제어 항목
│   ├── WorkspaceLabNode.tsx       # Lab 전용 node renderer
│   ├── WorkspaceLabEdge.tsx       # Lab 전용 edge renderer
│   └── WorkspaceLab.module.css    # token 소비와 slot 표현
└── index.ts
```

개발 route는 `app/(dev)/dev/workspace-lab/page.tsx`에 있다. route가 production에서 차단되더라도 Lab 모듈은 운영 기능의 dependency로 사용하지 않는다.

## 상태 흐름

Inspector가 바꾸는 값은 `model/config.ts`의 `WorkspaceLabConfig` 한 객체에 모여 있다. `WorkspaceLab`은 `useReducer(workspaceLabConfigReducer)`로 이 객체를 들고, Preview에는 `config`를, Inspector의 각 구획에는 `config`와 `onChange(바꿀 필드)`를 내려준다. 구획 사이의 규칙(컬러 테마를 바꾸면 색 역할 초기화)은 reducer가 맡는다.

Inspector는 "무엇을 결정하는가"로 탭을 나눈다. 새 구획은 이 기준으로 탭을 고른다.

| 탭        | 결정하는 것               | 구획                             |
| --------- | ------------------------- | -------------------------------- |
| 구조      | 어떤 트리를 어떻게 펼칠지 | 시나리오, 레이아웃, 상태         |
| 스타일    | 트리를 어떻게 그릴지      | 컬러, 형태, 캔버스, 노드, 연결선 |
| 화면 영역 | 트리 주변에 무엇을 둘지   | 화면 요소, 왼쪽 패널, 메모 패널  |

숨긴 탭도 마운트를 유지해, 펼쳐 둔 세부 설정이 탭을 오가도 접히지 않는다.

디자인 테마 선택기는 탭 위 헤더에 둔다. 스타일 탭과 화면 영역 탭의 값을 함께 바꾸므로 어느 한 탭에 속하지 않는다.

"수정됨"의 기준은 현재 디자인 테마 하나다. 되돌리는 범위에 따라 세 가지를 둔다.

| 위치              | 비교 대상                        | 누르면                               |
| ----------------- | -------------------------------- | ------------------------------------ |
| 구획 제목 옆 배지 | 그 구획이 책임지는 테마 값       | 그 구획만 테마 값으로                |
| 헤더 테마 옆 배지 | 테마가 정하는 값 전체            | 테마 전체를 다시 적용                |
| 헤더 전체 초기화  | `workspaceLabDefaultConfig` 전체 | 구조·화면 영역까지 Lab 기본 조합으로 |

구획과 테마 값의 대응은 `design-themes.ts`의 `designThemeSectionKeys`가 정한다. 테마에 새 값을 넣으면 이 표에도 구획을 정해 준다.

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

### 테마 용어

Lab의 "테마"는 범위에 따라 둘로 나눈다.

| 용어        | 범위                                                                   | 정의 위치          |
| ----------- | ---------------------------------------------------------------------- | ------------------ |
| 컬러 테마   | 색 토큰만. 그 위에 색 역할이 덧씌워진다                                | `color-themes.ts`  |
| 디자인 테마 | 컬러 테마, 형태, 노드, 연결선, 캔버스, 패널 표현을 묶은 이름 있는 조합 | `design-themes.ts` |

곡률과 그림자는 색이 아니므로 컬러 테마에 두지 않고 `shape-styles.ts`의 형태 슬롯으로 둔다.

### 디자인 테마 추가

`design-themes.ts`의 `workspaceLabDesignThemes`에 각 슬롯의 id를 묶어 정의한다. 패널은 표면·경계·밀도만 정한다.

디자인 테마에 넣지 않는 항목은 다음과 같다. 테마를 바꿔도 사용자가 고른 값이 남는다.

- 구조 탭의 시나리오·레이아웃·상태
- viewport와 툴바·플레이어·패널 표시 여부
- 패널 배치와 너비

`config.designTheme`은 마지막으로 적용한 디자인 테마다. 그 뒤 테마가 정하는 값을 하나라도 바꾸면 `isWorkspaceLabDesignThemeModified`가 수정됨으로 판단한다. 같은 테마를 다시 고르면 테마 값으로 되돌아간다. 첫 디자인 테마는 `workspaceLabDefaultConfig`와 같은 조합이어야 하며, 테스트가 이를 확인한다.

### 컬러 테마 추가

1. `color-themes.ts`에서 기존 token 집합을 펼친 뒤 필요한 값만 덮어쓴다.
2. `workspaceLabColorThemes` registry에 새 정의를 추가한다.
3. 새 색상 책임이 필요하면 `WorkspaceLabColorThemeTokens`와 `tokenCssVariables`를 함께 확장한다.
4. CSS에서는 직접 색을 추가하기보다 `--lab-*` 변수를 소비한다.
5. 컬러 테마 테스트에서 모든 token이 CSS 변수로 변환되는지 확인한다.

컬러 테마에는 색만 둔다. 곡률, 그림자 모양, 연결선 종류처럼 독립적으로 비교할 항목을 컬러 테마 안에 숨기지 않는다. 예외로 `previewBackground`, `previewPattern`, `frameShadow`는 Workspace 바깥의 Lab 배경이라 컬러 테마에 남겨 둔다.

### 형태 추가

`shape-styles.ts`의 `workspaceLabShapeStyles`에 노드 곡률과 노드·루트·선택·툴바·플레이어 그림자를 정의한다. 그림자 색은 직접 쓰지 않고 컬러 테마의 `--lab-shadow-ink`를 `color-mix`로 섞는다. 그래야 어떤 컬러 테마와 조합해도 그림자가 바탕색과 어긋나지 않는다. 테스트가 그림자 값에 직접 쓴 색이 없는지 확인한다.

### 색 역할 추가

컬러 테마는 색의 출발점이고, `color-roles.ts`의 역할 선택이 그 위에 덧씌워진다. 역할은 중립 톤, 강조색, 루트 노드, 상태 색, 크롬, 대비 여섯 개다. 각 역할의 첫 선택지는 `theme`(테마 기본)이고, 모두 `theme`이면 테마 토큰이 그대로 쓰인다.

- 선택지의 `apply`는 앞선 역할까지 덧씌운 토큰을 받아 바꿀 토큰만 돌려준다.
- `getWorkspaceLabColorTokens`는 neutral → accent → root → status → chrome → contrast 순서로 적용한다. 루트와 크롬이 새 강조색·중립 톤을 따라가고, 대비가 마지막 결과를 같은 비율로 조정하려면 이 순서를 지켜야 한다.
- 강조색은 고정 목록 대신 이전 강조색과 같은 값을 쓰던 토큰을 모두 바꾼다. 테마마다 강조색을 쓰는 토큰이 다르기 때문이다.
- 컬러 테마를 바꾸면 역할 선택은 테마 기본으로 돌아간다.
- Inspector 컬러 구획의 `수정됨 · 초기화`는 컬러 테마나 색 역할이 현재 디자인 테마와 다를 때 나타난다. `테마 기본` 견본은 자체 색이 없으므로 현재 테마 토큰의 같은 자리 색을 보여준다.

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
4. `config.ts`의 `WorkspaceLabConfig`에 필드를, `workspaceLabDefaultConfig`에 기본값을 둔다.
5. 해당하는 `ui/inspector/*Section.tsx`에 제어 항목을 연결한다.
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

React Flow의 `Background`로 표현 가능한 패턴은 `WorkspaceLabCanvasStyleDefinition.backgrounds`에 레이어 배열로 정의한다. 모눈처럼 보조선과 주선을 겹치는 프리셋은 레이어를 여러 개 둔다. 별도 질감이 필요한 프리셋은 캔버스의 `data-canvas`와 CSS로 표현한다.

패턴 색은 레이어 정의의 `color`가 정한다. CSS에서 `.react-flow__background`의 `fill`이나 `stroke`를 덮어쓰면 프리셋별 색 차이가 사라지므로 추가하지 않는다.

CSS 질감은 viewport와 함께 움직이지 않는다. 이동·확대 기준이 되어야 하는 패턴은 `Background` 레이어로 만들고, 시선 유도나 종이 결처럼 화면에 고정되어도 되는 표현만 CSS로 둔다.

레이어 책임은 다음과 같다.

- React Flow root: 테마의 캔버스 색과 별도 질감
- React Flow `Background`: 도트, 라인, 크로스 패턴 레이어
- `.react-flow__renderer`: 투명 유지

renderer에 불투명 배경을 주면 root의 페이퍼 질감이 가려지므로 추가하지 않는다.

### 패널 슬롯 추가

왼쪽 패널과 메모 패널은 `panels.ts`의 같은 registry를 쓰되 선택값은 각자 가진다. 한 패널을 바꿔도 다른 패널은 바뀌지 않는다.

- `placement`: 고정은 캔버스 옆에서 폭을 나누고, 플로팅은 캔버스 위에 절대 위치로 뜬다.
- `width`: 단계 이름은 공유하고 실제 px는 `sidebar`와 `memo`에 따로 둔다. 두 패널은 담는 정보가 달라 같은 단계에서도 너비가 다르다.
- `surface`: 테마 token(`--lab-panel-surface`, `--lab-canvas`, `--lab-surface-muted`)에서만 색을 가져온다.
- `border`: 구분선, 그림자, 없음. 표면색을 건드리지 않는다.
- `density`: 구획 여백, 목록 항목 여백, 글자 크기를 `getWorkspaceLabPanelStyle`이 CSS 변수로 만든다.

너비와 밀도는 inline style로, 배치·표면·경계는 패널 root의 `data-placement`, `data-surface`, `data-border`로 전달한다. 슬롯마다 다른 CSS 속성을 맡겨 어떤 조합에서도 앞선 선택을 지우지 않게 한다. 패널 안 여백은 Tailwind 여백 대신 `.workspace-preview-panel-section`이 `--lab-panel-padding`을 소비한다.

### 시나리오 추가

`scenarios.ts`에 최소한의 재현 데이터만 추가한다. 시나리오는 특정 스타일을 고정하지 않고 구조, node state, edge state의 검증 조건만 표현한다.

새 기능에 따라 fixture를 추가하기 전에 기존 `balanced`, `deep`, `dense`, `empty` 시나리오로 재현할 수 있는지 먼저 확인한다.

## 검증 체크리스트

- Inspector에서 새 옵션을 선택하고 다른 옵션과 독립적으로 바뀌는지 확인한다.
- 기본 조합을 새로고침해도 깨지지 않는지 확인한다.
- 세로, 가로, 방사형 배치를 모두 확인한다.
- Compact와 Spacious 밀도에서 노드가 겹치지 않는지 확인한다.
- 세로 + 촘촘하게 + 원형 노드에서 직각 연결선이 불필요하게 여러 번 꺾이지 않는지 확인한다.
- 각 캔버스 프리셋이 실제로 구분되어 보이는지 확인한다.
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
