"use client";

import { useGoogleLoginMutation } from "@/src/entities/auth";
import { routes } from "@/src/shared/config/routes";
import { authSession } from "@/src/shared/lib/auth/authSession";
import { GoogleLogin } from "@react-oauth/google";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getGoogleLoginErrorMessage } from "../lib/getGoogleLoginErrorMessage";
import { useExistingSessionCheck } from "../model/useExistingSessionCheck";

export const GoogleLoginButton = () => {
  const router = useRouter();
  const [googleLoginError, setGoogleLoginError] = useState(false);
  const googleLoginMutation = useGoogleLoginMutation();
  const sessionCheckStatus = useExistingSessionCheck();

  /*
  기존 세션을 확인하는 동안에는 버튼을 감추고 같은 크기의 자리만 남긴다.
  세션이 있는 사용자에게 버튼이 잠깐 보였다 사라지는 깜빡임과 레이아웃 흔들림을 막는다.
  */
  if (sessionCheckStatus === "checking") {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-80" role="status">
          <span className="sr-only">로그인 상태를 확인하고 있습니다.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {sessionCheckStatus === "failed" && (
        <p
          className="w-full rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800"
          role="status"
        >
          로그인 상태를 확인하지 못했습니다. 다시 로그인해 주세요.
        </p>
      )}

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
            onSuccess: ({ accessToken }) => {
              authSession.setTokens({ accessToken });
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
          로그인하고 있습니다.
        </p>
      )}

      {googleLoginError && (
        <p className="text-sm text-red-600" role="alert">
          Google 인증에 실패했습니다. 다시 시도해 주세요.
        </p>
      )}

      {/* Google 인증은 성공했지만 백엔드 로그인 요청이 실패한 경우 */}
      {googleLoginMutation.isError && !googleLoginError && (
        <p className="text-sm text-red-600" role="alert">
          {getGoogleLoginErrorMessage(googleLoginMutation.error)}
        </p>
      )}
    </div>
  );
};
