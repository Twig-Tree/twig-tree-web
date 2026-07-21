"use client";

import { useCreateFolder } from "@/src/features/folder/create-folder";
import {
  DirectoryContentsGrid,
  DirectoryHeader,
} from "@/src/widgets/directory";
import { getRootDirectoryPageData } from "./_data/mockDirectoryData";

export default function DirectoryRootPage() {
  const directory = getRootDirectoryPageData();
  const { folders, createFolder, isCreateFolderDisabled } = useCreateFolder({
    initialFolders: directory.folders,
    folderParentId: null,
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
