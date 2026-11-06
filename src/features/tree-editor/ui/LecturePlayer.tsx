import { useEffect, useMemo } from "react";
import {
  GraduationCap,
  Pause,
  Play,
  RotateCcw,
  SkipForward,
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
import { useLecturePlayback } from "../model/lecture/useLecturePlayback";
import { useLectureKeyboard } from "../model/lecture/useLectureKeyboard";
import { useTreeStore } from "../model/treeStore";

type LecturePlayerProps = {
  script: LectureScript | null; // 지금 트리에서 재생할 수 있는 대본. 없으면 시작 화면을 그리지 않는다
  onRevealNodes: (
    clientIds: string[],
    options: { maxZoom: number; duration: number },
  ) => void; // focus 동작에 사용할 강의 카메라 함수
  onResetCamera: () => void; // 종료와 reset 동작에 사용할 전체 트리 맞춤 함수
  onBeforeCollapseRestore: () => void; // 강의가 끝나 접힘을 되돌릴 때 바뀐 배치에 맞춰 화면을 옮기도록 맡기는 함수
  panelLayoutKey: string; // 패널 배치를 나타내는 값. 강의 중에 바뀌면 카메라를 다시 맞춘다
};

/*
함수 이름 : LecturePlayer
기능 : 대본을 현재 트리에 연결하고 장면·비트 단위 음성, 자막, 애니메이션을 함께 재생한다.
인자 : LecturePlayerProps
반환값 : 강의 재생 컨트롤과 현재 내레이션
*/
export function LecturePlayer({
  script,
  onRevealNodes,
  onResetCamera,
  onBeforeCollapseRestore,
  panelLayoutKey,
}: LecturePlayerProps) {
  const status = useLectureStore((state) => state.status);
  const activeScript = useLectureStore((state) => state.script);
  const sceneIndex = useLectureStore((state) => state.sceneIndex);
  const beatIndex = useLectureStore((state) => state.beatIndex);
  const startLecture = useLectureStore((state) => state.startLecture);
  const pauseLecture = useLectureStore((state) => state.pauseLecture);
  const resumeLecture = useLectureStore((state) => state.resumeLecture);
  const goToNextScene = useLectureStore((state) => state.goToNextScene);
  const resetLecture = useLectureStore((state) => state.resetLecture);
  const resetVisual = useLectureAnimationStore((state) => state.resetVisual);
  const nodes = useTreeStore((state) => state.nodes);

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
    if (script === null) return null;

    const beatCount = editorScript?.scenes.reduce(
      (count, scene) => count + scene.beats.length,
      0,
    );

    return (
      <section
        aria-label="강의 플레이어"
        data-camera-inset="bottom"
        className="flex items-center gap-3 rounded-card border border-line bg-surface px-4 py-3 shadow-control"
      >
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
          disabled={editorScript === null}
          aria-describedby={
            editorScript === null ? "script-unavailable-reason" : undefined
          }
          onClick={handleStart}
        >
          <Play className="size-4" aria-hidden="true" />
          강의 시작
        </Button>
      </section>
    );
  }

  if (status === "ended") {
    return (
      <section
        aria-label="강의 플레이어"
        data-camera-inset="bottom"
        className="flex items-center gap-3 rounded-card border border-line bg-surface px-4 py-3 shadow-control"
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
      className="flex w-[min(42rem,calc(100vw-2rem))] flex-col gap-3 rounded-card border border-line bg-surface px-4 py-3 shadow-control"
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

      <p
        aria-live="polite"
        className="min-h-12 text-center text-base leading-relaxed text-content"
      >
        {beat?.narration.text}
      </p>
    </section>
  );
}
