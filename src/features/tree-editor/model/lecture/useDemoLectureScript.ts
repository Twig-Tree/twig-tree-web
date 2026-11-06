import { useMemo } from "react";
import { findDemoLectureScript } from "../../lib/lecture/findDemoLectureScript";
import { useTreeStore } from "../treeStore";

/*
함수 이름 : useDemoLectureScript
기능 : 지금 트리에 맞는 데모 강의 대본을 고른다. 강의 API를 연결하면 강의 조회 query로 바꾼다.
인자 : 없음
반환값 : 데모 강의 대본. 지금 트리에 맞는 강의가 없으면 null
*/
export const useDemoLectureScript = () => {
  const nodes = useTreeStore((state) => state.nodes);
  const edges = useTreeStore((state) => state.edges);

  return useMemo(() => findDemoLectureScript(nodes, edges), [nodes, edges]);
};
