import { act, render, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { Suspense } from "react";
import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { treeQueryKeys } from "@/src/entities/tree/model/queryKeys";
import { createQueryWrapper } from "@/src/tests/helpers/createQueryWrapper";
import { server } from "@/src/tests/mocks/server";
import WorkspacePage from "./page";

/*
페이지는 params를 use()로 풀어 쓰므로 Suspense 안에서 렌더한다.
promise가 풀린 뒤의 재렌더가 act 안에서 끝나야 하므로 비동기 act로 감싼다.
*/
const renderPage = async (workspaceId: string) => {
  const { queryClient, wrapper } = createQueryWrapper();

  await act(async () => {
    render(
      <Suspense fallback={null}>
        <WorkspacePage params={Promise.resolve({ workspaceId })} />
      </Suspense>,
      { wrapper },
    );
  });

  return { queryClient };
};

describe("WorkspacePage", () => {
  /*
  편집기가 화면 너비, 요소 크기, 캔버스 배율을 읽는데 jsdom에는 이 API들이 없다.
  */
  beforeEach(() => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    );
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
    vi.stubGlobal(
      "DOMMatrixReadOnly",
      class {
        m22 = 1;
      },
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  /*
  요청 여부와 함께 query cache가 비어 있는지 확인한다. 하위 화면이 렌더되지 않아
  query가 만들어지지도 않았음을 단정한다. #73에서 useSuspenseQuery로 바꿔도 이 전제가 유지되어야 한다.
  */
  it.each(["abc", "0", "1.5", "1e3", "default"])(
    "ID 형식이 잘못되면(%s) 조회 없이 찾을 수 없다고 안내한다",
    async (workspaceId) => {
      const requestWorkspace = vi.fn();
      server.use(
        http.get("*/api/workspaces/:workspaceId", () => {
          requestWorkspace();
          return HttpResponse.json(null, { status: 500 });
        }),
      );

      const { queryClient } = await renderPage(workspaceId);

      expect(
        await screen.findByRole("heading", {
          name: "워크스페이스를 찾을 수 없습니다",
        }),
      ).toBeInTheDocument();
      expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
      expect(requestWorkspace).not.toHaveBeenCalled();
    },
  );

  const TREE_LOAD_ERROR_MESSAGE = "트리를 불러오지 못했습니다.";
  const failTreeRequest = () =>
    server.use(
      http.get("*/api/trees/:treeId/nodes", () =>
        HttpResponse.json(null, { status: 500 }),
      ),
    );

  it("보여 줄 트리가 없는 첫 조회가 실패하면 오류를 안내한다", async () => {
    failTreeRequest();

    await renderPage("1");

    expect(
      await screen.findByText(TREE_LOAD_ERROR_MESSAGE),
    ).toBeInTheDocument();
  });

  /*
  다른 곳의 변경을 확인하는 재조회가 실패해도 이미 그린 편집기를 지우면 입력 중인 초안이 사라진다.
  */
  it("트리를 불러온 뒤 재조회가 실패하면 편집기를 유지한다", async () => {
    const { queryClient } = await renderPage("1");
    const treeQueryKey = treeQueryKeys.detail("10");

    await waitFor(() =>
      expect(queryClient.getQueryData(treeQueryKey)).toBeDefined(),
    );
    await waitFor(() =>
      expect(document.querySelector(".react-flow")).toBeInTheDocument(),
    );

    failTreeRequest();

    /*
    query 상태는 다음 task에 구독자로 전달되므로, 기다리지 않으면 오류 화면이 그려지기 전에 검사하게 된다.
    */
    await act(async () => {
      await queryClient.refetchQueries({ queryKey: treeQueryKey, exact: true });
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(queryClient.getQueryState(treeQueryKey)?.status).toBe("error");
    expect(screen.queryByText(TREE_LOAD_ERROR_MESSAGE)).not.toBeInTheDocument();
    expect(document.querySelector(".react-flow")).toBeInTheDocument();
  });
});
