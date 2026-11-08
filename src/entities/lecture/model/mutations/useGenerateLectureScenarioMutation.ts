import { useMutation } from "@tanstack/react-query";
import { lectureApi } from "../../api/lectureApi";
import { type LectureRepairRequest } from "../generation/repairRequest";
import { LECTURE_SCENARIO_SCHEMA_VERSION } from "../scenario/schema";

type GenerateLectureScenarioVariables = {
  treeId: string; // 강의를 만들 트리 ID
  request: string; // 사용자 요청 문장
  treeOutline: string; // getLectureTreeOutline으로 만든 outline. 모델이 본 노드와 컴파일러가 인정하는 노드를 같게 둔다
  repair: LectureRepairRequest | null; // getLectureRepairRequest가 만든 요청. 처음 요청이면 null
};

/*
함수 이름 : useGenerateLectureScenarioMutation
기능 : 강의 시나리오 생성 요청을 보낸다. 트리 ID를 숫자로 바꾸고, 프론트가 쓰는 시나리오 스키마 버전을 함께 싣는다.
인자 : 없음
반환값 : 강의 시나리오 생성 mutation. 성공 데이터는 파싱하지 않은 모델 응답과 생성 측정값

백엔드가 아무것도 저장하지 않아 낡는 캐시가 없으므로 onSuccess가 없다.
*/
export const useGenerateLectureScenarioMutation = () =>
  useMutation({
    /*
    기본값 online은 오프라인이면 요청 전에 멈추고, 멈춘 동안은 HTTP 타임아웃도 돌지 않는다.
    생성 중에는 입력 카드를 닫을 수 없으므로 멈추지 않고 네트워크 오류로 끝낸다.
    */
    networkMode: "always",
    mutationFn: ({
      treeId,
      request,
      treeOutline,
      repair,
    }: GenerateLectureScenarioVariables) =>
      lectureApi.generateLectureScenario({
        treeId: Number(treeId),
        request,
        treeOutline,
        scenarioSchemaVersion: LECTURE_SCENARIO_SCHEMA_VERSION,
        repair,
      }),
  });
