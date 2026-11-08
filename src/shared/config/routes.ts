export const routes = {
  login: "/login",
  dashboard: "/dashboard",
  directoryRoot: "/directory",
  directory: (folderId: string) => `/directory/${folderId}`,
  recent: "/recent",
  settings: "/settings",
  workspace: (workspaceId: string) => `/workspace/${workspaceId}`,
} as const;
