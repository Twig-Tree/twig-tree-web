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
