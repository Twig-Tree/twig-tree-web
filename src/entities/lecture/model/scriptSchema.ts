import * as z from "zod/mini";

/*
플레이어가 재생하는 강의 대본(LectureScript)의 런타임 스키마.
타입의 원본은 types.ts이고, 이 스키마는 같은 모양을 검사한다. 두 쪽이 같은지는 scriptSchema.test.ts가 양방향으로 대조한다.

지금 규칙은 타입이 표현하는 모양과 숫자가 유한한지까지만 본다.
대상 목록이 비어 있지 않은지, 노드가 트리에 있는지 같은 재생 전 검사는 쓰는 곳(랩, 강의 API)이 맡는다.
*/

const nodeIdsSchema = z.array(z.string());

const durationSchema = z
  .number()
  .check(
    z.refine(Number.isFinite, { message: "유한한 숫자여야 합니다." }),
    z.gte(0),
  );

const persistSchema = z.optional(z.boolean());

export const lectureFocusActionSchema = z.object({
  type: z.literal("focus"),
  targetNodeIds: nodeIdsSchema,
  maxZoom: z
    .number()
    .check(
      z.refine(Number.isFinite, { message: "유한한 숫자여야 합니다." }),
      z.gt(0),
    ),
  durationMs: durationSchema,
});

export const lectureHighlightActionSchema = z.object({
  type: z.literal("highlight"),
  targetNodeIds: nodeIdsSchema,
  style: z.enum(["steady", "pulse", "pop", "bounce", "shake"]),
  tone: z.optional(z.enum(["accent", "success", "warning", "danger"])),
  durationMs: durationSchema,
  persist: persistSchema,
});

export const lectureDimActionSchema = z.object({
  type: z.literal("dim"),
  exceptNodeIds: nodeIdsSchema,
  durationMs: durationSchema,
  persist: persistSchema,
});

export const lectureTraceActionSchema = z.object({
  type: z.literal("trace"),
  nodeIds: nodeIdsSchema,
  durationMs: durationSchema,
  mode: z.optional(z.enum(["simultaneous", "progressive"])),
  direction: z.optional(z.enum(["forward", "reverse"])),
  persist: persistSchema,
});

export const lectureWaitActionSchema = z.object({
  type: z.literal("wait"),
  durationMs: durationSchema,
});

export const lectureCollapseActionSchema = z.object({
  type: z.literal("collapse"),
  targetNodeIds: nodeIdsSchema,
  durationMs: durationSchema,
});

export const lectureExpandActionSchema = z.object({
  type: z.literal("expand"),
  targetNodeIds: nodeIdsSchema,
  durationMs: durationSchema,
});

export const lectureResetActionSchema = z.object({
  type: z.literal("reset"),
  scope: z.enum(["visual", "camera", "all"]),
});

const lectureAnimationActionSchemas = [
  lectureFocusActionSchema,
  lectureHighlightActionSchema,
  lectureDimActionSchema,
  lectureTraceActionSchema,
  lectureWaitActionSchema,
  lectureCollapseActionSchema,
  lectureExpandActionSchema,
  lectureResetActionSchema,
] as const;

export const lectureAnimationActionSchema = z.discriminatedUnion(
  "type",
  lectureAnimationActionSchemas,
);

/*
group은 자기 자신을 자식으로 담는다. getter로 자식 스키마를 늦게 읽어 재귀를 표현하고,
group도 같은 discriminatedUnion에 넣어 오류 위치가 "children.2.durationMs"처럼 정확히 남게 한다.
*/
export const lectureAnimationGroupSchema = z.object({
  type: z.literal("group"),
  mode: z.enum(["sequence", "parallel"]),
  get children(): z.ZodMiniArray<typeof lectureAnimationSchema> {
    return z.array(lectureAnimationSchema);
  },
});

export const lectureAnimationSchema = z.discriminatedUnion("type", [
  ...lectureAnimationActionSchemas,
  lectureAnimationGroupSchema,
]);

export const lectureScriptSchema = z.object({
  id: z.string(),
  title: z.string(),
  scenes: z.array(
    z.object({
      id: z.string(),
      nodeId: z.string(),
      beats: z.array(
        z.object({
          id: z.string(),
          narration: z.object({
            text: z.string(),
            fallbackDurationMs: durationSchema,
          }),
          animation: lectureAnimationSchema,
        }),
      ),
    }),
  ),
});
