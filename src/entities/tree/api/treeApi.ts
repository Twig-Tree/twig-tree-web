import { axiosInstance } from "@/src/shared/api/axiosInstance";
import {
  CreateNodeRequest,
  CreateTreeFromPromptRequest,
  GetTreeResponse,
  CreateTreeFromPromptResponse,
  CreateNodeResponse,
  TreeMockScenario,
} from "./types";
import { ApiResponse } from "@/src/shared/api/types";
import { CreatedTree, TreeNode } from "../model/types";
import {
  mapCreatedTreeDtoToDomain,
  mapNodeDtoToDomain,
  mapNodesDtoToDomain,
} from "../lib/mappers";
import { LLM_PROVIDER } from "../model/constants";

interface CreateTreeFromPromptParams {
  message: string; // 사용자가 입력한 지시문. 첨부만 보내는 경우 빈 문자열일 수 있다
  file?: File; // 첨부 파일. 있으면 multipart로 보낸다
  mock?: TreeMockScenario; // 개발용. 주면 백엔드가 LLM을 호출하지 않고 고정 트리를 돌려준다
}

/*
LLM 응답을 기다리는 시간. 백엔드가 LLM 호출을 65초에서 끊으므로(ChatService.LLM_TIMEOUT)
그보다 짧으면 프론트가 항상 먼저 끊는다. 파싱·검증·저장에 드는 시간을 더해 잡는다.
axiosInstance 기본값(10초)은 다른 요청을 위해 그대로 둔다.
*/
const CREATE_TREE_FROM_PROMPT_TIMEOUT_MS = 90_000;

export const treeApi = {
  /*
  함수 이름 : createTreeFromPrompt
  기능 : 프롬프트를 보내 워크스페이스·트리·노드를 한 번에 만든다. 첨부 파일이 있으면 multipart로 보낸다.
  인자 : CreateTreeFromPromptParams
  반환값 : 서버가 확정한 워크스페이스 ID, 트리 ID, 노드 목록

  빈 트리를 만드는 workspaceApi.createWorkspaceTree와 다른 요청이다.
  이쪽은 LLM이 채운 트리를 워크스페이스째로 만들어 돌려준다.
  */
  createTreeFromPrompt: async ({
    message,
    file,
    mock,
  }: CreateTreeFromPromptParams): Promise<CreatedTree> => {
    const mockParams = mock === undefined ? undefined : { mock };

    if (file === undefined) {
      const body: CreateTreeFromPromptRequest = {
        message,
        provider: LLM_PROVIDER,
      };

      const res = await axiosInstance.post<CreateTreeFromPromptResponse>(
        "/tree-request",
        body,
        { params: mockParams, timeout: CREATE_TREE_FROM_PROMPT_TIMEOUT_MS },
      );

      return mapCreatedTreeDtoToDomain(res.data.data);
    }

    /*
    백엔드의 multipart 핸들러는 파일만 본문으로 받고 message와 provider는 쿼리 파라미터로 읽는다.
    지시문 없이 파일만 보내는 경우가 있어 빈 문자열은 싣지 않는다. 백엔드는 둘 다 비었을 때만 거절한다.
    */
    const formData = new FormData();

    /*
    파일 이름을 세 번째 인자로 명시한다. 생략하면 환경에 따라 조각의 filename이 "blob"으로 실려
    백엔드가 확장자로 파서를 고르지 못하고 CHAT400-4로 거절한다.
    */
    formData.append("file", file, file.name);

    const res = await axiosInstance.post<CreateTreeFromPromptResponse>(
      "/tree-request",
      formData,
      {
        params: {
          ...mockParams,
          ...(message === "" ? {} : { message }),
          provider: LLM_PROVIDER,
        },
        timeout: CREATE_TREE_FROM_PROMPT_TIMEOUT_MS,
        /*
        FormData의 경계 문자열은 요청마다 달라 브라우저가 직접 붙여야 한다.
        axiosInstance의 기본 Content-Type(application/json)을 지워야 그 자리가 비고, 남겨 두면 서버가 조각을 나누지 못한다.
        */
        headers: { "Content-Type": undefined },
      },
    );

    return mapCreatedTreeDtoToDomain(res.data.data);
  },

  getTree: async (treeId: number): Promise<TreeNode[]> => {
    const res = await axiosInstance.get<GetTreeResponse>(
      `/trees/${treeId}/nodes`,
    );
    return mapNodesDtoToDomain(res.data.data.nodes);
  },

  createNode: async (
    treeId: number,
    body: CreateNodeRequest,
  ): Promise<TreeNode> => {
    const res = await axiosInstance.post<CreateNodeResponse>(
      `/trees/${treeId}/nodes`,
      body,
    );
    return mapNodeDtoToDomain(res.data.data);
  },

  deleteNode: async (treeId: number, nodeId: number): Promise<void> => {
    await axiosInstance.delete<ApiResponse<void>>(
      `/trees/${treeId}/nodes/${nodeId}`,
    );
  },
};
