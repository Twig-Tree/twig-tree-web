import * as z from "zod/mini";
import { getRepeatedRoleNodePaths } from "../scenario/scenarioChecks";
import { nodeIdListSchema, nodeIdSchema } from "../scenario/schema";

/*
recipe 입력의 역할 모양. 시나리오 cue의 role과 같은 규칙을 쓴다.
- one: 노드 하나
- many: 비어 있지 않은 노드 목록
- optionalMany: 없어도 되는 목록. 주어지면 비어 있으면 안 된다
*/
export const recipeRole = {
  one: nodeIdSchema,
  many: nodeIdListSchema,
  optionalMany: z.optional(nodeIdListSchema),
};

/*
함수 이름 : createRecipeInputSchema
기능 : 역할 이름별 모양으로 recipe 입력 스키마를 만든다. 정의하지 않은 역할은 거부하고, 한 노드를 두 역할에 쓰면 거부한다.
인자 : Roles roles -> 역할 이름별 모양
반환값 : recipe 입력 스키마
*/
export const createRecipeInputSchema = <
  Roles extends Record<string, z.ZodMiniType>,
>(
  roles: Roles,
) =>
  z.strictObject(roles).check(
    z.superRefine((value, context) => {
      const repeatedPaths = getRepeatedRoleNodePaths(
        value as Record<string, string | string[] | undefined>,
      );

      for (const path of repeatedPaths) {
        context.addIssue({
          code: "custom",
          message: "한 recipe 입력에서 같은 노드를 두 번 쓸 수 없습니다.",
          path,
        });
      }
    }),
  );
