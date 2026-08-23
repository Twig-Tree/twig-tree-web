# Tree Editor

Tree Editor는 사용자 행동, 서버 상태 동기화, 편집기 초기화, 노드 배치 및 React Flow 연결을 하나의 Feature에서 함께 다룬다. 서로 다른 생명주기와 변경 이유를 가진 로직이 한 디렉터리에 섞이지 않도록 `model`을 책임별로 나눈다.

## model 책임

- `actions`: 노드 추가·삭제 같은 사용자 행동을 mutation과 editor store에 연결한다. 페이지에는 개별 행동 훅 대신 `useTreeEditorActions` facade를 제공한다.
- `initialization`: 서버에서 조회한 트리 데이터를 editor store의 초기 상태로 반영한다.
- `layout`: 노드와 edge의 배치를 계산하고 편집기 viewport를 조정한다.
- `react-flow`: React Flow가 요구하는 인터페이스와 Tree Editor store 사이를 연결한다.
- `treeStore.ts`: 편집 중인 노드, edge 및 history를 관리한다.
- `types.ts`: Tree Editor에서 사용하는 node와 edge 타입을 정의한다.

## 노드 신원

편집기 노드의 `id`는 클라이언트가 정한다. 초기화 때는 `transformToFlowElements`가, 노드 추가 때는 `useAddNode`가 `createClientNodeId`로 만들고, 이 값은 세션 동안 바뀌지 않는다. 서버가 확정한 ID는 `data.serverId`에 담으며 아직 저장되지 않은 노드는 `null`이다.

두 값을 분리하는 이유는 두 가지다.

- **레이아웃이 한 번만 돈다.** 노드 `id`가 곧 서버 ID이면 응답이 도착할 때 ID를 교체해야 한다. 교체는 배치를 전혀 바꾸지 않으면서 구조 시그니처를 바꾸므로 ELK가 한 번 더 실행된다. ELK는 worker 없이 메인 스레드에서 동기로 돌기 때문에 그 시간 동안 입력이 멈춘다.
- **막는 대상이 편집이 아니라 서버 전송이 된다.** "서버에 아직 없다"는 판별이 `serverId === null`이므로 노드 ID의 생김새로 저장 여부를 추측하지 않는다.

이름은 `clientId`와 `serverId`로 구분한다. 예외는 React Flow가 이름을 소유하는 `Node.id` 하나이고, 거기 담기는 값이 곧 `clientId`다. 엣지의 `source`·`target`도 같은 신원을 가리킨다. `entities`는 노드를 가리키는 ID가 하나뿐이라 `nodeId`를 그대로 쓴다.

`serverId`가 아직 없는 노드에 대한 요청은 알림과 함께 막는다. 대기·큐 방식은 여러 편집을 묶어 저장하는 방식이 도입될 때 함께 정한다.

## 배열 순서와 레이아웃

`elkOptions`의 `considerModelOrder`가 `NODES_AND_EDGES`이므로 **노드와 엣지 배열의 순서가 형제 노드의 배치 순서를 결정한다.** 배열 순서는 단순 정렬 취향이 아니라 화면에 직접 드러나는 값이다.

정렬은 `transformToFlowElements`에서 `orderIndex` 기준으로 한 번만 수행한다. query cache는 순서를 약속하지 않으므로 mutation이 노드를 어느 위치에 넣어도 무방하다. 화면에 넘기기 직전에만 보장하면 되기 때문이다.

## 초기화 규칙

editor store 초기화는 트리당 한 번만 수행한다. `useInitializeTree`는 `currentTreeId === treeId`이면 건너뛴다.

재초기화는 세 가지를 무너뜨린다. `mapToVisualNodes`가 모든 `position`을 원점으로 되돌리므로 레이아웃이 다시 계산되어야 하고, 노드 신원도 새로 부여되므로 선택 상태와 편집 중인 대상을 가리키던 참조가 끊기며, 편집 중이라면 내용까지 덮어쓴다.

대신 편집기를 벗어날 때 `resetTree`로 store를 비운다. 비우지 않으면 재진입해도 초기화가 일어나지 않아 그 사이의 서버 변경이 화면에 반영되지 않는다. 이 호출은 마운트·언마운트 전용 effect에 둔다. 초기화 effect의 cleanup으로 붙이면 deps가 바뀔 때마다 store가 비워진다.

여러 변경을 묶어 저장하는 방식이 도입되면 언마운트가 곧 미저장 편집 폐기가 되므로 이 규칙을 재검토한다.

## 레이어 선택 배경

Tree Editor는 여러 UI 요소와 편집 기능을 조합해 하나의 큰 화면 영역을 구성하므로 역할만 보면 `widgets` 레이어가 자연스럽다. 하지만 편집기 전용 상태와 노드 추가·삭제 같은 행동이 서로 긴밀하게 의존한다. 이를 Widget과 여러 Feature로 분리하면 Feature가 Widget의 상태나 로직을 참조할 수 없어 FSD의 하위 레이어 참조 규칙을 위반하거나, 규칙을 지키기 위해 상태와 인터페이스를 여러 슬라이스로 나누어 전달해야 한다.

현재는 참조 규칙을 지키면서 불필요한 경계와 연결 복잡도를 늘리지 않기 위해 Tree Editor 전체를 하나의 Feature로 두었다. 대신 규모가 큰 내부 로직은 `model` 아래에서 `actions`, `initialization`, `layout`, `react-flow` 책임으로 구분한다. 이는 모든 Feature에 적용하는 공통 규칙이 아니라 Tree Editor의 응집도와 레이어 의존성을 고려한 예외적인 선택이다.

외부 레이어는 내부 경로를 직접 참조하지 않고 루트 `index.ts`의 공개 API를 사용한다.
