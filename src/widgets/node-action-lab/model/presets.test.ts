import { describe, expect, it } from "vitest";
import { DEFAULT_NODE_ACTION_LAB_CONFIG } from "./config";
import {
  applyPreset,
  getMatchingPresetId,
  NODE_ACTION_LAB_PRESETS,
} from "./presets";

describe("NODE_ACTION_LAB_PRESETS", () => {
  it("프리셋끼리 설정이 겹치지 않는다", () => {
    const serialized = NODE_ACTION_LAB_PRESETS.map((preset) =>
      JSON.stringify(preset.config),
    );

    expect(new Set(serialized).size).toBe(NODE_ACTION_LAB_PRESETS.length);
  });

  it("첫 프리셋은 실험실을 처음 열었을 때의 설정이다", () => {
    expect(getMatchingPresetId(DEFAULT_NODE_ACTION_LAB_CONFIG)).toBe(
      NODE_ACTION_LAB_PRESETS[0].id,
    );
  });
});

describe("applyPreset", () => {
  /*
  단축키 기준 운영체제는 보는 사람의 기기 문제라 프리셋을 바꿔도 유지한다.
  */
  it("단축키 기준 운영체제는 지금 값을 유지한다", () => {
    const current = {
      ...DEFAULT_NODE_ACTION_LAB_CONFIG,
      shortcutPlatform: "windows" as const,
    };

    NODE_ACTION_LAB_PRESETS.forEach((preset) => {
      expect(applyPreset(current, preset).shortcutPlatform).toBe("windows");
    });
  });

  it("적용한 프리셋이 지금 설정과 맞는 프리셋으로 잡힌다", () => {
    NODE_ACTION_LAB_PRESETS.forEach((preset) => {
      expect(
        getMatchingPresetId(
          applyPreset(DEFAULT_NODE_ACTION_LAB_CONFIG, preset),
        ),
      ).toBe(preset.id);
    });
  });
});

describe("getMatchingPresetId", () => {
  it("프리셋에서 하나라도 바꾸면 맞는 프리셋이 없다", () => {
    expect(
      getMatchingPresetId({
        ...DEFAULT_NODE_ACTION_LAB_CONFIG,
        showHintBar: true,
      }),
    ).toBeNull();
  });
});
