/**
 * HUB by Raisen — Formulario de creacion de plantilla WhatsApp (Slide 4.9).
 * C4 <=75. Envia crearTemplate y refetches la lista.
 */
import { useState } from "react";
import { t } from "@/lib/i18n";
import type { Idioma } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { crearTemplate } from "@/lib/templates-client/functions";
import type { TemplateError } from "@/lib/templates-client/types";

export function TemplateCreateForm({ language, onCreated }: {
  language: Idioma;
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [lang, setLang] = useState("es");
  const [category, setCategory] = useState("utility");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<TemplateError | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.SubmitEvent): Promise<void> {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    if (!/^[a-z_]+$/.test(name)) return;
    setLoading(true);
    const r = await crearTemplate({ name, language: lang, category, body });
    setLoading(false);
    if (!r.ok) { setError(r.error); return; }
    setSuccess(true);
    setName(""); setBody("");
    onCreated();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <h3 className="text-sm font-bold">{t(language, "templates.create.title")}</h3>
      <input type="text" value={name} onInput={(e) => setName(e.currentTarget.value)}
        placeholder={t(language, "templates.create.name")} pattern="[a-z_]+"
        className="rounded-xl glass-card px-3 py-2 text-sm w-full"
        title={t(language, "templates.create.nameHint")} required />
      <input type="text" value={lang} onInput={(e) => setLang(e.currentTarget.value)}
        placeholder={t(language, "templates.create.language")}
        className="rounded-xl glass-card px-3 py-2 text-sm w-full" required />
      <select value={category} onChange={(e) => setCategory(e.currentTarget.value)}
        className="rounded-xl glass-card px-3 py-2 text-sm w-full">
        <option value="utility">{t(language, "templates.create.category.utility")}</option>
        <option value="marketing">{t(language, "templates.create.category.marketing")}</option>
        <option value="authentication">{t(language, "templates.create.category.authentication")}</option>
      </select>
      <textarea value={body} onInput={(e) => setBody(e.currentTarget.value)}
        placeholder={t(language, "templates.create.body")}
        className="rounded-xl glass-card px-3 py-2 text-sm w-full" rows={4} required />
      <Button variant="primary" size="sm" loading={loading}>
        {t(language, "templates.create.submit")}
      </Button>
      {error ? <p className="text-xs text-critical">{
        error.kind === "validation" ? t(language, "templates.create.error") + (error.cause ? ": " + error.cause : "") : t(language, "templates.create.error")
      }</p> : null}
      {success ? <p className="text-xs text-success">{t(language, "templates.create.success")}</p> : null}
    </form>
  );
}