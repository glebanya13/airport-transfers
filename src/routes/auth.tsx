import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Staff sign in — BRAND NAME" }, { name: "description", content: "Sign in to the admin panel." }, { property: "og:title", content: "Staff sign in" }, { property: "og:description", content: "Admin panel sign in." }, { name: "robots", content: "noindex" }] }),
  component: AuthPage,
});

function AuthPage() {
  const nav = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setMsg(null);
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return setMsg(error.message);
      nav({ to: "/admin" });
    } else {
      const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin + "/admin" } });
      setMsg(error ? error.message : "Check your email to confirm your account.");
    }
  }
  const input = "mt-1 w-full rounded-xl border bg-background px-3 py-2.5";
  return (
    <div className="grid min-h-screen place-items-center bg-secondary px-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-2xl bg-card p-8 shadow-float">
        <h1 className="text-2xl font-bold">{mode === "in" ? "Staff sign in" : "Create staff account"}</h1>
        <label className="block text-sm font-medium">Email<input required type="email" className={input} value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        <label className="block text-sm font-medium">Password<input required type="password" minLength={8} className={input} value={password} onChange={(e) => setPassword(e.target.value)} /></label>
        {msg && <p className="text-sm text-muted-foreground">{msg}</p>}
        <button className="w-full rounded-xl bg-primary py-3 font-semibold text-primary-foreground">{mode === "in" ? "Sign in" : "Sign up"}</button>
        <button type="button" onClick={() => setMode(mode === "in" ? "up" : "in")} className="w-full text-sm text-primary">{mode === "in" ? "Need an account? Sign up" : "Have an account? Sign in"}</button>
      </form>
    </div>
  );
}
