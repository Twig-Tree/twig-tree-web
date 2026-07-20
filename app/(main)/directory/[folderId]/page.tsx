import {
  DirectoryContentsGrid,
  DirectoryHeader,
} from "@/src/widgets/directory";
import { notFound } from "next/navigation";
import { getDirectoryPageData } from "../_data/mockDirectoryData";

interface DirectoryPageProps {
  params: Promise<{ folderId: string }>;
}

export default async function DirectoryPage({ params }: DirectoryPageProps) {
  const { folderId } = await params;
  const directory = getDirectoryPageData(folderId);

  if (!directory) {
    notFound();
  }

  return (
    <div className="h-full overflow-y-auto bg-slate-50/70 px-6 py-8 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <DirectoryHeader
          title={directory.title}
          breadcrumbs={directory.breadcrumbs}
        />
        <DirectoryContentsGrid
          folders={directory.folders}
          workspaces={directory.workspaces}
        />
      </div>
    </div>
  );
}
