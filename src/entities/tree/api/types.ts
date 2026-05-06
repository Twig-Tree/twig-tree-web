export interface NodeDTO {
  node_id: number;
  title: string;
  parent_id: number | null;
  order_id: number;
  memo: string | null;
}
