import { Logo } from "@/src/shared/ui/logo";
import { GoogleLoginButton } from "@/src/features/auth/google-login";

export default function LoginPage() {
  return (
    <section className="w-full max-w-md rounded-card border border-line bg-surface px-8 py-10 text-center shadow-card">
      <Logo alt="" isEager className="mx-auto mb-3 h-20" />
      <h1 className="text-2xl font-semibold tracking-tight text-content">
        로그인
      </h1>
      <p className="mt-3 text-sm leading-6 text-content-secondary">
        Google 계정으로 로그인하여 트리와 메모를 관리하세요.
      </p>

      <div className="mt-8">
        <GoogleLoginButton />
      </div>
    </section>
  );
}
