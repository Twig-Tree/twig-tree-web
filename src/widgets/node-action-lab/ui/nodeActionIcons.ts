import {
  Pencil,
  Plus,
  StickyNote,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { type NodeActionId } from "../model/nodeActions";

/*
동작마다 메뉴·버튼·팔레트가 같은 아이콘을 쓴다. 진입점마다 아이콘이 다르면 비교가 아니라 다른 화면이 된다.
*/
export const NODE_ACTION_ICONS: Record<NodeActionId, LucideIcon> = {
  openMemo: StickyNote,
  addChild: Plus,
  rename: Pencil,
  delete: Trash2,
};
