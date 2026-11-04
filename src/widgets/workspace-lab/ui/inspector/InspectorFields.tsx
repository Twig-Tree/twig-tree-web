import type { ReactNode } from "react";

export function SelectField<T extends string>({
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
    <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-600">
      {label}
      <select
        value={value}
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

export function FieldDescription({ children }: { children: ReactNode }) {
  return <p className="text-[11px] leading-4 text-slate-500">{children}</p>;
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
