import { useId, useState } from "react";
import {
  getWorkspaceLabColorTokens,
  workspaceLabAccentColors,
  workspaceLabChromeColors,
  workspaceLabColorContrasts,
  workspaceLabNeutralTones,
  workspaceLabRootColors,
  workspaceLabStatusColors,
} from "../../model/color-roles";
import {
  getWorkspaceLabColorTheme,
  getWorkspaceLabColorThemePalette,
  workspaceLabColorThemes,
  type WorkspaceLabColorThemeTokens,
} from "../../model/color-themes";
import type { LabColorRoles } from "../../model/types";
import {
  DisclosureButton,
  InspectorSection,
  SegmentedField,
  SelectField,
  SwatchField,
  toSelectOptions,
  type SwatchOption,
} from "./InspectorFields";
import { DesignThemeSectionReset } from "./DesignThemeField";
import type { InspectorSectionProps } from "./types";

/*
테마 기본 선택지는 자체 견본이 없으므로 현재 테마 토큰에서 같은 자리의 색을 꺼내 보여준다.
*/
const getSwatchOptions = <T extends string>(
  options: ReadonlyArray<{
    id: T;
    name: string;
    swatches?: readonly string[];
  }>,
  getThemeSwatches: () => readonly string[],
): Array<SwatchOption<T>> =>
  options.map((option) => ({
    value: option.id,
    label: option.name,
    swatches: option.swatches ?? getThemeSwatches(),
  }));

export function ColorSection({ config, onChange }: InspectorSectionProps) {
  const { colorTheme, colorRoles } = config;
  const [showDetail, setShowDetail] = useState(false);
  const themeDescriptionId = useId(); // 팔레트 카드 안의 컬러 테마 설명
  const currentTheme = getWorkspaceLabColorTheme(colorTheme);
  const baseTokens: WorkspaceLabColorThemeTokens = currentTheme.tokens;
  const tokens = getWorkspaceLabColorTokens(baseTokens, colorRoles);
  const palette = getWorkspaceLabColorThemePalette({ ...currentTheme, tokens });

  const changeRole = <K extends keyof LabColorRoles>(
    role: K,
    value: LabColorRoles[K],
  ) => onChange({ colorRoles: { ...colorRoles, [role]: value } });

  return (
    <InspectorSection
      title="Color"
      action={
        <DesignThemeSectionReset
          config={config}
          onChange={onChange}
          section="color"
        />
      }
    >
      <SelectField
        label="컬러 테마"
        value={colorTheme}
        options={toSelectOptions(workspaceLabColorThemes)}
        onChange={(value) => onChange({ colorTheme: value })}
        describedBy={themeDescriptionId}
      />
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
        <div className="flex items-center gap-2">
          {palette.map((swatch) => (
            <span
              key={swatch.label}
              className="size-6 rounded-full border border-black/10 shadow-sm"
              style={{ backgroundColor: swatch.color }}
              title={swatch.label}
            />
          ))}
        </div>
        <p
          id={themeDescriptionId}
          className="mt-2 text-[11px] leading-4 text-slate-500"
        >
          {currentTheme.description}
        </p>
      </div>

      <SwatchField
        label="중립 톤"
        value={colorRoles.neutral}
        options={getSwatchOptions(workspaceLabNeutralTones, () => [
          baseTokens.canvas,
          baseTokens.surface,
          baseTokens.text,
        ])}
        onChange={(value) => changeRole("neutral", value)}
      />
      <SwatchField
        label="강조색"
        value={colorRoles.accent}
        options={getSwatchOptions(workspaceLabAccentColors, () => [
          baseTokens.accent,
        ])}
        onChange={(value) => changeRole("accent", value)}
      />
      <SelectField
        label="루트 노드"
        value={colorRoles.root}
        options={toSelectOptions(workspaceLabRootColors)}
        onChange={(value) => changeRole("root", value)}
      />
      <SegmentedField
        label="대비"
        value={colorRoles.contrast}
        options={[
          ...toSelectOptions(workspaceLabColorContrasts).filter(
            (option) => option.value === "low",
          ),
          { value: "theme", label: "기본" },
          ...toSelectOptions(workspaceLabColorContrasts).filter(
            (option) => option.value === "high",
          ),
        ]}
        onChange={(value) => changeRole("contrast", value)}
      />

      <DisclosureButton
        label="세부 설정"
        isOpen={showDetail}
        controls="workspace-lab-color-detail"
        onToggle={() => setShowDetail((current) => !current)}
      />

      {showDetail ? (
        <div
          id="workspace-lab-color-detail"
          className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3"
        >
          <SwatchField
            label="상태 색"
            value={colorRoles.status}
            options={getSwatchOptions(workspaceLabStatusColors, () => [
              baseTokens.highlight,
              baseTokens.lecture,
              baseTokens.danger,
            ])}
            onChange={(value) => changeRole("status", value)}
          />
          <SelectField
            label="크롬 (툴바·아바타)"
            value={colorRoles.chrome}
            options={toSelectOptions(workspaceLabChromeColors)}
            onChange={(value) => changeRole("chrome", value)}
          />
        </div>
      ) : null}
    </InspectorSection>
  );
}
