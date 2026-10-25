import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { TagInput } from "./TagInput";

const tags = [
  { id: "t1", name: "React" },
  { id: "t2", name: "React Native" },
  { id: "t3", name: "중요" },
];

const renderTagInput = ({
  attachedTagIds = [] as string[],
  remainingTagCount = 10,
  attachResult = null as string | null,
} = {}) => {
  const onAttachTag = vi.fn(() => attachResult);
  const onAttachTagByName = vi.fn(() => attachResult);

  render(
    <TagInput
      tags={tags}
      attachedTagIds={attachedTagIds}
      remainingTagCount={remainingTagCount}
      tagLimitMessage="태그는 노드당 최대 10개까지 붙일 수 있습니다."
      onAttachTag={onAttachTag}
      onAttachTagByName={onAttachTagByName}
    />,
  );

  return { onAttachTag, onAttachTagByName };
};

const openInput = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole("button", { name: "+ 태그 추가" }));

  return screen.getByRole("combobox", { name: "태그 이름" });
};

const getSuggestionNames = () =>
  screen.queryAllByRole("option").map((option) => option.textContent);

describe("TagInput", () => {
  it("점선 칸을 누르면 입력창을 열고 붙지 않은 트리 태그를 자동완성으로 보여 준다", async () => {
    const user = userEvent.setup();
    renderTagInput({ attachedTagIds: ["t3"] });

    const input = await openInput(user);

    expect(input).toHaveFocus();
    expect(getSuggestionNames()).toEqual(["React", "React Native"]);
  });

  it("입력값과 일치하는 태그만 보여 준다", async () => {
    const user = userEvent.setup();
    renderTagInput();

    await user.type(await openInput(user), "native");

    expect(getSuggestionNames()).toEqual(["React Native"]);
  });

  it("자동완성 항목을 누르면 그 태그를 붙이고 입력창을 닫는다", async () => {
    const user = userEvent.setup();
    const { onAttachTag } = renderTagInput();

    await user.type(await openInput(user), "nat");
    await user.click(screen.getByRole("option", { name: "React Native" }));

    expect(onAttachTag).toHaveBeenCalledExactlyOnceWith("t2");
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });

  it("화살표로 고른 항목을 Enter로 붙이고 입력창을 닫는다", async () => {
    const user = userEvent.setup();
    const { onAttachTag, onAttachTagByName } = renderTagInput();

    await openInput(user);
    await user.keyboard("{ArrowDown}{ArrowDown}{Enter}");

    expect(onAttachTag).toHaveBeenCalledExactlyOnceWith("t2");
    expect(onAttachTagByName).not.toHaveBeenCalled();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });

  it("이름을 입력해 붙이면 입력창을 비운 채 열어 둔다", async () => {
    const user = userEvent.setup();
    renderTagInput();

    const input = await openInput(user);
    await user.type(input, "복습{Enter}");

    expect(input).toHaveValue("");
    expect(input).toHaveFocus();
  });

  it("항목을 고르지 않고 Enter를 누르면 입력한 이름으로 붙이고, 새로 만들 이름이면 미리 알린다", async () => {
    const user = userEvent.setup();
    const { onAttachTagByName } = renderTagInput();

    await user.type(await openInput(user), "복습");

    expect(
      screen.getByText('Enter로 "복습" 태그를 새로 만듭니다.'),
    ).toBeInTheDocument();

    await user.keyboard("{Enter}");

    expect(onAttachTagByName).toHaveBeenCalledExactlyOnceWith("복습");
  });

  it("빈 입력에서 Enter를 누르면 아무것도 붙이지 않는다", async () => {
    const user = userEvent.setup();
    const { onAttachTagByName } = renderTagInput();

    await user.type(await openInput(user), "   {Enter}");

    expect(onAttachTagByName).not.toHaveBeenCalled();
  });

  it("붙이지 못하면 안내 문구를 보여 주고 입력값을 남긴다", async () => {
    const user = userEvent.setup();
    renderTagInput({ attachResult: "이미 붙은 태그입니다." });

    const input = await openInput(user);
    await user.type(input, "React{Enter}");

    expect(screen.getByRole("alert")).toHaveTextContent(
      "이미 붙은 태그입니다.",
    );
    expect(input).toHaveValue("React");
  });

  it("Escape를 누르면 붙이지 않고 입력창을 닫는다", async () => {
    const user = userEvent.setup();
    const { onAttachTagByName } = renderTagInput();

    await user.type(await openInput(user), "복습{Escape}");

    expect(onAttachTagByName).not.toHaveBeenCalled();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });

  it("마지막 자리를 채우면 입력창을 닫는다", async () => {
    const user = userEvent.setup();
    renderTagInput({ remainingTagCount: 1 });

    await user.type(await openInput(user), "복습{Enter}");

    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });

  it("더 붙일 수 없으면 점선 칸을 막고 안내한다", () => {
    renderTagInput({ remainingTagCount: 0 });

    expect(screen.getByRole("button", { name: "+ 태그 추가" })).toBeDisabled();
    expect(
      screen.getByText("태그는 노드당 최대 10개까지 붙일 수 있습니다."),
    ).toBeInTheDocument();
  });
});
