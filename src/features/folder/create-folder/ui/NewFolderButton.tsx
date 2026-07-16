import { Button, type ButtonProps } from "@/src/shared/ui/button";

export type NewFolderButtonProps = Omit<ButtonProps, "children" | "variant">;

export function NewFolderButton(props: NewFolderButtonProps) {
  return (
    <Button {...props} variant="secondary">
      <span
        className="h-3.5 w-4 rounded-sm border-2 border-current"
        aria-hidden="true"
      />
      New Folder
    </Button>
  );
}
