import { useRef, useState } from "react";
import { requestConfirm } from "@/src/shared/ui/confirm-dialog";
import { getLectureGenerationErrorMessage } from "../../lib/lecture/getLectureGenerationErrorMessage";
import { useGeneratedLectureStore } from "./generatedLectureStore";
import { useGenerateLecture } from "./useGenerateLecture";

type UseLectureGenerationParams = {
  hasGeneratedScript: boolean; // 지금 트리에 생성한 강의가 있는지. 있으면 새로 만들기 전에 확인을 받는다
};

/*
함수 이름 : useLectureGeneration
기능 : 강의 만들기 버튼을 누르면 지금 트리로 강의를 만들고, 만든 대본을 트리별 생성 강의로 보관한다.
이미 생성한 강의가 있으면 그 강의를 대신하게 되므로 확인을 받은 뒤에 만든다.
인자 : UseLectureGenerationParams
반환값 : 강의 생성 핸들러, 생성 중 여부, 실패 안내 문구
*/
export const useLectureGeneration = ({
  hasGeneratedScript,
}: UseLectureGenerationParams) => {
  const { generateLecture, isGenerating } = useGenerateLecture();
  const setGeneratedLecture = useGeneratedLectureStore(
    (state) => state.setGeneratedLecture,
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  /*
  확인 창은 답을 기다리는 동안 handler를 멈추므로, 묻기 전에 가드를 세워야 연타가 확인 창을 다시 열지 않는다.
  생성 중의 연타는 useGenerateLecture가 막는다.
  */
  const isConfirmingRef = useRef(false);

  /*
  확인 창을 띄울지 정한 뒤 요청을 보내고, 결과에 따라 대본을 보관하거나 실패 이유를 남긴다.
  */
  const handleGenerateLecture = async () => {
    if (isGenerating || isConfirmingRef.current) return;

    if (hasGeneratedScript) {
      isConfirmingRef.current = true;

      try {
        const shouldGenerate = await requestConfirm({
          title: "강의를 새로 만들까요?",
          description:
            "지금 강의는 새로 만든 강의로 바뀝니다. 최대 2분쯤 걸립니다.",
          confirmLabel: "새로 만들기",
        });

        if (!shouldGenerate) return;
      } finally {
        isConfirmingRef.current = false;
      }
    }

    setErrorMessage(null);

    const result = await generateLecture();
    if (result === null) return;

    if (result.status === "success") {
      setGeneratedLecture(result.treeId, result.script);
      return;
    }

    setErrorMessage(getLectureGenerationErrorMessage(result));
  };

  return { handleGenerateLecture, isGenerating, errorMessage };
};
