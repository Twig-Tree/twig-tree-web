export const memberQueryKeys = {
  all: ["member"] as const,

  me: () => [...memberQueryKeys.all, "me"] as const,
};
