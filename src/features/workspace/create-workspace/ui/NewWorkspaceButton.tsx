import { Plus } from "lucide-react";
import { Button, type ButtonProps } from "@/src/shared/ui/button";

export type NewWorkspaceButtonProps = Omit<ButtonProps, "children" | "variant">;

export function NewWorkspaceButton(props: NewWorkspaceButtonProps) {
  return (
    <Button {...props} variant="primary">
      <Plus className="h-4 w-4" aria-hidden="true" />
      New Workspace
    </Button>
  );
}
