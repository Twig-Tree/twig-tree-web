import { Play } from "lucide-react";
import {
  type LectureAnimation,
  type LectureCompileSource,
  type LectureCompileSourceMap,
  type LectureScript,
} from "@/src/entities/lecture";
import { getLabAnimationLines } from "../model/labAnimationLines";
import { getLabScenarioOutline } from "../model/labScenarioOutline";
import { getLabBeatAnimation } from "../model/labScenarioRun";

type LabScenarioOutlineProps = {
  script: LectureScript; // 컴파일한 대본
  sourceMap: LectureCompileSourceMap; // beat ID별 동작 출처
  labelByNodeId: ReadonlyMap<string, string>; // 지금 트리의 노드 ID별 이름
  onPlay: (animation: LectureAnimation) => void; // 비트나 cue 하나만 재생한다
};

const getSourceLabel = (source: LectureCompileSource): string =>
  source.type === "cue"
    ? `cue ${source.cueIndex + 1} · ${source.intent} → ${source.recipeId}`
    : "컴파일러 · 빈 비트";

/*
함수 이름 : PlayPartButton
기능 : 비트나 cue 하나를 재생하는 작은 버튼을 그린다.
인자 : { label, onClick } -> 화면 읽기 도구가 읽을 이름과 누를 때 실행할 함수
반환값 : 재생 버튼
*/
function PlayPartButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className="flex size-6 shrink-0 items-center justify-center rounded-control text-accent hover:bg-surface-hover"
      onClick={onClick}
    >
      <Play className="size-3.5" aria-hidden="true" />
    </button>
  );
}

/*
함수 이름 : LabScenarioOutline
기능 : 컴파일 결과를 장면 → 비트 → cue → recipe → 동작 순서로 보여 주고, 비트나 cue 하나만 재생하게 한다.
부분 재생은 앞 비트가 남긴 효과와 카메라 없이 시작하므로, 장면 전체의 흐름은 위의 재생 버튼으로 본다.
인자 : LabScenarioOutlineProps
반환값 : 컴파일 결과 트리
*/
export function LabScenarioOutline({
  script,
  sourceMap,
  labelByNodeId,
  onPlay,
}: LabScenarioOutlineProps) {
  const outline = getLabScenarioOutline(script, sourceMap);

  return (
    <ol className="flex flex-col gap-3">
      {outline.map((scene) => (
        <li key={scene.id} className="flex flex-col gap-2">
          <p className="text-xs font-bold text-content">
            장면 {scene.id}
            <span className="ml-1 font-medium text-content-muted">
              · {labelByNodeId.get(scene.nodeId) ?? scene.nodeId}
            </span>
          </p>

          <ol className="flex flex-col gap-2">
            {scene.beats.map(({ beat, sources }) => (
              <li
                key={beat.id}
                className="rounded-control border border-line bg-surface p-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-bold text-content">
                    비트 {beat.id}
                    <span className="ml-1 font-medium text-content-muted">
                      · 내레이션 {beat.narration.fallbackDurationMs}ms
                    </span>
                  </p>
                  <PlayPartButton
                    label={`비트 ${beat.id} 재생`}
                    onClick={() => onPlay(getLabBeatAnimation(beat))}
                  />
                </div>
                <p className="mb-2 text-xs text-content-secondary">
                  {beat.narration.text}
                </p>

                <ol className="flex flex-col gap-2">
                  {sources.map(({ key, source, animation }) => (
                    <li key={key} className="border-l-2 border-line pl-2">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-mono text-xs font-medium text-content">
                          {getSourceLabel(source)}
                        </p>
                        {source.type === "cue" ? (
                          <PlayPartButton
                            label={`비트 ${beat.id}의 cue ${source.cueIndex + 1} 재생`}
                            onClick={() => onPlay(animation)}
                          />
                        ) : null}
                      </div>
                      <ol className="font-mono text-xs text-content-secondary">
                        {getLabAnimationLines(animation, labelByNodeId).map(
                          ({ depth, text }, index) => (
                            <li
                              key={index}
                              style={{ paddingLeft: `${depth * 12}px` }}
                            >
                              {text}
                            </li>
                          ),
                        )}
                      </ol>
                    </li>
                  ))}
                </ol>
              </li>
            ))}
          </ol>
        </li>
      ))}
    </ol>
  );
}
