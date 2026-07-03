# Tree Editor Action Hooks Convention

## 목적

트리 에디터 액션 훅은 사용자 액션이 서버 상태와 로컬 React Flow 에디터 상태를 어떻게 함께 갱신하는지 정의한다.

트리 에디터에는 두 가지 상태 계층이 있다.

- React Query cache: 서버 응답 형태인 `NodeDTO` 데이터를 관리한다.
- Zustand editor store: React Flow에서 사용하는 `CustomEditorNode`, `CustomEditorEdge` 데이터를 관리한다.

두 계층의 책임을 분리해야 optimistic update, rollback, layout 보존 흐름을 예측 가능하게 유지할 수 있다.

## 액션 핸들러의 책임

`handleAddNode` 같은 핸들러는 사용자 이벤트를 처리하는 진입점이다.

액션 핸들러에서는 필요에 따라 다음 두 종류의 함수를 함께 호출할 수 있다.

- `addNodeToStore`, `rollbackAddNode` 같은 store action
- `useAddNodeMutation` 같은 mutation hook

store action은 에디터 화면을 즉시 갱신하고, mutation hook은 서버 요청과 query cache 동기화를 담당한다.

## Mutation Hook과 Action Hook의 책임 분리

Mutation hook은 서버 상태와 React Query cache를 관리한다.

예를 들어 `useAddNodeMutation`은 다음을 담당한다.

- `onMutate`: query cache에 임시 `NodeDTO`를 추가한다.
- `onSuccess`: query cache의 임시 노드를 서버가 반환한 노드로 교체한다.
- `onError`: query cache를 이전 상태로 rollback한다.

Action hook은 editor store 상태와 UI 액션별 동작을 관리한다.

예를 들어 `useAddNodeAction`은 다음을 담당한다.

- 임시 React Flow node/edge를 생성한다.
- Zustand editor store에 임시 node/edge를 추가한다.
- 성공 시 임시 editor id를 서버 id로 교체한다.
- 실패 시 임시 editor node/edge를 rollback한다.
- 사용자에게 보여줄 에러 메시지를 처리한다.

Action hook에서 말하는 rollback은 editor store rollback을 의미한다. Query cache rollback은 mutation hook 선언부에서 따로 처리한다.

## Optimistic Update 규칙

Optimistic update는 각 상태 계층에 맞는 데이터 형태로 적용한다.

- Query cache에는 optimistic `NodeDTO`를 넣는다.
- Editor store에는 optimistic `CustomEditorNode`, `CustomEditorEdge`를 넣는다.

서버가 생성된 노드를 반환하면 query cache는 임시 DTO 전체를 서버 DTO로 교체해도 된다. 반면 editor store는 서버가 실제로 보정한 값만 반영한다. 예를 들어 임시 id를 실제 id로 교체하되, 화면 layout 정보는 보존한다.

## Rollback 규칙

Optimistic rollback에 일반 삭제 액션을 재사용하지 않는다.

예를 들어 노드 추가 실패 rollback은 `deleteNodeFromStore`가 아니라 `rollbackAddNode`를 사용한다.

일반 삭제 액션은 사용자가 의도적으로 트리를 변경한 것이므로 `isDirty`를 true로 만든다. 반면 rollback 액션은 실패한 optimistic update 이전 상태로 되돌리는 것이므로, 이전 `isDirty` 값까지 복구해야 한다.

Optimistic update를 적용하기 전에 rollback에 필요한 상태를 저장한다.

```ts
const wasDirtyBeforeAdd = useTreeStore.getState().isDirty;
```

실패 시 이 값을 rollback store action에 전달한다.

## isDirty 규칙

`isDirty`는 단순한 미저장 변경 플래그가 아니다. `useInitializeTree`에서 같은 트리를 다시 초기화하지 않게 막아 editor layout을 보호하는 가드 역할도 한다.

따라서 다음 규칙을 지킨다.

- 서버 요청이 성공했다는 이유만으로 `isDirty`를 false로 바꾸지 않는다.
- 임시 editor id를 서버 id로 교체할 때는 `isDirty`를 유지한다.
- 실패한 optimistic update를 rollback할 때는 이전 `isDirty` 값을 복구한다.
- React Flow의 selection-only change는 dirty로 보지 않는다.

트리 구조나 저장 대상 editor 데이터가 의도적으로 바뀌는 액션은 dirty로 표시한다. Optimistic metadata만 정리하는 액션은 현재 dirty 상태를 보존한다.

## 이름 규칙

이름은 어떤 계층의 동작인지 드러나야 한다.

- 사용자 이벤트 핸들러: `handleAddNode`, `handleDeleteNode`
- Action hook: `useAddNodeAction`, `useDeleteNodeAction`
- Server mutation hook: `useAddNodeMutation`, `useDeleteNodeMutation`
- Store action: `addNodeToStore`, `deleteNodeFromStore`, `rollbackAddNode`

`onAdd`, `onDelete`처럼 범용적인 이름은 domain store action에는 사용하지 않는다. `on*` 이름은 React Flow의 `onNodesChange`, `onEdgesChange` 같은 framework callback 성격에 남겨둔다.

## Cache와 Store 분리

Mutation hook은 서버 상태와 React Query cache를 관리한다.

Action hook은 editor store 상태와 UI interaction state를 관리한다.

두 계층에 같은 논리적 변경이 필요하더라도, 한쪽 데이터 모델을 다른 쪽에 억지로 재사용하지 않는다. 각 계층에 맞는 형태로 각각 업데이트한다.

## onSuccess와 onError 위치

Mutation 선언부의 callback은 cache-level 동작을 담당한다.

Mutation 호출부의 callback은 action-specific editor store 동작을 담당한다.

노드 추가 기준 책임은 다음과 같다.

- `useAddNodeMutation.onSuccess`: query cache를 업데이트한다.
- `useAddNodeMutation.onError`: query cache를 rollback한다.
- `useAddNodeAction`의 call-site `onSuccess`: editor store의 node id와 edge를 업데이트한다.
- `useAddNodeAction`의 call-site `onError`: editor store의 node/edge를 rollback한다.

사용자에게 보여주는 알림은 보통 action hook 호출부에서 처리한다. 이렇게 해야 같은 mutation hook을 여러 곳에서 사용할 때 중복 alert를 피할 수 있다.

## 새 Action Hook 추가 체크리스트

`useDeleteNodeAction` 같은 새 액션 훅을 추가할 때는 다음을 확인한다.

- 이 액션이 React Query cache를 변경하는가?
- 이 액션이 Zustand editor store를 변경하는가?
- Optimistic update가 필요한가?
- Optimistic update 전에 어떤 상태를 저장해야 하는가?
- 실패 시 어떤 rollback action으로 이전 상태를 복구하는가?
- `isDirty`를 변경해야 하는가, 유지해야 하는가, 복구해야 하는가?
- 사용자-facing 에러는 어디에서 보여줄 것인가?

`useTreeEditorActions`는 page-level consumer를 위한 작은 facade로 유지한다. 각 액션의 세부 구현을 직접 소유하지 않고 action hook을 조합해 화면에서 쓰기 좋은 handler를 노출한다.

## 예시: Add Node

`useAddNodeAction`은 임시 editor node/edge를 만들고, 이전 dirty 상태를 저장한 뒤 `useAddNodeMutation`을 호출한다.

성공 시:

- Query cache는 임시 DTO를 서버 DTO로 교체한다.
- Editor store는 임시 node id와 연결된 edge target을 서버 id로 교체한다.
- Editor layout과 `isDirty`는 보존한다.

실패 시:

- Query cache는 이전 `NodeDTO[]`로 복구한다.
- Editor store는 `rollbackAddNode`로 임시 node/edge를 제거한다.
- Editor store는 이전 `isDirty` 값을 복구한다.
