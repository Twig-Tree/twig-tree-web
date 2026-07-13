"use client";

import {
  GoogleOAuthProvider as ReactGoogleOAuthProvider,
} from "@react-oauth/google";
import type { ReactNode } from "react";

interface GoogleOAuthProviderProps {
  children: ReactNode;
  clientId: string;
}

export const GoogleOAuthProvider = ({
  children,
  clientId,
}: GoogleOAuthProviderProps) => {
  return (
    <ReactGoogleOAuthProvider clientId={clientId}>
      {children}
    </ReactGoogleOAuthProvider>
  );
};
