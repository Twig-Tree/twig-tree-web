import { Play, Square, Undo2 } from "lucide-react";
import { Button } from "@/src/shared/ui/button";

type LabPlaybackControlsProps = {
  isPlayDisabled: boolean; // 재생할 애니메이션이 없거나 고쳐야 할 입력이 있는지
  isPlaying: boolean; // 재생 중인지 여부
  stage: string | null; // 지금 실행 중인 동작 이름
  isLooping: boolean; // 반복 재생 여부
  onChangeLooping: (isLooping: boolean) => void; // 반복 재생을 켜고 끈다
  onPlay: () => void; // 지금 모드의 애니메이션을 재생한다
  onStop: () => void; // 재생을 멈추고 시각 효과를 지운다
  onReset: () => void; // 재생을 멈추고 카메라까지 되돌린다
};

/*
함수 이름 : LabPlaybackControls
기능 : 모든 모드가 함께 쓰는 재생, 중단, 초기화 버튼과 반복 재생 설정을 그린다.
인자 : LabPlaybackControlsProps
반환값 : 재생 조작 영역
*/
export function LabPlaybackControls({
  isPlayDisabled,
  isPlaying,
  stage,
  isLooping,
  onChangeLooping,
  onPlay,
  onStop,
  onReset,
}: LabPlaybackControlsProps) {
  return (
    <section aria-label="재생" className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Button
          variant="primary"
          className="flex-1"
          disabled={isPlayDisabled}
          onClick={onPlay}
        >
          <Play className="size-4" aria-hidden="true" />
          {isPlaying ? "처음부터" : "재생"}
        </Button>
        <Button className="flex-1" disabled={!isPlaying} onClick={onStop}>
          <Square className="size-3.5" aria-hidden="true" />
          중단
        </Button>
        <Button className="flex-1" onClick={onReset}>
          <Undo2 className="size-3.5" aria-hidden="true" />
          초기화
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-xs font-medium text-content-secondary">
          <input
            type="checkbox"
            checked={isLooping}
            onChange={(event) => onChangeLooping(event.target.checked)}
          />
          반복 재생
        </label>
        <p
          role="status"
          aria-live="polite"
          className="text-xs font-medium text-accent"
        >
          {isPlaying ? `실행 중: ${stage ?? "준비"}` : "대기 중"}
        </p>
      </div>
    </section>
  );
}
