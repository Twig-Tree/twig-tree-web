import { useGeneratedLectureStore } from "./generatedLectureStore";
import { useTreeStore } from "../treeStore";
import { useDemoLectureScript } from "./useDemoLectureScript";

/*
함수 이름 : useLectureScript
기능 : 지금 트리에서 재생할 강의 대본을 고른다. 생성한 강의가 있으면 그것을, 없으면 트리에 맞는 데모 강의를 쓴다.
인자 : 없음
반환값 : 강의 대본과 생성한 강의인지 여부. 둘 다 없으면 대본이 null
*/
export const useLectureScript = () => {
  const treeId = useTreeStore((state) => state.treeId);
  const generatedScript = useGeneratedLectureStore((state) =>
    treeId === null ? undefined : state.scriptByTreeId[treeId],
  );
  const demoScript = useDemoLectureScript();

  return generatedScript === undefined
    ? { script: demoScript, isGenerated: false }
    : { script: generatedScript, isGenerated: true };
};
