import { useState } from "react";
import { LoaderCircle, Sparkles, X } from "lucide-react";
import { Button } from "@/src/shared/ui/button";
import { IconButton } from "@/src/shared/ui/icon-button";
import { getLectureGenerationErrorMessage } from "../lib/lecture/getLectureGenerationErrorMessage";
import { useGeneratedLectureStore } from "../model/lecture/generatedLectureStore";
import { useGenerateLecture } from "../model/lecture/useGenerateLecture";

type LectureGeneratorProps = {
  onClose: () => void; // 패널을 닫는다. 생성에 성공해도 부른다
};

/*
함수 이름 : LectureGenerator
기능 : 버튼을 누르면 지금 트리로 강의를 만들고, 만든 대본을 트리별 생성 강의로 보관한다.
인자 : LectureGeneratorProps
반환값 : 강의 만들기 버튼, 생성 중 안내, 실패 안내
*/
export function LectureGenerator({ onClose }: LectureGeneratorProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { generateLecture, isGenerating } = useGenerateLecture();
  const setGeneratedLecture = useGeneratedLectureStore(
    (state) => state.setGeneratedLecture,
  );

  /*
  요청을 보내고 결과에 따라 대본을 보관하거나 실패 이유를 보여 준다.
  */
  const handleGenerate = async () => {
    setErrorMessage(null);

    const result = await generateLecture();
    if (result === null) return;

    if (result.status === "success") {
      setGeneratedLecture(result.treeId, result.script);
      onClose();
      return;
    }

    setErrorMessage(getLectureGenerationErrorMessage(result));
  };

  return (
    <section
      aria-label="강의 만들기"
      data-camera-inset="bottom"
      className="pointer-events-auto flex w-full flex-col gap-3 rounded-card border border-line bg-surface px-4 py-3 shadow-control"
    >
      <div className="flex items-center gap-2">
        <Sparkles className="size-5 text-accent" aria-hidden="true" />
        <h2 className="flex-1 text-sm font-semibold text-content">
          이 트리로 강의 만들기
        </h2>
        <IconButton
          aria-label="강의 만들기 닫기"
          size="sm"
          disabled={isGenerating}
          onClick={onClose}
        >
          <X />
        </IconButton>
      </div>

      <div className="flex items-center gap-3">
        <p className="flex-1 text-xs text-content-secondary">
          지금 트리를 뿌리에서 가지 순서로 설명하는 강의를 만듭니다.
        </p>
        <Button
          variant="primary"
          disabled={isGenerating}
          onClick={() => void handleGenerate()}
        >
          강의 만들기
        </Button>
      </div>

      {isGenerating ? (
        <p
          role="status"
          className="flex items-center gap-2 text-xs text-content-secondary"
        >
          <LoaderCircle
            className="size-4 motion-safe:animate-spin"
            aria-hidden="true"
          />
          강의를 만드는 중입니다. 최대 2분쯤 걸립니다.
        </p>
      ) : null}

      {errorMessage === null ? null : (
        <p role="alert" className="text-xs text-danger">
          {errorMessage}
        </p>
      )}
    </section>
  );
}
