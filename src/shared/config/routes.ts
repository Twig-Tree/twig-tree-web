export const routes = {
  login: "/login",
  dashboard: "/dashboard",
  directoryDefault: "/directory",
  directory: (directoryId: string) => `/directory/${directoryId}`,
  recent: "/recent",
  workspaceDefault: "/workspace/default",
  workspaceRoot: "/workspace",
  workspace: (treeId: string) => `/workspace/${treeId}`,
} as const;
