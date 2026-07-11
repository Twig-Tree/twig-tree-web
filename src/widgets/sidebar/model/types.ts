export type SidebarItem = {
  label: string; // 사이드바 아이템 이름
  href: string; // 아이템 클릭 시 이동할 경로
  activePrefix?: string; // 이 경로로 시작하는 하위 경로에서도 아이템을 활성화
};
