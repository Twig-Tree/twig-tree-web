import { type DemoLecture } from "./createDemoLecture";
import { COMPUTER_SCIENCE_DEMO_LECTURE } from "./mockComputerScienceLectureScript";
import { GOGURYEO_DEMO_LECTURE } from "./mockGoguryeoLectureScript";
import { WORLD_GEOGRAPHY_DEMO_LECTURE } from "./mockLectureScript";

export const DEMO_LECTURES: DemoLecture[] = [
  WORLD_GEOGRAPHY_DEMO_LECTURE,
  COMPUTER_SCIENCE_DEMO_LECTURE,
  GOGURYEO_DEMO_LECTURE,
];
