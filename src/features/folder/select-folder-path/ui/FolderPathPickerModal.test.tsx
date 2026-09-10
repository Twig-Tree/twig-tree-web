import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { createQueryWrapper } from "@/src/tests/helpers/createQueryWrapper";
import { FolderPathPickerModal } from "./FolderPathPickerModal";

const renderModal = () => {
  const onClose = vi.fn();
  const onSelect = vi.fn();

  render(
    <FolderPathPickerModal isOpen onClose={onClose} onSelect={onSelect} />,
    { wrapper: createQueryWrapper().wrapper },
  );

  return { onClose, onSelect };
};

describe("FolderPathPickerModal", () => {
  it("현재 위치의 폴더와 워크스페이스를 함께 보여준다", async () => {
    renderModal();

    expect(await screen.findByText("Root Folder")).toBeInTheDocument();
    expect(await screen.findByText("Root Workspace")).toBeInTheDocument();
  });

  /*
  워크스페이스는 들어갈 수 있는 위치가 아니므로 폴더 행과 달리 누를 수 없어야 한다.
  button으로 그리면 경로를 옮길 수 있는 항목으로 읽힌다.
  */
  it("워크스페이스 행은 누를 수 없다", async () => {
    renderModal();

    expect(await screen.findByText("Root Workspace")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Root Workspace" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Root Folder" }),
    ).toBeInTheDocument();
  });

  it("폴더로 내려가면 그 폴더의 목록으로 바뀐다", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(
      await screen.findByRole("button", { name: "Root Folder" }),
    );

    expect(await screen.findByText("Folder In Folder")).toBeInTheDocument();
    expect(await screen.findByText("Workspace In Folder")).toBeInTheDocument();
    expect(screen.queryByText("Root Workspace")).not.toBeInTheDocument();
  });

  /*
  두 목록이 모두 도착하기 전에는 이 폴더에 무엇이 들어 있는지 확인하지 못한 상태다.
  */
  it("목록이 도착한 뒤에만 위치를 확정할 수 있다", async () => {
    const { onSelect } = renderModal();

    const selectButton = screen.getByRole("button", { name: "여기에 만들기" });
    expect(selectButton).toBeDisabled();

    await waitFor(() => expect(selectButton).toBeEnabled());

    await userEvent.setup().click(selectButton);
    expect(onSelect).toHaveBeenCalledWith(null);
  });
});
