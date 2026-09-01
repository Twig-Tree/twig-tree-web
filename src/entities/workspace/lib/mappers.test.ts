import { describe, it, expect } from "vitest";
import type { WorkspaceDTO } from "../api/types";
import {
  mapWorkspaceDtoToDomain,
  mapWorkspaceListDtoToDomain,
} from "./mappers";

const createWorkspaceDto = (
  overrides: Partial<WorkspaceDTO> = {},
): WorkspaceDTO => ({
  workspaceId: 12,
  name: "Workspace",
  folderId: 3,
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
  목록이 이미 폴더 기준으로 조회되므로 화면이 folderId를 쓸 일이 없다.
  도메인 모델에 넣지 않기로 한 결정을 여기서 고정한다.
  */
  it("folderId는 도메인 모델로 옮기지 않는다", () => {
    expect(mapWorkspaceDtoToDomain(createWorkspaceDto())).toEqual({
      id: "12",
      name: "Workspace",
      updatedAt: "2026-08-31T21:00:00",
    });
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
