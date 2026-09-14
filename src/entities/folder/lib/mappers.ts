import { FolderDTO, FolderPathItemDTO } from "@/src/entities/folder/api/types";
import { FolderItem } from "@/src/entities/folder/model/types";

export const mapFolderDtoToDomain = (dto: FolderDTO): FolderItem => {
  return {
    id: String(dto.folderId),
    name: dto.name,
  };
};

export const mapFolderListDtoToDomain = (dtos: FolderDTO[]): FolderItem[] => {
  return dtos.map((dto) => mapFolderDtoToDomain(dto));
};

/*
경로 항목에는 folderParentId가 없다. 순서가 곧 상하 관계이므로 백엔드가 보내지 않는다.
*/
export const mapFolderPathDtoToDomain = (
  dtos: FolderPathItemDTO[],
): FolderItem[] => {
  return dtos.map((dto) => ({
    id: String(dto.folderId),
    name: dto.name,
  }));
};
