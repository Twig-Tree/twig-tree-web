import { useMemo, useSyncExternalStore } from "react";
import {
  findPreferredKoreanVoice,
  getSelectableKoreanVoices,
  isSpeechSynthesisSupported,
} from "./speechVoices";

export type KoreanVoiceOption = {
  voiceUri: string; // 저장과 비교에 쓰는 음성 식별자
  name: string; // 화면에 보여 줄 음성 이름
};

const EMPTY_VOICE_OPTIONS_SNAPSHOT = "[]";

const subscribeVoices = (onChange: () => void) => {
  if (!isSpeechSynthesisSupported()) return () => {};

  window.speechSynthesis.addEventListener("voiceschanged", onChange);

  return () =>
    window.speechSynthesis.removeEventListener("voiceschanged", onChange);
};

/*
스냅숏은 음성 객체가 아니라 voiceURI 문자열로 둔다. 브라우저에 따라 getVoices()가 부를 때마다 새 객체를 돌려주므로
객체를 그대로 쓰면 매번 다른 값으로 보여 다시 그리기를 멈추지 못한다.
*/
const getKoreanVoiceUri = (preferredVoiceUri: string | null): string | null => {
  if (!isSpeechSynthesisSupported()) return null;

  return (
    findPreferredKoreanVoice(
      window.speechSynthesis.getVoices(),
      preferredVoiceUri,
    )?.voiceURI ?? null
  );
};

const getServerKoreanVoiceUri = () => null;

/*
함수 이름 : useKoreanVoice
기능 : 브라우저의 한국어 음성을 구독한다. Chrome은 음성 목록을 비동기로 채우므로 voiceschanged 이벤트를 따라 다시 찾는다.
인자 : string | null preferredVoiceUri -> 사용자가 고른 음성. null이면 자동으로 고른다
반환값 : 한국어 음성. 음성 합성을 지원하지 않거나 한국어 음성이 없으면 null
*/
export const useKoreanVoice = (
  preferredVoiceUri: string | null,
): SpeechSynthesisVoice | null => {
  const voiceUri = useSyncExternalStore(
    subscribeVoices,
    () => getKoreanVoiceUri(preferredVoiceUri),
    getServerKoreanVoiceUri,
  );

  return useMemo(() => {
    if (voiceUri === null) return null;

    return (
      window.speechSynthesis
        .getVoices()
        .find((voice) => voice.voiceURI === voiceUri) ?? null
    );
  }, [voiceUri]);
};

const getKoreanVoiceOptionsSnapshot = (): string => {
  if (!isSpeechSynthesisSupported()) return EMPTY_VOICE_OPTIONS_SNAPSHOT;

  return JSON.stringify(
    getSelectableKoreanVoices(window.speechSynthesis.getVoices()).map(
      (voice): KoreanVoiceOption => ({
        voiceUri: voice.voiceURI,
        name: voice.name,
      }),
    ),
  );
};

const getServerKoreanVoiceOptionsSnapshot = () => EMPTY_VOICE_OPTIONS_SNAPSHOT;

/*
함수 이름 : useKoreanVoiceOptions
기능 : 사용자가 고를 수 있는 한국어 음성 목록을 구독한다. 스냅숏은 음성 객체와 같은 이유로 문자열로 둔다.
인자 : 없음
반환값 : 한국어 음성 선택지. 음성 합성을 지원하지 않거나 고를 수 있는 음성이 없으면 빈 배열
*/
export const useKoreanVoiceOptions = (): KoreanVoiceOption[] => {
  const snapshot = useSyncExternalStore(
    subscribeVoices,
    getKoreanVoiceOptionsSnapshot,
    getServerKoreanVoiceOptionsSnapshot,
  );

  return useMemo(() => JSON.parse(snapshot), [snapshot]);
};
