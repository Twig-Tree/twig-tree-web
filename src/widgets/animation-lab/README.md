# Animation Lab

강의 애니메이션을 시험하는 개발 전용 widget이다. route는 `app/(dev)/dev/animation-lab/page.tsx`이고 production에서는 `notFound()`로 막는다. 운영 기능은 이 모듈에 의존하지 않는다.

제품의 `nodeTypes`, `edgeTypes`, `useEditorLayout`, `useFocusNode`, `useNodeTransition`을 그대로 쓴다. 효과는 이 렌더러들이 애니메이션 store를 구독해 그리므로, 여기서 본 모습이 강의에서 보이는 모습과 같다.

트리는 `model/fixtureTree.ts`의 고정 데이터로 `useInitializeTree`를 거쳐 채운다. 서버에 조회나 저장을 하지 않으므로 인증 없이 열린다. 노드 제목 편집 UI는 제품 노드에 그대로 있어 눌러볼 수 있지만, 저장 요청은 실패하고 실제 트리에는 닿지 않는다. 트리 ID가 숫자가 아니기 때문이다.

## 조합과 재생

타임라인은 단계 목록(`model/labTimeline.ts`)이고, 각 단계는 대본 계약의 단위 동작을 그대로 담는다. 노드는 고정 트리의 서버 ID로 가리킨다. `앞 단계와 동시에 시작`을 켠 단계끼리 병렬 그룹으로 묶이고, 그 묶음을 순서대로 이어 `beat.animation` 하나를 만든다. 재생은 제품과 같은 `runLectureAnimation`을 쓴다.

단위 동작은 카메라(`focus`), 노드(`highlight`, `dim`), 연결선(`trace`), 구조(`collapse`, `expand`), 흐름 제어(`wait`, `reset`)로 나뉜다. `highlight`는 스타일과 의미 색상을, `trace`는 동시·순차 진행과 정·역방향 및 유지 여부를 고를 수 있다. 프리셋은 이 범용 동작들을 교육 상황에 맞게 조합한 예시다.

대본 계약은 그룹을 얼마든지 중첩할 수 있지만 타임라인은 "순차 안의 병렬"까지만 표현한다. JSON 편집기에 더 깊은 중첩을 넣으면 적용하지 않고 안내한다.

복사한 JSON의 노드 ID는 고정 트리의 ID이므로, 대본에 옮길 때는 `nodeIds.xxx`처럼 그 대본의 ID로 바꾼다.

## 새 효과 추가

새 효과는 타임라인 값만으로는 만들 수 없고, 렌더러와 계약에 코드를 더해야 한다. 계약과 registry, 실행기에 추가하는 순서는 [강의 대본 계약](../../../docs/specs/lecture-script-contract.md#새-동작-추가)을 따르고, 화면에서는 다음을 더한다.

1. `lectureAnimationStore`에 레이어와 판단 함수를 추가한다.
2. `CustomNode`나 `CustomEdge`가 판단 함수를 구독해 data 속성을 달고, `app/xy-theme.css`에서 모양을 정한다. 색은 테마 토큰을 쓴다.
3. 이 화면의 `model/labActions.ts`에 이름과 기본값을 채운다. 빠뜨리면 타입 오류가 난다.
4. 편집 필드가 필요하면 `LabStepEditor.tsx`에, 재생해도 변화가 없는 조건이 있으면 `validateLabStep.ts`에 추가하고 재생해 본다.

JSON 편집기는 대본 스키마(`lectureAnimationActionSchema`)로 동작을 검사하므로 따로 고치지 않는다. 대상 노드를 읽고 바꾸는 일도 registry의 필드 이름으로 처리한다.
