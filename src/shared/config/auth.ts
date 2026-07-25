export type AuthMode = "required" | "optional";

export function resolveAuthMode(value: string | undefined): AuthMode {
  if (value === "optional") {
    return "optional";
  }

  if (value === "required") {
    return "required";
  }

  throw new Error("NEXT_PUBLIC_AUTH_MODE must be 'required' or 'optional'.");
}

export const authMode = resolveAuthMode(
  process.env.NEXT_PUBLIC_AUTH_MODE?.trim(),
);

export const isAuthRequired = authMode === "required";
