import type { DirectoryItem } from "@/src/entities/directory";
import { routes } from "@/src/shared/config/routes";
import type { BreadcrumbItem } from "@/src/shared/ui/breadcrumb";

export interface DirectoryPageData {
  title: string;
  breadcrumbs: BreadcrumbItem[];
  items: DirectoryItem[];
}

const rootDirectory: DirectoryPageData = {
  title: "Root",
  breadcrumbs: [{ label: "Root" }],
  items: [{ id: "project", name: "Project", type: "folder" }],
};

const directoryPages: Record<string, DirectoryPageData> = {
  project: {
    title: "Project",
    breadcrumbs: [
      { label: "Root", href: routes.directoryDefault },
      { label: "Project" },
    ],
    items: [{ id: "ai-research", name: "AI Research", type: "folder" }],
  },
  "ai-research": {
    title: "AI Research Hub",
    breadcrumbs: [
      { label: "Root", href: routes.directoryDefault },
      { label: "Project", href: routes.directory("project") },
      { label: "AI Research" },
    ],
    items: [
      { id: "folder-design-assets", name: "Design Assets", type: "folder" },
      { id: "folder-raw-datasets", name: "Raw Datasets", type: "folder" },
      {
        id: "folder-legal-documentation",
        name: "Legal Documentation",
        type: "folder",
      },
      { id: "folder-archive-2022", name: "Archive 2022", type: "folder" },
      {
        id: "workspace-computer-science-1",
        name: "Computer Science",
        type: "workspace",
        modifiedAt: "Oct 12, 2023",
      },
      {
        id: "workspace-computer-science-2",
        name: "Computer Science",
        type: "workspace",
        modifiedAt: "Oct 12, 2023",
      },
      {
        id: "workspace-literature-review",
        name: "Literature Review",
        type: "workspace",
        modifiedAt: "Oct 12, 2023",
      },
    ],
  },
};

export function getRootDirectoryPageData() {
  return rootDirectory;
}

export function getDirectoryPageData(directoryId: string) {
  return directoryPages[directoryId];
}
