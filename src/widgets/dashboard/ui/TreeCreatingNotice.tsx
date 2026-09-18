import { Loader2 } from "lucide-react";

/*
함수 이름 : TreeCreatingNotice
기능 : 프롬프트로 트리를 만드는 동안 진행 중임을 알리고, 기다리는 시간이 길 수 있다는 것을 함께 안내한다.
인자 : 없음
반환값 : 생성 진행 안내 영역

AI 응답을 기다리는 구간이 1분에 이를 수 있어, 입력 바를 잠그는 것만으로는 화면이 멈춘 것처럼 보인다.
role="status"로 두어 스크린 리더에도 진행 상태가 전달되게 한다. 조용히 바뀌는 영역이므로 alert이 아니다.
*/
export function TreeCreatingNotice() {
  return (
    <div
      role="status"
      className="flex items-center gap-3 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-800"
    >
      <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden="true" />

      <div className="min-w-0">
        <p className="font-medium">트리를 만들고 있습니다</p>
        <p className="mt-0.5 text-xs text-indigo-700">
          내용에 따라 1분 정도 걸릴 수 있습니다. 창을 닫지 말고 기다려 주세요.
        </p>
      </div>
    </div>
  );
}
