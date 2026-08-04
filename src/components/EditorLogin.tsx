import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function EditorLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUserEmail(data.session?.user.email ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    else setPassword("");
    setBusy(false);
  }

  async function handleSignOut() {
    setBusy(true);
    await supabase.auth.signOut();
    setBusy(false);
  }

  const box: React.CSSProperties = {
    position: "fixed",
    top: "8px",
    left: "8px",
    marginTop: "34px",
    zIndex: 999999,
    background: "black",
    color: "#0f0",
    fontFamily: "monospace",
    fontSize: "11px",
    padding: "6px 10px",
    borderRadius: "4px",
    direction: "ltr",
    display: "flex",
    gap: "6px",
    alignItems: "center",
  };

  if (userEmail) {
    return (
      <div style={box}>
        <span>signed in as {userEmail}</span>
        <button type="button" onClick={handleSignOut} disabled={busy} style={{ fontSize: "11px" }}>
          sign out
        </button>
      </div>
    );
  }

  return (
    <form style={box} onSubmit={handleSignIn}>
      <input
        type="email"
        value={email}
        placeholder="email"
        autoComplete="username"
        onChange={(e) => setEmail(e.target.value)}
        style={{ fontSize: "11px", width: "150px" }}
      />
      <input
        type="password"
        value={password}
        placeholder="password"
        autoComplete="current-password"
        onChange={(e) => setPassword(e.target.value)}
        style={{ fontSize: "11px", width: "120px" }}
      />
      <button type="submit" disabled={busy} style={{ fontSize: "11px" }}>
        sign in
      </button>
      {error && <span style={{ color: "#f66" }}>{error}</span>}
    </form>
  );
}