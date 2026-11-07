type IssuePath = (string | number)[];

/*
함수 이름 : getRepeatedRoleNodePaths
기능 : cue 하나의 role 값에서 앞서 나온 노드가 다시 나온 위치를 찾는다.
모든 intent의 role은 서로 다른 역할이라, 한 노드가 두 role에 들어가거나 한 role에 두 번 들어가면 컴파일러가 연출을 정할 수 없다.
인자 : Record<string, string | string[] | undefined> roles -> cue의 role 이름별 노드 ID
반환값 : roles 기준으로 두 번째 이후 등장한 노드의 경로 목록
*/
export const getRepeatedRoleNodePaths = (
  roles: Record<string, string | string[] | undefined>,
): IssuePath[] => {
  const seenNodeIds = new Set<string>();
  const repeatedPaths: IssuePath[] = [];

  const visit = (nodeId: string, path: IssuePath) => {
    if (seenNodeIds.has(nodeId)) repeatedPaths.push(path);
    seenNodeIds.add(nodeId);
  };

  for (const [role, value] of Object.entries(roles)) {
    if (value === undefined) continue;

    if (typeof value === "string") {
      visit(value, [role]);
      continue;
    }

    value.forEach((nodeId, index) => visit(nodeId, [role, index]));
  }

  return repeatedPaths;
};

type ScenarioIdTree = {
  scenes: { id: string; beats: { id: string }[] }[];
};

/*
함수 이름 : getRepeatedScenarioIdPaths
기능 : 시나리오 전체에서 앞서 나온 scene ID 또는 beat ID가 다시 나온 위치를 찾는다.
beat ID는 장면을 넘어 고유해야 컴파일 결과를 원본 비트로 역추적할 수 있다.
인자 : ScenarioIdTree scenario -> 검사할 시나리오
반환값 : 시나리오 기준으로 중복된 id 필드의 경로 목록
*/
export const getRepeatedScenarioIdPaths = (
  scenario: ScenarioIdTree,
): IssuePath[] => {
  const seenSceneIds = new Set<string>();
  const seenBeatIds = new Set<string>();
  const repeatedPaths: IssuePath[] = [];

  scenario.scenes.forEach((scene, sceneIndex) => {
    if (seenSceneIds.has(scene.id)) {
      repeatedPaths.push(["scenes", sceneIndex, "id"]);
    }
    seenSceneIds.add(scene.id);

    scene.beats.forEach((beat, beatIndex) => {
      if (seenBeatIds.has(beat.id)) {
        repeatedPaths.push(["scenes", sceneIndex, "beats", beatIndex, "id"]);
      }
      seenBeatIds.add(beat.id);
    });
  });

  return repeatedPaths;
};
