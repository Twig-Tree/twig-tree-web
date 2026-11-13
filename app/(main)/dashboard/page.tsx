"use client";

import { useState } from "react";
import { useGetRecentWorkspaceFirstPageQuery } from "@/src/entities/workspace";
import { PromptComposer } from "@/src/features/prompt/compose-prompt";
import { useCreateWorkspaceFromPrompt } from "@/src/features/prompt/create-workspace-from-prompt";
import { routes } from "@/src/shared/config/routes";
import {
  DashboardHero,
  RECENT_WORKSPACE_DISPLAY_COUNT,
  RecentWorkspaceSection,
  TreeCreatingNotice,
} from "@/src/widgets/dashboard";

export default function DashboardPage() {
  const [editingWorkspaceId, setEditingWorkspaceId] = useState<string | null>(
    null,
  );
  const recentWorkspaceListQuery = useGetRecentWorkspaceFirstPageQuery(
    RECENT_WORKSPACE_DISPLAY_COUNT,
  );
  const { createWorkspaceFromPrompt, isCreatingWorkspaceFromPrompt } =
    useCreateWorkspaceFromPrompt();

  return (
    // 창 높이가 낮으면 여백부터 줄어 입력창까지 스크롤 없이 보이게 한다. 그래도 넘치면 세로로 스크롤한다.
    <div className="mx-auto flex h-full max-w-3xl flex-col gap-[clamp(1.25rem,5vh,3rem)] overflow-y-auto px-8 py-[clamp(1.5rem,6vh,3rem)]">
      <div className="flex flex-1 flex-col justify-center gap-[clamp(1.25rem,5vh,3rem)]">
        <DashboardHero />

        <RecentWorkspaceSection
          editingWorkspaceId={editingWorkspaceId}
          isError={recentWorkspaceListQuery.isError}
          isLoaded={recentWorkspaceListQuery.isSuccess}
          isLoading={recentWorkspaceListQuery.isLoading}
          onEditingEnd={() => setEditingWorkspaceId(null)}
          onWorkspaceEditingStart={setEditingWorkspaceId}
          viewAllHref={routes.recent}
          workspaces={recentWorkspaceListQuery.data ?? []}
        />
      </div>

      <div className="flex flex-col gap-3">
        {isCreatingWorkspaceFromPrompt ? <TreeCreatingNotice /> : null}

        {/*
        첨부는 하나까지만 받으므로 첫 항목의 원본 파일을 넘긴다. 목록으로 관리하는 것은 입력 UI의 사정이고,
        요청에 실리는 것은 파일 하나다.
        */}
        <PromptComposer
          placeholder="주제를 적거나 파일을 첨부하세요. 예: 재생 에너지 연구"
          isSubmitting={isCreatingWorkspaceFromPrompt}
          onSubmit={(draft) =>
            createWorkspaceFromPrompt(draft.text, draft.attachments[0]?.file)
          }
        />

        <p className="text-center text-xs text-content-muted">
          AI가 사람, 장소, 사실에 대해 부정확한 정보를 제공할 수 있습니다.
        </p>
      </div>
    </div>
  );
}
