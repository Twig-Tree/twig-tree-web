import { useState } from "react";
import { type LectureAnimation } from "@/src/entities/lecture";
import { Button } from "@/src/shared/ui/button";
import { getLabStepsFromJson, type LabStep } from "../model/labTimeline";

type LabJsonEditorProps = {
  animation: LectureAnimation; // 타임라인에서 만들어진 애니메이션
  onApply: (steps: LabStep[]) => void; // 고친 JSON으로 타임라인을 바꾼다
};

/*
함수 이름 : LabJsonEditor
기능 : 타임라인을 대본 계약 JSON으로 보여 주고, 직접 고쳐 타임라인에 되돌리거나 복사하게 한다.
인자 : LabJsonEditorProps
반환값 : JSON 편집 영역

고치는 중에만 초안을 따로 두고, 그 외에는 타임라인에서 파생한다. 복사본을 state에 두면 타임라인과 어긋난다.
*/
export function LabJsonEditor({ animation, onApply }: LabJsonEditorProps) {
  const [draft, setDraft] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const animationJson = JSON.stringify(animation, null, 2);
  const value = draft ?? animationJson;

  const handleApply = () => {
    const result = getLabStepsFromJson(value);

    if ("error" in result) {
      setErrorMessage(result.error);
      return;
    }

    setDraft(null);
    setErrorMessage(null);
    onApply(result.steps);
  };

  const handleDiscard = () => {
    setDraft(null);
    setErrorMessage(null);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setIsCopied(true);
    window.setTimeout(() => setIsCopied(false), 1200);
  };

  return (
    <section aria-label="애니메이션 JSON" className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-content-secondary">
          대본 JSON (beat.animation)
        </h3>
        <Button
          className="!h-8 !px-3 text-xs"
          onClick={() => void handleCopy()}
        >
          {isCopied ? "복사됨" : "복사"}
        </Button>
      </div>

      <textarea
        aria-label="애니메이션 JSON 편집"
        spellCheck={false}
        value={value}
        rows={10}
        className="w-full resize-y rounded-control border border-line bg-surface p-2 font-mono text-xs text-content"
        onChange={(event) => {
          setDraft(event.target.value);
          setErrorMessage(null);
        }}
      />

      {errorMessage ? (
        <p role="alert" className="text-xs font-medium text-danger">
          {errorMessage}
        </p>
      ) : null}

      {draft !== null ? (
        <div className="flex gap-2">
          <Button
            variant="primary"
            className="!h-8 flex-1 text-xs"
            onClick={handleApply}
          >
            타임라인에 적용
          </Button>
          <Button className="!h-8 flex-1 text-xs" onClick={handleDiscard}>
            되돌리기
          </Button>
        </div>
      ) : null}
    </section>
  );
}
