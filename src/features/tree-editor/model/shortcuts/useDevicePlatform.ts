import { useSyncExternalStore } from "react";
import { type ShortcutPlatform } from "../../lib/shortcuts/nodeActionShortcuts";

const subscribe = () => () => {}; // 기기의 운영체제는 화면이 열려 있는 동안 바뀌지 않는다

/*
함수 이름 : getDevicePlatform
기능 : 브라우저가 알려 주는 기기 정보로 단축키 표를 고를 운영체제를 정한다.
인자 : 없음
반환값 : 맥·iPad·iPhone이면 "mac", 그 밖은 "windows"

userAgentData는 Chromium 계열에만 있어 없으면 platform으로 판단한다. platform은 폐기 예정이지만 아직 모든 브라우저가 채운다.
iPad·iPhone에 연결한 키보드도 ⌘·Return을 쓰는 맥 방식이고 F키 줄이 없거나 시스템 키라 Mac 표를 쓴다.
모바일 사이트를 요청하는 iPad는 platform이 "iPad"로 와서 mac만 보면 놓친다.
*/
export const getDevicePlatform = (): ShortcutPlatform => {
  const navigatorWithUserAgentData = navigator as Navigator & {
    userAgentData?: { platform?: string };
  };
  const platform =
    navigatorWithUserAgentData.userAgentData?.platform ?? navigator.platform;

  return /mac|iphone|ipad|ipod/i.test(platform) ? "mac" : "windows";
};

const getServerPlatform = (): ShortcutPlatform => "windows"; // 서버는 기기를 모른다. hydration 뒤 실제 값으로 바뀐다

/*
함수 이름 : useDevicePlatform
기능 : 접속한 기기의 운영체제를 돌려준다. 사용자가 고르는 설정은 없고, 맥 계열이 아니면 Windows 표를 쓴다.
인자 : 없음
반환값 : "mac" 또는 "windows"
*/
export function useDevicePlatform() {
  return useSyncExternalStore(subscribe, getDevicePlatform, getServerPlatform);
}
