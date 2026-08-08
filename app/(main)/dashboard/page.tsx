"use client";

import type { WorkspaceItem } from "@/src/entities/workspace";
import { PromptComposer } from "@/src/features/prompt/compose-prompt";
import { routes } from "@/src/shared/config/routes";
import {
  DashboardHero,
  RecentWorkspaceSection,
} from "@/src/widgets/dashboard";

/*
최근 워크스페이스 조회 API를 연동하기 전까지 사용하는 임시 목록.
연동 시 useGetRecentWorkspaceListQuery의 결과로 교체한다.
*/
const recentWorkspaces: WorkspaceItem[] = [
  { id: "1", name: "Recent Workspace 1", modifiedAt: "2 hours ago" },
  { id: "2", name: "Recent Workspace 2", modifiedAt: "5 hours ago" },
  { id: "3", name: "Recent Workspace 3", modifiedAt: "Yesterday" },
];

export default function DashboardPage() {
  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col gap-12 px-8 py-12">
      <div className="flex flex-1 flex-col justify-center gap-12">
        <DashboardHero />

        <RecentWorkspaceSection
          workspaces={recentWorkspaces}
          viewAllHref={routes.workspaceRoot}
        />
      </div>

      <div>
        <PromptComposer
          placeholder="Research on renewable energy"
          onSubmit={() => {
            /*
            워크스페이스 생성 API 연동 전까지 전송이 눌린 사실만 알린다.
            연동 시 create-workspace-from-prompt feature의 handler로 교체한다.
            */
            alert("API 연동 예정입니다.");
          }}
        />

        <p className="mt-3 text-center text-xs text-slate-400">
          The Architect may produce inaccurate information about people, places,
          or facts.
        </p>
      </div>
    </div>
  );
}
