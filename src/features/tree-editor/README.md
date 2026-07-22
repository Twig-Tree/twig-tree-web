# Tree Editor

Tree Editor는 사용자 행동, 서버 상태 동기화, 편집기 초기화, 노드 배치 및 React Flow 연결을 하나의 Feature에서 함께 다룬다. 서로 다른 생명주기와 변경 이유를 가진 로직이 한 디렉터리에 섞이지 않도록 `model`을 책임별로 나눈다.

## model 책임

- `actions`: 노드 추가·삭제 같은 사용자 행동을 mutation과 editor store에 연결한다. 페이지에는 개별 행동 훅 대신 `useTreeEditorActions` facade를 제공한다.
- `initialization`: 서버에서 조회한 트리 데이터를 editor store의 초기 상태로 반영한다.
- `layout`: 노드와 edge의 배치를 계산하고 편집기 viewport를 조정한다.
- `react-flow`: React Flow가 요구하는 인터페이스와 Tree Editor store 사이를 연결한다.
- `treeStore.ts`: 편집 중인 노드, edge 및 history를 관리한다.
- `types.ts`: Tree Editor에서 사용하는 node와 edge 타입을 정의한다.

## 레이어 선택 배경

Tree Editor는 여러 UI 요소와 편집 기능을 조합해 하나의 큰 화면 영역을 구성하므로 역할만 보면 `widgets` 레이어가 자연스럽다. 하지만 편집기 전용 상태와 노드 추가·삭제 같은 행동이 서로 긴밀하게 의존한다. 이를 Widget과 여러 Feature로 분리하면 Feature가 Widget의 상태나 로직을 참조할 수 없어 FSD의 하위 레이어 참조 규칙을 위반하거나, 규칙을 지키기 위해 상태와 인터페이스를 여러 슬라이스로 나누어 전달해야 한다.

현재는 참조 규칙을 지키면서 불필요한 경계와 연결 복잡도를 늘리지 않기 위해 Tree Editor 전체를 하나의 Feature로 두었다. 대신 규모가 큰 내부 로직은 `model` 아래에서 `actions`, `initialization`, `layout`, `react-flow` 책임으로 구분한다. 이는 모든 Feature에 적용하는 공통 규칙이 아니라 Tree Editor의 응집도와 레이어 의존성을 고려한 예외적인 선택이다.

외부 레이어는 내부 경로를 직접 참조하지 않고 루트 `index.ts`의 공개 API를 사용한다.
