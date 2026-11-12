import { describe, expect, it } from "vitest";
import {
  DEFAULT_NODE_ACTION_LAB_CONFIG,
  type NodeActionLabConfig,
} from "./config";
import { getConfigSummary } from "./getConfigSummary";

const createConfig = (
  patch: Partial<NodeActionLabConfig>,
): NodeActionLabConfig => ({ ...DEFAULT_NODE_ACTION_LAB_CONFIG, ...patch });

describe("getConfigSummary", () => {
  it("설정 패널과 같은 이름으로 한 줄씩 적는다", () => {
    const summary = getConfigSummary(
      createConfig({
        toolbarVisibility: "selected",
        toolbarPosition: "bottom",
        showHintBar: true,
      }),
      "mac",
    );

    expect(summary).toContain("- 메뉴 여는 방법: 우클릭");
    expect(summary).toContain("- 노드 옆 버튼: 선택");
    expect(summary).toContain("- 버튼 위치: 아래");
    expect(summary).toContain("- 툴팁에 단축키 표기: 켬");
    expect(summary).toContain("- 하단 힌트 줄: 켬");
  });

  it("이 기기를 고르면 실제 운영체제를 함께 적는다", () => {
    expect(getConfigSummary(createConfig({}), "mac")).toContain(
      "- 단축키 기준 운영체제: 이 기기 (Mac)",
    );
    expect(
      getConfigSummary(createConfig({ shortcutPlatform: "windows" }), "mac"),
    ).toContain("- 단축키 기준 운영체제: Windows");
  });

  /*
  패널에서 보이지 않는 하위 설정까지 적으면 꺼 둔 기능이 켜진 것처럼 읽힌다.
  */
  it("노드 옆 버튼을 끄면 버튼의 하위 설정은 줄에서 뺀다", () => {
    const summary = getConfigSummary(
      createConfig({ toolbarVisibility: "off" }),
      "mac",
    );

    expect(summary).not.toContain("버튼 위치");
    expect(summary).not.toContain("툴팁");
  });

  it("마지막 줄의 JSON으로 설정을 그대로 되살릴 수 있다", () => {
    const config = createConfig({ menuTrigger: "click", tooltip: "off" });
    const lastLine = getConfigSummary(config, "windows").split("\n").at(-1);

    expect(JSON.parse(lastLine ?? "")).toEqual(config);
  });
});
