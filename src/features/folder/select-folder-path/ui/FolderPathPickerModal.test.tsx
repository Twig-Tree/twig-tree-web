import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { createQueryWrapper } from "@/src/tests/helpers/createQueryWrapper";
import { FolderPathPickerModal } from "./FolderPathPickerModal";

type OptionalProps = {
  currentLocationId?: string | null;
  movingFolderId?: string;
  errorMessage?: string | null;
  onSelect?: (folderParentId: string | null) => void | Promise<boolean>;
};

const renderModal = ({
  onSelect = vi.fn(),
  ...restrictionProps
}: OptionalProps = {}) => {
  const onClose = vi.fn();

  render(
    <FolderPathPickerModal
      isOpen
      onClose={onClose}
      onSelect={onSelect}
      title="옮길 위치"
      confirmLabel="여기로 옮기기"
      {...restrictionProps}
    />,
    { wrapper: createQueryWrapper().wrapper },
  );

  return { onClose, onSelect };
};

describe("FolderPathPickerModal", () => {
  it("받은 제목과 확정 버튼 문구를 표시한다", async () => {
    renderModal();

    expect(
      screen.getByRole("heading", { name: "옮길 위치" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "여기로 옮기기" }),
    ).toBeInTheDocument();
  });

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

    const selectButton = screen.getByRole("button", { name: "여기로 옮기기" });
    expect(selectButton).toBeDisabled();

    await waitFor(() => expect(selectButton).toBeEnabled());

    await userEvent.setup().click(selectButton);
    expect(onSelect).toHaveBeenCalledWith(null);
  });

  /*
  같은 곳으로 옮기는 것은 이동이 아니다. 목록이 도착한 뒤에도 확정할 수 없어야 한다.
  */
  it("옮기려는 대상이 지금 있는 위치에서는 확정할 수 없다", async () => {
    renderModal({ currentLocationId: null });

    expect(await screen.findByText("Root Folder")).toBeInTheDocument();
    expect(screen.getByText("지금 있는 위치입니다")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "여기로 옮기기" }),
    ).toBeDisabled();
  });

  it("지금 있는 위치를 벗어나면 확정할 수 있다", async () => {
    const user = userEvent.setup();
    const { onSelect } = renderModal({ currentLocationId: null });

    await user.click(
      await screen.findByRole("button", { name: "Root Folder" }),
    );
    expect(await screen.findByText("Folder In Folder")).toBeInTheDocument();

    const selectButton = screen.getByRole("button", { name: "여기로 옮기기" });
    await waitFor(() => expect(selectButton).toBeEnabled());
    expect(screen.queryByText("지금 있는 위치입니다")).not.toBeInTheDocument();

    await user.click(selectButton);
    expect(onSelect).toHaveBeenCalledWith("3");
  });

  /*
  자기 자신으로 들어갈 수 없으면 그 하위 폴더에도 닿을 수 없어, 자기 하위로 옮기는 경로가 막힌다.
  목록에서 빼면 있어야 할 폴더가 사라진 것처럼 보이므로 이름은 그대로 보여준다.
  */
  it("옮기려는 폴더는 보이지만 들어갈 수 없다", async () => {
    renderModal({ movingFolderId: "3" });

    expect(await screen.findByText("Root Folder")).toBeInTheDocument();
    expect(screen.getByText("옮기는 폴더")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Root Folder/ }),
    ).not.toBeInTheDocument();
  });

  it("확정 callback이 true로 끝나면 팝업을 닫는다", async () => {
    const { onClose } = renderModal({
      onSelect: vi.fn().mockResolvedValue(true),
    });

    const selectButton = screen.getByRole("button", { name: "여기로 옮기기" });
    await waitFor(() => expect(selectButton).toBeEnabled());
    await userEvent.setup().click(selectButton);

    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  /*
  실패하면 사용자가 다른 위치를 고를 수 있도록 팝업을 열어 둔다.
  */
  it("확정 callback이 false로 끝나면 열어 둔 채 실패 안내를 보여준다", async () => {
    const { onClose } = renderModal({
      onSelect: vi.fn().mockResolvedValue(false),
      errorMessage: "옮길 위치에 같은 이름의 폴더가 있습니다.",
    });

    const selectButton = screen.getByRole("button", { name: "여기로 옮기기" });
    await waitFor(() => expect(selectButton).toBeEnabled());
    await userEvent.setup().click(selectButton);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "옮길 위치에 같은 이름의 폴더가 있습니다.",
    );
    expect(onClose).not.toHaveBeenCalled();
  });

  /*
  다른 폴더로 옮겨 가서도 남아 있으면 지금 보는 폴더에 대한 안내로 읽힌다.
  */
  it("실패한 위치를 벗어나면 실패 안내를 숨긴다", async () => {
    const user = userEvent.setup();
    renderModal({
      onSelect: vi.fn().mockResolvedValue(false),
      errorMessage: "옮길 위치에 같은 이름의 폴더가 있습니다.",
    });

    const selectButton = screen.getByRole("button", { name: "여기로 옮기기" });
    await waitFor(() => expect(selectButton).toBeEnabled());
    await user.click(selectButton);
    expect(await screen.findByRole("alert")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Root Folder" }));

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  /*
  실패 안내는 확정한 뒤에만 보인다. 팝업을 열자마자 이전 문구가 보이면 안 된다.
  */
  it("확정하기 전에는 실패 안내를 보여주지 않는다", async () => {
    renderModal({ errorMessage: "옮길 위치에 같은 이름의 폴더가 있습니다." });

    expect(await screen.findByText("Root Folder")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
