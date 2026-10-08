import { act, render, screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { Suspense } from "react";
import { describe, it, expect, vi } from "vitest";
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
});
