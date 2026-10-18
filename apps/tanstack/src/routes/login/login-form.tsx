/**
 * HUB by Raisen — Formulario de login/registro.
 */
import type { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type Mode, LockIcon } from "./login-utils";

export function LoginForm({
  mode, setMode, email, setEmail, password, setPassword,
  fullName, setFullName, error, loading, onSubmit,
}: {
  mode: Mode; setMode: (m: Mode) => void;
  email: string; setEmail: (v: string) => void;
  password: string; setPassword: (v: string) => void;
  fullName: string; setFullName: (v: string) => void;
  error: string; loading: boolean;
  onSubmit: (e: FormEvent) => void;
}) {
  return (
    <form className="glass-card login-card--premium" onSubmit={onSubmit} noValidate>
      <div className="login-brand">
        <LockIcon />
        <div>
          <h1 className="login-title">
            HUB <small>by Raisen</small>
          </h1>
          <p className="login-sub">Comunicación omnicanal</p>
        </div>
      </div>

      <p className="login-intro">Accede a tu tenant para gestionar conversaciones, cotizaciones y canales.</p>

      <div className="login-tabs" role="tablist">
        <button
          type="button"
          className={mode === "login" ? "login-tab is-active" : "login-tab"}
          onClick={() => setMode("login")}
        >
          Entrar
        </button>
        <button
          type="button"
          className={mode === "register" ? "login-tab is-active" : "login-tab"}
          onClick={() => setMode("register")}
        >
          Registrarse
        </button>
      </div>

      <Input name="email" label="Email" type="email" placeholder="tucorreo@empresa.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
      {mode === "register" ? (
        <Input name="fullName" label="Nombre" placeholder="Tu nombre" value={fullName} onChange={(e) => setFullName(e.target.value)} />
      ) : null}
      <Input name="password" label="Contraseña" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
      {error ? <p className="text-sm text-critical" role="alert">{error}</p> : null}

      <Button type="submit" variant="primary" loading={loading} className="w-full login-submit">
        {mode === "login" ? "Entrar" : "Crear cuenta"}
      </Button>

      <p className="login-hint">Con el correo y la contraseña del tenant.</p>
    </form>
  );
}