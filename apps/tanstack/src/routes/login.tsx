import { useState, type FormEvent } from "react";
import { createRoute, useNavigate } from "@tanstack/react-router";
import { rootRoute } from "@/app/root";
import { login, registerUser, type AuthResult } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const LoginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
});

type Mode = "login" | "register";

function errorText(r: AuthResult): string {
  return r.ok ? "" : r.message;
}

function LockIcon() {
  return (
    <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/15 text-primary ring-1 ring-primary/25">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    </span>
  );
}

function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Completa email y contraseña");
      return;
    }
    if (mode === "register" && !fullName) {
      setError("Completa tu nombre");
      return;
    }
    setLoading(true);
    const r = mode === "login" ? await login(email, password) : await registerUser(email, password);
    setLoading(false);
    setError(errorText(r));
    if (r.ok) void navigate({ to: "/inbox" });
  }

  return (
    <div className="login-wrap">
      <form className="glass-card login-card--premium" onSubmit={onSubmit} noValidate>
        <div className="login-brand">
          <LockIcon />
          <div>
            <h1 className="login-title">
              HUB <small>by Raisen</small>
            </h1>
            <p className="login-sub">FORTRESS. by Raisen</p>
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
          {mode === "login" ? "Continuar" : "Crear cuenta"}
        </Button>

        <p className="login-hint">Con el correo y la contraseña del tenant.</p>
      </form>
      <footer className="login-footer">FORTRESS. by Raisen</footer>
    </div>
  );
}
