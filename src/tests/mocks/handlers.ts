import {
  RAW_CREATED_TREE_DATA,
  RAW_FOLDER_DATA,
  RAW_TREE_DATA,
  RAW_TREE_DATA_WITH_CYCLE,
  RAW_WORKSPACE_DATA,
} from "@/src/tests/mocks/data";
import { http, HttpResponse } from "msw";

export const handlers = [
  /*
  폴더 목록 조회 GET 요청 핸들러.
  folderParentId를 생략하면 루트의 폴더만, 값이 있으면 그 폴더의 하위 폴더만 돌려준다.
  */
  http.get("*/api/folders", ({ request }) => {
    const folderParentId = new URL(request.url).searchParams.get(
      "folderParentId",
    );

    const data = RAW_FOLDER_DATA.filter((folder) =>
      folderParentId === null
        ? folder.folderParentId === null
        : String(folder.folderParentId) === folderParentId,
    );

    return HttpResponse.json(
      {
        isSuccess: true,
        code: "FOLDERS_FOUND",
        message: "폴더 목록이 조회되었습니다.",
        data,
      },
      { status: 200 },
    );
  }),

  /*
  폴더 이름 수정 PATCH 요청 핸들러.
  요청 body의 이름을 반영해 응답하므로, 이름이 실제로 실려 가는지 확인할 수 있다.
  */
  http.patch("*/api/folders/:folderId", async ({ params, request }) => {
    const folder = RAW_FOLDER_DATA.find(
      ({ folderId }) => String(folderId) === params.folderId,
    );

    if (!folder) {
      return HttpResponse.json(
        {
          isSuccess: false,
          code: "FOLDER404-1",
          message: "해당 폴더가 존재하지 않습니다.",
          data: null,
        },
        { status: 404 },
      );
    }

    const body = (await request.json()) as { name: string };

    return HttpResponse.json(
      {
        isSuccess: true,
        code: "FOLDER_UPDATED",
        message: "성공적으로 폴더 정보를 수정했습니다.",
        data: {
          ...folder,
          name: body.name,
        },
      },
      { status: 200 },
    );
  }),

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

  /*
  워크스페이스 상세 조회 GET 요청 핸들러.
  목록에 없는 ID는 백엔드처럼 404와 에러 응답 봉투를 돌려준다.
  */
  http.get("*/api/workspaces/:workspaceId", ({ params }) => {
    const workspace = RAW_WORKSPACE_DATA.find(
      ({ workspaceId }) => String(workspaceId) === params.workspaceId,
    );

    if (!workspace) {
      return HttpResponse.json(
        {
          isSuccess: false,
          code: "WORKSPACE404-1",
          message: "해당 워크스페이스가 존재하지 않습니다.",
          data: null,
        },
        { status: 404 },
      );
    }

    return HttpResponse.json(
      {
        isSuccess: true,
        code: "WORKSPACE_FOUND",
        message: "워크스페이스가 조회되었습니다.",
        data: workspace,
      },
      { status: 200 },
    );
  }),

  /*
  워크스페이스 생성 POST 요청 핸들러.
  요청 body를 그대로 반영해 응답하므로, 이름과 folderId가 실제로 실려 가는지 확인할 수 있다.
  */
  http.post("*/api/workspaces", async ({ request }) => {
    const body = (await request.json()) as {
      name: string;
      folderId: number | null;
    };

    return HttpResponse.json(
      {
        isSuccess: true,
        code: "WORKSPACE_CREATED",
        message: "워크스페이스가 생성되었습니다.",
        data: {
          workspaceId: 999,
          name: body.name,
          folderId: body.folderId,
          treeId: null,
          updatedAt: "2026-09-07T00:00:00",
        },
      },
      { status: 201 },
    );
  }),

  /*
  워크스페이스 이름 수정 PATCH 요청 핸들러.
  요청 body의 이름을 반영해 응답하므로, 이름이 실제로 실려 가는지 확인할 수 있다.
  수정 시각은 백엔드처럼 새 값으로 바뀐다.
  */
  http.patch("*/api/workspaces/:workspaceId", async ({ params, request }) => {
    const workspace = RAW_WORKSPACE_DATA.find(
      ({ workspaceId }) => String(workspaceId) === params.workspaceId,
    );

    if (!workspace) {
      return HttpResponse.json(
        {
          isSuccess: false,
          code: "WORKSPACE404-1",
          message: "해당 워크스페이스가 존재하지 않습니다.",
          data: null,
        },
        { status: 404 },
      );
    }

    const body = (await request.json()) as { name: string };

    return HttpResponse.json(
      {
        isSuccess: true,
        code: "WORKSPACE_UPDATED",
        message: "성공적으로 워크스페이스 정보를 수정했습니다.",
        data: {
          ...workspace,
          name: body.name,
          updatedAt: "2026-09-22T00:00:00",
        },
      },
      { status: 200 },
    );
  }),

  /*
  워크스페이스 트리 생성 POST 요청 핸들러.
  백엔드처럼 워크스페이스당 트리는 하나라, 이미 트리가 있는 워크스페이스는 409로 거절한다.
  */
  http.post("*/api/workspaces/:workspaceId/trees", ({ params }) => {
    const workspace = RAW_WORKSPACE_DATA.find(
      ({ workspaceId }) => String(workspaceId) === params.workspaceId,
    );

    if (!workspace) {
      return HttpResponse.json(
        {
          isSuccess: false,
          code: "WORKSPACE404-1",
          message: "해당 워크스페이스가 존재하지 않습니다.",
          data: null,
        },
        { status: 404 },
      );
    }

    if (workspace.treeId !== null) {
      return HttpResponse.json(
        {
          isSuccess: false,
          code: "TREE409-1",
          message: "해당 워크스페이스에 이미 트리가 존재합니다.",
          data: null,
        },
        { status: 409 },
      );
    }

    return HttpResponse.json(
      {
        isSuccess: true,
        code: "TREE_CREATED",
        message: "트리가 생성되었습니다.",
        data: { treeId: 20 },
      },
      { status: 201 },
    );
  }),

  /*
  노드 생성 POST 요청 핸들러.
  요청 body를 그대로 반영해 응답하므로 parentId가 실제로 어떻게 실려 가는지 확인할 수 있다.
  백엔드처럼 트리당 루트는 하나라, 루트가 있는 트리(RAW_TREE_DATA를 쓰는 10번)에 루트를 만들면 409로 거절한다.
  */
  http.post("*/api/trees/:treeId/nodes", async ({ params, request }) => {
    const body = (await request.json()) as {
      name: string;
      parentId: number | null;
      orderId: number;
    };

    if (body.parentId === null && params.treeId === "10") {
      return HttpResponse.json(
        {
          isSuccess: false,
          code: "NODE409-2",
          message: "하나의 트리에는 하나의 루트만 존재할 수 있습니다.",
          data: null,
        },
        { status: 409 },
      );
    }

    return HttpResponse.json(
      {
        isSuccess: true,
        code: "NODE_CREATED",
        message: "노드가 생성되었습니다.",
        data: {
          nodeId: 500,
          name: body.name,
          parentId: body.parentId,
          orderId: body.orderId,
          memo: null,
        },
      },
      { status: 201 },
    );
  }),

  /*
  프롬프트 트리 생성 POST 요청 핸들러.
  백엔드처럼 Content-Type으로 JSON과 multipart를 가르고, 지시문과 파일이 모두 비면 CHAT400-3으로 거절한다.
  multipart 경로에서 message와 provider를 쿼리 파라미터로 읽는 것도 백엔드와 같아서,
  요청이 어느 형식으로 나갔는지 이 핸들러가 걸러내는 것으로 확인할 수 있다.
  */
  http.post("*/api/tree-request", async ({ request }) => {
    const searchParams = new URL(request.url).searchParams;
    const isMultipart = request.headers
      .get("content-type")
      ?.includes("multipart/form-data");

    let message: string | null;
    let hasFile: boolean;

    if (isMultipart) {
      const formData = await request.formData();

      message = searchParams.get("message");
      hasFile = formData.get("file") !== null;
    } else {
      const body = (await request.json()) as { message?: string };

      message = body.message ?? null;
      hasFile = false;
    }

    // mock 시나리오는 백엔드에서도 본문 검증보다 먼저 분기한다.
    if (searchParams.get("mock") === null && !message && !hasFile) {
      return HttpResponse.json(
        {
          isSuccess: false,
          code: "CHAT400-3",
          message: "메시지와 파일 중 최소 하나는 필요합니다.",
          data: null,
        },
        { status: 400 },
      );
    }

    return HttpResponse.json(
      {
        isSuccess: true,
        code: "CHAT201-1",
        message: "트리가 성공적으로 생성되었습니다.",
        data: RAW_CREATED_TREE_DATA,
      },
      { status: 201 },
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
