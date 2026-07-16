import { Button, type ButtonProps } from "@/src/shared/ui/button";

export type NewWorkspaceButtonProps = Omit<ButtonProps, "children" | "variant">;

export function NewWorkspaceButton(props: NewWorkspaceButtonProps) {
  return (
    <Button {...props} variant="primary">
      <span
        className="h-3.5 w-3.5 rounded-sm border-2 border-current"
        aria-hidden="true"
      />
      New Workspace
    </Button>
  );
}
