import { WorkspaceDTO } from "@/src/entities/workspace/api/types";
import {
  WorkspaceDetail,
  WorkspaceItem,
} from "@/src/entities/workspace/model/types";

/*
folderId는 도메인 모델에 옮기지 않는다. 목록이 이미 폴더 기준으로 조회되므로 화면이 쓸 일이 없다.
treeId도 목록 카드는 쓰지 않으므로 상세 모델에만 싣는다.
*/
export const mapWorkspaceDtoToDomain = (dto: WorkspaceDTO): WorkspaceItem => {
  return {
    id: String(dto.workspaceId),
    name: dto.name,
    updatedAt: dto.updatedAt,
  };
};

/*
null 확인이 문자열 변환보다 먼저다. String(null)은 "null"이라 트리가 있는 것처럼 보이게 된다.
*/
export const mapWorkspaceDetailDtoToDomain = (
  dto: WorkspaceDTO,
): WorkspaceDetail => {
  return {
    ...mapWorkspaceDtoToDomain(dto),
    treeId: dto.treeId === null ? null : String(dto.treeId),
  };
};

export const mapWorkspaceListDtoToDomain = (
  dtos: WorkspaceDTO[],
): WorkspaceItem[] => {
  return dtos.map((dto) => mapWorkspaceDtoToDomain(dto));
};
