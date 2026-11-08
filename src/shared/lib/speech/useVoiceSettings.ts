import { useSyncExternalStore } from "react";
import {
  getServerVoiceSettings,
  getVoiceSettings,
  subscribeVoiceSettings,
  updateVoiceSettings,
} from "./voiceSettingsStore";

/*
함수 이름 : useVoiceSettings
기능 : 음성 설정을 구독하고 설정을 바꾸는 함수를 함께 돌려준다.
인자 : 없음
반환값 : 현재 음성 설정과 변경 함수
*/
export const useVoiceSettings = () => {
  const voiceSettings = useSyncExternalStore(
    subscribeVoiceSettings,
    getVoiceSettings,
    getServerVoiceSettings,
  );

  return { voiceSettings, updateVoiceSettings };
};
