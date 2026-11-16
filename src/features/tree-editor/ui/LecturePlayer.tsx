import { useEffect, useMemo, type Ref } from "react";
import {
  GraduationCap,
  LoaderCircle,
  Pause,
  Play,
  RotateCcw,
  SkipForward,
  Sparkles,
  Square,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { type LectureScript } from "@/src/entities/lecture";
import { Button } from "@/src/shared/ui/button";
import { IconButton } from "@/src/shared/ui/icon-button";
import { getEditorLectureScript } from "../lib/lecture/getEditorLectureScript";
import { useLectureAnimationStore } from "../model/lecture/lectureAnimationStore";
import { useLectureStore } from "../model/lecture/lectureStore";
import { useLectureGeneration } from "../model/lecture/useLectureGeneration";
import { useLecturePlayback } from "../model/lecture/useLecturePlayback";
import { useLectureKeyboard } from "../model/lecture/useLectureKeyboard";
import { useTreeStore } from "../model/treeStore";
import { LectureSubtitle } from "./LectureSubtitle";

type LecturePlayerProps = {
  script: LectureScript | null; // 지금 트리에서 재생할 수 있는 대본. 없으면 시작 화면 대신 강의 만들기 버튼을 그린다
  isGeneratedScript: boolean; // 생성한 강의인지. 생성한 강의에만 새로 만들기 버튼을 둔다. 데모 강의는 시연용으로 배치한 것이라 바꾸지 않는다
  onRevealNodes: (
    clientIds: string[],
    options: { maxZoom: number; duration: number; keepCollapse?: boolean },
  ) => void; // focus 동작에 사용할 강의 카메라 함수
  onResetCamera: () => void; // 종료와 reset 동작에 사용할 전체 트리 맞춤 함수
  onBeforeCollapseRestore: () => void; // 강의가 끝나 접힘을 되돌릴 때 바뀐 배치에 맞춰 화면을 옮기도록 맡기는 함수
  panelLayoutKey: string; // 패널 배치를 나타내는 값. 강의 중에 바뀌면 카메라를 다시 맞춘다
  onGenerateClick?: () => void; // 강의 만들기 버튼을 누르면 알린다. 기능 안내가 할 일을 마친 것으로 기록한다
  generateButtonRef?: Ref<HTMLButtonElement>; // 강의 만들기 버튼 요소. 대본이 없을 때의 글자 버튼과 생성한 강의의 아이콘 버튼 중 보이는 쪽이다. 데모 강의에는 없다. 기능 안내가 가리킨다
};

type LectureGenerationMessageProps = {
  isGenerating: boolean; // 강의를 만드는 중인지
  errorMessage: string | null; // 마지막 생성이 실패한 이유. 없으면 null
};

/*
함수 이름 : LectureGenerationMessage
기능 : 강의를 만드는 동안의 안내나 실패 이유를 보여 준다. 둘 다 없으면 그리지 않는다.
인자 : LectureGenerationMessageProps
반환값 : 생성 중 안내, 실패 안내, 또는 null
*/
function LectureGenerationMessage({
  isGenerating,
  errorMessage,
}: LectureGenerationMessageProps) {
  if (isGenerating) {
    return (
      <p
        role="status"
        className="flex items-center gap-2 text-xs text-content-secondary"
      >
        <LoaderCircle
          className="size-4 shrink-0 motion-safe:animate-spin"
          aria-hidden="true"
        />
        강의를 만드는 중입니다. 최대 2분쯤 걸립니다.
      </p>
    );
  }

  if (errorMessage === null) return null;

  return (
    <p role="alert" className="text-xs text-danger">
      {errorMessage}
    </p>
  );
}

/*
함수 이름 : LecturePlayer
기능 : 대본을 현재 트리에 연결하고 장면·비트 단위 음성, 자막, 애니메이션을 함께 재생한다.
시작 전에는 지금 트리로 강의를 바로 만들 수 있다. 이미 생성한 강의가 있으면 확인을 받은 뒤에 새로 만든다.
데모 강의가 배치된 트리에는 만들기 버튼을 두지 않는다.
인자 : LecturePlayerProps
반환값 : 강의 재생 컨트롤과 현재 내레이션
*/
export function LecturePlayer({
  script,
  isGeneratedScript,
  onRevealNodes,
  onResetCamera,
  onBeforeCollapseRestore,
  panelLayoutKey,
  onGenerateClick,
  generateButtonRef,
}: LecturePlayerProps) {
  const status = useLectureStore((state) => state.status);
  const activeScript = useLectureStore((state) => state.script);
  const sceneIndex = useLectureStore((state) => state.sceneIndex);
  const beatIndex = useLectureStore((state) => state.beatIndex);
  const seekId = useLectureStore((state) => state.seekId);
  const startLecture = useLectureStore((state) => state.startLecture);
  const pauseLecture = useLectureStore((state) => state.pauseLecture);
  const resumeLecture = useLectureStore((state) => state.resumeLecture);
  const goToNextScene = useLectureStore((state) => state.goToNextScene);
  const resetLecture = useLectureStore((state) => state.resetLecture);
  const resetVisual = useLectureAnimationStore((state) => state.resetVisual);
  const nodes = useTreeStore((state) => state.nodes);
  const { handleGenerateLecture, isGenerating, errorMessage } =
    useLectureGeneration({
      hasGeneratedScript: script !== null && isGeneratedScript,
    });

  const editorScript = useMemo(
    () => (script === null ? null : getEditorLectureScript(script, nodes)),
    [script, nodes],
  );

  const { audioMode, toggleMute, refocusCamera } = useLecturePlayback({
    revealNodes: onRevealNodes,
    resetCamera: onResetCamera,
    onBeforeCollapseRestore,
    panelLayoutKey,
  });

  useEffect(
    () => () => {
      useLectureStore.getState().resetLecture();
      useLectureAnimationStore.getState().resetVisual();
    },
    [],
  );

  const handleGenerateClick = () => {
    onGenerateClick?.();
    void handleGenerateLecture();
  };

  const handleStart = () => {
    if (editorScript === null) return;
    resetVisual();
    startLecture(editorScript);
  };

  const handleStop = () => {
    resetLecture();
    resetVisual();
    window.requestAnimationFrame(onResetCamera); // 작은 시작 화면으로 돌아간 플레이어의 크기로 맞추도록 그려진 뒤에 옮긴다.
  };

  useLectureKeyboard({
    onStop: handleStop,
    onToggleMute: toggleMute,
    onRefocusCamera: refocusCamera,
  });

  if (status === "idle") {
    /*
    대본이 없으면 버튼만 둔다. 만드는 중이거나 실패하면 그 안내를 담도록 카드로 넓힌다.
    버튼을 같은 자리에 두어, 카드로 바뀌어도 버튼이 다시 만들어지지 않고 기능 안내가 가리키는 요소도 그대로다.
    */
    if (script === null) {
      const hasMessage = isGenerating || errorMessage !== null;

      return (
        <div
          data-camera-inset="bottom"
          className={
            hasMessage
              ? "pointer-events-auto flex flex-col items-center gap-2 rounded-card border border-line bg-surface px-4 py-3 shadow-control"
              : "pointer-events-auto"
          }
        >
          <Button
            ref={generateButtonRef}
            className={hasMessage ? undefined : "shadow-control"}
            disabled={isGenerating}
            onClick={handleGenerateClick}
          >
            <Sparkles className="size-4 text-accent" aria-hidden="true" />
            강의 만들기
          </Button>
          <LectureGenerationMessage
            isGenerating={isGenerating}
            errorMessage={errorMessage}
          />
        </div>
      );
    }

    const beatCount = editorScript?.scenes.reduce(
      (count, scene) => count + scene.beats.length,
      0,
    );

    /*
    만드는 동안에는 시작을 막는다. 강의를 시작하면 이 화면이 강의 컨트롤로 바뀌어 생성 중 안내와 실패 안내가 가려진다.
    */
    return (
      <section
        aria-label="강의 플레이어"
        data-camera-inset="bottom"
        className="pointer-events-auto flex flex-col gap-2 rounded-card border border-line bg-surface px-4 py-3 shadow-control"
      >
        <div className="flex items-center gap-3">
          <GraduationCap className="size-5 text-accent" aria-hidden="true" />
          <div className="flex min-w-0 flex-col">
            <p className="text-sm font-semibold text-content">{script.title}</p>
            {editorScript === null ? (
              <p
                id="script-unavailable-reason"
                className="text-xs text-content-secondary"
              >
                현재 트리에 대본이 가리키는 노드가 없습니다.
              </p>
            ) : (
              <p className="text-xs text-content-secondary">
                장면 {editorScript.scenes.length}개 · 비트 {beatCount}개
              </p>
            )}
          </div>
          <Button
            variant="primary"
            className="ml-2 shrink-0"
            disabled={editorScript === null || isGenerating}
            aria-describedby={
              editorScript === null ? "script-unavailable-reason" : undefined
            }
            onClick={handleStart}
          >
            <Play className="size-4" aria-hidden="true" />
            강의 시작
          </Button>
          {isGeneratedScript ? (
            <IconButton
              ref={generateButtonRef}
              aria-label="강의 새로 만들기"
              disabled={isGenerating}
              onClick={handleGenerateClick}
            >
              {isGenerating ? (
                <LoaderCircle className="motion-safe:animate-spin" />
              ) : (
                <Sparkles />
              )}
            </IconButton>
          ) : null}
        </div>
        <LectureGenerationMessage
          isGenerating={isGenerating}
          errorMessage={errorMessage}
        />
      </section>
    );
  }

  if (status === "ended") {
    return (
      <section
        aria-label="강의 플레이어"
        data-camera-inset="bottom"
        className="pointer-events-auto flex items-center gap-3 rounded-card border border-line bg-surface px-4 py-3 shadow-control"
      >
        <GraduationCap className="size-5 text-accent" aria-hidden="true" />
        <p role="status" className="text-sm font-semibold text-content">
          강의를 마쳤습니다.
        </p>
        <Button
          variant="primary"
          className="ml-2"
          disabled={editorScript === null}
          onClick={handleStart}
        >
          <RotateCcw className="size-4" aria-hidden="true" />
          처음부터 다시
        </Button>
        <IconButton
          aria-label="강의 플레이어 닫기"
          size="sm"
          onClick={handleStop}
        >
          <X />
        </IconButton>
      </section>
    );
  }

  const isPlaying = status === "playing";
  const scene = activeScript?.scenes[sceneIndex];
  const beat = scene?.beats[beatIndex];
  const sceneCount = activeScript?.scenes.length ?? 0;

  return (
    <section
      aria-label="강의 플레이어"
      data-camera-inset="bottom"
      className="pointer-events-auto flex w-full flex-col gap-3 rounded-card border border-line bg-surface px-4 py-3 shadow-control"
    >
      <div className="flex items-center gap-2">
        <IconButton
          aria-label={isPlaying ? "일시정지" : "재생"}
          variant="primary"
          onClick={isPlaying ? pauseLecture : resumeLecture}
        >
          {isPlaying ? <Pause /> : <Play />}
        </IconButton>
        <IconButton aria-label="다음 장면" onClick={goToNextScene}>
          <SkipForward />
        </IconButton>
        <IconButton aria-label="강의 종료" onClick={handleStop}>
          <Square />
        </IconButton>

        <div className="ml-2 flex min-w-0 flex-1 flex-col">
          <p className="truncate text-sm font-semibold text-content">
            {activeScript?.title}
          </p>
          <p className="text-xs text-content-secondary">
            장면 {sceneIndex + 1} / {sceneCount} · 비트 {beatIndex + 1} /{" "}
            {scene?.beats.length ?? 0}
            {isPlaying ? "" : " · 일시정지됨"}
          </p>
        </div>

        {audioMode === "silent" ? (
          <p className="flex shrink-0 items-center gap-1 rounded-full bg-surface-muted px-2.5 py-1 text-xs text-content-secondary">
            <VolumeX className="size-3.5" aria-hidden="true" />
            음성 없음 · 자막만 재생
          </p>
        ) : (
          <IconButton
            aria-label={audioMode === "speech" ? "음성 끄기" : "음성 켜기"}
            onClick={toggleMute}
          >
            {audioMode === "speech" ? <Volume2 /> : <VolumeX />}
          </IconButton>
        )}
      </div>

      <div
        className="flex gap-1"
        role="progressbar"
        aria-label="강의 진행"
        aria-valuemin={1}
        aria-valuemax={sceneCount}
        aria-valuenow={sceneIndex + 1}
      >
        {activeScript?.scenes.map((item, index) => (
          <span
            key={item.id}
            className={`h-1 flex-1 rounded-full ${index <= sceneIndex ? "bg-accent" : "bg-line"}`}
          />
        ))}
      </div>

      {beat && scene && (
        <LectureSubtitle
          revealKey={`${scene.id}:${beat.id}:${seekId}`} // 같은 비트를 다시 재생해도 seekId가 늘어 자막을 처음부터 드러낸다
          text={beat.narration.text}
          narrationDurationMs={beat.narration.fallbackDurationMs}
          isPlaying={isPlaying}
        />
      )}
    </section>
  );
}
