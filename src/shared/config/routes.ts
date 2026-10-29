export const routes = {
  login: "/login",
  dashboard: "/dashboard",
  directoryRoot: "/directory",
  directory: (folderId: string) => `/directory/${folderId}`,
  recent: "/recent",
  workspace: (workspaceId: string) => `/workspace/${workspaceId}`,
  learningPath: (workspaceId: string) =>
    `/workspace/${workspaceId}/learning-path`,
  flashcards: (workspaceId: string) => `/workspace/${workspaceId}/flashcards`,
  learningPathPalette: "/prototype/learning-path-palette",
} as const;
