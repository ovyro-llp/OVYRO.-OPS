"use client";

import { FormEvent, useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
      const result = await response.json();
      if (!response.ok) { setError(result.error ?? "Unable to sign in."); return; }
      window.location.assign("/");
    } catch {
      setError("Could not connect. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return <main className="login-shell"><section className="login-card"><div className="login-brand"><div className="brand-mark">O<span>.</span></div><div><strong>ovyro</strong><small>GROWTH OPERATIONS</small></div></div><div className="eyebrow">INTERNAL WORKSPACE</div><h1>Sign in to OVYRO</h1><p className="login-description">Use your workspace administrator credentials to continue.</p><form onSubmit={submit}><label className="field-label">Email address<input type="email" autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)} required autoFocus/></label><label className="field-label">Password<input type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} required/></label>{error && <p className="login-error" role="alert">{error}</p>}<button className="button button-dark login-submit" type="submit" disabled={loading}>{loading?"Signing in…":"Sign in"}</button></form><small className="login-footnote">Admin credentials are validated on the server. The password is never sent to the browser as configuration.</small></section></main>;
}
