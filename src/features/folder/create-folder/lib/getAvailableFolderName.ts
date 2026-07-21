import type { FolderItem } from "@/src/entities/folder";

export const getAvailableFolderName = (folders: FolderItem[]) => {
  const siblingNames = new Set(folders.map(({ name }) => name));

  if (!siblingNames.has("Folder")) {
    return "Folder";
  }

  let suffix = 2;
  while (siblingNames.has(`Folder ${suffix}`)) {
    suffix += 1;
  }

  return `Folder ${suffix}`;
};
