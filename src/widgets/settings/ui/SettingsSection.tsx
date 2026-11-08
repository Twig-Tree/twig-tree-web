import type { ReactNode } from "react";

interface SettingsSectionProps {
  title: string; // 섹션 제목. 화면 낭독기가 섹션 이름으로도 읽는다
  description: string; // 이 섹션에서 정하는 것을 한 줄로 설명하는 문구
  children: ReactNode; // 섹션의 설정 항목
}

/*
함수 이름 : SettingsSection
기능 : 설정 페이지의 한 묶음을 제목, 설명과 함께 카드로 보여 준다.
인자 : SettingsSectionProps
반환값 : 설정 섹션 요소
*/
export function SettingsSection({
  title,
  description,
  children,
}: SettingsSectionProps) {
  return (
    <section
      aria-label={title}
      className="flex flex-col gap-4 rounded-card border border-line-subtle bg-surface p-5 shadow-card"
    >
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-content">{title}</h2>
        <p className="text-sm text-content-muted">{description}</p>
      </div>

      {children}
    </section>
  );
}
