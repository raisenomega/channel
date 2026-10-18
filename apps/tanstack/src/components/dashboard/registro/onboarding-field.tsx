/**
 * HUB by Raisen — S-2/S-4/S-5/S-6: campo reusable del onboarding (input / tel / textarea / select).
 * Etiqueta arriba + control. readOnly para email (S-3). Sin estado propio (controlado). C4 <=75.
 */
interface Opt { readonly value: string; readonly label: string; }

export function OnbField({ label, value, onChange, kind = "text", readOnly, maxLength, options, placeholder, testId }: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  kind?: "text" | "textarea" | "select" | "tel";
  readOnly?: boolean;
  maxLength?: number;
  options?: readonly Opt[];
  placeholder?: string;
  testId?: string;
}) {
  const cls = "mt-1 w-full rounded-lg border border-border/50 bg-transparent px-3 py-2 text-sm" + (readOnly ? " opacity-60" : "");
  const emit = (v: string) => onChange?.(v);
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {kind === "select" ? (
        <select data-testid={testId} className={cls} value={value} disabled={readOnly} onChange={(e) => emit(e.target.value)}>
          <option value="">{placeholder ?? ""}</option>
          {options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : kind === "textarea" ? (
        <textarea data-testid={testId} className={cls} rows={2} value={value} maxLength={maxLength} readOnly={readOnly}
          placeholder={placeholder} onChange={(e) => emit(e.target.value)} />
      ) : (
        <input data-testid={testId} className={cls} type="text" inputMode={kind === "tel" ? "tel" : undefined} value={value}
          maxLength={maxLength} readOnly={readOnly} placeholder={placeholder} onChange={(e) => emit(e.target.value)} />
      )}
    </label>
  );
}
