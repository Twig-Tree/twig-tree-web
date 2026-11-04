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
import { useLectureScriptStore } from "../model/lecture/lectureScriptStore";
import { useLectureScriptPlayback } from "../model/lecture/useLectureScriptPlayback";
import { useTreeStore } from "../model/treeStore";

type LectureScriptPlayerProps = {
  script: LectureScript; // LLM 또는 목데이터가 만든 동적 대본
  onRevealNodes: (
    clientIds: string[],
    options: { maxZoom: number; duration: number },
  ) => void; // focus 동작에 사용할 강의 카메라 함수
  onResetCamera: () => void; // 종료와 reset 동작에 사용할 전체 트리 맞춤 함수
};

/*
함수 이름 : LectureScriptPlayer
기능 : 동적 대본을 현재 트리에 연결하고 장면·비트 단위 음성, 자막, 애니메이션을 함께 재생한다.
인자 : LectureScriptPlayerProps
반환값 : 동적 강의 재생 컨트롤과 현재 내레이션
*/
export function LectureScriptPlayer({
  script,
  onRevealNodes,
  onResetCamera,
}: LectureScriptPlayerProps) {
  const status = useLectureScriptStore((state) => state.status);
  const activeScript = useLectureScriptStore((state) => state.script);
  const sceneIndex = useLectureScriptStore((state) => state.sceneIndex);
  const beatIndex = useLectureScriptStore((state) => state.beatIndex);
  const startScript = useLectureScriptStore((state) => state.startScript);
  const pauseScript = useLectureScriptStore((state) => state.pauseScript);
  const resumeScript = useLectureScriptStore((state) => state.resumeScript);
  const goToNextScene = useLectureScriptStore((state) => state.goToNextScene);
  const resetScript = useLectureScriptStore((state) => state.resetScript);
  const resetVisual = useLectureAnimationStore((state) => state.resetVisual);
  const nodes = useTreeStore((state) => state.nodes);

  const editorScript = useMemo(
    () => getEditorLectureScript(script, nodes),
    [script, nodes],
  );
  const audioMode = useLectureScriptPlayback({
    revealNodes: onRevealNodes,
    resetCamera: onResetCamera,
  });

  useEffect(
    () => () => {
      useLectureScriptStore.getState().resetScript();
      useLectureAnimationStore.getState().resetVisual();
    },
    [],
  );

  const handleStart = () => {
    if (editorScript === null) return;
    resetVisual();
    startScript(editorScript);
  };

  const handleStop = () => {
    resetScript();
    resetVisual();
    onResetCamera();
  };

  if (status === "idle") {
    const beatCount = editorScript?.scenes.reduce(
      (count, scene) => count + scene.beats.length,
      0,
    );

    return (
      <section
        aria-label="동적 강의 플레이어"
        className="flex items-center gap-3 rounded-xl border border-cyan-200 bg-white px-4 py-3 shadow-sm"
      >
        <GraduationCap className="size-5 text-cyan-600" aria-hidden="true" />
        <div className="flex min-w-0 flex-col">
          <p className="text-sm font-semibold text-slate-800">{script.title}</p>
          {editorScript === null ? (
            <p
              id="script-unavailable-reason"
              className="text-xs text-slate-500"
            >
              현재 트리에 대본이 가리키는 노드가 없습니다.
            </p>
          ) : (
            <p className="text-xs text-slate-500">
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
        aria-label="동적 강의 플레이어"
        className="flex items-center gap-3 rounded-xl border border-cyan-200 bg-white px-4 py-3 shadow-sm"
      >
        <GraduationCap className="size-5 text-cyan-600" aria-hidden="true" />
        <p role="status" className="text-sm font-semibold text-slate-800">
          동적 강의를 마쳤습니다.
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
          aria-label="동적 강의 플레이어 닫기"
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
      aria-label="동적 강의 플레이어"
      className="flex w-[min(42rem,calc(100vw-2rem))] flex-col gap-3 rounded-xl border border-cyan-200 bg-white px-4 py-3 shadow-sm"
    >
      <div className="flex items-center gap-2">
        <IconButton
          aria-label={isPlaying ? "일시정지" : "재생"}
          variant="primary"
          onClick={isPlaying ? pauseScript : resumeScript}
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
          <p className="truncate text-sm font-semibold text-slate-800">
            {script.title}
          </p>
          <p className="text-xs text-slate-500">
            장면 {sceneIndex + 1} / {sceneCount} · 비트 {beatIndex + 1} /{" "}
            {scene?.beats.length ?? 0}
            {isPlaying ? "" : " · 일시정지됨"}
          </p>
        </div>

        <p className="flex shrink-0 items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
          {audioMode === "speech" ? (
            <>
              <Volume2 className="size-3.5" aria-hidden="true" />
              음성 재생
            </>
          ) : (
            <>
              <VolumeX className="size-3.5" aria-hidden="true" />
              음성 없음 · 자막만 재생
            </>
          )}
        </p>
      </div>

      <div
        className="flex gap-1"
        role="progressbar"
        aria-label="동적 강의 진행"
        aria-valuemin={1}
        aria-valuemax={sceneCount}
        aria-valuenow={sceneIndex + 1}
      >
        {activeScript?.scenes.map((item, index) => (
          <span
            key={item.id}
            className={`h-1 flex-1 rounded-full ${index <= sceneIndex ? "bg-cyan-500" : "bg-slate-200"}`}
          />
        ))}
      </div>

      <p
        aria-live="polite"
        className="min-h-12 text-center text-base leading-relaxed text-slate-800"
      >
        {beat?.narration.text}
      </p>
    </section>
  );
}
