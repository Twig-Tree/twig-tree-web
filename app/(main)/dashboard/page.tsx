"use client";

import { useGetRecentWorkspaceListQuery } from "@/src/entities/workspace";
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
  /*
  최신순 화면과 같은 query라 캐시를 함께 쓴다. 두 화면을 오가도 조회가 겹치지 않는다.
  */
  const recentWorkspaceListQuery = useGetRecentWorkspaceListQuery();
  const { createWorkspaceFromPrompt, isCreatingWorkspaceFromPrompt } =
    useCreateWorkspaceFromPrompt();

  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col gap-12 overflow-y-auto px-8 py-12">
      <div className="flex flex-1 flex-col justify-center gap-12">
        <DashboardHero />

        <RecentWorkspaceSection
          isError={recentWorkspaceListQuery.isError}
          isLoaded={recentWorkspaceListQuery.isSuccess}
          isLoading={recentWorkspaceListQuery.isLoading}
          viewAllHref={routes.recent}
          workspaces={(recentWorkspaceListQuery.data ?? []).slice(
            0,
            RECENT_WORKSPACE_DISPLAY_COUNT,
          )}
        />
      </div>

      <div className="flex flex-col gap-3">
        {isCreatingWorkspaceFromPrompt ? <TreeCreatingNotice /> : null}

        {/*
        첨부는 하나까지만 받으므로 첫 항목의 원본 파일을 넘긴다. 목록으로 관리하는 것은 입력 UI의 사정이고,
        요청에 실리는 것은 파일 하나다.
        */}
        <PromptComposer
          placeholder="Research on renewable energy"
          isSubmitting={isCreatingWorkspaceFromPrompt}
          onSubmit={(draft) =>
            createWorkspaceFromPrompt(draft.text, draft.attachments[0]?.file)
          }
        />

        <p className="text-center text-xs text-slate-400">
          The Architect may produce inaccurate information about people, places,
          or facts.
        </p>
      </div>
    </div>
  );
}
