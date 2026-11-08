import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_VOICE_SETTINGS,
  updateVoiceSettings,
} from "@/src/shared/lib/speech";
import { VoiceSettingsForm } from "./VoiceSettingsForm";

const YUNA = { name: "Yuna", lang: "ko-KR", voiceURI: "yuna" };
const GOOGLE = { name: "Google 한국의", lang: "ko-KR", voiceURI: "google" };
const EDDY = { name: "Eddy", lang: "ko-KR", voiceURI: "eddy" };
const SAMANTHA = { name: "Samantha", lang: "en-US", voiceURI: "samantha" };

type FakeUtterance = {
  voice: unknown;
  volume: number;
  rate: number;
  onend: (() => void) | null;
  onerror: ((event: { error: string }) => void) | null;
};

/*
jsdom에는 음성 합성 API가 없으므로, 발화를 기록만 하는 가짜를 얹는다.
*/
const stubSpeech = (voices = [EDDY, GOOGLE, YUNA, SAMANTHA]) => {
  const speak = vi.fn<(utterance: FakeUtterance) => void>();
  const cancel = vi.fn();

  vi.stubGlobal(
    "SpeechSynthesisUtterance",
    class {
      onend = null;
      onerror = null;
    },
  );
  vi.stubGlobal("speechSynthesis", {
    getVoices: () => voices,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    speak,
    cancel,
  });

  return { speak, cancel };
};

/*
앞 테스트가 끊은 발화의 재시작 대기 시각은 모듈에 남는다. 발화는 그만큼 늦게 시작될 수 있어 시작될 때까지 기다린다.
*/
const startPreview = async (speak: ReturnType<typeof stubSpeech>["speak"]) => {
  await userEvent.click(screen.getByRole("button", { name: "미리 듣기" }));
  await waitFor(() => expect(speak).toHaveBeenCalled());
};

const getStoredSettings = () =>
  JSON.parse(window.localStorage.getItem("twig-tree:voice-settings")!);

/*
구독 해제와 발화 중단이 음성 합성 API를 부르므로, stub을 걷기 전에 먼저 해제한다.
*/
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  updateVoiceSettings(DEFAULT_VOICE_SETTINGS);
  window.localStorage.clear();
});

describe("VoiceSettingsForm", () => {
  it("음성 합성을 지원하지 않으면 입력 대신 안내를 보여 준다", () => {
    render(<VoiceSettingsForm />);

    expect(screen.getByText(/한국어 음성이 없어/)).toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });

  it("한국어 음성이 없으면 입력 대신 안내를 보여 준다", () => {
    stubSpeech([SAMANTHA]);

    render(<VoiceSettingsForm />);

    expect(screen.getByText(/한국어 음성이 없어/)).toBeInTheDocument();
  });

  it("자동 선택과 고를 수 있는 한국어 음성만 선택지로 보여 준다", () => {
    stubSpeech();

    render(<VoiceSettingsForm />);

    expect(
      screen.getAllByRole("option").map((option) => option.textContent),
    ).toEqual(["자동 선택", "Google 한국의", "Yuna"]);
    expect(screen.getByRole("combobox", { name: "음성" })).toHaveValue("");
  });

  it("고를 수 있는 음성이 없어도 자동 선택으로 설정을 바꿀 수 있다", () => {
    stubSpeech([EDDY]);

    render(<VoiceSettingsForm />);

    expect(
      screen.getAllByRole("option").map((option) => option.textContent),
    ).toEqual(["자동 선택"]);
    expect(screen.getByRole("slider", { name: "음량" })).toBeInTheDocument();
  });

  it("음성을 고르면 저장하고, 자동 선택으로 되돌릴 수 있다", async () => {
    const user = userEvent.setup();
    stubSpeech();
    render(<VoiceSettingsForm />);

    const select = screen.getByRole("combobox", { name: "음성" });

    await user.selectOptions(select, "yuna");
    expect(select).toHaveValue("yuna");
    expect(getStoredSettings().voiceUri).toBe("yuna");

    await user.selectOptions(select, "자동 선택");
    expect(getStoredSettings().voiceUri).toBeNull();
  });

  it("고른 음성이 이 기기에 없으면 자동 선택으로 보여 준다", () => {
    stubSpeech();
    updateVoiceSettings({ voiceUri: "gone" });

    render(<VoiceSettingsForm />);

    expect(screen.getByRole("combobox", { name: "음성" })).toHaveValue("");
  });

  it("음량을 바꾸면 비율로 저장하고 퍼센트로 보여 준다", () => {
    stubSpeech();
    render(<VoiceSettingsForm />);

    fireEvent.change(screen.getByRole("slider", { name: "음량" }), {
      target: { value: "35" },
    });

    expect(screen.getByText("35%")).toBeInTheDocument();
    expect(getStoredSettings().volume).toBe(0.35);
  });

  it("속도를 고르면 저장하고 선택 표시를 옮긴다", async () => {
    const user = userEvent.setup();
    stubSpeech();
    render(<VoiceSettingsForm />);

    expect(screen.getByRole("radio", { name: "보통" })).toBeChecked();

    await user.click(screen.getByRole("radio", { name: "느리게" }));

    expect(screen.getByRole("radio", { name: "느리게" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "보통" })).not.toBeChecked();
    expect(getStoredSettings().rate).toBe(0.75);
  });

  describe("미리 듣기", () => {
    it("고른 음성과 음량, 속도로 읽고 끝나면 버튼을 되돌린다", async () => {
      const { speak } = stubSpeech();
      updateVoiceSettings({ voiceUri: "yuna", volume: 0.5, rate: 1.25 });
      render(<VoiceSettingsForm />);

      await startPreview(speak);

      expect(speak.mock.calls[0][0]).toMatchObject({
        voice: YUNA,
        volume: 0.5,
        rate: 1.25,
      });

      act(() => speak.mock.calls[0][0].onend?.());

      expect(
        screen.getByRole("button", { name: "미리 듣기" }),
      ).toBeInTheDocument();
    });

    it("음소거 상태여도 소리를 낸다", async () => {
      const { speak } = stubSpeech();
      updateVoiceSettings({ isMuted: true });
      render(<VoiceSettingsForm />);

      await startPreview(speak);

      expect(speak).toHaveBeenCalledOnce();
    });

    it("읽는 중에 누르면 멈춘다", async () => {
      const { speak, cancel } = stubSpeech();
      render(<VoiceSettingsForm />);

      await startPreview(speak);
      cancel.mockClear();
      await userEvent.click(screen.getByRole("button", { name: "멈추기" }));

      expect(cancel).toHaveBeenCalledOnce();
      expect(
        screen.getByRole("button", { name: "미리 듣기" }),
      ).toBeInTheDocument();
    });

    it("읽기에 실패하면 알리고, 다시 시도하면 안내를 지운다", async () => {
      const { speak } = stubSpeech();
      render(<VoiceSettingsForm />);

      await startPreview(speak);
      act(() =>
        speak.mock.calls[0][0].onerror?.({ error: "synthesis-failed" }),
      );

      expect(screen.getByRole("alert")).toHaveTextContent(
        "미리 듣기에 실패했습니다",
      );

      await userEvent.click(screen.getByRole("button", { name: "미리 듣기" }));

      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("화면을 떠나면 읽기를 끊는다", async () => {
      const { speak, cancel } = stubSpeech();
      const { unmount } = render(<VoiceSettingsForm />);

      await startPreview(speak);
      cancel.mockClear();
      unmount();

      expect(cancel).toHaveBeenCalledOnce();
    });
  });
});
