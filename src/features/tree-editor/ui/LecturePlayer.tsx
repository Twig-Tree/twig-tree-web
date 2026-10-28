import { useMemo } from "react";
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
import { type Lecture } from "@/src/entities/lecture";
import { Button } from "@/src/shared/ui/button";
import { IconButton } from "@/src/shared/ui/icon-button";
import { getEditorLectureSegments } from "../lib/lecture/getEditorLectureSegments";
import { useLectureStore } from "../model/lecture/lectureStore";
import { useLectureCamera } from "../model/lecture/useLectureCamera";
import { useLecturePlayback } from "../model/lecture/useLecturePlayback";
import { useTreeStore } from "../model/treeStore";

export interface LecturePlayerProps {
  lecture: Lecture; // 재생할 강의. 지금은 목데이터이고 서버 연동 후에는 조회 결과가 들어온다
  /*
  대상 노드의 접힌 조상을 펼치고 한 화면에 모으는 함수. useFocusNode의 revealNodes를 넘긴다.
  */
  onRevealNodes: (
    clientIds: string[],
    options: { maxZoom: number; duration: number },
  ) => void;
}

/*
함수 이름 : LecturePlayer
기능 : 강의 시작·일시정지·재개·다음 구간·종료 버튼과 지금 문장의 자막, 진행 위치, 음성 재생 여부를 보여 준다.
재생 엔진과 카메라 연결을 함께 두어, 플레이어가 화면에 있는 동안에만 강의가 진행된다.
인자 : LecturePlayerProps
반환값 : 강의 플레이어

화면에 한 번만 둔다. 재생 엔진이 둘이면 같은 문장을 두 번 읽는다.
*/
export function LecturePlayer({ lecture, onRevealNodes }: LecturePlayerProps) {
  const status = useLectureStore((state) => state.status);
  const segments = useLectureStore((state) => state.segments);
  const segmentIndex = useLectureStore((state) => state.segmentIndex);
  const subtitleIndex = useLectureStore((state) => state.subtitleIndex);
  const startLecture = useLectureStore((state) => state.startLecture);
  const pauseLecture = useLectureStore((state) => state.pauseLecture);
  const resumeLecture = useLectureStore((state) => state.resumeLecture);
  const goToNextSegment = useLectureStore((state) => state.goToNextSegment);
  const resetLecture = useLectureStore((state) => state.resetLecture);

  const nodes = useTreeStore((state) => state.nodes);
  const edges = useTreeStore((state) => state.edges);

  const audioMode = useLecturePlayback();
  useLectureCamera({ revealNodes: onRevealNodes });

  /*
  시작 버튼을 잠글지 정하려고 지금 트리에 강의를 연결할 수 있는지 미리 본다.
  시작할 때는 이 결과를 그대로 넘긴다. 노드가 바뀌면 다시 계산되므로 누르는 순간의 트리와 같다.
  */
  const editorSegments = useMemo(
    () => getEditorLectureSegments(lecture.segments, nodes, edges),
    [lecture.segments, nodes, edges],
  );

  if (status === "idle") {
    return (
      <section
        aria-label="강의 플레이어"
        className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
      >
        <GraduationCap className="size-5 text-indigo-600" aria-hidden="true" />
        <div className="flex min-w-0 flex-col">
          <p className="text-sm font-semibold text-slate-800">
            {lecture.title}
          </p>
          {editorSegments === null ? (
            <p
              id="lecture-unavailable-reason"
              className="text-xs text-slate-500"
            >
              이 트리에는 데모 강의가 없습니다. 데모 강의와 같은 구조의 트리에서
              볼 수 있습니다.
            </p>
          ) : (
            <p className="text-xs text-slate-500">
              {editorSegments.length}개 구간
            </p>
          )}
        </div>
        <Button
          variant="primary"
          className="ml-2 shrink-0"
          disabled={editorSegments === null}
          aria-describedby={
            editorSegments === null ? "lecture-unavailable-reason" : undefined
          }
          onClick={() => {
            if (editorSegments) startLecture(editorSegments);
          }}
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
        className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
      >
        <GraduationCap className="size-5 text-indigo-600" aria-hidden="true" />
        <p role="status" className="text-sm font-semibold text-slate-800">
          강의를 마쳤습니다.
        </p>
        <Button
          variant="primary"
          className="ml-2"
          disabled={editorSegments === null}
          onClick={() => {
            if (editorSegments) startLecture(editorSegments);
          }}
        >
          <RotateCcw className="size-4" aria-hidden="true" />
          처음부터 다시
        </Button>
        <IconButton
          aria-label="강의 플레이어 닫기"
          size="sm"
          onClick={resetLecture}
        >
          <X />
        </IconButton>
      </section>
    );
  }

  const isPlaying = status === "playing";
  const segment = segments[segmentIndex];
  const subtitle = segment?.subtitles[subtitleIndex];

  return (
    <section
      aria-label="강의 플레이어"
      className="flex w-[min(40rem,calc(100vw-2rem))] flex-col gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
    >
      <div className="flex items-center gap-2">
        <IconButton
          aria-label={isPlaying ? "일시정지" : "재생"}
          variant="primary"
          onClick={isPlaying ? pauseLecture : resumeLecture}
        >
          {isPlaying ? <Pause /> : <Play />}
        </IconButton>
        <IconButton aria-label="다음 구간" onClick={goToNextSegment}>
          <SkipForward />
        </IconButton>
        <IconButton aria-label="강의 종료" onClick={resetLecture}>
          <Square />
        </IconButton>

        <div className="ml-2 flex min-w-0 flex-1 flex-col">
          <p className="truncate text-sm font-semibold text-slate-800">
            {lecture.title}
          </p>
          <p className="text-xs text-slate-500">
            구간 {segmentIndex + 1} / {segments.length}
            {isPlaying ? "" : " · 일시정지됨"}
          </p>
        </div>

        {/*
        음성이 나오지 않는 환경에서 음성이 나오는 것처럼 보이지 않도록 재생 방식을 항상 드러낸다.
        */}
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
        aria-label="강의 진행"
        aria-valuemin={1}
        aria-valuemax={segments.length}
        aria-valuenow={segmentIndex + 1}
      >
        {segments.map((item, index) => (
          <span
            key={item.id}
            className={`h-1 flex-1 rounded-full ${index <= segmentIndex ? "bg-indigo-500" : "bg-slate-200"}`}
          />
        ))}
      </div>

      <p
        aria-live="polite"
        className="min-h-12 text-center text-base leading-relaxed text-slate-800"
      >
        {subtitle?.text}
      </p>
    </section>
  );
}
