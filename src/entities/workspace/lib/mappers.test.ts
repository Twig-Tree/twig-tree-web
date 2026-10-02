import { describe, it, expect } from "vitest";
import type { WorkspaceDTO } from "../api/types";
import {
  mapWorkspaceDetailDtoToDomain,
  mapWorkspaceDtoToDomain,
  mapWorkspaceListDtoToDomain,
} from "./mappers";

const createWorkspaceDto = (
  overrides: Partial<WorkspaceDTO> = {},
): WorkspaceDTO => ({
  workspaceId: 12,
  name: "Workspace",
  folderId: 3,
  treeId: 7,
  updatedAt: "2026-08-31T21:00:00",
  ...overrides,
});

describe("mapWorkspaceDtoToDomain", () => {
  it("숫자 ID를 문자열로 바꾼다", () => {
    expect(mapWorkspaceDtoToDomain(createWorkspaceDto()).id).toBe("12");
  });

  it("updatedAt은 서버 값을 그대로 싣는다", () => {
    const dto = createWorkspaceDto({ updatedAt: "2026-01-05T09:07:00.123" });

    expect(mapWorkspaceDtoToDomain(dto).updatedAt).toBe(
      "2026-01-05T09:07:00.123",
    );
  });

  /*
  treeId는 목록 카드가 쓰지 않으므로 상세 모델에만 싣는다.
  */
  it("folderId를 문자열로 바꿔 싣고 treeId는 옮기지 않는다", () => {
    expect(mapWorkspaceDtoToDomain(createWorkspaceDto())).toEqual({
      id: "12",
      name: "Workspace",
      folderId: "3",
      updatedAt: "2026-08-31T21:00:00",
    });
  });

  /*
  String(null)은 "null"이라, null 확인이 빠지면 루트의 워크스페이스가 "null" 폴더에 든 것처럼 된다.
  */
  it("루트에 있으면 folderId를 null로 둔다", () => {
    const dto = createWorkspaceDto({ folderId: null });

    expect(mapWorkspaceDtoToDomain(dto).folderId).toBeNull();
  });
});

describe("mapWorkspaceDetailDtoToDomain", () => {
  it("treeId를 문자열로 바꿔 싣는다", () => {
    expect(mapWorkspaceDetailDtoToDomain(createWorkspaceDto())).toEqual({
      id: "12",
      name: "Workspace",
      folderId: "3",
      updatedAt: "2026-08-31T21:00:00",
      treeId: "7",
    });
  });

  /*
  String(null)은 "null"이라, null 확인이 빠지면 트리가 없는 워크스페이스가 트리를 가진 것처럼 된다.
  */
  it("트리가 없으면 treeId를 null로 둔다", () => {
    const dto = createWorkspaceDto({ treeId: null });

    expect(mapWorkspaceDetailDtoToDomain(dto).treeId).toBeNull();
  });
});

describe("mapWorkspaceListDtoToDomain", () => {
  it("서버가 준 순서를 그대로 둔다", () => {
    const dtos = [
      createWorkspaceDto({ workspaceId: 1, name: "최근" }),
      createWorkspaceDto({ workspaceId: 2, name: "예전" }),
    ];

    expect(mapWorkspaceListDtoToDomain(dtos).map(({ name }) => name)).toEqual([
      "최근",
      "예전",
    ]);
  });

  it("빈 목록은 빈 배열로 돌려준다", () => {
    expect(mapWorkspaceListDtoToDomain([])).toEqual([]);
  });
});
