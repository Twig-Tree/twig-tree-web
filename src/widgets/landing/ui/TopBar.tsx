import Link from "next/link";
import { routes } from "@/src/shared/config/routes";
import { SiteHeader } from "@/src/shared/ui/site-header";
import { FOCUS_RING_CLASS } from "./styles";

export function TopBar() {
  return (
    <SiteHeader
      homeHref="#top"
      homeLabel="Twig Tree 홈"
      tone="fixed"
      actions={
        <Link
          href={routes.login}
          className={`rounded-landing-button bg-landing-brand px-4 py-2 text-[15px] font-semibold text-landing-on-brand hover:bg-landing-brand-strong ${FOCUS_RING_CLASS}`}
        >
          로그인
        </Link>
      }
    />
  );
}
