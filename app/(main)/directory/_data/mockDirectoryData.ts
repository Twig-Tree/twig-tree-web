import type { FolderItem } from "@/src/entities/folder";
import type { WorkspaceItem } from "@/src/entities/workspace";
import { routes } from "@/src/shared/config/routes";
import type { BreadcrumbItem } from "@/src/shared/ui/breadcrumb";

export interface DirectoryPageData {
  title: string;
  breadcrumbs: BreadcrumbItem[];
  folders: FolderItem[];
  workspaces: WorkspaceItem[];
}

const rootDirectory: DirectoryPageData = {
  title: "Root",
  breadcrumbs: [{ label: "Root" }],
  folders: [{ id: "project", name: "Project" }],
  workspaces: [],
};

const directoryPages: Record<string, DirectoryPageData> = {
  project: {
    title: "Project",
    breadcrumbs: [
      { label: "Root", href: routes.directoryRoot },
      { label: "Project" },
    ],
    folders: [{ id: "ai-research", name: "AI Research" }],
    workspaces: [],
  },
  "ai-research": {
    title: "AI Research Hub",
    breadcrumbs: [
      { label: "Root", href: routes.directoryRoot },
      { label: "Project", href: routes.directory("project") },
      { label: "AI Research" },
    ],
    folders: [
      { id: "folder-design-assets", name: "Design Assets" },
      { id: "folder-raw-datasets", name: "Raw Datasets" },
      {
        id: "folder-legal-documentation",
        name: "Legal Documentation",
      },
      { id: "folder-archive-2022", name: "Archive 2022" },
    ],
    workspaces: [
      {
        id: "workspace-computer-science-1",
        name: "Computer Science",
        modifiedAt: "Oct 12, 2023",
      },
      {
        id: "workspace-computer-science-2",
        name: "Computer Science",
        modifiedAt: "Oct 12, 2023",
      },
      {
        id: "workspace-literature-review",
        name: "Literature Review",
        modifiedAt: "Oct 12, 2023",
      },
    ],
  },
};

export function getRootDirectoryPageData() {
  return rootDirectory;
}

export function getDirectoryPageData(folderId: string) {
  return directoryPages[folderId];
}
