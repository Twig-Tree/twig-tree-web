import { afterEach, describe, expect, it, vi } from "vitest";
import { getDevicePlatform } from "./useDevicePlatform";

const stubNavigator = (platform: string, userAgentPlatform?: string) => {
  vi.stubGlobal("navigator", {
    platform,
    userAgentData:
      userAgentPlatform === undefined
        ? undefined
        : { platform: userAgentPlatform },
  });
};

describe("getDevicePlatform", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it.each(["MacIntel", "iPad", "iPhone"])("%s는 Mac 표를 쓴다", (platform) => {
    stubNavigator(platform);

    expect(getDevicePlatform()).toBe("mac");
  });

  it.each(["Win32", "Linux x86_64", ""])(
    "%s는 Windows 표를 쓴다",
    (platform) => {
      stubNavigator(platform);

      expect(getDevicePlatform()).toBe("windows");
    },
  );

  /*
  Chromium은 platform을 고정값으로 줄여 가고 있어, userAgentData가 있으면 그 값을 먼저 본다.
  */
  it("userAgentData가 있으면 platform보다 먼저 본다", () => {
    stubNavigator("Win32", "macOS");

    expect(getDevicePlatform()).toBe("mac");
  });
});
