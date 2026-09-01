import {
  RAW_TREE_DATA,
  RAW_TREE_DATA_WITH_CYCLE,
  RAW_WORKSPACE_DATA,
} from "@/src/tests/mocks/data";
import { http, HttpResponse } from "msw";

export const handlers = [
  /*
  워크스페이스 목록 조회 GET 요청 핸들러.
  folderId를 생략하면 폴더에 속하지 않은 것만, 값이 있으면 그 폴더의 것만 돌려준다.
  실제 백엔드와 같은 규칙이라 쿼리 파라미터가 빠지면 결과가 달라져 테스트가 잡아낸다.
  */
  http.get("*/api/workspaces", ({ request }) => {
    const folderId = new URL(request.url).searchParams.get("folderId");

    const data = RAW_WORKSPACE_DATA.filter((workspace) =>
      folderId === null
        ? workspace.folderId === null
        : String(workspace.folderId) === folderId,
    );

    return HttpResponse.json(
      {
        isSuccess: true,
        code: "WORKSPACES_FOUND",
        message: "워크스페이스 목록이 조회되었습니다.",
        data,
      },
      { status: 200 },
    );
  }),

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
