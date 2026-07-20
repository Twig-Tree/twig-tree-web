export const routes = {
  login: "/login",
  dashboard: "/dashboard",
  directoryRoot: "/directory",
  directory: (folderId: string) => `/directory/${folderId}`,
  recent: "/recent",
  workspaceDefault: "/workspace/default",
  workspaceRoot: "/workspace",
  workspace: (treeId: string) => `/workspace/${treeId}`,
} as const;
