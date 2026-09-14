import { FolderPlus } from "lucide-react";
import { Button, type ButtonProps } from "@/src/shared/ui/button";

export type NewFolderButtonProps = Omit<ButtonProps, "children" | "variant">;

export function NewFolderButton(props: NewFolderButtonProps) {
  return (
    <Button {...props} variant="secondary">
      <FolderPlus className="h-4 w-4" aria-hidden="true" />
      New Folder
    </Button>
  );
}
