import type { NodeResult } from "@/src/features/tree-editor";

export interface NodeResultListProps {
  results: NodeResult[]; // 보여 줄 결과
  emptyMessage: string; // 결과가 없을 때 안내. 검색과 태그가 문구를 다르게 쓴다
  onSelect: (result: NodeResult) => void; // 항목을 눌렀을 때
  isSelectDisabled: boolean; // 항목 클릭을 막을지
}

/*
함수 이름 : NodeResultList
기능 : 강조된 노드들을 목록으로 보여 주고, 항목을 누르면 그 결과를 넘긴다. 검색과 태그가 함께 쓰므로 결과가 어디서 왔는지는 모른다.
인자 : NodeResultListProps
반환값 : 결과 개수와 결과 목록. 결과가 없으면 안내 문구
*/
export function NodeResultList({
  results,
  emptyMessage,
  onSelect,
  isSelectDisabled,
}: NodeResultListProps) {
  if (results.length === 0) {
    return (
      <p className="px-3 py-6 text-center text-sm text-slate-500">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <p className="px-3 text-xs font-medium text-slate-400">
        결과 {results.length}개
      </p>

      <ul className="flex flex-col">
        {results.map((result) => (
          <li key={result.clientId}>
            <button
              type="button"
              title={result.label}
              disabled={isSelectDisabled}
              onClick={() => onSelect(result)}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none disabled:cursor-not-allowed disabled:text-slate-400 disabled:hover:bg-transparent"
            >
              <span className="min-w-0 flex-1 truncate">{result.label}</span>
              {/*
              배지 글자는 이름과 붙어 "이름메모"로 읽히므로, 화면에는 배지만 보이고 스크린 리더에는 일치 위치를 문장으로 읽힌다.
              */}
              {result.isMemoMatched ? (
                <>
                  <span
                    aria-hidden="true"
                    className="shrink-0 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 ring-1 ring-amber-200"
                  >
                    메모
                  </span>
                  <span className="sr-only">, 메모에서 일치</span>
                </>
              ) : null}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
