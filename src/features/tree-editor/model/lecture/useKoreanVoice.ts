import { useMemo, useSyncExternalStore } from "react";
import { findKoreanVoice, isSpeechSynthesisSupported } from "./lectureSpeech";

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
const getKoreanVoiceUri = (): string | null => {
  if (!isSpeechSynthesisSupported()) return null;

  return findKoreanVoice(window.speechSynthesis.getVoices())?.voiceURI ?? null;
};

const getServerKoreanVoiceUri = () => null;

/*
함수 이름 : useKoreanVoice
기능 : 브라우저의 한국어 음성을 구독한다. Chrome은 음성 목록을 비동기로 채우므로 voiceschanged 이벤트를 따라 다시 찾는다.
인자 : 없음
반환값 : 한국어 음성. 음성 합성을 지원하지 않거나 한국어 음성이 없으면 null
*/
export const useKoreanVoice = (): SpeechSynthesisVoice | null => {
  const voiceUri = useSyncExternalStore(
    subscribeVoices,
    getKoreanVoiceUri,
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
