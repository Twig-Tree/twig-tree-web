export type AuthMode = "required" | "optional";

export function resolveAuthMode(value: string | undefined): AuthMode {
  return value === "required" ? "required" : "optional";
}

export const authMode = resolveAuthMode(
  process.env.NEXT_PUBLIC_AUTH_MODE?.trim(),
);

export const isAuthRequired = authMode === "required";
