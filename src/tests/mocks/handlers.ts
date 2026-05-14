import {
  RAW_TREE_DATA,
  RAW_TREE_DATA_WITH_CYCLE,
} from "@/src/tests/mocks/data";
import { http, HttpResponse } from "msw";

export const handlers = [
  // 트리 조회 GET 요청 핸들러
  http.get("*/api/tree/:treeId", ({ params }) => {
    const { treeId } = params;

    return HttpResponse.json(
      {
        code: "TREE_FETCHED",
        message: "트리가 성공적으로 조회되었습니다.",
        data: {
          tree_id: Number(treeId),
          nodes: RAW_TREE_DATA,
        },
      },
      { status: 200 },
    );
  }),

  // 순환 참조 테스트를 위한 에러 시나리오 핸들러
  http.get("*/api/tree/error/cycle", () => {
    return HttpResponse.json(
      {
        code: "TREE_CYCLE_ERROR",
        message: "데이터에 순환 참조가 포함되어 있습니다.",
        data: {
          tree_id: 999,
          nodes: RAW_TREE_DATA_WITH_CYCLE,
        },
      },
      { status: 200 },
    ); // 백엔드에서 200으로 주되 로직상 에러일 경우를 가정
  }),
];
