import {
  Pencil,
  Plus,
  StickyNote,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { type NodeActionId } from "../lib/shortcuts/nodeActionShortcuts";

/*
노드 옆 버튼과 우클릭 메뉴가 같은 아이콘을 쓴다.
*/
export const NODE_ACTION_ICONS: Record<NodeActionId, LucideIcon> = {
  openMemo: StickyNote,
  addChild: Plus,
  rename: Pencil,
  delete: Trash2,
};
