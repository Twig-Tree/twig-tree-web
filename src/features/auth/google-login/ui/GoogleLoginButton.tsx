"use client";

import { GoogleLogin } from "@react-oauth/google";
import { useState } from "react";

type LoginStatus = "idle" | "success" | "error";

export const GoogleLoginButton = () => {
  const [status, setStatus] = useState<LoginStatus>("idle");

  return (
    <div className="flex flex-col items-center gap-4">
      <GoogleLogin
        onSuccess={(credentialResponse) => {
          setStatus(credentialResponse.credential ? "success" : "error");
        }}
        onError={() => setStatus("error")}
        shape="rectangular"
        size="large"
        text="signin_with"
        theme="outline"
        width="320"
      />

      {status === "success" && (
        <p className="text-sm text-emerald-700" role="status">
          Google 인증 응답을 받았습니다. 백엔드 연동이 필요합니다.
        </p>
      )}

      {status === "error" && (
        <p className="text-sm text-red-600" role="alert">
          Google 로그인에 실패했습니다. 다시 시도해 주세요.
        </p>
      )}
    </div>
  );
};
