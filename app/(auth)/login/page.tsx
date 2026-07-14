import { GoogleLoginButton } from "@/src/features/auth/google-login/ui/GoogleLoginButton";

export default function LoginPage() {
  return (
    <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white px-8 py-10 text-center shadow-sm">
      <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-lg font-semibold text-white">
        T
      </div>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
        Twig Tree에 로그인
      </h1>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        Google 계정으로 로그인하여 트리와 메모를 관리하세요.
      </p>

      <div className="mt-8">
        <GoogleLoginButton />
      </div>
    </section>
  );
}
