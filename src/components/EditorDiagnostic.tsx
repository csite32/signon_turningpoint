// TEMPORARY DIAGNOSTIC — remove once the embedded-Lovable-Preview detection issue is resolved
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { isEditorEnvironment } from "@/lib/editor/environment";

type Info = Record<string, string>;

export function EditorDiagnostic() {
  const [info, setInfo] = useState<Info | null>(null);

  useEffect(() => {
    if (import.meta.env.MODE === "production") return;
    let cancelled = false;

    async function collect() {
      let topLocation = "cross-origin (cannot read)";
      try {
        topLocation = window.top?.location.href ?? "unknown";
      } catch {
        topLocation = "cross-origin (cannot read)";
      }
      let session = "none";
      try {
        const { data } = await supabase.auth.getSession();
        session = data.session?.user.email ?? "none";
      } catch {
        session = "none";
      }
      const bundle =
        (document.querySelector('script[type="module"]') as HTMLScriptElement | null)?.src ?? "none";
      if (cancelled) return;
      setInfo({
        inIframe: String(window.self !== window.top),
        hostname: window.location.hostname,
        topLocation,
        MODE: import.meta.env.MODE,
        "isEditorEnvironment()": String(isEditorEnvironment()),
        session,
        loginInDom: String(!!document.querySelector('input[type="email"]')),
        triggerInDom: String(!!document.querySelector('[aria-label="פתיחת עורך"]')),
        bundle,
      });
    }

    collect();
    const t = setInterval(collect, 2000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  if (import.meta.env.MODE === "production" || !info) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "8px",
        left: "8px",
        zIndex: 1000000,
        background: "black",
        color: "#0f0",
        fontFamily: "monospace",
        fontSize: "10px",
        lineHeight: 1.4,
        padding: "6px 8px",
        borderRadius: "4px",
        maxWidth: "360px",
        wordBreak: "break-all",
        pointerEvents: "none",
        direction: "ltr",
        textAlign: "left",
      }}
    >
      {Object.entries(info).map(([k, v]) => (
        <div key={k}>
          {k}: {v}
        </div>
      ))}
    </div>
  );
}