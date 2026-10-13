import { routes } from "@/src/shared/config/routes";
import { redirect } from "next/navigation";

/*
특정 워크스페이스 없이 들어오면 열 워크스페이스를 정할 수 없다. 이 주소로 연결하는 메뉴는 없지만
북마크나 직접 입력으로 들어올 수 있으므로, 워크스페이스 카드가 모여 있는 대시보드로 보낸다.
*/
export default function WorkspaceRootPage() {
  redirect(routes.dashboard);
}
