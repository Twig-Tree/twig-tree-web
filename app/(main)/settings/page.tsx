import { ThemeSelector } from "@/src/features/theme/select-theme";
import { SettingsSection } from "@/src/widgets/settings";

const PREPARING_MESSAGE = "준비 중입니다.";

export default function SettingsPage() {
  return (
    <div className="h-full overflow-y-auto bg-surface-muted/70 px-6 py-8 lg:px-8">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
        <h1 className="text-3xl font-bold tracking-tight text-content">설정</h1>

        <SettingsSection
          title="화면"
          description="이 기기에서 쓸 화면 모습을 고릅니다."
        >
          <ThemeSelector />
        </SettingsSection>

        <SettingsSection
          title="연출"
          description="강의 애니메이션을 어떻게 보여 줄지 고릅니다."
        >
          <p className="text-sm text-content-muted">{PREPARING_MESSAGE}</p>
        </SettingsSection>

        <SettingsSection
          title="음성"
          description="강의를 읽어 주는 음성을 고릅니다."
        >
          <p className="text-sm text-content-muted">{PREPARING_MESSAGE}</p>
        </SettingsSection>
      </div>
    </div>
  );
}
