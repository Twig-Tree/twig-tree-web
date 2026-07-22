# Tree Editor Action Model Convention

## 목적

Tree editor action hook은 사용자 이벤트를 기준으로 React Query cache와 Zustand editor store를 함께 갱신하는 흐름을 관리한다.

Tree editor에는 두 가지 상태 계층이 있다.

- React Query cache: 서버 응답 형태의 `NodeDTO` 데이터를 관리한다.
- Zustand editor store: React Flow에서 사용하는 `CustomEditorNode`, `CustomEditorEdge` 데이터를 관리한다.

두 계층은 데이터 모델과 책임이 다르므로, optimistic update와 실패 복구도 각 계층에 맞는 방식으로 처리한다.

## Action Handler의 책임

`handleAddNode`, `handleDeleteNode` 같은 handler는 사용자 이벤트를 처리하는 진입점이다.

Action handler에서는 필요에 따라 다음 함수를 함께 호출한다.

- `addNodeToStore`, `deleteNodeFromStore` 같은 store action
- `useAddNodeMutation`, `useDeleteNodeMutation` 같은 mutation hook

store action은 editor 화면을 즉시 갱신하고, mutation hook은 서버 요청과 React Query cache 동기화를 담당한다.

## Mutation Hook과 Action Hook의 책임 분리

Mutation hook은 서버 상태와 React Query cache를 관리한다.

예를 들어 `useAddNodeMutation`은 다음을 담당한다.

- `onMutate`: query cache에 임시 `NodeDTO`를 추가한다.
- `onSuccess`: query cache의 임시 노드를 서버가 반환한 노드로 교체한다.
- `onError`: query cache를 이전 상태로 복구한다.

Action hook은 editor store 상태와 UI action별 동작을 관리한다.

예를 들어 `useAddNode`는 다음을 담당한다.

- 임시 React Flow node/edge를 생성한다.
- Zustand editor store에 임시 node/edge를 추가한다.
- 성공 시 임시 editor id를 서버 id로 교체한다.
- 실패 시 editor store를 undo로 복구한다.
- 사용자에게 보여줄 에러 메시지를 처리한다.

사용자에게 보여주는 알림은 보통 action hook 호출부에서 처리한다. 이렇게 해야 같은 mutation hook을 여러 곳에서 재사용할 때 중복 alert를 피할 수 있다.

## Optimistic Update 규칙

Optimistic update는 각 상태 계층에 맞는 데이터 형태로 적용한다.

- Query cache에는 optimistic `NodeDTO`를 넣는다.
- Editor store에는 optimistic `CustomEditorNode`, `CustomEditorEdge`를 넣는다.

서버가 생성된 노드를 반환하면 query cache는 임시 DTO 전체를 서버 DTO로 교체해도 된다. 반면 editor store는 서버가 실제로 보정한 값만 반영한다.

예를 들어 노드 추가 성공 시 editor store에서는 임시 id를 실제 id로 교체하되, React Flow layout 정보는 유지한다.

## 실패 복구 규칙

현재 action hook의 editor store 실패 복구는 별도 rollback store action이 아니라 `undo()`를 사용한다.

따라서 다음 전제가 필요하다.

- add/delete mutation이 pending인 동안 다른 편집 action이 끼어들지 않아야 한다.
- pending 중에는 add/delete 버튼, undo/redo 버튼, React Flow drag/connect/reconnect/select 같은 편집 입력을 막는다.
- `undo()`가 복구해야 하는 history의 마지막 항목은 방금 실패한 optimistic update여야 한다.

이 전제를 만족하면 실패 시 다음처럼 처리한다.

```ts
onError: () => {
  useTreeStore.temporal.getState().undo();
  alert("노드 추가에 실패했습니다.");
};
```

`rollbackAddNode`, `rollbackDeleteNode` 같은 별도 store action은 두지 않는다. 실패 복구가 여러 상태를 직접 조립하기보다, optimistic update로 쌓인 history를 되돌리는 방식으로 통일한다.

## History와 isDirty 규칙

`isDirty`는 단순한 미저장 변경 플래그가 아니라, `useInitializeTree`가 같은 tree를 다시 초기화하지 않도록 막아 editor layout을 보호하는 가드 역할도 한다.

따라서 다음 규칙을 지킨다.

- 서버 요청이 성공했다는 이유만으로 `isDirty`를 `false`로 바꾸지 않는다.
- 임시 editor id를 서버 id로 교체할 때는 `isDirty`를 유지한다.
- 실패한 optimistic update를 `undo()`로 복구할 때 `isDirty`도 함께 복구되어야 한다.
- React Flow의 selection-only change는 dirty로 보지 않는다.

`undo()`로 실패 복구를 단순화하려면 zundo history에 `nodes`, `edges`와 함께 `isDirty`도 포함하는 것이 좋다.

```ts
partialize: (state) => ({
  nodes: state.nodes,
  edges: state.edges,
  isDirty: state.isDirty,
}),
```

## Pending 중 편집 잠금

실패 시 `undo()`를 사용하는 구조에서는 pending 중 편집 잠금이 중요하다.

페이지나 editor boundary에서는 add/delete pending 상태를 묶어 interaction disable 값을 만든다.

```ts
const isMutating = isAddingNode || isDeletingNode;
```

그리고 React Flow와 버튼에 같은 기준을 적용한다.

```tsx
<ReactFlow
  nodesDraggable={!isMutating}
  nodesConnectable={!isMutating}
  edgesReconnectable={!isMutating}
  elementsSelectable={!isMutating}
/>
```

Undo/Redo도 pending 중에는 막는다.

```tsx
<button disabled={!canUndo || isMutating}>Undo</button>
<button disabled={!canRedo || isMutating}>Redo</button>
```

## 이름 규칙

이름은 어떤 계층의 동작인지 드러나야 한다.

- 사용자 이벤트 handler: `handleAddNode`, `handleDeleteNode`
- Action hook: `useAddNode`, `useDeleteNode`
- Server mutation hook: `useAddNodeMutation`, `useDeleteNodeMutation`
- Store action: `addNodeToStore`, `deleteNodeFromStore`

`onAdd`, `onDelete`처럼 범용적인 이름은 domain store action에는 사용하지 않는다. `on*` 이름은 React Flow의 `onNodesChange`, `onEdgesChange` 같은 framework callback 성격에 남겨둔다.

## Cache와 Store 분리

Mutation hook은 서버 상태와 React Query cache를 관리한다.

Action hook은 editor store 상태와 UI interaction state를 관리한다.

두 계층에 같은 논리 변경이 필요하더라도, 한쪽 데이터 모델을 다른 쪽에 억지로 재사용하지 않는다. 각 계층에 맞는 형태로 각각 업데이트한다.

## onSuccess와 onError 위치

Mutation 선언부의 callback은 cache-level 동작을 담당한다.

Mutation 호출부의 callback은 action-specific editor store 동작을 담당한다.

노드 추가 기준 책임은 다음과 같다.

- `useAddNodeMutation.onSuccess`: query cache를 업데이트한다.
- `useAddNodeMutation.onError`: query cache를 복구한다.
- `useAddNode`의 call-site `onSuccess`: editor store의 node id와 edge를 업데이트한다.
- `useAddNode`의 call-site `onError`: editor store를 undo로 복구한다.

노드 삭제처럼 서버 응답만으로 최종 cache 상태를 확정하기 어렵다면 `onSettled`에서 `invalidateQueries`로 서버 상태와 다시 동기화한다.

## 새 Action Hook 추가 체크리스트

`useDeleteNode` 같은 새 action hook을 추가할 때는 다음을 확인한다.

- 이 action이 React Query cache를 변경하는가?
- 이 action이 Zustand editor store를 변경하는가?
- Optimistic update가 필요한가?
- 실패 시 `undo()` 복구가 안전하도록 pending 중 다른 편집이 막혀 있는가?
- `isDirty`를 변경해야 하는가, 유지해야 하는가, 복구해야 하는가?
- 사용자-facing 에러를 어디에서 보여줄 것인가?
- 서버 성공 후 cache를 직접 보정할 수 있는가, 아니면 invalidate가 필요한가?

`useTreeEditorActions`는 page-level consumer를 위한 얇은 facade로 유지한다. 각 action의 세부 구현을 직접 소유하지 않고 action hook을 조합해 화면에서 쓰기 좋은 handler를 노출한다.

## 예시: Add Node

`useAddNode`는 임시 editor node/edge를 만들고 `useAddNodeMutation`을 호출한다.

성공 시:

- Query cache는 임시 DTO를 서버 DTO로 교체한다.
- Editor store는 임시 node id와 연결된 edge target을 서버 id로 교체한다.
- Editor layout과 `isDirty`는 유지한다.

실패 시:

- Query cache는 이전 `NodeDTO[]`로 복구한다.
- Editor store는 `undo()`로 optimistic add를 되돌린다.

## 예시: Delete Node

`useDeleteNode`는 선택된 노드와 하위 노드 id를 수집한 뒤 editor store에서 먼저 제거하고 `useDeleteNodeMutation`을 호출한다.

성공 시:

- Editor store는 optimistic delete 상태를 유지한다.
- Query cache는 필요하면 `invalidateQueries`로 서버 상태와 다시 맞춘다.

실패 시:

- Query cache는 이전 `NodeDTO[]`로 복구한다.
- Editor store는 `undo()`로 optimistic delete를 되돌린다.
