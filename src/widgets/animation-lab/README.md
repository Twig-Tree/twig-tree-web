# Animation Lab

강의 애니메이션을 시험하는 개발 전용 widget이다. route는 `app/(dev)/dev/animation-lab/page.tsx`이고 production에서는 `notFound()`로 막는다. 운영 기능은 이 모듈에 의존하지 않는다.

제품의 `nodeTypes`, `edgeTypes`, `useEditorLayout`, `useFocusNode`를 그대로 쓴다. 효과는 이 렌더러들이 애니메이션 store를 구독해 그리므로, 여기서 본 모습이 강의에서 보이는 모습과 같다.

트리는 `model/fixtureTree.ts`의 고정 데이터로 `useInitializeTree`를 거쳐 채운다. 서버에 조회나 저장을 하지 않으므로 인증 없이 열린다. 노드 제목 편집 UI는 제품 노드에 그대로 있어 눌러볼 수 있지만, 저장 요청은 실패하고 실제 트리에는 닿지 않는다. 트리 ID가 숫자가 아니기 때문이다.
