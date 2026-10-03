import { WorkspaceDTO } from "@/src/entities/workspace/api/types";
import {
  WorkspaceDetail,
  WorkspaceItem,
} from "@/src/entities/workspace/model/types";

/*
folderId는 목록 카드에도 싣는다. 최신순 목록은 폴더를 가로지르므로, 이름 수정·삭제가 갱신할
폴더 목록 캐시를 항목마다 알아야 한다. null 확인이 문자열 변환보다 먼저다. String(null)은 "null"이라
루트의 워크스페이스가 "null"이라는 폴더에 든 것처럼 된다.
treeId는 목록 카드가 쓰지 않으므로 상세 모델에만 싣는다.
*/
export const mapWorkspaceDtoToDomain = (dto: WorkspaceDTO): WorkspaceItem => {
  return {
    id: String(dto.workspaceId),
    name: dto.name,
    folderId: dto.folderId === null ? null : String(dto.folderId),
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
