import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { createQueryWrapper } from "@/src/tests/helpers/createQueryWrapper";
import { useGetMyInfoQuery } from "./queries";

describe("useGetMyInfoQuery", () => {
  it("응답 DTO를 도메인 모델로 바꿔 돌려준다", async () => {
    const { result } = renderHook(() => useGetMyInfoQuery(), {
      wrapper: createQueryWrapper().wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual({
      id: "1",
      email: "twig@example.com",
      name: "트윅",
      profileImage: "https://example.com/profile.png",
    });
  });
});
