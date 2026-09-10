import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { workspaceQueryKeys } from "@/src/entities/workspace";
import { createQueryWrapper } from "@/src/tests/helpers/createQueryWrapper";
import { useCreateWorkspace } from "./useCreateWorkspace";

const ROOT_WORKSPACE = {
  id: "1",
  name: "Workspace",
  updatedAt: "2026-08-31T21:00:00",
};

describe("useCreateWorkspace", () => {
  describe("createWorkspace", () => {
    it("렌더 시점에 받은 형제 목록으로 기본 이름을 정한다", async () => {
      const { wrapper } = createQueryWrapper();
      const { result } = renderHook(
        () =>
          useCreateWorkspace({ folderId: "3", workspaces: [ROOT_WORKSPACE] }),
        { wrapper },
      );

      const created = await result.current.createWorkspace();

      expect(created.name).toBe("Workspace 2");
    });

    /*
    최신순 팝업처럼 파라미터 없이 쓰는 화면은 위치를 호출 인자로 받는다. 그 위치의 형제
    목록은 렌더 시점에 넘겨받지 않았으므로 캐시에서 읽는다.
    */
    it("호출 인자로 받은 위치는 캐시에서 형제 목록을 읽는다", async () => {
      const { queryClient, wrapper } = createQueryWrapper();
      queryClient.setQueryData(workspaceQueryKeys.listByFolder("5"), [
        ROOT_WORKSPACE,
      ]);

      const { result } = renderHook(() => useCreateWorkspace(), { wrapper });

      const created = await result.current.createWorkspace("5");

      expect(created.name).toBe("Workspace 2");
    });

    it("위치를 모르면 만들지 않는다", async () => {
      const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
      const { wrapper } = createQueryWrapper();
      const { result } = renderHook(() => useCreateWorkspace(), { wrapper });

      await expect(result.current.createWorkspace()).rejects.toThrow();
      expect(alertSpy).toHaveBeenCalled();

      alertSpy.mockRestore();
    });

    /*
    백엔드가 같은 위치의 이름 중복을 거절하므로, 형제 목록을 모르는 채로 기본 이름을
    추측해서 시도하지 않는다.
    */
    it("형제 목록을 알 수 없으면 만들지 않는다", async () => {
      const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
      const { wrapper } = createQueryWrapper();
      const { result } = renderHook(() => useCreateWorkspace(), { wrapper });

      await expect(result.current.createWorkspace("5")).rejects.toThrow();
      expect(alertSpy).toHaveBeenCalled();

      alertSpy.mockRestore();
    });
  });

  describe("isCreateWorkspaceDisabled", () => {
    it("파라미터를 받지 않으면 요청 중 여부만 반영한다", () => {
      const { wrapper } = createQueryWrapper();
      const { result } = renderHook(() => useCreateWorkspace(), { wrapper });

      expect(result.current.isCreateWorkspaceDisabled).toBe(false);
    });

    it("파라미터로 받은 folderId가 유효하지 않으면 비활성이다", () => {
      const { wrapper } = createQueryWrapper();
      const { result } = renderHook(
        () => useCreateWorkspace({ folderId: "0", workspaces: [] }),
        { wrapper },
      );

      expect(result.current.isCreateWorkspaceDisabled).toBe(true);
    });

    /*
    Number(null)이 0이므로 null 확인이 숫자 변환보다 먼저여야 한다.
    순서가 뒤집히면 루트가 유효하지 않은 값으로 판정돼 이 검사가 실패한다.
    */
    it("루트(folderId: null)는 유효한 위치로 취급한다", () => {
      const { wrapper } = createQueryWrapper();
      const { result } = renderHook(
        () => useCreateWorkspace({ folderId: null, workspaces: [] }),
        { wrapper },
      );

      expect(result.current.isCreateWorkspaceDisabled).toBe(false);
    });

    it("파라미터로 받은 workspaces가 아직 없으면 비활성이다", () => {
      const { wrapper } = createQueryWrapper();
      const { result } = renderHook(
        () => useCreateWorkspace({ folderId: "3" }),
        { wrapper },
      );

      expect(result.current.isCreateWorkspaceDisabled).toBe(true);
    });

    it("folderId와 workspaces를 모두 받으면 활성이다", () => {
      const { wrapper } = createQueryWrapper();
      const { result } = renderHook(
        () => useCreateWorkspace({ folderId: "3", workspaces: [] }),
        { wrapper },
      );

      expect(result.current.isCreateWorkspaceDisabled).toBe(false);
    });
  });
});
