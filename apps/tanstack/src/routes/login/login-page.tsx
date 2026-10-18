/**
 * HUB by Raisen — Pagina de Login (componente principal).
 */
import { useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { login, registerUser } from "@/lib/auth";
import { mapLoginError, mapSignupError } from "@/lib/auth-error-map";
import { type Mode } from "./login-utils";
import { LoginForm } from "./login-form";

export function LoginPage() {
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
    if (r.ok) {
      // M-1: signup -> wizard de tenant; login -> inbox.
      void navigate({ to: mode === "register" ? "/onboarding/tenant" : "/inbox" });
      return;
    }
    // M-4: error diferenciado segun el modo.
    setError(mode === "register" ? mapSignupError(r.message) : mapLoginError(r.message));
  }

  return (
    <div className="login-wrap" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <LoginForm
        mode={mode} setMode={setMode}
        email={email} setEmail={setEmail}
        password={password} setPassword={setPassword}
        fullName={fullName} setFullName={setFullName}
        error={error} loading={loading}
        onSubmit={onSubmit}
      />
      <footer className="login-footer">HUB by Raisen</footer>
    </div>
  );
}