import { notFound } from "next/navigation";
import { NodeActionLab } from "@/src/widgets/node-action-lab";

export default function NodeActionLabPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return <NodeActionLab />;
}
