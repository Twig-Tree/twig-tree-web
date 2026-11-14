import { useEffect, useMemo, useState, type Ref } from "react";
import {
  GraduationCap,
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
import { useLecturePlayback } from "../model/lecture/useLecturePlayback";
import { useLectureKeyboard } from "../model/lecture/useLectureKeyboard";
import { useTreeStore } from "../model/treeStore";
import { LectureGenerator } from "./LectureGenerator";
import { LectureSubtitle } from "./LectureSubtitle";

type LecturePlayerProps = {
  script: LectureScript | null; // 지금 트리에서 재생할 수 있는 대본. 없으면 시작 화면 대신 강의 만들기 버튼을 그린다
  isGeneratedScript: boolean; // 생성한 강의인지. 데모 강의면 "새로 만들기" 대신 "강의 만들기"로 부른다
  onRevealNodes: (
    clientIds: string[],
    options: { maxZoom: number; duration: number; keepCollapse?: boolean },
  ) => void; // focus 동작에 사용할 강의 카메라 함수
  onResetCamera: () => void; // 종료와 reset 동작에 사용할 전체 트리 맞춤 함수
  onBeforeCollapseRestore: () => void; // 강의가 끝나 접힘을 되돌릴 때 바뀐 배치에 맞춰 화면을 옮기도록 맡기는 함수
  panelLayoutKey: string; // 패널 배치를 나타내는 값. 강의 중에 바뀌면 카메라를 다시 맞춘다
  onGeneratorOpenChange?: (isOpen: boolean) => void; // 강의 만들기 패널의 열림 상태가 바뀔 때 시각 프레임 정렬을 위해 알린다
  generateButtonRef?: Ref<HTMLButtonElement>; // 강의 만들기 버튼 요소. 대본이 없을 때의 글자 버튼과 있을 때의 아이콘 버튼 중 보이는 쪽이다. 기능 안내가 가리킨다
};

/*
함수 이름 : LecturePlayer
기능 : 대본을 현재 트리에 연결하고 장면·비트 단위 음성, 자막, 애니메이션을 함께 재생한다. 시작 전에는 지금 트리로 강의를 새로 만들 수 있다.
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
  onGeneratorOpenChange,
  generateButtonRef,
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
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);

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

  const isGeneratorVisible = status === "idle" && isGeneratorOpen;

  useEffect(() => {
    onGeneratorOpenChange?.(isGeneratorVisible);

    return () => {
      onGeneratorOpenChange?.(false);
    };
  }, [isGeneratorVisible, onGeneratorOpenChange]);

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
    if (isGeneratorOpen) {
      return <LectureGenerator onClose={() => setIsGeneratorOpen(false)} />;
    }

    if (script === null) {
      return (
        <Button
          ref={generateButtonRef}
          className="pointer-events-auto shadow-control"
          data-camera-inset="bottom"
          onClick={() => setIsGeneratorOpen(true)}
        >
          <Sparkles className="size-4 text-accent" aria-hidden="true" />
          강의 만들기
        </Button>
      );
    }

    const beatCount = editorScript?.scenes.reduce(
      (count, scene) => count + scene.beats.length,
      0,
    );

    return (
      <section
        aria-label="강의 플레이어"
        data-camera-inset="bottom"
        className="pointer-events-auto flex items-center gap-3 rounded-card border border-line bg-surface px-4 py-3 shadow-control"
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
        <IconButton
          ref={generateButtonRef}
          aria-label={isGeneratedScript ? "강의 새로 만들기" : "강의 만들기"}
          onClick={() => setIsGeneratorOpen(true)}
        >
          <Sparkles />
        </IconButton>
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
          key={`${scene.id}:${beat.id}`}
          text={beat.narration.text}
          narrationDurationMs={beat.narration.fallbackDurationMs}
          isPlaying={isPlaying}
        />
      )}
    </section>
  );
}
