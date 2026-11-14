import { type DemoLecture, type DemoTreeNode } from "./createDemoLecture";
import { COMPUTER_SCIENCE_DEMO_LECTURE } from "./mockComputerScienceLectureScript";
import {
  GOGURYEO_DEMO_LECTURE,
  GOGURYEO_DEMO_TREE,
} from "./mockGoguryeoLectureScript";
import { WORLD_GEOGRAPHY_DEMO_LECTURE } from "./mockLectureScript";
import {
  SHOWCASE_DEMO_LECTURE,
  SHOWCASE_DEMO_TREE,
} from "./mockShowcaseLectureScript";

/*
플레이어는 앞에서부터 지금 트리에 맞는 첫 강의를 고른다. 발표 시연 강의는 컴퓨터 사이언스 데모와 루트 이름이 같고 노드가 더 많으므로,
앞에 두어야 큰 트리에서는 발표 강의가, 작은 트리에서는 기존 데모가 재생된다.
*/
export const DEMO_LECTURES: DemoLecture[] = [
  SHOWCASE_DEMO_LECTURE,
  WORLD_GEOGRAPHY_DEMO_LECTURE,
  COMPUTER_SCIENCE_DEMO_LECTURE,
  GOGURYEO_DEMO_LECTURE,
];

/*
개발용 화면에서 DB에 다시 만들 수 있는 트리. 세계 지리와 컴퓨터 사이언스 기초는 아직 편집기에서 직접 만든다.
*/
export const DEMO_TREES: DemoTreeNode[] = [
  SHOWCASE_DEMO_TREE,
  GOGURYEO_DEMO_TREE,
];
