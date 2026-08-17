"use client";

import { useGoogleLoginMutation } from "@/src/entities/auth";
import { routes } from "@/src/shared/config/routes";
import { authSession } from "@/src/shared/lib/auth/authSession";
import { GoogleLogin } from "@react-oauth/google";
import { useRouter } from "next/navigation";
import { useState } from "react";

export const GoogleLoginButton = () => {
  const router = useRouter();
  const [googleLoginError, setGoogleLoginError] = useState(false);
  const googleLoginMutation = useGoogleLoginMutation();

  const errorMessage =
    googleLoginMutation.error instanceof Error
      ? googleLoginMutation.error.message
      : "백엔드 로그인 요청에 실패했습니다.";

  return (
    <div className="flex flex-col items-center gap-4">
      <GoogleLogin
        onSuccess={(credentialResponse) => {
          const idToken = credentialResponse.credential;

          if (!idToken) {
            setGoogleLoginError(true);
            googleLoginMutation.reset();
            return;
          }

          setGoogleLoginError(false);
          googleLoginMutation.mutate(idToken, {
            onSuccess: ({ accessToken, refreshToken }) => {
              authSession.setTokens({ accessToken, refreshToken });
              router.replace(routes.dashboard);
            },
          });
        }}
        onError={() => {
          setGoogleLoginError(true);
          googleLoginMutation.reset();
        }}
        shape="rectangular"
        size="large"
        text="signin_with"
        theme="outline"
        width="320"
      />

      {googleLoginMutation.isPending && (
        <p className="text-sm text-slate-600" role="status">
          백엔드 로그인 API를 확인하고 있습니다.
        </p>
      )}

      {googleLoginMutation.data && (
        <div
          className="w-full rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
          role="status"
        >
          <p className="font-medium">로그인 API 연결에 성공했습니다.</p>
          <p className="mt-1">{googleLoginMutation.data.member.name}</p>
          <p>{googleLoginMutation.data.member.email}</p>
        </div>
      )}

      {googleLoginError && (
        <p className="text-sm text-red-600" role="alert">
          Google 인증에 실패했습니다. 다시 시도해 주세요.
        </p>
      )}

      {/* Google 인증은 성공했지만 백엔드 로그인 API 요청이 실패한 경우 */}
      {googleLoginMutation.isError && !googleLoginError && (
        <p className="text-sm text-red-600" role="alert">
          {errorMessage}
        </p>
      )}
    </div>
  );
};
