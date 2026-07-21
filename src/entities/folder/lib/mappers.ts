import { FolderDTO } from "@/src/entities/folder/api/types";
import { FolderItem } from "@/src/entities/folder/model/types";

export const mapFolderDtoToDomain = (dto: FolderDTO): FolderItem => {
  return {
    id: String(dto.folderId),
    name: dto.name,
  };
};
