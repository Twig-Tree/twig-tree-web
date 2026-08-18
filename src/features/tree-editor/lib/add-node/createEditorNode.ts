import { CustomEditorNode } from "../../model/types";

type CreateEditorNodeParams = {
  id: string;
  label: string;
  orderIndex: number;
  x: number;
  y: number;
};

export const createEditorNode = ({
  id,
  label,
  orderIndex,
  x,
  y,
}: CreateEditorNodeParams): CustomEditorNode => {
  return {
    id,
    type: "custom",
    data: {
      label,
      orderIndex,
      memo: null, // 새 노드는 메모 없이 만들어진다.
    },
    position: {
      x,
      y,
    },
  };
};
