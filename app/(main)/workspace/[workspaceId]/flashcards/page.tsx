"use client";

import Link from "next/link";
import { use } from "react";
import {
  FlashcardStudySession,
  sampleFlashcardScenarios,
} from "@/src/features/flashcards";
import { routes } from "@/src/shared/config/routes";
import { isValidApiId } from "@/src/shared/lib/validation/isValidApiId";
import { WorkspaceHeader, WorkspaceLoadError } from "@/src/widgets/workspace";

interface FlashcardsPageProps {
  params: Promise<{ workspaceId: string }>;
}

export default function FlashcardsPage({ params }: FlashcardsPageProps) {
  const { workspaceId } = use(params);

  if (!isValidApiId(workspaceId)) {
    return <WorkspaceLoadError isNotFound />;
  }

  const scenario = sampleFlashcardScenarios.find(
    (candidate) => candidate.tree.id === workspaceId,
  );

  return (
    <div className="flex h-full w-full flex-col bg-slate-50">
      <WorkspaceHeader
        name={scenario ? `${scenario.title} 플래시카드` : "플래시카드"}
        actions={<WorkspaceLearningNav workspaceId={workspaceId} />}
      />

      {scenario ? (
        <div className="flex min-h-0 flex-1 overflow-y-auto">
          <FlashcardStudySession
            key={workspaceId}
            workspaceId={workspaceId}
            scenario={scenario}
          />
        </div>
      ) : (
        <main className="grid min-h-0 flex-1 place-items-center px-6">
          <section className="max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">
              아직 준비된 카드가 없습니다
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              이 워크스페이스에는 프로토타입 플래시카드 덱이 연결되지
              않았습니다.
            </p>
            <Link
              href={routes.workspace(workspaceId)}
              className="mt-6 inline-flex h-10 items-center justify-center rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              트리로 돌아가기
            </Link>
          </section>
        </main>
      )}
    </div>
  );
}

function WorkspaceLearningNav({ workspaceId }: { workspaceId: string }) {
  return (
    <nav
      aria-label="워크스페이스 화면 전환"
      className="flex rounded-lg bg-slate-100 p-1 text-xs font-semibold"
    >
      <Link
        href={routes.workspace(workspaceId)}
        className="rounded-md px-3 py-1.5 text-slate-500 transition-colors hover:text-slate-900"
      >
        트리 보기
      </Link>
      <Link
        href={routes.learningPath(workspaceId)}
        className="rounded-md px-3 py-1.5 text-slate-500 transition-colors hover:text-slate-900"
      >
        학습 경로
      </Link>
      <Link
        href={routes.flashcards(workspaceId)}
        aria-current="page"
        className="rounded-md bg-white px-3 py-1.5 text-indigo-700 shadow-sm"
      >
        플래시카드
      </Link>
    </nav>
  );
}
