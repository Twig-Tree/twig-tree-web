import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createQueryWrapper } from "@/src/tests/helpers/createQueryWrapper";
import { DirectoryContentsGrid } from "./DirectoryContentsGrid";
import { DirectoryDragMoveProvider } from "./DirectoryDragMoveProvider";

const { moveFolderByDrop, moveWorkspaceByDrop } = vi.hoisted(() => ({
  moveFolderByDrop: vi.fn(),
  moveWorkspaceByDrop: vi.fn(),
}));

vi.mock("@/src/features/folder/move-folder", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useMoveFolderByDrop: () => ({ moveFolderByDrop }),
}));

vi.mock("@/src/features/workspace/move-workspace", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useMoveWorkspaceByDrop: () => ({ moveWorkspaceByDrop }),
}));

const folderA = { id: "1", name: "기획 폴더" };
const folderB = { id: "2", name: "디자인 폴더" };
const workspace = {
  id: "1",
  name: "리서치",
  folderId: null,
  updatedAt: "2026-08-31T12:00:00.000000Z",
};

/*
jsdom은 배치를 계산하지 않아 모든 요소의 크기가 0이다. 충돌 판정이 되도록 카드 이름으로 자리를 정해 준다.
카드는 가로로 200px 간격, 크기 100×100이다.
*/
const CARD_LEFT: Record<string, number> = {
  [folderA.name]: 0,
  [folderB.name]: 200,
  [workspace.name]: 400,
};

const getCardRect = (element: Element): DOMRect => {
  const name = Object.keys(CARD_LEFT).find((cardName) =>
    element.textContent?.includes(cardName),
  );
  const isSingleCard =
    name !== undefined &&
    Object.keys(CARD_LEFT).filter((cardName) =>
      element.textContent?.includes(cardName),
    ).length === 1;

  if (!isSingleCard) return new DOMRect(0, 0, 0, 0);

  return new DOMRect(CARD_LEFT[name], 0, 100, 100);
};

const renderGrid = () =>
  render(
    <DirectoryDragMoveProvider folderParentId={null}>
      <DirectoryContentsGrid
        editingFolderId={null}
        editingWorkspaceId={null}
        folderParentId={null}
        folders={[folderA, folderB]}
        isError={false}
        isLoaded={true}
        isLoading={false}
        onFolderEditingStart={vi.fn()}
        onEditingEnd={vi.fn()}
        onWorkspaceEditingStart={vi.fn()}
        workspaces={[workspace]}
      />
    </DirectoryDragMoveProvider>,
    { wrapper: createQueryWrapper().wrapper },
  );

/*
카드 이름이 든 링크에서 시작해 x만큼 끈다. 첫 이동은 끌기 시작 거리를 넘기기 위한 것이다.
*/
const dragCard = (name: string, deltaX: number) => {
  const link = screen.getByRole("link", { name: new RegExp(name) });
  const startX = CARD_LEFT[name] + 50;

  fireEvent.mouseDown(link, { button: 0, clientX: startX, clientY: 50 });
  fireEvent.mouseMove(document, { clientX: startX + 10, clientY: 50 });
  fireEvent.mouseMove(document, { clientX: startX + deltaX, clientY: 50 });

  return link;
};

const dropCard = () => fireEvent.mouseUp(document);

describe("디렉토리 드래그 이동", () => {
  beforeEach(() => {
    vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(
      function (this: Element) {
        return getCardRect(this);
      },
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    moveFolderByDrop.mockClear();
    moveWorkspaceByDrop.mockClear();
  });

  it("폴더를 다른 폴더 카드에 놓으면 그 폴더로 옮긴다", () => {
    renderGrid();

    dragCard(folderA.name, 200);
    dropCard();

    expect(moveFolderByDrop).toHaveBeenCalledWith(folderA, folderB.id);
  });

  it("워크스페이스를 폴더 카드에 놓으면 그 폴더로 옮긴다", () => {
    renderGrid();

    dragCard(workspace.name, -400);
    dropCard();

    expect(moveWorkspaceByDrop).toHaveBeenCalledWith(workspace, folderA.id);
  });

  it("끄는 동안 놓을 수 있는 폴더 카드만 강조한다", () => {
    const { container } = renderGrid();

    dragCard(folderA.name, 200);

    const highlighted = container.querySelectorAll("[data-drop-highlighted]");
    expect(highlighted).toHaveLength(1);
    expect(highlighted[0]).toHaveTextContent(folderB.name);

    dropCard();
  });

  it("자기 자신 위에 놓으면 요청하지 않는다", () => {
    const { container } = renderGrid();

    dragCard(folderA.name, 20);

    expect(container.querySelector("[data-drop-highlighted]")).toBeNull();

    dropCard();

    expect(moveFolderByDrop).not.toHaveBeenCalled();
  });

  it("놓을 곳이 없는 자리에 놓으면 요청하지 않는다", () => {
    renderGrid();

    dragCard(folderB.name, 400);
    dropCard();

    expect(moveFolderByDrop).not.toHaveBeenCalled();
    expect(moveWorkspaceByDrop).not.toHaveBeenCalled();
  });

  it("끌고 놓은 직후의 click은 링크를 열지 않고, 잠시 뒤의 click은 막지 않는다", async () => {
    renderGrid();

    const link = dragCard(folderA.name, 400);
    dropCard();

    expect(fireEvent.click(link)).toBe(false);

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(fireEvent.click(link)).toBe(true);
  });
});
