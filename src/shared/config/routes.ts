export const routes = {
  login: "/login",
  dashboard: "/dashboard",
  directory: "/directory",
  recent: "/recent",
  workspaceDefault: "/workspace/default",
  workspaceRoot: "/workspace",
  workspace: (treeId: string) => `/workspace/${treeId}`,
} as const;
