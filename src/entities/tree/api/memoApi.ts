import { axiosInstance } from "@/src/shared/api/axiosInstance";
import { ApiResponse } from "@/src/shared/api/types";
import { MemoDTO, UpdateMemoRequest, UpdateMemoResponse } from "./types";

export const memoApi = {
  updateMemo: async (
    nodeId: number,
    body: UpdateMemoRequest,
  ): Promise<MemoDTO> => {
    const res = await axiosInstance.put<UpdateMemoResponse>(
      `/nodes/${nodeId}/memos`,
      body,
    );
    return res.data.data;
  },

  deleteMemo: async (nodeId: number): Promise<void> => {
    await axiosInstance.delete<ApiResponse<void>>(`/nodes/${nodeId}/memos`);
  },
};
