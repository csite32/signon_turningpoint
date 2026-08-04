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

  const card: React.CSSProperties = {
    position: "fixed",
    top: "12px",
    right: "12px",
    zIndex: 999998,
    background: "#ffffff",
    color: "#1f2937",
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize: "13px",
    lineHeight: 1.4,
    padding: "12px 14px",
    borderRadius: "10px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 6px 20px rgba(0, 0, 0, 0.12)",
    direction: "rtl",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    minWidth: "220px",
    maxWidth: "280px",
  };

  const heading: React.CSSProperties = {
    fontSize: "14px",
    fontWeight: 600,
    margin: 0,
    color: "#111827",
  };

  const input: React.CSSProperties = {
    fontSize: "13px",
    padding: "6px 8px",
    borderRadius: "6px",
    border: "1px solid #d1d5db",
    direction: "ltr",
    textAlign: "left",
    width: "100%",
    boxSizing: "border-box",
  };

  const button: React.CSSProperties = {
    fontSize: "13px",
    fontWeight: 500,
    padding: "6px 12px",
    borderRadius: "6px",
    border: "none",
    cursor: "pointer",
    background: "#111827",
    color: "#ffffff",
    alignSelf: "flex-start",
  };

  const buttonDisabled: React.CSSProperties = {
    opacity: 0.55,
    cursor: "not-allowed",
  };

  const errorText: React.CSSProperties = {
    color: "#dc2626",
    fontSize: "12px",
    marginTop: "2px",
  };

  if (userEmail) {
    return (
      <div style={card}>
        <p style={heading}>כניסת מנהל</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <span>מחוברת כ-{userEmail}</span>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={busy}
            style={busy ? { ...button, ...buttonDisabled } : button}
          >
            התנתקות
          </button>
        </div>
      </div>
    );
  }

  return (
    <form style={card} onSubmit={handleSignIn}>
      <p style={heading}>כניסת מנהל</p>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <input
          type="email"
          value={email}
          placeholder="אימייל"
          autoComplete="username"
          onChange={(e) => setEmail(e.target.value)}
          style={input}
        />
        <input
          type="password"
          value={password}
          placeholder="סיסמה"
          autoComplete="current-password"
          onChange={(e) => setPassword(e.target.value)}
          style={input}
        />
        <button
          type="submit"
          disabled={busy}
          style={busy ? { ...button, ...buttonDisabled } : button}
        >
          כניסה
        </button>
        {error && <span style={errorText}>{error}</span>}
      </div>
    </form>
  );
}
