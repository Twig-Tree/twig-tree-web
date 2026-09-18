"use client";

import type { WorkspaceItem } from "@/src/entities/workspace";
import { PromptComposer } from "@/src/features/prompt/compose-prompt";
import { useCreateWorkspaceFromPrompt } from "@/src/features/prompt/create-workspace-from-prompt";
import { routes } from "@/src/shared/config/routes";
import {
  DashboardHero,
  RecentWorkspaceSection,
  TreeCreatingNotice,
} from "@/src/widgets/dashboard";

/*
최근 워크스페이스 조회 API를 연동하기 전까지 사용하는 임시 목록.
연동 시 useGetRecentWorkspaceListQuery의 결과로 교체한다.
*/
const recentWorkspaces: WorkspaceItem[] = [
  { id: "1", name: "Recent Workspace 1", updatedAt: "2026-08-31T21:00:00" },
  { id: "2", name: "Recent Workspace 2", updatedAt: "2026-08-31T18:00:00" },
  { id: "3", name: "Recent Workspace 3", updatedAt: "2026-08-30T09:00:00" },
];

export default function DashboardPage() {
  const { createWorkspaceFromPrompt, isCreatingWorkspaceFromPrompt } =
    useCreateWorkspaceFromPrompt();

  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col gap-12 overflow-y-auto px-8 py-12">
      <div className="flex flex-1 flex-col justify-center gap-12">
        <DashboardHero />

        <RecentWorkspaceSection
          workspaces={recentWorkspaces}
          viewAllHref={routes.recent}
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
