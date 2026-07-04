# TypeScript Comment Convention

TypeScript 코드의 주석은 타입 정보와 구현 의도를 함께 읽기 쉽게 만드는 것을 목표로 한다.

이미 타입 시스템이 표현하는 내용을 주석으로 반복하지 않는다. 대신 코드만으로 드러나기 어려운 의도, 책임, 예외 상황, 상태 전이 기준을 설명한다.

## 함수 주석

함수, hook, store action처럼 독립적인 책임을 가진 단위에는 함수 주석을 작성한다.

함수 주석에는 다음 항목을 적는다.

- 함수 이름
- 기능
- 인자
- 반환값

object parameter를 받는 함수는 `인자` 항목에 각 필드를 모두 나열하지 않고, parameter type 이름만 적는다. 필드별 설명은 type 선언부에서 작성한다.

```ts
/*
함수 이름 : useAddNodeAction
기능 : 선택된 노드의 자식 노드를 optimistic update로 editor store에 추가하고, 서버 요청 결과에 따라 store 상태를 보정하거나 rollback한다.
인자 : UseAddNodeActionParams
반환값 : 노드 추가 핸들러와 노드 추가 mutation 상태
*/
export const useAddNodeAction = ({
  treeId,
  selectedNode,
  nodes,
  edges,
}: UseAddNodeActionParams) => {
  // ...
};
```

인자가 원시값 한두 개뿐이고 별도 parameter type이 없다면 함수 주석의 `인자` 항목에 직접 설명할 수 있다.

```ts
/*
함수 이름 : getNextOrderIndex
기능 : 부모 노드의 기존 자식 노드 목록을 기준으로 다음 orderIndex를 계산한다.
인자 : string parentNodeId -> 기준 부모 노드 ID
CustomEditorNode[] nodes -> 현재 노드 목록
CustomEditorEdge[] edges -> 현재 엣지 목록
반환값 : 다음 자식 노드에 사용할 orderIndex
*/
export const getNextOrderIndex = (
  parentNodeId: string,
  nodes: CustomEditorNode[],
  edges: CustomEditorEdge[],
) => {
  // ...
};
```

## 파라미터 주석

object parameter의 필드는 type 또는 interface 선언부에서 문장 끝 주석으로 설명한다.

```ts
type UseAddNodeActionParams = {
  treeId: string; // 노드를 추가할 트리 ID
  selectedNode: CustomEditorNode | undefined; // 자식 노드를 추가할 기준 노드
  nodes: CustomEditorNode[]; // 현재 editor store의 노드 목록
  edges: CustomEditorEdge[]; // 현재 editor store의 엣지 목록
};
```

이 방식은 함수 시그니처와 인자 설명을 함께 읽을 수 있게 해준다.

필드 설명이 길어져 한 줄에서 읽기 어렵다면 필드 위 블록 주석을 사용할 수 있다. 단, 기본 방식은 문장 끝 주석이다.

```ts
type UseExampleParams = {
  /*
  서버 요청과 editor store rollback을 연결하기 위해 사용하는 임시 노드 ID
  */
  optimisticNodeId: string;
};
```

## 블록 주석

블록 주석은 여러 줄의 코드가 하나의 처리 단위를 이룰 때 사용한다.

블록 주석은 “무엇을 하는 코드인지”보다 “왜 이 단위가 필요한지”, “어떤 상태 전이를 만드는지”를 설명하는 데 집중한다.

```ts
/*
서버 응답을 기다리기 전에 editor store에 임시 노드와 엣지를 추가한다.
*/
addNodeToStore(newNode, newEdge);
```

```ts
/*
서버에서 실제 노드 ID를 받으면 editor store의 임시 노드 ID와 엣지 target을 실제 ID로 교체한다.
*/
useTreeStore.setState((state) => ({
  nodes: state.nodes.map((node) =>
    node.id === newNodeId ? { ...node, id: realNodeId } : node,
  ),
  edges: state.edges.map((edge) =>
    edge.target === newNodeId ? { ...edge, target: realNodeId } : edge,
  ),
}));
```

너무 당연한 구현 설명은 피한다.

```ts
/*
nodes를 map으로 순회한다.
*/
nodes.map(...)
```

위와 같은 주석은 코드가 이미 말하고 있으므로 작성하지 않는다.

## 문장 주석

문장 끝 주석은 한 줄짜리 보조 설명이 필요할 때만 사용한다.

좋은 사용 예시는 다음과 같다.

```ts
const parentId = Number(selectedNode.id); // 서버 요청에 사용할 부모 노드 ID를 숫자로 변환한다.
const newNodeId = `temp_${crypto.randomUUID()}`; // 서버 응답 전까지 사용할 임시 노드 ID를 생성한다.
const wasDirtyBeforeAdd = useTreeStore.getState().isDirty; // 실패 시 이전 dirty 상태로 복구하기 위해 저장한다.
```

문장 주석은 코드 오른쪽에 붙기 때문에 너무 길게 쓰지 않는다. 설명이 길어지면 블록 주석으로 올린다.

피해야 할 예시는 다음과 같다.

```ts
const label = `Added node ${nextOrderIndex}`; // label 변수를 만든다.
```

이런 주석은 코드가 이미 표현하는 내용을 반복하므로 작성하지 않는다.

## 작성 기준

주석을 작성할 때는 다음 기준을 따른다.

- 공개 hook, store action, 복잡한 utility에는 함수 주석을 작성한다.
- object parameter는 type/interface 필드 옆에 설명한다.
- 상태 전이, optimistic update, rollback, cache/store 분리처럼 맥락이 중요한 부분에는 블록 주석을 작성한다.
- 한 줄짜리 변환이나 임시값 생성처럼 보조 설명이 필요한 경우에만 문장 주석을 작성한다.
- 타입 이름, 변수 이름, 함수 이름만으로 충분한 내용은 주석으로 반복하지 않는다.

## 적용 예시

```ts
type UseAddNodeActionParams = {
  treeId: string; // 노드를 추가할 트리 ID
  selectedNode: CustomEditorNode | undefined; // 자식 노드를 추가할 기준 노드
  nodes: CustomEditorNode[]; // 현재 editor store의 노드 목록
  edges: CustomEditorEdge[]; // 현재 editor store의 엣지 목록
};

/*
함수 이름 : useAddNodeAction
기능 : 선택된 노드의 자식 노드를 optimistic update로 editor store에 추가하고, 서버 요청 결과에 따라 store 상태를 보정하거나 rollback한다.
인자 : UseAddNodeActionParams
반환값 : 노드 추가 핸들러와 노드 추가 mutation 상태
*/
export const useAddNodeAction = ({
  treeId,
  selectedNode,
  nodes,
  edges,
}: UseAddNodeActionParams) => {
  /*
  선택된 노드를 기준으로 새 자식 노드를 생성하고 서버에 노드 추가 요청을 보낸다.
  */
  const handleAddNode = () => {
    if (!selectedNode || isAddingNode) return;

    const parentId = Number(selectedNode.id); // 서버 요청에 사용할 부모 노드 ID를 숫자로 변환한다.
    if (Number.isNaN(parentId)) return;

    /*
    서버 응답을 기다리기 전에 editor store에 임시 노드와 엣지를 추가한다.
    */
    addNodeToStore(newNode, newEdge);
  };
};
```
