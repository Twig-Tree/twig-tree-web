export const VOICE_RATES = [0.75, 1, 1.25, 1.5] as const;

export type VoiceRate = (typeof VOICE_RATES)[number];

export type VoiceSettings = {
  voiceUri: string | null; // 사용자가 고른 음성. null이면 자동으로 고른다
  volume: number; // 0부터 1까지의 음량
  rate: VoiceRate; // 낭독 속도
  isMuted: boolean; // 음성을 껐는지 여부. 음량과 따로 두어 켜면 이전 음량으로 돌아간다
};

export const VOICE_SETTINGS_STORAGE_KEY = "twig-tree:voice-settings";

export const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  voiceUri: null,
  volume: 1,
  rate: 1,
  isMuted: false,
};

const isVoiceRate = (value: unknown): value is VoiceRate =>
  VOICE_RATES.some((rate) => rate === value);

const isVolume = (value: unknown): value is number =>
  typeof value === "number" && value >= 0 && value <= 1;

/*
함수 이름 : getVoiceSettingsFromStoredValue
기능 : 저장소에서 읽은 문자열을 음성 설정으로 바꾼다.
인자 : string | null storedValue -> 저장소에 있던 값
반환값 : 음성 설정. 형식이 틀린 항목만 기본값으로 채운다

사용자가 고친 값이 아니어도 저장 형식은 배포마다 달라질 수 있다. 한 항목이 틀렸다고 나머지 설정까지 버리지 않는다.
*/
export const getVoiceSettingsFromStoredValue = (
  storedValue: string | null,
): VoiceSettings => {
  let stored: Partial<Record<keyof VoiceSettings, unknown>> | null;

  try {
    stored = storedValue === null ? null : JSON.parse(storedValue);
  } catch {
    return DEFAULT_VOICE_SETTINGS;
  }

  if (typeof stored !== "object" || stored === null) {
    return DEFAULT_VOICE_SETTINGS;
  }

  const { voiceUri, volume, rate, isMuted } = stored;

  return {
    voiceUri:
      typeof voiceUri === "string" ? voiceUri : DEFAULT_VOICE_SETTINGS.voiceUri,
    volume: isVolume(volume) ? volume : DEFAULT_VOICE_SETTINGS.volume,
    rate: isVoiceRate(rate) ? rate : DEFAULT_VOICE_SETTINGS.rate,
    isMuted:
      typeof isMuted === "boolean" ? isMuted : DEFAULT_VOICE_SETTINGS.isMuted,
  };
};
