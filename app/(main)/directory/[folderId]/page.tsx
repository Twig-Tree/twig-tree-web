"use client";

import { use } from "react";
import { useCreateFolder } from "@/src/features/folder/create-folder";
import {
  DirectoryContentsGrid,
  DirectoryHeader,
} from "@/src/widgets/directory";
import { notFound } from "next/navigation";
import { getDirectoryPageData } from "../_data/mockDirectoryData";

interface DirectoryPageProps {
  params: Promise<{ folderId: string }>;
}

export default function DirectoryPage({ params }: DirectoryPageProps) {
  const { folderId } = use(params);
  const directory = getDirectoryPageData(folderId);

  if (!directory) {
    notFound();
  }

  const folderParentId = Number(folderId);
  return (
    <DirectoryPageContent
      key={folderId}
      directory={directory}
      folderParentId={folderParentId}
    />
  );
}

interface DirectoryPageContentProps {
  directory: NonNullable<ReturnType<typeof getDirectoryPageData>>;
  folderParentId: number;
}

function DirectoryPageContent({
  directory,
  folderParentId,
}: DirectoryPageContentProps) {
  const { folders, createFolder, isCreateFolderDisabled } = useCreateFolder({
    initialFolders: directory.folders,
    folderParentId,
  });

  return (
    <div className="h-full overflow-y-auto bg-slate-50/70 px-6 py-8 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <DirectoryHeader
          title={directory.title}
          breadcrumbs={directory.breadcrumbs}
          onCreateFolder={() => void createFolder()}
          isCreateFolderDisabled={isCreateFolderDisabled}
        />
        <DirectoryContentsGrid
          folders={folders}
          workspaces={directory.workspaces}
        />
      </div>
    </div>
  );
}
