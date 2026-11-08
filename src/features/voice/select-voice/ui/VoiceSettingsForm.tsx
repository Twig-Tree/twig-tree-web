"use client";

import { useId } from "react";
import {
  useKoreanVoice,
  useKoreanVoiceOptions,
  useVoiceSettings,
  VOICE_RATES,
  type VoiceRate,
} from "@/src/shared/lib/speech";
import { Button } from "@/src/shared/ui/button";
import { useVoicePreview } from "../model/useVoicePreview";

const AUTO_VOICE_VALUE = ""; // 음성 선택지에서 자동 선택을 나타내는 값

const VOICE_RATE_LABELS: Record<VoiceRate, string> = {
  0.75: "느리게",
  1: "보통",
  1.25: "조금 빠르게",
  1.5: "빠르게",
};

/*
함수 이름 : VoiceSettingsForm
기능 : 강의 음성의 종류, 음량, 속도를 고르고 미리 들어 보게 한다. 고른 값은 바로 적용하고 이 기기에 저장한다.
인자 : 없음
반환값 : 음성 설정 입력. 읽을 수 있는 한국어 음성이 없으면 안내 문구
*/
export function VoiceSettingsForm() {
  const voiceSelectId = useId();
  const volumeInputId = useId();
  const { voiceSettings, updateVoiceSettings } = useVoiceSettings();
  const { voiceUri, volume, rate } = voiceSettings;
  const voiceOptions = useKoreanVoiceOptions();
  const voice = useKoreanVoice(voiceUri);
  const { isPreviewing, hasPreviewFailed, togglePreview } = useVoicePreview({
    voice,
    volume,
    rate,
  });

  if (voice === null) {
    return (
      <p className="text-sm text-content-muted">
        이 브라우저에는 읽을 수 있는 한국어 음성이 없어 강의를 자막으로만
        재생합니다.
      </p>
    );
  }

  const volumePercent = Math.round(volume * 100);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <label
          htmlFor={voiceSelectId}
          className="text-sm font-medium text-content"
        >
          음성
        </label>
        {/* 다른 기기에서 고른 음성은 목록에 없다. 이때 React가 첫 선택지를 고르므로 재생과 같은 자동 선택이 보인다. */}
        <select
          id={voiceSelectId}
          value={voiceUri ?? AUTO_VOICE_VALUE}
          onChange={(event) =>
            updateVoiceSettings({
              voiceUri:
                event.target.value === AUTO_VOICE_VALUE
                  ? null
                  : event.target.value,
            })
          }
          className="h-10 w-full rounded-control border border-line bg-surface px-3 text-sm text-content outline-none focus-visible:ring-2 focus-visible:ring-focus"
        >
          <option value={AUTO_VOICE_VALUE}>자동 선택</option>
          {voiceOptions.map((option) => (
            <option key={option.voiceUri} value={option.voiceUri}>
              {option.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label
            htmlFor={volumeInputId}
            className="text-sm font-medium text-content"
          >
            음량
          </label>
          <output
            htmlFor={volumeInputId}
            className="text-sm text-content-secondary"
          >
            {volumePercent}%
          </output>
        </div>
        <input
          id={volumeInputId}
          type="range"
          min={0}
          max={100}
          step={5}
          value={volumePercent}
          onChange={(event) =>
            updateVoiceSettings({ volume: Number(event.target.value) / 100 })
          }
          className="w-full accent-accent"
        />
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-content">속도</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {VOICE_RATES.map((voiceRate) => (
            <label
              key={voiceRate}
              className="flex cursor-pointer items-center gap-3 rounded-control border border-line px-3 py-2.5 text-sm text-content transition-colors hover:bg-surface-hover has-[:checked]:border-accent has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-focus"
            >
              <input
                type="radio"
                name="voice-rate"
                value={voiceRate}
                checked={voiceRate === rate}
                onChange={() => updateVoiceSettings({ rate: voiceRate })}
                className="accent-accent outline-none"
              />
              {VOICE_RATE_LABELS[voiceRate]}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-col items-start gap-2">
        <Button onClick={togglePreview}>
          {isPreviewing ? "멈추기" : "미리 듣기"}
        </Button>
        {hasPreviewFailed && (
          <p className="text-sm text-danger" role="alert">
            미리 듣기에 실패했습니다. 다시 시도해 주세요.
          </p>
        )}
      </div>
    </div>
  );
}
