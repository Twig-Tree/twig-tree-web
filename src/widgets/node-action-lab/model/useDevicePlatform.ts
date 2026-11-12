import { useSyncExternalStore } from "react";
import { type ShortcutPlatform } from "./shortcuts";

const subscribe = () => () => {}; // 기기의 운영체제는 화면이 열려 있는 동안 바뀌지 않는다

/*
userAgentData는 Chromium 계열에만 있어 없으면 platform으로 판단한다. platform은 폐기 예정이지만 아직 모든 브라우저가 채운다.
*/
const getPlatform = (): ShortcutPlatform => {
  const navigatorWithUserAgentData = navigator as Navigator & {
    userAgentData?: { platform?: string };
  };
  const platform =
    navigatorWithUserAgentData.userAgentData?.platform ?? navigator.platform;

  return /mac/i.test(platform) ? "mac" : "windows";
};

const getServerPlatform = (): ShortcutPlatform => "windows"; // 서버는 기기를 모른다. 첫 렌더 뒤 실제 값으로 바뀐다

/*
함수 이름 : useDevicePlatform
기능 : 접속한 기기가 맥인지 판단해 단축키 표를 고를 운영체제를 돌려준다. 맥이 아니면 Windows 표를 쓴다.
인자 : 없음
반환값 : "mac" 또는 "windows"
*/
export function useDevicePlatform() {
  return useSyncExternalStore(subscribe, getPlatform, getServerPlatform);
}
