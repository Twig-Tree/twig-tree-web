"use client";

import { RecentHeader } from "@/src/widgets/recent";

export default function RecentPage() {
  return (
    <div className="h-full overflow-y-auto bg-slate-50/70 px-6 py-8 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <RecentHeader
          onSelectFolderPath={(folderParentId) => {
            /*
            워크스페이스는 프롬프트 전송으로 트리와 함께 생성되므로 단일 생성 API가 없다.
            트리 생성 API 연동(#6) 전까지 선택된 위치만 알린다.
            */
            alert(
              `선택한 위치: ${folderParentId === null ? "루트" : folderParentId}`,
            );
          }}
        />
      </div>
    </div>
  );
}
