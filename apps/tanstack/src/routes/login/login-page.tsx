/**
 * HUB by Raisen — Pagina de Login (componente principal).
 */
import { useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { login, registerUser } from "@/lib/auth";
import { type Mode, errorText } from "./login-utils";
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
    setError(errorText(r));
    if (r.ok) void navigate({ to: "/inbox" });
  }

  return (
    <div className="login-wrap">
      <LoginForm
        mode={mode} setMode={setMode}
        email={email} setEmail={setEmail}
        password={password} setPassword={setPassword}
        fullName={fullName} setFullName={setFullName}
        error={error} loading={loading}
        onSubmit={onSubmit}
      />
      <footer className="login-footer">FORTRESS. by Raisen</footer>
    </div>
  );
}