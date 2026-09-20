import { http, HttpResponse } from "msw";
import { describe, it, expect } from "vitest";
import { isAxiosError } from "axios";
import { server } from "@/src/tests/mocks/server";
import { RAW_CREATED_TREE_DATA } from "@/src/tests/mocks/data";
import { treeApi } from "./treeApi";

/*
요청이 실제로 어떤 형식으로 나갔는지 확인하기 위해, 기본 핸들러 대신 요청을 그대로 붙잡는 핸들러를 끼운다.
*/
const captureRequest = () => {
  const captured: {
    contentType: string | null;
    searchParams: URLSearchParams | null;
    jsonBody: unknown;
    hasFile: boolean;
  } = {
    contentType: null,
    searchParams: null,
    jsonBody: null,
    hasFile: false,
  };

  server.use(
    http.post("*/api/tree-request", async ({ request }) => {
      captured.contentType = request.headers.get("content-type");
      captured.searchParams = new URL(request.url).searchParams;

      if (captured.contentType?.includes("multipart/form-data")) {
        /*
        본문을 문자열로 읽어 조각 이름만 확인한다. request.formData()를 쓰면 Node 24에서 예외가 난다.
        jsdom 환경에서 File과 FormData는 jsdom 것이고 Request는 Node 것이라, 본문을 되읽을 때
        undici의 multipart 파서가 자기 File이 아닌 값을 만나 단언에서 멈춘다.

        파일 이름은 검사하지 않는다. jsdom에서는 FormData가 Request를 통과하는 순간 조각의 filename이
        "blob"으로 바뀐다. jsdom의 File을 undici가 일반 Blob으로 취급하기 때문이고, 브라우저에서는 유지된다.
        요청 코드가 file.name을 명시해 두었으므로 실제 이름이 실리는지는 브라우저에서 확인한다.
        */
        captured.hasFile = (await request.text()).includes('name="file"');
      } else {
        captured.jsonBody = await request.json();
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
  );

  return captured;
};

describe("treeApi.createTreeFromPrompt", () => {
  it("서버가 확정한 ID를 문자열 도메인 모델로 돌려준다", async () => {
    const created = await treeApi.createTreeFromPrompt({
      message: "자료구조 트리 만들어줘",
    });

    expect(created.workspaceId).toBe("31");
    expect(created.treeId).toBe("30");
    expect(created.nodes).toEqual([
      {
        id: "40",
        parentId: null,
        label: "컴퓨터 사이언스",
        orderIndex: 1,
        memo: "전공 기초",
      },
      {
        id: "41",
        parentId: "40",
        label: "자료구조",
        orderIndex: 1,
        memo: null,
      },
    ]);
  });

  it("첨부가 없으면 JSON 본문에 지시문과 제공자를 담아 보낸다", async () => {
    const captured = captureRequest();

    await treeApi.createTreeFromPrompt({ message: "자료구조 트리 만들어줘" });

    expect(captured.contentType).toContain("application/json");
    expect(captured.jsonBody).toEqual({
      message: "자료구조 트리 만들어줘",
      provider: "OPENAI",
    });
  });

  /*
  파일은 본문 조각으로, 지시문과 제공자는 쿼리 파라미터로 나가야 백엔드의 multipart 핸들러가 읽는다.
  경계 문자열이 붙었는지도 함께 본다. axiosInstance의 기본 Content-Type이 남아 있으면 여기서 걸린다.
  */
  it("첨부가 있으면 multipart로 파일을 싣고 나머지는 쿼리로 보낸다", async () => {
    const captured = captureRequest();
    const file = new File(["본문"], "보고서.txt", { type: "text/plain" });

    await treeApi.createTreeFromPrompt({ message: "3단계로 정리해줘", file });

    expect(captured.contentType).toContain("multipart/form-data");
    expect(captured.contentType).toContain("boundary=");
    expect(captured.hasFile).toBe(true);
    expect(captured.searchParams?.get("message")).toBe("3단계로 정리해줘");
    expect(captured.searchParams?.get("provider")).toBe("OPENAI");
  });

  it("지시문 없이 파일만 보내면 message 파라미터를 싣지 않는다", async () => {
    const captured = captureRequest();
    const file = new File(["본문"], "보고서.txt", { type: "text/plain" });

    await treeApi.createTreeFromPrompt({ message: "", file });

    expect(captured.searchParams?.has("message")).toBe(false);
    expect(captured.hasFile).toBe(true);
  });

  it("목 시나리오를 주면 쿼리에 싣고, 주지 않으면 싣지 않는다", async () => {
    const withMock = captureRequest();
    await treeApi.createTreeFromPrompt({ message: "트리", mock: "small" });
    expect(withMock.searchParams?.get("mock")).toBe("small");

    const withoutMock = captureRequest();
    await treeApi.createTreeFromPrompt({ message: "트리" });
    expect(withoutMock.searchParams?.has("mock")).toBe(false);
  });

  it("지시문과 파일이 모두 없으면 400 오류가 된다", async () => {
    await expect(
      treeApi.createTreeFromPrompt({ message: "" }),
    ).rejects.toSatisfy(
      (error: unknown) => isAxiosError(error) && error.response?.status === 400,
    );
  });
});
