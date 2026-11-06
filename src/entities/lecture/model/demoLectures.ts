import { type DemoLecture, type DemoTreeNode } from "./createDemoLecture";
import { COMPUTER_SCIENCE_DEMO_LECTURE } from "./mockComputerScienceLectureScript";
import {
  GOGURYEO_DEMO_LECTURE,
  GOGURYEO_DEMO_TREE,
} from "./mockGoguryeoLectureScript";
import { WORLD_GEOGRAPHY_DEMO_LECTURE } from "./mockLectureScript";

export const DEMO_LECTURES: DemoLecture[] = [
  WORLD_GEOGRAPHY_DEMO_LECTURE,
  COMPUTER_SCIENCE_DEMO_LECTURE,
  GOGURYEO_DEMO_LECTURE,
];

/*
개발용 화면에서 DB에 다시 만들 수 있는 트리. 세계 지리와 컴퓨터 사이언스는 아직 편집기에서 직접 만든다.
*/
export const DEMO_TREES: DemoTreeNode[] = [GOGURYEO_DEMO_TREE];
