import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { type EditorLectureScript } from "../types";
import { useLectureStore } from "./lectureStore";
import { useLectureCameraRefit } from "./useLectureCameraRefit";

const script: EditorLectureScript = {
  id: "script",
  title: "강의",
  scenes: [{ id: "scene", clientId: "c1", beats: [] }],
};

const renderRefit = () =>
  renderHook(({ panelLayoutKey }) => useLectureCameraRefit(panelLayoutKey), {
    initialProps: { panelLayoutKey: "a" },
  });

beforeEach(() => {
  useLectureStore.getState().resetLecture();
});

describe("useLectureCameraRefit", () => {
  it("카메라 동작을 바로 실행한다", () => {
    const { result } = renderRefit();
    const cameraMove = vi.fn();

    result.current.runCameraMove(cameraMove);

    expect(cameraMove).toHaveBeenCalledOnce();
  });

  it("강의 중에 패널 배치가 바뀌면 마지막 동작만 다시 실행한다", () => {
    const { result, rerender } = renderRefit();
    const firstMove = vi.fn();
    const lastMove = vi.fn();

    act(() => useLectureStore.getState().startLecture(script));
    result.current.runCameraMove(firstMove);
    result.current.runCameraMove(lastMove);

    rerender({ panelLayoutKey: "b" });

    expect(firstMove).toHaveBeenCalledOnce();
    expect(lastMove).toHaveBeenCalledTimes(2);
  });

  it("일시정지 중에도 다시 실행한다", () => {
    const { result, rerender } = renderRefit();
    const cameraMove = vi.fn();

    act(() => useLectureStore.getState().startLecture(script));
    result.current.runCameraMove(cameraMove);
    act(() => useLectureStore.getState().pauseLecture());

    rerender({ panelLayoutKey: "b" });

    expect(cameraMove).toHaveBeenCalledTimes(2);
  });

  it("패널 배치가 그대로면 다시 실행하지 않는다", () => {
    const { result, rerender } = renderRefit();
    const cameraMove = vi.fn();

    act(() => useLectureStore.getState().startLecture(script));
    result.current.runCameraMove(cameraMove);

    rerender({ panelLayoutKey: "a" });

    expect(cameraMove).toHaveBeenCalledOnce();
  });

  it("강의 중이 아니면 다시 실행하지 않는다", () => {
    const { result, rerender } = renderRefit();
    const cameraMove = vi.fn();

    result.current.runCameraMove(cameraMove);

    rerender({ panelLayoutKey: "b" });

    expect(cameraMove).toHaveBeenCalledOnce();
  });

  it("마지막 동작을 요청하면 다시 실행한다", () => {
    const { result } = renderRefit();
    const cameraMove = vi.fn();

    result.current.runCameraMove(cameraMove);
    result.current.repeatLastCameraMove();

    expect(cameraMove).toHaveBeenCalledTimes(2);
  });

  it("다시 실행용 동작을 따로 주면 다시 실행할 때 그 동작을 쓴다", () => {
    const { result } = renderRefit();
    const cameraMove = vi.fn();
    const repeatMove = vi.fn();

    result.current.runCameraMove(cameraMove, repeatMove);
    result.current.repeatLastCameraMove();

    expect(cameraMove).toHaveBeenCalledOnce();
    expect(repeatMove).toHaveBeenCalledOnce();
  });

  it("지운 동작은 다시 실행하지 않는다", () => {
    const { result } = renderRefit();
    const cameraMove = vi.fn();

    result.current.runCameraMove(cameraMove);
    result.current.forgetLastCameraMove();
    result.current.repeatLastCameraMove();

    expect(cameraMove).toHaveBeenCalledOnce();
  });

  it("끝난 강의의 동작은 다음 강의에서 다시 실행하지 않는다", () => {
    const { result, rerender } = renderRefit();
    const cameraMove = vi.fn();

    act(() => useLectureStore.getState().startLecture(script));
    result.current.runCameraMove(cameraMove);
    act(() => useLectureStore.getState().resetLecture());
    act(() => useLectureStore.getState().startLecture(script));

    rerender({ panelLayoutKey: "b" });

    expect(cameraMove).toHaveBeenCalledOnce();
  });
});
