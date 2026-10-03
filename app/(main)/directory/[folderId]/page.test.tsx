import { act, render, screen } from "@testing-library/react";
import { http } from "msw";
import { Suspense } from "react";
import { describe, it, expect, vi } from "vitest";
import { createQueryWrapper } from "@/src/tests/helpers/createQueryWrapper";
import { server } from "@/src/tests/mocks/server";
import DirectoryPage from "./page";

/*
페이지는 params를 use()로 풀어 쓰므로 Suspense 안에서 렌더한다.
promise가 풀린 뒤의 재렌더가 act 안에서 끝나야 하므로 비동기 act로 감싼다.
*/
const renderPage = async (folderId: string) => {
  const { queryClient, wrapper } = createQueryWrapper();

  await act(async () => {
    render(
      <Suspense fallback={null}>
        <DirectoryPage params={Promise.resolve({ folderId })} />
      </Suspense>,
      { wrapper },
    );
  });

  return { queryClient };
};

describe("DirectoryPage", () => {
  /*
  폴더 query는 아직 enabled로도 잘못된 ID를 막고 있어 요청 여부만으로는 페이지 검사를 확인할 수 없다.
  query cache가 비어 있는지까지 확인해 하위 화면이 렌더되지 않았음을 단정한다.
  */
  it.each(["abc", "0", "1.5", "1e3"])(
    "폴더 ID 형식이 잘못되면(%s) 조회 없이 찾을 수 없다고 안내한다",
    async (folderId) => {
      const requestDirectory = vi.fn();
      server.use(
        http.get("*/api/folders", requestDirectory),
        http.get("*/api/folders/:folderId/path", requestDirectory),
        http.get("*/api/workspaces", requestDirectory),
      );

      const { queryClient } = await renderPage(folderId);

      expect(
        await screen.findByRole("heading", { name: "폴더를 찾을 수 없습니다" }),
      ).toBeInTheDocument();
      expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
      expect(requestDirectory).not.toHaveBeenCalled();
    },
  );
});
