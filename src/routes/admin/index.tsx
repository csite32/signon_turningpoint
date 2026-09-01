import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, type CSSProperties } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAdminAccess } from "@/hooks/use-admin-access";
import { enableEditMode, disableEditMode } from "@/lib/editor/edit-mode";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "לוח בקרה — נקודת מפנה" },
      { name: "description", content: "לוח הבקרה לניהול התכנים של אתר נקודת מפנה." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "לוח בקרה — נקודת מפנה" },
      { property: "og:description", content: "לוח הבקרה לניהול התכנים של אתר נקודת מפנה." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminDashboardPage,
});

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  background: "#f5f5f5",
  direction: "rtl",
  fontFamily: "system-ui, -apple-system, 'Segoe UI', Arial, sans-serif",
  padding: "32px 16px",
  color: "#1a1a1a",
  fontSize: "14px",
};

const cardStyle: CSSProperties = {
  maxWidth: "720px",
  margin: "0 auto",
  background: "#fff",
  border: "1px solid #e2e2e2",
  borderRadius: "10px",
  boxShadow: "0 6px 24px rgba(0,0,0,0.08)",
  padding: "24px",
};

const buttonStyle: CSSProperties = {
  padding: "8px 14px",
  border: "1px solid #d4d4d4",
  borderRadius: "6px",
  background: "#fff",
  color: "#1a1a1a",
  fontSize: "14px",
  fontFamily: "inherit",
  cursor: "pointer",
};

const primaryButtonStyle: CSSProperties = {
  ...buttonStyle,
  border: "none",
  background: "#E14E50",
  color: "#fff",
  textDecoration: "none",
  display: "inline-block",
};

function AdminDashboardPage() {
  const state = useAdminAccess();
  const navigate = useNavigate();

  useEffect(() => {
    if (state.status === "unauthenticated") {
      navigate({ to: "/admin/login", replace: true });
    }
  }, [state.status, navigate]);

  async function handleSignOut() {
    disableEditMode();
    await supabase.auth.signOut();
    navigate({ to: "/admin/login", replace: true });
  }

  function handleEditSite() {
    enableEditMode();
    navigate({ to: "/" });
  }

  if (state.status === "loading" || state.status === "unauthenticated") {
    return (
      <div style={pageStyle}>
        <div style={cardStyle}>טוען...</div>
      </div>
    );
  }

  if (state.status === "forbidden") {
    return (
      <div style={pageStyle}>
        <div style={cardStyle}>
          <h1 style={{ margin: "0 0 12px", fontSize: "18px", fontWeight: 600 }}>אין הרשאה</h1>
          <p style={{ margin: "0 0 16px" }}>
            המשתמש {state.email} אינו בעל הרשאת ניהול.
          </p>
          <button type="button" style={buttonStyle} onClick={handleSignOut}>
            התנתקות
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <h1 style={{ margin: "0 0 8px", fontSize: "20px", fontWeight: 600 }}>לוח בקרה</h1>
        <p style={{ margin: "0 0 20px", color: "#555" }}>מחוברת כ-{state.email}</p>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button type="button" onClick={handleEditSite} style={primaryButtonStyle}>
            עריכת האתר
          </button>
          <button type="button" style={buttonStyle} onClick={handleSignOut}>
            התנתקות
          </button>
        </div>
        <div style={{ marginTop: "24px" }}>
          <Link to="/admin/dashboard" style={primaryButtonStyle}>
            לוח בקרה — ניהול פרויקטים ומשתמשים
          </Link>
        </div>
      </div>
    </div>
  );
}
