import { describe, expect, it } from "vitest";
import { getLectureScenarioJsonSchema } from "./jsonSchema";

/*
백엔드와 외부 모델에 넘기는 JSON Schema는 저장소에 파일로 둔다. 스키마를 바꾸고 파일을 갱신하지 않으면 이 테스트가 실패한다.
갱신: pnpm exec vitest run src/entities/lecture/model/scenario/jsonSchema.test.ts -u
*/
describe("getLectureScenarioJsonSchema", () => {
  it("저장소의 JSON Schema 파일과 같다", async () => {
    const jsonSchema = `${JSON.stringify(getLectureScenarioJsonSchema(), null, 2)}\n`;

    await expect(jsonSchema).toMatchFileSnapshot(
      "../../../../../docs/specs/lecture-scenario.schema.json",
    );
  });
});
