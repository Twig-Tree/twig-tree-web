import type { ReactNode } from "react";
import type { TreeTag } from "@/src/entities/tree";

type TagChipListProps = {
  nodeTags: TreeTag[]; // 노드에 붙은 태그. 붙인 순서대로 칩을 그린다
  onDetach: (tagId: string) => void; // 칩의 X 버튼을 눌렀을 때 노드에서 뗄 태그 ID를 넘긴다
  children?: ReactNode; // 칩 목록 끝에 놓을 태그 입력. 칩과 같은 줄에 이어 붙는다
};

/*
함수 이름 : TagChipList
기능 : 메모 패널 하단에 선택된 노드의 태그를 칩으로 보여 주고, 칩에서 노드와 태그의 연결을 끊게 한다.
트리 태그 자체는 지우지 않는다. 트리 태그 삭제는 워크스페이스 패널의 태그 목록이 맡는다.
인자 : TagChipListProps
반환값 : 노드 태그 영역
*/
export const TagChipList = ({
  nodeTags,
  onDetach,
  children,
}: TagChipListProps) => {
  return (
    <section
      aria-label="노드 태그"
      className="shrink-0 border-t border-slate-200 px-5 py-4"
    >
      <h3 className="text-xs font-medium tracking-wide text-slate-400">태그</h3>

      <ul className="mt-2 flex flex-wrap items-start gap-1.5">
        {nodeTags.map((tag) => (
          <li
            key={tag.id}
            className="flex h-7 max-w-full items-center gap-1 rounded-full bg-slate-100 pr-1 pl-2.5 text-xs text-slate-700"
          >
            <span className="min-w-0 truncate" title={tag.name}>
              {tag.name}
            </span>
            <button
              type="button"
              aria-label={`${tag.name} 태그 제거`}
              onClick={() => onDetach(tag.id)}
              className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
            >
              <span aria-hidden="true">×</span>
            </button>
          </li>
        ))}

        {/*
        남은 줄 폭을 차지해, 입력창이 열리면 칩 옆 빈 자리를 채우고 좁으면 다음 줄로 넘어간다.
        태그 입력은 자동완성 자리까지 품어 키가 크므로, 목록을 items-start로 두어 같은 줄의 칩이 따라 늘어나지 않게 한다.
        */}
        {children ? <li className="min-w-32 grow">{children}</li> : null}
      </ul>
    </section>
  );
};
