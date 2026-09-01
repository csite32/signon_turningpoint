import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type CSSProperties } from "react";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/login")({
  head: () => ({
    meta: [
      { title: "כניסת מנהל — נקודת מפנה" },
      { name: "description", content: "כניסה לאזור הניהול של אתר נקודת מפנה." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "כניסת מנהל — נקודת מפנה" },
      { property: "og:description", content: "כניסה לאזור הניהול של אתר נקודת מפנה." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminLoginPage,
});

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#f5f5f5",
  direction: "rtl",
  fontFamily: "system-ui, -apple-system, 'Segoe UI', Arial, sans-serif",
  padding: "16px",
};

const cardStyle: CSSProperties = {
  width: "100%",
  maxWidth: "360px",
  background: "#fff",
  border: "1px solid #e2e2e2",
  borderRadius: "10px",
  boxShadow: "0 6px 24px rgba(0,0,0,0.08)",
  padding: "24px",
  fontSize: "14px",
  color: "#1a1a1a",
};

const inputStyle: CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "8px 10px",
  marginTop: "6px",
  border: "1px solid #d4d4d4",
  borderRadius: "6px",
  fontSize: "14px",
  fontFamily: "inherit",
  direction: "ltr",
  textAlign: "left",
};

const buttonStyle: CSSProperties = {
  width: "100%",
  marginTop: "16px",
  padding: "9px 12px",
  border: "none",
  borderRadius: "6px",
  background: "#E14E50",
  color: "#fff",
  fontSize: "14px",
  fontFamily: "inherit",
  cursor: "pointer",
};

const eyeToggleStyle: CSSProperties = {
  position: "absolute",
  top: 0,
  bottom: 0,
  right: "6px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "0 4px",
  background: "none",
  border: "none",
  cursor: "pointer",
  color: "#8a8a8a",
  lineHeight: 0,
};

/**
 * Where a signed-in user lands: `admin` → /admin (the hub with the visual
 * editor); `editor` → straight to the dashboard's projects screen, since
 * /admin itself is admin-only.
 */
async function destinationForSession(): Promise<"/admin" | "/admin/dashboard/projects"> {
  const { data } = await supabase.auth.getSession();
  if (!data.session) return "/admin";
  const { data: roleRow } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", data.session.user.id)
    .maybeSingle();
  return roleRow?.role === "editor" ? "/admin/dashboard/projects" : "/admin";
}

function AdminLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getSession().then(async ({ data }) => {
      if (cancelled || !data.session) return;
      navigate({ to: await destinationForSession(), replace: true });
    });
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setBusy(false);
      setError(signInError.message);
      return;
    }
    const dest = await destinationForSession();
    setBusy(false);
    navigate({ to: dest, replace: true });
  }

  return (
    <div style={pageStyle}>
      <form style={cardStyle} onSubmit={handleSubmit}>
        <h1 style={{ margin: "0 0 16px", fontSize: "18px", fontWeight: 600 }}>כניסת מנהל</h1>
        <label style={{ display: "block", marginBottom: "12px" }}>
          אימייל
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
            autoComplete="email"
            required
          />
        </label>
        <label style={{ display: "block" }}>
          סיסמה
          <div style={{ position: "relative", marginTop: "6px" }}>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ ...inputStyle, marginTop: 0, paddingRight: "38px" }}
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "הסתרת סיסמה" : "הצגת סיסמה"}
              style={eyeToggleStyle}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </label>
        {error && <p style={{ margin: "12px 0 0", color: "#c02626", fontSize: "13px" }}>{error}</p>}
        <button type="submit" style={buttonStyle} disabled={busy}>
          {busy ? "מתחברת..." : "התחברות"}
        </button>
      </form>
    </div>
  );
}
