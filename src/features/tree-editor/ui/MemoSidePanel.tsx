import { X } from "lucide-react";
import { IconButton } from "@/src/shared/ui/icon-button";
import { MemoEditor } from "./MemoEditor";
import { TagChipList } from "./TagChipList";
import { TagInput } from "./TagInput";
import { getTagsByIds } from "../lib/tag/getTagsByIds";
import { useAttachNodeTag } from "../model/actions/attach-node-tag/useAttachNodeTag";
import { useDetachNodeTag } from "../model/actions/detach-node-tag/useDetachNodeTag";
import { useSaveMemo } from "../model/actions/save-memo/useSaveMemo";
import { useTreeTags } from "../model/tag/useTreeTags";
import type { CustomEditorNode } from "../model/types";

type MemoSidePanelProps = {
  treeId: string;
  selectedNode: CustomEditorNode | undefined;
  onClose: () => void;
  isOverlay: boolean; // 좁은 화면이면 캔버스를 밀어내지 않고 그 위에 겹쳐 띄운다
};

export const MemoSidePanel = ({
  treeId,
  selectedNode,
  onClose,
  isOverlay,
}: MemoSidePanelProps) => {
  const savedMemo = selectedNode?.data.memo ?? null; // 저장된 메모가 없으면 null이다.

  const { handleSaveMemo, isSaving } = useSaveMemo({
    treeId,
    clientId: selectedNode?.id,
    serverId: selectedNode?.data.serverId ?? null,
    savedMemo,
  });

  const { tags } = useTreeTags();
  const attachedTagIds = selectedNode?.data.tagIds ?? [];

  const { attachTag, attachTagByName, remainingTagCount, tagLimitMessage } =
    useAttachNodeTag({
      treeId,
      clientId: selectedNode?.id,
      serverId: selectedNode?.data.serverId ?? null,
      attachedTagIds,
    });

  const { handleDetachNodeTag } = useDetachNodeTag({
    treeId,
    clientId: selectedNode?.id,
    serverId: selectedNode?.data.serverId ?? null,
  });

  return (
    <aside
      aria-label="메모 패널"
      className={`z-10 flex h-full w-[360px] max-w-full shrink-0 flex-col bg-surface-muted shadow-panel ${
        isOverlay ? "absolute inset-y-0 right-0 z-30" : "relative"
      }`}
    >
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-line px-panel">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-content-muted">
            메모
          </p>
          <h2 className="truncate text-lg font-semibold text-content">
            {selectedNode?.data.label ?? "선택한 노드 없음"}
          </h2>
        </div>
        <IconButton size="sm" aria-label="메모 패널 닫기" onClick={onClose}>
          <X aria-hidden="true" />
        </IconButton>
      </header>

      {selectedNode ? (
        /*
        노드를 바꾸면 편집 중이던 메모와 태그 입력을 함께 버리도록 노드 ID를 key로 준다.
        태그 영역은 MemoEditor 안에 들어가므로 key 하나로 둘 다 새로 그려진다.
        */
        <MemoEditor
          key={selectedNode.id}
          initialMemo={savedMemo ?? ""}
          onSave={(content) => void handleSaveMemo(content)}
          isSaving={isSaving}
        >
          <TagChipList
            nodeTags={getTagsByIds(tags, attachedTagIds)}
            onDetach={(tagId) => void handleDetachNodeTag(tagId)}
          >
            <TagInput
              tags={tags}
              attachedTagIds={attachedTagIds}
              remainingTagCount={remainingTagCount}
              tagLimitMessage={tagLimitMessage}
              onAttachTag={attachTag}
              onAttachTagByName={attachTagByName}
            />
          </TagChipList>
        </MemoEditor>
      ) : (
        <>
          <div className="min-h-0 flex-1 p-panel">
            <div className="flex h-full items-center justify-center rounded-control border border-dashed border-line text-sm text-content-muted">
              노드를 선택하면 메모를 남길 수 있습니다.
            </div>
          </div>

          <footer className="flex h-16 shrink-0 items-center justify-end gap-2 border-t border-line px-panel">
            <button
              type="button"
              className="rounded-control border border-line px-4 py-2 text-sm font-medium text-content-disabled"
              disabled
            >
              되돌리기
            </button>
            <button
              type="button"
              className="rounded-control bg-surface-strong px-4 py-2 text-sm font-medium text-content-disabled"
              disabled
            >
              저장
            </button>
          </footer>
        </>
      )}
    </aside>
  );
};
