# Tree Editor Action Model Convention

## 목적

Tree editor action hook은 사용자 이벤트를 기준으로 React Query cache와 Zustand editor store를 함께 갱신하는 흐름을 관리한다.

Tree editor에는 두 가지 상태 계층이 있다.

- React Query cache: 서버가 확정한 도메인 데이터 `TreeNode`를 관리한다. 서버 응답으로만 갱신한다.
- Zustand editor store: React Flow에서 사용하는 `CustomEditorNode`, `CustomEditorEdge` 데이터를 관리한다. 화면이 그리는 것은 이쪽이다.

화면이 store에서만 그려지므로 optimistic update도 store에서만 한다. cache가 화면에 도달하는 경로는 `useInitializeTree` 하나뿐이고 그마저 트리당 한 번만 실행되므로, cache를 추측으로 미리 바꿀 이유가 없다.

## Action Handler의 책임

`handleAddNode`, `handleDeleteNode` 같은 handler는 사용자 이벤트를 처리하는 진입점이다.

Action handler에서는 필요에 따라 다음 함수를 함께 호출한다.

- `addNodeToStore`, `deleteNodeFromStore` 같은 store action
- `useAddNodeMutation`, `useDeleteNodeMutation` 같은 mutation hook

store action은 editor 화면을 즉시 갱신하고, mutation hook은 서버 요청과 React Query cache 동기화를 담당한다.

## Mutation Hook과 Action Hook의 책임 분리

Mutation hook은 서버 상태와 React Query cache를 관리한다.

예를 들어 `useAddNodeMutation`은 다음을 담당한다.

- `onSuccess`: 서버가 반환한 `TreeNode`를 query cache에 반영한다.

`onMutate`와 `onError`는 두지 않는다. cache를 추측으로 미리 바꾸지 않으므로 되돌릴 것도 없다.

Action hook은 editor store 상태와 UI action별 동작을 관리한다.

예를 들어 `useAddNode`는 다음을 담당한다.

- 임시 React Flow node/edge를 생성한다.
- Zustand editor store에 임시 node/edge를 추가한다.
- 성공 시 임시 editor id를 서버 id로 교체한다.
- 실패 시 editor store를 undo로 복구한다.
- 사용자에게 보여줄 에러 메시지를 처리한다.

사용자에게 보여주는 알림은 보통 action hook 호출부에서 처리한다. 이렇게 해야 같은 mutation hook을 여러 곳에서 재사용할 때 중복 alert를 피할 수 있다.

## Optimistic Update 규칙

Optimistic update는 editor store에서만 한다.

- Editor store에는 optimistic `CustomEditorNode`, `CustomEditorEdge`를 넣는다.
- Query cache에는 넣지 않는다. 서버 응답을 받은 뒤에만 갱신한다.

서버 응답이 도착하면 editor store는 서버가 실제로 보정한 값만 반영한다.

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

### 예외: history에 기록되지 않는 action

`undo()` 복구는 해당 변경이 zundo history에 쌓여 있을 때만 성립한다. `treeStore`의 `handleSet`은 아래 두 조건에서만 history를 기록한다.

- 노드 또는 엣지 개수 변화
- `data.orderIndex` 변화

따라서 노드 제목 수정처럼 `data`의 다른 필드만 바꾸는 action은 history에 남지 않는다. 이때 `undo()`를 호출하면 방금 실패한 변경이 아니라 그 앞의 추가·삭제가 되돌려지므로 **써서는 안 된다.**

이런 action은 handler가 변경 전 값을 보관했다가 직접 되돌린다.

```ts
const previousLabel = /* 변경 전 label */;

updateNodeLabelInStore(nodeId, nextLabel);

try {
  await editNodeNameOnServer(...);
} catch {
  updateNodeLabelInStore(nodeId, previousLabel);
}
```

history에 남지 않으므로 **`undo()`가 엉뚱한 항목을 되돌리지 않게 하려는 목적의** 편집 잠금은 필요 없다. 페이지의 `isMutating`에 이 action의 pending을 합치지 않고, 편집 중인 입력만 비활성화한다.

직접 복구는 그 action이 바꾼 값만 되돌리고 전역 상태는 함께 되돌리지 않는다. 요청 시작 시점의 전역 상태를 복원하면 요청이 겹칠 때 나중 편집의 결과를 덮어쓰기 때문이다.

```text
노드 A 편집 → blur로 A 요청 발신 → 노드 B 편집 → B 요청 발신 → A 실패
                                                              → A 시작 전 전역 상태 복원 (B의 변경 소실)
```

노드 추가·삭제의 `undo()` 복구는 성격이 다르다. zundo history의 직전 스냅샷으로 `nodes`와 `edges`를 통째로 되돌리므로 값 단위가 아니다. 이쪽이 안전한 근거는 범위가 좁아서가 아니라 위 "실패 복구 규칙"의 전제, 즉 pending 중 다른 편집이 끼어들지 못하게 막는 데 있다.

새 action을 추가할 때는 그 변경이 `handleSet`의 기록 조건에 걸리는지 먼저 확인하고, 걸리지 않으면 `undo()` 대신 직접 복구를 쓴다.

## History와 초기화 가드

`useInitializeTree`는 `currentTreeId === treeId`이면 초기화를 건너뛴다. 초기화는 트리당 한 번만 일어난다. 재초기화는 모든 `position`을 원점으로 되돌리고 편집 내용까지 덮어쓰기 때문이다.

따라서 다음 규칙을 지킨다.

- cache가 갱신되어도 store를 다시 채우지 않는다. 서버 응답 반영은 cache에서 끝난다.
- 편집기를 벗어날 때만 `resetTree`로 store를 비운다. 그래야 재진입 시 초기화가 다시 일어나 그 사이의 서버 변경이 반영된다.
- zundo `partialize`에는 `nodes`와 `edges`만 담는다. 되돌릴 대상은 노드와 엣지뿐이다.

미저장 변경을 나타내는 플래그는 두지 않는다. 모든 action이 즉시 서버로 가므로 "저장 안 됨" 상태가 존재하지 않는다. 여러 변경을 묶어 저장하는 방식이 도입되면 그때 이탈 가드와 함께 다시 설계한다.

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

- 사용자 이벤트 handler: `handleAddNode`, `handleDeleteNode`, `handleSaveMemo`
- Action hook: `useAddNode`, `useDeleteNode`, `useUpdateNodeName`
- Server mutation hook: `useAddNodeMutation`, `useDeleteNodeMutation`, `useEditNodeNameMutation`
- Store action: `addNodeToStore`, `deleteNodeFromStore`, `updateNodeLabelInStore`

`handle*`을 붙이는 기준은 인자 유무가 아니라 **이벤트나 콜백 prop에 연결되어 그 자체로 완결되는가**다. `handleSaveMemo(content)`처럼 인자를 받아도 호출부가 결과를 쓰지 않고 그대로 넘기면 handler다.

반면 호출부가 반환값을 받아 자기 흐름을 결정하는 함수는 동사형으로 둔다. `updateNodeName(name)`은 `Promise<boolean>`을 돌려주고, `CustomNode`의 `commitName`이 그 결과로 편집 종료와 에러 표시를 나눈다. 이런 함수는 handler가 아니라 handler가 조립해 쓰는 연산이다.

`onAdd`, `onDelete`처럼 범용적인 이름은 domain store action에는 사용하지 않는다. `on*` 이름은 React Flow의 `onNodesChange`, `onEdgesChange` 같은 framework callback 성격에 남겨둔다.

## Cache와 Store 분리

Mutation hook은 서버 상태와 React Query cache를 관리한다.

Action hook은 editor store 상태와 UI interaction state를 관리한다.

store의 node `data`는 cache와 같은 `TreeNodeData`를 그대로 재사용한다. 다만 `position`, `selected`처럼 서버가 모르는 값은 store에만 두고 cache로 올리지 않는다.

한쪽을 바꿨다고 다른 쪽을 따라 바꾸지 않는다. store는 사용자 입력으로, cache는 서버 응답으로 각각 갱신된다.

## onSuccess와 onError 위치

Mutation 선언부의 callback은 cache-level 동작을 담당한다.

Mutation 호출부의 callback은 action-specific editor store 동작을 담당한다.

노드 추가 기준 책임은 다음과 같다.

- `useAddNodeMutation.onSuccess`: 서버가 반환한 노드를 query cache에 반영한다.
- `useAddNode`의 call-site `onSuccess`: editor store의 node id와 edge를 업데이트한다.
- `useAddNode`의 call-site `onError`: editor store를 undo로 복구한다.

mutation 선언부에는 `onError`를 두지 않는다. cache를 미리 바꾸지 않았으므로 복구할 것이 없다.

노드 삭제처럼 응답 본문이 없어 cache를 직접 확정할 수 없다면 `invalidateQueries`로 다시 조회한다. 이때 `onSettled`가 아니라 `onSuccess`에 둔다. 실패한 경우에는 cache를 건드린 적이 없어 재조회할 이유가 없다.

## 새 Action Hook 추가 체크리스트

`useDeleteNode` 같은 새 action hook을 추가할 때는 다음을 확인한다.

- 이 action이 React Query cache를 변경하는가?
- 이 action이 Zustand editor store를 변경하는가?
- Optimistic update가 필요한가?
- 실패 시 `undo()` 복구가 안전하도록 pending 중 다른 편집이 막혀 있는가?
- 실패 복구가 `undo()`인가 직접 복구인가? 직접 복구라면 되돌릴 값을 그 action이 바꾼 범위로 한정했는가?
- 사용자-facing 에러를 어디에서 보여줄 것인가?
- 서버 성공 후 cache를 직접 보정할 수 있는가, 아니면 invalidate가 필요한가?

`useTreeEditorActions`는 page-level consumer를 위한 얇은 facade로 유지한다. 각 action의 세부 구현을 직접 소유하지 않고 action hook을 조합해 화면에서 쓰기 좋은 handler를 노출한다.

## 예시: Add Node

`useAddNode`는 임시 editor node/edge를 만들고 `useAddNodeMutation`을 호출한다.

성공 시:

- Query cache는 서버가 반환한 `TreeNode`를 배열 끝에 덧붙인다.
- Editor store는 임시 node id와 연결된 edge target을 서버 id로 교체한다.
- Editor layout은 유지한다.

실패 시:

- Query cache는 그대로 둔다. 추가된 적이 없다.
- Editor store는 `undo()`로 optimistic add를 되돌린다.

## 예시: Delete Node

`useDeleteNode`는 선택된 노드와 하위 노드 id를 수집한 뒤 editor store에서 먼저 제거하고 `useDeleteNodeMutation`을 호출한다.

성공 시:

- Editor store는 optimistic delete 상태를 유지한다.
- Query cache는 `invalidateQueries`로 서버 상태와 다시 맞춘다. 지워진 서브트리 범위를 cache에서 다시 계산하지 않기 위해서다.

실패 시:

- Query cache는 그대로 둔다. 지운 적이 없다.
- Editor store는 `undo()`로 optimistic delete를 되돌린다.

## 예시: Update Node Name

`useUpdateNodeName`은 입력값을 검증한 뒤 `updateNodeLabelInStore`로 label을 먼저 바꾸고 `useEditNodeNameMutation`을 호출한다.

성공 시:

- Query cache는 서버가 반환한 `TreeNode`로 해당 노드를 교체한다.
- Editor store도 서버가 반환한 `data.label`로 label을 다시 맞춘다. 서버가 제목을 보정하면 optimistic label을 그대로 두었을 때 cache와 화면이 갈리기 때문이다.

실패 시:

- Query cache는 그대로 둔다. 바꾼 적이 없다.
- Editor store는 보관해 둔 이전 label만 직접 되돌린다. `undo()`를 쓰지 않는다(위 "예외: history에 기록되지 않는 action" 참고).

이 action은 노드마다 다른 대상에 적용되므로 `useTreeEditorActions` facade에 넣지 않고 `CustomNode`가 직접 호출한다. 검증 메시지와 저장 실패 메시지도 alert이 아니라 노드 안의 문구로 보여주므로, action hook은 성공 여부만 반환하고 메시지 표시는 UI가 결정한다.
