import { WorkspaceDTO } from "@/src/entities/workspace/api/types";
import { WorkspaceItem } from "@/src/entities/workspace/model/types";

/*
folderId는 도메인 모델에 옮기지 않는다. 목록이 이미 폴더 기준으로 조회되므로 화면이 쓸 일이 없다.
*/
export const mapWorkspaceDtoToDomain = (dto: WorkspaceDTO): WorkspaceItem => {
  return {
    id: String(dto.workspaceId),
    name: dto.name,
    updatedAt: dto.updatedAt,
  };
};

export const mapWorkspaceListDtoToDomain = (
  dtos: WorkspaceDTO[],
): WorkspaceItem[] => {
  return dtos.map((dto) => mapWorkspaceDtoToDomain(dto));
};
