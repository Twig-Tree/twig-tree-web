"use client";

import { useRouter } from "next/navigation";
import { DEMO_TREES, type DemoTreeNode } from "@/src/entities/lecture";
import { routes } from "@/src/shared/config/routes";
import { Button } from "@/src/shared/ui/button";
import { useCreateDemoTree } from "../model/useCreateDemoTree";

/*
함수 이름 : getDemoTreeNodeCount
기능 : 데모 트리의 노드 수를 센다.
인자 : DemoTreeNode node -> 셀 트리의 루트
반환값 : 루트를 포함한 노드 수
*/
const getDemoTreeNodeCount = (node: DemoTreeNode): number =>
  (node.children ?? []).reduce(
    (count, child) => count + getDemoTreeNodeCount(child),
    1,
  );

/*
함수 이름 : DemoTreeCreator
기능 : 데모 강의가 재생되는 트리를 DB에 만들고, 다 만들면 그 워크스페이스로 이동한다.
인자 : 없음
반환값 : 데모 트리 목록과 생성 버튼
*/
export function DemoTreeCreator() {
  const router = useRouter();
  const { mutate: createDemoTree, isPending, error } = useCreateDemoTree();

  const handleCreateDemoTree = (tree: DemoTreeNode) => {
    createDemoTree(tree, {
      onSuccess: (workspaceId) => router.push(routes.workspace(workspaceId)),
    });
  };

  return (
    <main className="mx-auto flex h-full w-full max-w-xl flex-col gap-6 overflow-y-auto bg-surface px-4 py-10 text-content">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">데모 트리</h1>
        <p className="text-sm text-content-secondary">
          로컬 DB가 비어 있을 때 데모 강의가 재생되는 트리를 루트 폴더에 다시
          만듭니다. 같은 이름의 워크스페이스가 이미 있으면 만들 수 없습니다.
        </p>
      </header>

      <ul className="flex flex-col gap-3">
        {DEMO_TREES.map((tree) => (
          <li
            key={tree.name}
            className="flex items-center justify-between gap-4 rounded-card border border-line p-4"
          >
            <div className="min-w-0">
              <p className="font-semibold">{tree.name}</p>
              <p className="text-sm text-content-muted">
                노드 {getDemoTreeNodeCount(tree)}개
              </p>
            </div>
            <Button
              variant="primary"
              disabled={isPending}
              onClick={() => handleCreateDemoTree(tree)}
            >
              {isPending ? "만드는 중" : "만들기"}
            </Button>
          </li>
        ))}
      </ul>

      {error !== null && (
        <p role="alert" className="text-sm text-danger">
          트리를 만들지 못했습니다. 같은 이름의 워크스페이스나 만들다 만
          워크스페이스가 있으면 지우고 다시 시도하세요.
        </p>
      )}
    </main>
  );
}
