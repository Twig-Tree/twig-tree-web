# Tree Editor Action Model Convention

## 목적

Tree editor action hook은 사용자 이벤트를 기준으로 React Query cache와 Zustand editor store를 함께 갱신하는 흐름을 관리한다.

Tree editor에는 두 가지 상태 계층이 있다.

- React Query cache: 서버가 확정한 도메인 데이터 `TreeNode`를 관리한다. 서버 응답으로만 갱신한다.
- Zustand editor store: React Flow에서 사용하는 `CustomEditorNode`, `CustomEditorEdge` 데이터를 관리한다. 화면이 그리는 것은 이쪽이다.

화면이 store에서만 그려지므로 optimistic update도 store에서만 한다. cache가 화면에 도달하는 경로는 트리당 한 번 실행되는 `useInitializeTree`와, 이 탭의 요청이 모두 끝난 뒤 다른 곳의 변경을 반영하는 `useSyncExternalTreeChange`뿐이므로, cache를 추측으로 미리 바꿀 이유가 없다.

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

- React Flow node/edge를 생성한다. 노드의 신원은 이때 클라이언트가 정한다.
- Zustand editor store에 node/edge를 추가한다.
- 성공 시 서버가 확정한 id를 노드의 `data.serverId`에 채운다.
- 성공 시 undo 기록을 남긴다.
- 실패 시 editor store를 요청 전 구조로 되돌린다.
- 사용자에게 보여줄 에러 메시지를 처리한다.

사용자에게 보여주는 알림은 보통 action hook 정의부(=mutation hook 호출부)에서 처리한다. 이렇게 해야 같은 mutation hook을 여러 곳에서 재사용할 때 중복 alert를 피할 수 있다.

## Optimistic Update 규칙

Optimistic update는 editor store에서만 한다.

- Editor store에는 optimistic `CustomEditorNode`, `CustomEditorEdge`를 넣는다.
- Query cache에는 넣지 않는다. 서버 응답을 받은 뒤에만 갱신한다.

서버 응답이 도착하면 editor store는 서버가 실제로 보정한 값만 반영한다.

예를 들어 노드 추가 성공 시 editor store에서는 `data.serverId`와 서버가 보정한 값만 채우고, 노드 신원과 React Flow layout 정보는 그대로 둔다.

## 실패 복구 규칙

구조 편집(노드 추가·삭제·이동)과 undo/redo는 요청 전 `nodes`·`edges`를 보관했다가, 실패하면 `restoreStructureInStore`로 **구조만** 되돌린다.

```ts
const { nodes, edges } = useTreeStore.getState(); // 실패하면 이 구조로 되돌린다.

moveNodeInStore({ clientId, parentClientId, position });

moveNodeOnServer(variables, {
  onError: () => {
    restoreStructureInStore({ nodes, edges });
    alert("노드 이동에 실패했습니다.");
  },
});
```

구조는 노드 집합, 배열 순서, `orderIndex`, 엣지다. 지금 store에만 있는 노드는 먼저 반영한 추가이므로 빠지고, 보관한 값에만 있는 노드는 먼저 반영한 삭제이므로 보관한 값으로 되살아난다.

- **나머지 값은 지금 값을 둔다.** `label`·`memo`·`tagIds`와 선택·좌표가 해당한다. 구조 편집 요청 중에도 제목·메모·태그 편집은 막혀 있지 않아, 보관한 값으로 덮으면 그 사이 서버에 저장된 편집이 화면에서 사라진다.
- **이동을 반대로 다시 적용하지 않는다.** `moveNodeInStore`는 형제 `orderIndex`를 `1..n`으로 다시 매긴다. 서버는 삭제 뒤 순번을 다시 매기지 않아 `1, 2, 4`처럼 빈 번호가 있을 수 있는데, store만 다시 매기면 다음 추가의 `orderIndex`가 서버의 기존 노드와 겹쳐 `DUPLICATED_ORDER_ID`가 난다.
- **복구는 undo 기록에 손대지 않는다.** 기록은 요청이 성공한 뒤에만 남기므로 실패한 편집은 처음부터 기록에 없다.

이 복구가 안전한 근거는 요청 중 **구조 편집이 끼어들지 못하게** 막는 데 있다(아래 "Pending 중 편집 잠금"). 그 사이 다른 구조 편집이 반영되면, 보관한 구조로 되돌릴 때 그 편집까지 사라진다.

### 값 단위 편집은 바꾼 값만 되돌린다

노드 제목 수정과 태그 붙이기·떼기는 구조를 바꾸지 않는다. handler가 변경 전 값을 보관했다가 그 값만 직접 되돌린다.

```ts
const previousLabel = /* 변경 전 label */;

updateNodeLabelInStore(clientId, nextLabel);

try {
  await editNodeNameOnServer(...);
} catch {
  updateNodeLabelInStore(clientId, previousLabel);
}
```

이 action들은 구조를 보관해 되돌리지 않으므로 편집 잠금이 필요 없다. 페이지의 `isMutating`에 pending을 합치지 않고, 편집 중인 입력만 비활성화한다.

직접 복구는 그 action이 바꾼 값만 되돌리고 전역 상태는 함께 되돌리지 않는다. 요청 시작 시점의 전역 상태를 복원하면 요청이 겹칠 때 나중 편집의 결과를 덮어쓰기 때문이다.

```text
노드 A 편집 → blur로 A 요청 발신 → 노드 B 편집 → B 요청 발신 → A 실패
                                                              → A 시작 전 전역 상태 복원 (B의 변경 소실)
```

구조 복구가 `nodes`·`edges`를 보관한 값으로 되돌리면서도 안전한 것은 위의 편집 잠금과, 구조가 아닌 값은 지금 값을 두는 규칙 덕분이다.

## Undo/Redo

undo/redo는 화면만이 아니라 서버도 되돌린다. history는 `nodes`·`edges` 스냅숏이 아니라 **편집 단위 기록**이다. 스냅숏으로는 어떤 요청을 보내야 되돌아가는지 알 수 없기 때문이다.

### 기록

`history/editHistoryStore`가 `past`·`future` 스택을 가진다. 서버를 모르는 순수 store다.

| 기록     | 남기는 곳                     | 담는 값                                           |
| -------- | ----------------------------- | ------------------------------------------------- |
| `add`    | `useAddNode`의 `onSuccess`    | 노드, 부모, 제목·메모·태그                        |
| `move`   | `useMoveNode`의 `onSuccess`   | 노드, 옮기기 전 자리, 옮긴 뒤 자리                |
| `delete` | `useDeleteNode`의 `onSuccess` | 하위 트리 루트, 원래 자리, 지운 노드(data째)·엣지 |

- **기록은 노드를 `clientId`로만 가리킨다.** `clientId`는 세션 동안 바뀌지 않는다. 삭제를 되돌려 노드가 새 `serverId`로 다시 만들어져도 앞뒤 기록을 고칠 필요가 없다. `serverId`는 요청을 보낼 때 store에서 읽는다.
- **요청이 성공한 뒤에 기록한다.** 서버에 반영되지 않은 편집은 되돌릴 요청을 만들 수 없다.
- **새 편집을 기록하면 redo 기록을 비운다.**
- **제목·메모·태그 편집은 기록하지 않는다.** 텍스트 편집의 undo는 입력 단위부터 정해야 한다. 대신 추가·삭제 기록이 되살릴 때 쓰는 제목·메모·태그는 지울 때마다 그 시점의 값으로 고쳐 쓴다(`replaceLatestUndo`·`replaceLatestRedo`). 고쳐 쓰지 않으면 되살린 뒤 고친 메모가 다음 되살리기에서 옛 값으로 돌아간다.

### 실행

`undo-redo/useUndoRedo`가 기록을 꺼내 다른 action과 같은 흐름으로 처리한다.

1. `takeUndo`·`takeRedo`로 기록을 꺼내 반대편 스택으로 옮긴다.
2. editor store에 먼저 반영하고 서버에 요청한다.
3. 실패하면 요청 전 구조로 되돌리고 `cancelUndo`·`cancelRedo`로 기록을 원래 스택에 돌려놓는다. undo/redo가 일어나지 않은 상태가 된다.

| 기록     | undo                              | redo                     |
| -------- | --------------------------------- | ------------------------ |
| `add`    | 그 노드 삭제                      | 부모의 맨 끝에 다시 생성 |
| `move`   | 옮기기 전 자리로 이동             | 옮긴 뒤 자리로 다시 이동 |
| `delete` | 하위 트리 재생성 + 메모·태그 복원 | 같은 노드 다시 삭제      |

다시 만든 노드는 같은 `clientId`를 쓰고 `serverId`만 새로 채운다(`confirmCreatedNodeInStore`).

- **추가의 redo는 저장해 둔 순번이 아니라 지금 형제의 맨 끝으로 다시 만든다.** 서버는 삭제 뒤 순번을 다시 매기지 않아 처음 순번이 비어 있다는 보장이 없다. 처음 추가할 때도 맨 끝에 붙었고, 기록을 순서대로만 되돌리므로 놓이는 자리는 같다.
- **삭제의 undo는 노드마다 다시 만든다.** 서버에 복원·일괄 생성 API가 없다.
  1. 하위 트리 루트를 원래 부모의 맨 끝에 만든다. 원래 순번은 그 사이 다른 노드가 차지했을 수 있다.
  2. 원래 자리가 맨 끝이 아니면 그 자리로 옮긴다.
  3. 나머지 노드를 부모 → 자식 순서로 원래 순번에 만든다(`getSubtreeCreationOrder`). 새로 만든 부모 밑이라 순번이 겹치지 않는다.
  4. 노드를 만들 때마다 메모와 태그를 되살린다. 그 사이 트리에서 지워진 태그는 트리 태그 목록으로 걸러 건너뛴다. 목록이 아직 없거나 낡아서 서버가 `TAG404-1`(태그 없음)로 거절해도 그 태그만 화면에서 빼고 넘어간다. 지워진 태그 하나 때문에 하위 트리 전체를 되돌리지 않는다.
  5. 중간에 실패하면 만든 하위 트리 루트를 지운다. 하위 노드는 서버가 함께 지운다.
     루트를 옮긴 뒤에 실패했다면 구조를 복구한 뒤 이동 응답에서 루트만 뺀 형제 순번으로 맞춘다. 서버는 이동하면서 형제 순번을 다시 매기고 정리 삭제 뒤에는 다시 매기지 않아, 요청 전 순번으로 두면 다음 추가가 `DUPLICATED_ORDER_ID`로 거절된다.
- 추가의 redo도 노드 하나짜리 하위 트리를 맨 끝에 되살리는 것과 같아 같은 함수를 쓴다.
- 접힌 부모 밑으로 되살리거나 옮기면 노드가 숨겨지므로 부모를 먼저 펼친다.
- 요청 중에 편집기를 벗어난 뒤 실패하면 아무것도 되돌리지 않는다. store는 이미 다음 편집기의 트리로 채워져, 보관한 구조로 되돌리면 그 트리를 덮는다. 같은 워크스페이스에 다시 들어와도 노드 신원이 새로 만들어지므로 트리 ID가 아니라 편집기가 떠 있는지(`isMountedRef`)로 판단한다.
- undo/redo를 연타하면 다음 기록을 꺼내 요청이 겹친다. `useRef` 동기 가드를 둔다(아래 "pending 값은 연타를 막지 못한다").

### 기록을 비우는 때

- **트리 초기화와 편집기 이탈.** 기록은 `clientId`를 담는데, 다시 들어오면 노드 신원이 새로 만들어진다. `useInitializeTree`가 비운다.
- **루트 추가.** 루트는 지울 수 없어 되돌릴 요청이 없다. 트리 초기화처럼 편집의 시작점으로 둔다.

### 한계

- **삭제를 되돌리면 서버 ID가 바뀐다.** 노드를 새로 만들기 때문이다. 서버 ID로 저장하는 접힘 상태는 돌아오지 않는다.
- **요청 수가 많다.** 노드 N개, 메모 M개, 태그 T개인 하위 트리를 되살리면 요청이 대략 `N + 1 + M + T`번 순서대로 나간다.
- **정리 요청까지 실패하면 서버에 일부가 남는다.** 화면은 지운 상태로 돌아가고, 새로고침하면 남은 노드가 보인다. 이때는 기록을 돌려놓지 않고 모두 비운 뒤 새로고침을 안내한다. 돌려놓으면 다음 undo가 같은 하위 트리를 또 만들어 서버에 중복이 생기고, 화면과 서버가 어긋난 상태라 이전 기록도 믿을 수 없다.
- 다른 곳의 구조 변경과 겹친 undo/redo는 따로 맞추지 않는다. 요청이 거절되면 실패로 알린다. 다른 곳의 변경이 편집기에 반영되면 기록을 비운다(tree-editor README의 "다른 곳의 변경 반영").

## 초기화 가드

`useInitializeTree`는 `currentTreeId === treeId`이면 초기화를 건너뛴다. 초기화는 트리당 한 번만 일어난다. 다시 돌리면 모든 `position`을 원점으로 되돌리고 편집 내용까지 덮어쓰기 때문이다.

따라서 다음 규칙을 지킨다.

- action이 cache를 갱신해도 store를 다시 채우지 않는다. 서버 응답 반영은 cache에서 끝난다. 다른 곳의 변경을 반영하는 일은 `useSyncExternalTreeChange`만 한다.
- 편집기를 벗어날 때만 `resetTree`로 store를 비운다. 그래야 재진입 시 초기화가 다시 일어나 그 사이의 서버 변경이 반영된다.
- 초기화와 이탈 때 undo 기록도 함께 비운다.

미저장 변경을 나타내는 플래그는 두지 않는다. 모든 action이 즉시 서버로 가므로 "저장 안 됨" 상태가 존재하지 않는다. 여러 변경을 묶어 저장하는 방식이 도입되면 그때 이탈 가드와 함께 다시 설계한다.

## Pending 중 편집 잠금

실패 시 요청 전 구조로 되돌리는 구조에서는 pending 중 편집 잠금이 중요하다.

페이지나 editor boundary에서는 add/delete/move와 undo/redo의 pending 상태를 묶어 interaction disable 값을 만든다.

```ts
const isMutating =
  isAddingNode || isDeletingNode || isMovingNode || isUndoingOrRedoing;
```

그리고 React Flow와 버튼에 같은 기준을 적용한다. 엣지를 잇거나 끝을 옮기는 편집은 서버에 저장할 수 없어 pending과 상관없이 항상 막는다. 부모와 순서는 노드 드래그로 바꾼다.

```tsx
<ReactFlow
  nodesDraggable={!isMutating}
  nodesConnectable={false}
  edgesReconnectable={false}
  elementsSelectable={!isMutating}
/>
```

Undo/Redo도 pending 중에는 막는다.

```tsx
<button disabled={!canUndo || isMutating}>Undo</button>
<button disabled={!canRedo || isMutating}>Redo</button>
```

### pending 값은 연타를 막지 못한다

위 잠금은 **요청이 진행 중이라고 화면이 인지한 뒤**에만 걸린다. `isPending`도 버튼의 `disabled`도 렌더 시점 값이라, 리렌더 전에 도착한 다음 클릭은 아직 이전 값을 본다. 핸들러 첫 줄의 `if (... || isPending) return`도 같은 스냅샷을 읽으므로 함께 뚫린다.

브라우저에서 버튼을 빠르게 3번 눌러 확인한 결과는 다음과 같다.

| action    | 나간 요청                       | 이유                                                   |
| --------- | ------------------------------- | ------------------------------------------------------ |
| 루트 추가 | 트리 생성 3회 (201 + `409` 2회) | 가드가 뚫리고, 중복 요청이 같은 대상을 노린다          |
| 자식 추가 | 노드 생성 3회 (모두 201)        | 가드는 뚫리지만 클릭마다 다른 노드라 결과가 일관된다   |
| 노드 삭제 | 삭제 1회                        | optimistic 삭제로 선택이 풀려 `!selectedNode`에 걸렸다 |

삭제가 안전한 것은 pending 가드 덕분이 아니라 선택이 풀린 덕분이다. 코드만 봐서는 드러나지 않으므로 여기 적어 둔다.

따라서 **중복 요청이 같은 대상을 노리는 action에만** `useRef` 동기 가드를 둔다. 핸들러 진입 즉시 세우고 `finally`에서 내린다.

```ts
const isSubmittingRef = useRef(false);

const handleAddRootNode = async () => {
  if (nodes.length > 0 || isAddingRootNode || isSubmittingRef.current) return;

  isSubmittingRef.current = true;

  try {
    /* 요청 흐름 */
  } finally {
    isSubmittingRef.current = false;
  }
};
```

모든 action에 일괄로 두지는 않는다. 자식 추가처럼 클릭마다 대상이 달라지는 action은 연타로 여러 번 실행되는 것이 사용자가 누른 그대로다.

## 이름 규칙

이름은 어떤 계층의 동작인지 드러나야 한다.

- 사용자 이벤트 handler: `handleAddNode`, `handleDeleteNode`, `handleUndo`, `handleRedo`, `handleSaveMemo`, `handleDetachNodeTag`, `handleDeleteTreeTag`
- Action hook: `useAddNode`, `useDeleteNode`, `useMoveNode`, `useUndoRedo`, `useUpdateNodeName`, `useAttachNodeTag`, `useDetachNodeTag`, `useDeleteTreeTag`
- Server mutation hook: `useAddNodeMutation`, `useDeleteNodeMutation`, `useMoveNodeMutation`, `useEditNodeNameMutation`
- Store action: `addNodeToStore`, `addSubtreeToStore`, `confirmCreatedNodeInStore`, `deleteNodeFromStore`, `moveNodeInStore`, `applySiblingOrderInStore`, `restoreStructureInStore`, `updateNodeLabelInStore`, `addTagToNodeInStore`, `removeTagFromNodeInStore`, `removeTagFromAllNodesInStore`

`handle*`을 붙이는 기준은 인자 유무가 아니라 **이벤트나 콜백 prop에 연결되어 그 자체로 완결되는가**다. `handleSaveMemo(content)`처럼 인자를 받아도 호출부가 결과를 쓰지 않고 그대로 넘기면 handler다.

반면 호출부가 반환값을 받아 자기 흐름을 결정하는 함수는 동사형으로 둔다. `updateNodeName(name)`은 `Promise<boolean>`을 돌려주고, `CustomNode`의 `commitName`이 그 결과로 편집 종료와 에러 표시를 나눈다. 이런 함수는 handler가 아니라 handler가 조립해 쓰는 연산이다.

`moveNode(params)`도 동사형이다. 반환값은 없지만 이벤트에 바로 연결되지 않기 때문이다. 드래그 handler `onNodeDragStop`이 놓은 지점에서 목적지를 구하고 접힌 노드를 펼친 뒤 부르는 연산이다.

`onAdd`, `onDelete`처럼 범용적인 이름은 domain store action에는 사용하지 않는다. `on*` 이름은 React Flow의 `onNodesChange`, `onEdgesChange` 같은 framework callback 성격에 남겨둔다.

## Cache와 Store 분리

Mutation hook은 서버 상태와 React Query cache를 관리한다.

Action hook은 editor store 상태와 UI interaction state를 관리한다.

store의 node `data`는 도메인 타입 `TreeNode`에서 React Flow가 이미 소유하는 필드를 덜어낸 `EditorNodeData`다. `position`, `selected`처럼 서버가 모르는 값은 store에만 두고 cache로 올리지 않는다.

한쪽을 바꿨다고 다른 쪽을 따라 바꾸지 않는다. store는 사용자 입력으로, cache는 서버 응답으로 각각 갱신된다.

## onSuccess와 onError 위치

Mutation 선언부의 callback은 cache-level 동작을 담당한다.

Mutation 호출부의 callback은 action-specific editor store 동작을 담당한다.

노드 추가 기준 책임은 다음과 같다.

- `useAddNodeMutation.onSuccess`: 서버가 반환한 노드를 query cache에 반영한다.
- `useAddNode`의 call-site `onSuccess`: editor store 노드의 `data.serverId`와 서버가 보정한 값을 채우고 undo 기록을 남긴다.
- `useAddNode`의 call-site `onError`: editor store를 요청 전 구조로 되돌린다.

mutation 선언부에는 `onError`를 두지 않는다. cache를 미리 바꾸지 않았으므로 복구할 것이 없다.

예외는 실패 응답이 서버 상태를 확정해 주는 경우다. 노드 태그 추가의 `TAG409-2`(이미 붙어 있음)와 제거의 `TAG404-2`(연결 없음)는 요청은 실패했지만 서버가 원하던 상태에 있다는 뜻이다. 이때는 선언부 `onError`가 그 코드만 골라 `onSuccess`와 같은 cache 갱신을 한다. 복구가 아니라 확정된 상태의 반영이다. 반영하지 않으면 편집기를 다시 열 때 낡은 cache로 store를 채워, 붙인 태그가 사라지거나 뗀 태그가 되살아난다.

노드 삭제처럼 응답 본문이 없어 cache를 직접 확정할 수 없다면 `invalidateQueries`로 다시 조회한다. 이때 `onSettled`가 아니라 `onSuccess`에 둔다. 실패한 경우에는 cache를 건드린 적이 없어 재조회할 이유가 없다.

## 새 Action Hook 추가 체크리스트

`useDeleteNode` 같은 새 action hook을 추가할 때는 다음을 확인한다.

- 이 action이 React Query cache를 변경하는가?
- 이 action이 Zustand editor store를 변경하는가?
- Optimistic update가 필요한가?
- 구조를 바꾸는 action이라면 pending 중 다른 구조 편집이 막혀 있는가?
- 서버에 되돌릴 요청을 만들 수 있는 편집이라면 성공 후 undo 기록을 남기는가?
- 연타로 중복 요청이 나가면 같은 대상을 노리는가? 그렇다면 `useRef` 동기 가드를 두었는가?
- 실패 복구가 구조 복구인가 값 단위 직접 복구인가? 직접 복구라면 되돌릴 값을 그 action이 바꾼 범위로 한정했는가?
- 사용자-facing 에러를 어디에서 보여줄 것인가?
- 서버 성공 후 cache를 직접 보정할 수 있는가, 아니면 invalidate가 필요한가?

`useTreeEditorActions`는 page-level consumer를 위한 얇은 facade로 유지한다. 각 action의 세부 구현을 직접 소유하지 않고 action hook을 조합해 화면에서 쓰기 좋은 handler를 노출한다.

## 예시: Add Node

`useAddNode`는 editor node/edge를 만들고 `useAddNodeMutation`을 호출한다. 새 노드의 신원은 `createClientNodeId`로 이때 정해지고, `data.serverId`는 응답이 올 때까지 `null`이다.

성공 시:

- Query cache는 서버가 반환한 `TreeNode`를 배열 끝에 덧붙인다.
- Editor store는 노드의 `data.serverId`를 채운다. 노드 신원과 edge는 손대지 않는다.
- Editor layout은 유지한다.
- undo 기록을 남긴다.

실패 시:

- Query cache는 그대로 둔다. 추가된 적이 없다.
- Editor store는 추가 전 구조로 되돌린다. 추가한 노드와 엣지만 빠진다.

## 예시: Add Root Node

`useAddRootNode`는 노드가 하나도 없는 트리에 루트 노드를 추가한다. 트리가 없는 워크스페이스는 트리부터 만든다. 자식 추가와 같은 `handleAddNode`를 쓰며, `useTreeEditorActions`가 노드 개수로 둘을 나눈다. 화면에서는 빈 트리일 때 툴바의 노드 추가 버튼이, 노드가 있을 때 노드 우클릭 메뉴의 노드 추가가 이 handler를 부른다.

위 "Optimistic Update 규칙"의 예외다. editor store에 먼저 넣지 않고 서버 응답을 받은 뒤에 넣는다.

- 캔버스가 비어 있어 먼저 그려서 얻는 이득이 작다.
- 트리까지 만드는 경우 요청이 둘이라, 먼저 넣으면 중간 실패 시 되돌릴 경로가 갈린다.
- store를 건드리지 않았으므로 실패해도 되돌릴 것이 없다.
- 요청 중에는 `isAddingNode`에 합쳐 편집을 잠근다. 여기에 더해 `useRef` 동기 가드로 연타를 막는다(위 "pending 값은 연타를 막지 못한다").

트리당 루트는 하나다. 백엔드는 DB 유니크 인덱스로 막고 `409 NODE409-2`를 돌려주므로, 루트 추가는 노드가 0개일 때만 연다.

흐름:

```text
treeId가 null → 트리 생성 → 루트 노드 생성 → store 초기화(treeId + 루트) → 워크스페이스 상세 캐시에 treeId
treeId가 있음 →            루트 노드 생성 → store 초기화(treeId + 루트)
```

트리를 새로 만들지는 store가 아니라 페이지가 넘기는 `treeId`(워크스페이스 상세 캐시)로 판단한다. 루트 생성이 실패해 캐시만 채워진 직후에는 store의 `treeId`가 아직 `null`이라, store로 판단하면 트리를 다시 만들려다 `409 TREE409-1`이 난다.

### 상세 캐시는 store 반영 뒤에 채운다

캐시에 `treeId`가 들어가면 페이지가 새 `treeId`로 트리를 조회하고, 조회가 끝나면 `useInitializeTree`가 store의 `treeId`와 비교해 다르면 store를 덮는다. 캐시를 트리 생성 직후에 채우면 이 조회가 루트 노드 생성과 동시에 진행된다.

```text
1. 트리 생성 응답 → 캐시에 treeId "5"
2. 페이지 재렌더 → GET /trees/5/nodes 시작    ┐ 동시에 진행
3. POST /trees/5/nodes (루트) 시작             ┘
4. 서버: 루트 저장 → 조회 처리 (루트 포함)
5. 조회 응답 먼저 도착 → store treeId(null) ≠ "5" → useInitializeTree가 루트를 채움
6. 루트 생성 응답 도착 → 같은 루트를 또 넣음 → 중복
```

그래서 store를 `initializeTree`로 `treeId`와 루트까지 채운 뒤에 캐시를 채운다. 조회는 루트 생성이 끝난 뒤 시작되고, store의 `treeId`가 이미 같아 `useInitializeTree`는 건너뛴다.

이 순서 때문에 **컨벤션 예외**가 생긴다. 캐시 갱신은 원래 mutation 선언부 `onSuccess`에 두지만, 선언부는 응답 직후 실행되어 순서를 지킬 수 없다. `useCreateWorkspaceTreeMutation` 선언부는 상세 캐시를 채우지 않고, 캐시 모양을 아는 `entities/workspace`가 `useSetWorkspaceTreeIdInCache`를 제공해 이 hook이 호출 시점을 정한다.

성공 시:

- Tree query cache는 `useAddNodeMutation`이 서버가 반환한 `TreeNode`를 덧붙인다. 새 트리는 아직 캐시가 없어 건드리지 않는다.
- Editor store는 `initializeTree`로 `treeId`와 루트 노드 하나로 채운다. 엣지는 없고 위치는 레이아웃이 계산한다.
- undo 기록을 비운다. 루트는 지울 수 없어 되돌릴 요청이 없으므로 트리 초기화처럼 편집의 시작점으로 둔다.
- 트리를 새로 만들었다면 워크스페이스 상세 캐시에 `treeId`를 채운다.

실패 시:

- Editor store는 그대로 둔다. 바꾼 적이 없다.
- 트리 생성 후 루트 생성만 실패했다면 트리는 생겼으므로 상세 캐시에 `treeId`를 채운다. store에 루트가 없어 조회 결과로 채워져도 겹칠 노드가 없고, 다음 시도는 루트 생성만 한다.
- `409 TREE409-1`은 다른 곳에서 트리가 먼저 생긴 경우다. 응답에 `treeId`가 없어 `useCreateWorkspaceTreeMutation` 선언부가 상세 캐시를 무효화한다.
- `409 NODE409-2`는 다른 곳에서 루트가 먼저 생긴 경우다. store는 트리당 한 번만 채워지므로 새로고침을 안내한다.

## 예시: Delete Node

`useDeleteNode`는 선택된 노드와 하위 노드 id를 수집한 뒤 editor store에서 먼저 제거하고 `useDeleteNodeMutation`을 호출한다.

성공 시:

- Editor store는 optimistic delete 상태를 유지한다.
- 지운 하위 트리를 메모·태그까지 data째, 들어오던 엣지와 원래 자리와 함께 undo 기록으로 남긴다.
- Query cache는 `invalidateQueries`로 서버 상태와 다시 맞춘다. 지워진 서브트리 범위를 cache에서 다시 계산하지 않기 위해서다.

실패 시:

- Query cache는 그대로 둔다. 지운 적이 없다.
- Editor store는 삭제 전 구조로 되돌린다. 지운 노드는 삭제 전 값으로 되살아난다.

## 예시: Move Node

`useMoveNode`는 노드를 하위 트리째 목적지 부모 밑의 `position` 번째로 옮긴다. 같은 부모 안 순서 변경과 다른 부모로의 이동을 한 API(`PATCH /trees/{treeId}/nodes/{nodeId}/move`)로 처리한다. 목적지는 드래그를 놓은 지점에서 정해지므로 호출부(`useMoveNodeByDrag`)가 넘긴다.

`position`은 옮길 노드를 뺀 형제 사이의 순번이고 1부터 센다. 같은 부모에서 `[a, b, c, d]`의 a를 c 뒤로 옮기면 4가 아니라 3이다. 서버가 같은 부모면 `1..n`, 다른 부모면 `1..n+1`만 받기 때문이다.

요청 전에 막는 경우는 다음과 같다.

- 루트 이동. 형제가 없어 옮길 자리가 없다.
- 같은 자리로의 이동. 요청을 보내지 않는다.
- 옮길 노드나 새 부모가 저장 전(`serverId === null`)인 경우. 알림을 띄운다.

`moveNodeInStore`가 editor store에 먼저 반영한다. 부모가 바뀌면 들어오는 엣지의 `source`만 바꾸고 엣지 ID는 그대로 둔다. 노드 배열에서 형제 순서를 바꾸고, 형제의 `orderIndex`를 서버와 같은 규칙으로 `1..n`으로 다시 매긴다. 다른 부모로 옮기면 원래 형제도 다시 매긴다. 삭제로 생긴 빈 번호도 이때 함께 정리된다.

성공 시:

- Query cache는 응답의 목적지 형제(`siblings`)와 원래 형제(`previousSiblings`)로 해당 노드를 덮는다. 응답에 바뀐 노드가 모두 들어 있어 무효화하지 않는다. cache에 없는 노드는 다른 곳에서 만든 노드이므로 끝에 덧붙인다.
- Editor store는 `applySiblingOrderInStore`로 응답의 형제 순서에 `orderIndex`와 배열 순서를 맞춘다. 먼저 반영한 값과 같으면 바뀌지 않는다. 다른 탭의 편집으로 순서가 달랐을 때만 바뀐다. 응답에만 있는 노드는 store에 들이지 않는다.
- 옮기기 전 자리와 옮긴 뒤 자리를 undo 기록으로 남긴다.

실패 시:

- Query cache는 그대로 둔다. 바꾼 적이 없다.
- Editor store는 이동 전 구조로 되돌린다. 이동을 반대로 다시 적용하지 않는 이유는 위 "실패 복구 규칙"에 있다.
- 알림은 에러 코드로 나눈다. `NODE400-1`은 루트 이동, `NODE400-2`는 자기 자신이나 하위 노드 밑으로의 이동이다. `NODE400-3`은 화면의 형제 수로 계산한 순번이 서버 범위를 벗어난 경우로, 다른 곳에서 트리가 바뀐 것이므로 새로고침을 안내한다.

접힌 노드의 자식으로 옮기면 `useMoveNodeByDrag`가 `moveNode`보다 먼저 그 노드를 펼친다. 펼치지 않으면 옮긴 노드가 숨겨져 선택이 풀리고 메모 패널이 닫힌다. 이동이 실패해도 펼친 상태는 둔다. 접힘은 undo 대상이 아니다.

## 예시: Update Node Name

`useUpdateNodeName`은 입력값을 검증한 뒤 `updateNodeLabelInStore`로 label을 먼저 바꾸고 `useEditNodeNameMutation`을 호출한다.

성공 시:

- Query cache는 서버가 반환한 `TreeNode`로 해당 노드를 교체한다.
- Editor store도 서버가 반환한 `data.label`로 label을 다시 맞춘다. 서버가 제목을 보정하면 optimistic label을 그대로 두었을 때 cache와 화면이 갈리기 때문이다.

실패 시:

- Query cache는 그대로 둔다. 바꾼 적이 없다.
- Editor store는 보관해 둔 이전 label만 직접 되돌린다(위 "값 단위 편집은 바꾼 값만 되돌린다" 참고).

이 action은 노드마다 다른 대상에 적용되므로 `useTreeEditorActions` facade에 넣지 않고 `CustomNode`가 직접 호출한다. 검증 메시지와 저장 실패 메시지도 alert이 아니라 노드 안의 문구로 보여주므로, action hook은 결과(`saved`, `conflict`, `notFound`, `failed`)만 반환하고 메시지 표시는 UI가 결정한다.

## 이름·메모 저장과 version

노드마다 서버가 관리하는 `version`이 있어, 이름·메모를 저장할 때 함께 보낸다. 서버 값과 다르면 저장하지 않고 `409 NODE409-3`을 돌려준다. 확인과 저장을 서버가 한 번에 처리하므로 다른 곳의 수정을 조용히 덮어쓰지 않는다. 이름과 메모가 version 하나를 함께 쓰며, 이동과 태그 변경으로는 오르지 않는다.

- **보낼 값은 차례가 왔을 때 store에서 읽는다.** 편집을 시작할 때 따로 기억하면, 메모를 쓰는 중 이 탭에서 이름을 저장했을 때 자기 자신과 충돌한다. 편집 중에는 다른 곳의 변경 반영이 미뤄지므로 store 값은 이 탭의 저장으로만 바뀐다.
- **같은 노드의 저장은 순서대로 보낸다**(`runNodeSaveInOrder`). 이름 입력 중 메모 저장을 누르면 blur 저장과 클릭 저장이 연달아 나가, 겹치면 같은 version을 보낸 뒤쪽이 자기 탭의 앞 요청과 충돌한다.
- **서버가 확정한 값만 store에 넣는다.** 메모 삭제 응답에는 본문이 없어 보낸 version에 1을 더한다. 메모가 있을 때만 삭제를 보내므로 성공했다면 정확히 1 올랐다.
- 삭제를 되돌려 되살린 노드는 생성 응답의 version을 쓴다.

### 충돌했을 때

`useReloadConflictedNode`가 단일 노드 조회로 제목·메모·version을 함께 store에 맞춘다. version만 올리면 화면에 없는 다른 곳의 제목이나 메모를 다음 저장이 충돌 없이 덮어쓴다. 입력은 버리지 않고, 다시 저장하면 사용자가 알고 덮어쓰는 것이 된다.

- **이름**: 입력창과 값을 남기고 안내한다. Enter는 저장, Esc는 취소이고, blur로는 저장하지 않는다. blur로 저장하면 다른 곳을 누르는 순간 사용자의 결정 없이 덮어쓴다.
- **메모**: 초안을 남기고 패널에 안내한다. 되돌리기는 최신 메모를 보여 주고 저장은 덮어쓴다. 최신 값을 읽는 동안에는 mutation이 pending이 아니라 `useRef` 동기 가드로 연타를 막는다.
- **이름 저장의 충돌이 메모를 바꿀 때**: 열린 메모 초안에도 안내한다. 메모와 version이 함께 최신이 되어 다음 메모 저장은 서버가 거절하지 않으므로, 안내가 없으면 사용자가 모르는 채 덮어쓴다. 메모가 그대로면 덮어쓸 것이 없어 안내하지 않는다.

노드가 지워졌으면(`NODE404-1`) 알린다. 충돌과 노드 없음 모두 트리 전체를 다시 확인하도록 요청한다.

## 예시: Node Tag

노드 태그 action은 노드와 태그의 연결을 editor store에 먼저 반영하고 서버에 요청한다. 트리 태그 목록은 query cache가 원본이라 생성·삭제는 응답을 받은 뒤에 반영한다.

- `useAttachNodeTag`: 자동완성에서 고른 태그는 `attachTag(tagId)`로, 입력한 이름은 `attachTagByName(name)`으로 붙인다. 같은 이름의 트리 태그가 있으면 그것을, 없으면 서버에 새로 만든 뒤 응답의 ID로 붙인다. 두 함수는 요청 전에 거를 수 있는 실패(이름 길이, 개수 상한, 저장 전 노드)의 안내 문구(`string | null`)를 돌려주고, 입력창을 비울지 남길지는 호출부가 그 결과로 정하므로 `handle*`이 아니라 동사형이다. 서버 실패는 요청이 끝난 뒤에 알 수 있으므로 alert로 알린다.
- `useDetachNodeTag`: `handleDetachNodeTag(tagId)`로 노드와 태그의 연결만 끊는다. 트리 태그는 남는다.
- `useDeleteTreeTag`: `handleDeleteTreeTag(tagId)`로 붙은 노드 수를 알리고 확인을 받은 뒤 서버에서 지운다. 응답을 받으면 트리 태그 목록 cache와 트리 조회 cache는 mutation이, editor store의 모든 노드는 handler가 태그를 뺀다.

태그 store action은 `data.tagIds`만 바꾸므로 노드 이름 수정처럼 직접 복구를 쓴다. 붙이기가 실패하면 그 태그를 떼고, 떼기가 실패하면 다시 붙인다(위 "값 단위 편집은 바꾼 값만 되돌린다" 참고). 다시 붙인 태그는 원래 자리가 아니라 끝에 놓이고, 새로고침하면 서버 순서로 돌아온다.

서버의 거절은 에러 코드에 따라 나눠 처리한다. 서버가 이미 화면과 같은 상태라는 거절이면 되돌리지 않는다.

| 에러 코드  | 의미                           | 처리                                                                   |
| ---------- | ------------------------------ | ---------------------------------------------------------------------- |
| `TAG409-1` | 트리에 같은 이름의 태그가 있음 | 다른 곳에서 만든 태그이므로 목록을 다시 받아 그 태그를 붙인다          |
| `TAG409-2` | 노드에 이미 붙어 있음          | 되돌리지 않고, 트리 조회 cache는 mutation이 성공처럼 갱신한다          |
| `TAG409-3` | 노드당 태그 개수 초과          | 떼고 개수 상한을 안내한다                                              |
| `TAG404-2` | 노드에 연결되어 있지 않음      | 떼기에서 되돌리지 않고, 트리 조회 cache는 mutation이 성공처럼 갱신한다 |

새 태그 생성과 트리 태그 삭제는 연타하면 같은 대상을 노리므로 `useRef` 동기 가드를 둔다(위 "pending 값은 연타를 막지 못한다"). 삭제 가드는 다른 태그의 삭제를 막지 않도록 태그별로 둔다.

이 action들은 메모 패널과 워크스페이스 패널이 직접 호출하므로 `useTreeEditorActions` facade에 넣지 않는다.
