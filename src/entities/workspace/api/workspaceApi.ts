import { axiosInstance } from "@/src/shared/api/axiosInstance";
import {
  CreateWorkspaceRequest,
  CreateWorkspaceResponse,
  GetWorkspaceListResponse,
} from "@/src/entities/workspace/api/types";
import {
  mapWorkspaceDtoToDomain,
  mapWorkspaceListDtoToDomain,
} from "@/src/entities/workspace/lib/mappers";
import { WorkspaceItem } from "@/src/entities/workspace/model/types";

export const workspaceApi = {
  /*
  함수 이름 : getWorkspaceList
  기능 : 폴더 기준으로 워크스페이스 목록을 조회한다. 정렬은 서버가 수정 시각 내림차순으로 해 준다.
  인자 : number | null folderId -> 조회할 폴더 ID. 루트는 null
  반환값 : 워크스페이스 목록
  */
  getWorkspaceList: async (
    folderId: number | null,
  ): Promise<WorkspaceItem[]> => {
    const response = await axiosInstance.get<GetWorkspaceListResponse>(
      "/workspaces",
      {
        params: {
          folderId: folderId === null ? undefined : folderId,
        },
      },
    );
    return mapWorkspaceListDtoToDomain(response.data.data);
  },

  /*
  함수 이름 : createWorkspace
  기능 : 빈 워크스페이스를 생성한다. 응답은 조회와 같은 DTO라 같은 mapper를 쓴다.
  인자 : CreateWorkspaceRequest body -> 생성할 워크스페이스 이름과 위치
  반환값 : 생성된 워크스페이스
  */
  createWorkspace: async (
    body: CreateWorkspaceRequest,
  ): Promise<WorkspaceItem> => {
    const response = await axiosInstance.post<CreateWorkspaceResponse>(
      "/workspaces",
      body,
    );
    return mapWorkspaceDtoToDomain(response.data.data);
  },
};
