import {
  getWorkspaceLabDesignTheme,
  getWorkspaceLabDesignThemeSectionChange,
  isWorkspaceLabDesignThemeModified,
  isWorkspaceLabDesignThemeSectionModified,
  workspaceLabDesignThemes,
  type WorkspaceLabDesignThemeSection,
} from "../../model/design-themes";
import {
  FieldDescription,
  ModifiedResetButton,
  toSelectOptions,
} from "./InspectorFields";
import type { InspectorSectionProps } from "./types";

/*
함수 이름 : DesignThemeField
기능 : 스타일 묶음 전체를 한 번에 바꾸는 디자인 테마 선택기를 그린다. 테마 값에서 벗어나면 수정됨 배지로 되돌릴 수 있게 한다.
인자 : InspectorSectionProps
반환값 : 디자인 테마 선택 영역
*/
export function DesignThemeField({ config, onChange }: InspectorSectionProps) {
  const currentTheme = getWorkspaceLabDesignTheme(config.designTheme);
  const isModified = isWorkspaceLabDesignThemeModified(config);

  /*
  select는 같은 값을 다시 골라도 change가 일어나지 않는다.
  그래서 테마 값으로 되돌리는 동작은 수정됨 배지가 맡는다.
  */
  return (
    <div className="mt-3 space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <label
          htmlFor="workspace-lab-design-theme"
          className="text-xs font-medium text-slate-600"
        >
          디자인 테마
        </label>
        {isModified ? (
          <ModifiedResetButton
            onReset={() => onChange({ designTheme: config.designTheme })}
          />
        ) : null}
      </div>
      <select
        id="workspace-lab-design-theme"
        value={config.designTheme}
        onChange={(event) =>
          onChange({
            designTheme: event.target.value as typeof config.designTheme,
          })
        }
        className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
      >
        {toSelectOptions(workspaceLabDesignThemes).map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
            {isModified && option.value === config.designTheme
              ? " · 수정됨"
              : ""}
          </option>
        ))}
      </select>
      <FieldDescription>{currentTheme.description}</FieldDescription>
    </div>
  );
}

type DesignThemeSectionResetProps = InspectorSectionProps & {
  section: WorkspaceLabDesignThemeSection; // 테마와 비교할 Inspector 구획
};

/*
함수 이름 : DesignThemeSectionReset
기능 : 구획 값이 현재 디자인 테마에서 벗어났을 때만 수정됨 배지를 그리고, 누르면 그 구획만 테마 값으로 되돌린다.
인자 : DesignThemeSectionResetProps
반환값 : 수정됨 배지 또는 null
*/
export function DesignThemeSectionReset({
  config,
  onChange,
  section,
}: DesignThemeSectionResetProps) {
  if (!isWorkspaceLabDesignThemeSectionModified(config, section)) return null;

  return (
    <ModifiedResetButton
      onReset={() =>
        onChange(getWorkspaceLabDesignThemeSectionChange(config, section))
      }
    />
  );
}
