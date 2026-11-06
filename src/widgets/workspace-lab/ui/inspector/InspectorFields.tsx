import { useId, type ReactNode } from "react";

type SelectFieldProps<T extends string> = {
  label: string;
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
  description?: ReactNode; // 현재 선택값의 설명
  describedBy?: string; // 여러 필드가 함께 쓰는 바깥 설명의 id
};

/*
함수 이름 : SelectField
기능 : 라벨이 붙은 select를 그린다. 설명이 있으면 select 아래에 두고 aria-describedby로 연결한다.
인자 : SelectFieldProps
반환값 : 선택 필드
*/
export function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
  description,
  describedBy,
}: SelectFieldProps<T>) {
  const descriptionId = useId();

  /*
  설명은 label 바깥에 둔다. label 안에 두면 설명 문장까지 필드 이름으로 읽힌다.
  */
  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-600">
        {label}
        <select
          value={value}
          aria-describedby={
            description !== undefined ? descriptionId : describedBy
          }
          onChange={(event) => onChange(event.target.value as T)}
          className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      {description !== undefined ? (
        <FieldDescription id={descriptionId}>{description}</FieldDescription>
      ) : null}
    </div>
  );
}

export function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 py-1 text-sm text-slate-700">
      {label}
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="size-4 accent-indigo-600"
      />
    </label>
  );
}

export type SwatchOption<T extends string> = {
  value: T;
  label: string;
  swatches: readonly string[]; // 버튼 안에 겹쳐 그릴 대표 색
};

export function SwatchField<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: Array<SwatchOption<T>>;
  onChange: (value: T) => void;
}) {
  const selected = options.find((option) => option.value === value);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-xs font-medium text-slate-600">
        <span>{label}</span>
        <span className="text-[11px] font-normal text-slate-400">
          {selected?.label}
        </span>
      </div>
      <div
        role="radiogroup"
        aria-label={label}
        className="flex flex-wrap gap-1.5"
      >
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={option.value === value}
            aria-label={option.label}
            title={option.label}
            onClick={() => onChange(option.value)}
            className="flex h-8 min-w-8 items-center justify-center rounded-lg border border-slate-200 bg-white px-1.5 transition-colors hover:border-indigo-300 aria-checked:border-indigo-500 aria-checked:ring-2 aria-checked:ring-indigo-100"
          >
            <span className="flex -space-x-1.5">
              {option.swatches.map((color, index) => (
                <span
                  key={`${color}-${index}`}
                  className="size-4 rounded-full border border-black/10"
                  style={{ backgroundColor: color }}
                />
              ))}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function SegmentedField<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5 text-xs font-medium text-slate-600">
      {label}
      <div
        role="radiogroup"
        aria-label={label}
        className="grid rounded-lg border border-slate-200 bg-slate-50 p-0.5"
        style={{
          gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))`,
        }}
      >
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={option.value === value}
            onClick={() => onChange(option.value)}
            className="h-7 rounded-md text-[11px] text-slate-500 transition-colors hover:text-slate-900 aria-checked:bg-white aria-checked:font-semibold aria-checked:text-indigo-600 aria-checked:shadow-sm"
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function InspectorSection({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode; // 제목 오른쪽에 둘 보조 동작
  children: ReactNode;
}) {
  const heading = (
    <h3 className="text-xs font-semibold tracking-wide text-slate-400 uppercase">
      {title}
    </h3>
  );

  /*
  탭 안의 첫 구획은 위 구분선을 그리지 않는다.
  */
  return (
    <section className="space-y-3 border-t border-slate-100 pt-5 first:border-t-0 first:pt-0">
      {action ? (
        <div className="flex items-center justify-between">
          {heading}
          {action}
        </div>
      ) : (
        heading
      )}
      {children}
    </section>
  );
}

/*
함수 이름 : ModifiedResetButton
기능 : 기준값에서 벗어났음을 알리고, 누르면 기준값으로 되돌리는 배지 버튼을 그린다.
인자 : (() => void) onReset -> 기준값으로 되돌리는 동작
반환값 : 수정됨 배지 버튼
*/
export function ModifiedResetButton({ onReset }: { onReset: () => void }) {
  return (
    <button
      type="button"
      onClick={onReset}
      className="flex shrink-0 items-center gap-1.5 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 hover:bg-amber-100"
    >
      <span className="size-1.5 rounded-full bg-amber-500" />
      수정됨 · 초기화
    </button>
  );
}

export function FieldDescription({
  id,
  children,
}: {
  id?: string; // 필드가 aria-describedby로 가리킬 id
  children: ReactNode;
}) {
  return (
    <p id={id} className="text-[11px] leading-4 text-slate-500">
      {children}
    </p>
  );
}

export function DisclosureButton({
  label,
  isOpen,
  controls,
  onToggle,
}: {
  label: string;
  isOpen: boolean;
  controls: string; // 펼쳐지는 영역의 id
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      aria-expanded={isOpen}
      aria-controls={controls}
      onClick={onToggle}
      className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-left text-xs font-medium text-slate-700 transition-colors hover:border-indigo-200 hover:bg-indigo-50"
    >
      <span>{label}</span>
      <span aria-hidden="true" className="text-slate-400">
        {isOpen ? "접기 −" : "열기 +"}
      </span>
    </button>
  );
}

export const toSelectOptions = <T extends string>(
  options: ReadonlyArray<{ id: T; name: string }>,
) => options.map((option) => ({ value: option.id, label: option.name }));
