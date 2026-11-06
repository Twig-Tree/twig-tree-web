import { notFound } from "next/navigation";
import { WorkspaceLab } from "@/src/widgets/workspace-lab";

export default function WorkspaceLabPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return <WorkspaceLab />;
}
