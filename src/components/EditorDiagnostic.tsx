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

      const trigger = document.querySelector('[aria-label="פתיחת עורך"]') as HTMLElement | null;
      const geo: Info = {
        "trig.style": "n/a",
        "trig.rect": "n/a",
        "trig.inViewport": "n/a",
        "trig.topmostAtCenter": "n/a",
        "trig.clippingAncestors": "n/a",
      };
      if (trigger) {
        const cs = getComputedStyle(trigger);
        geo["trig.style"] = [
          `display=${cs.display}`,
          `visibility=${cs.visibility}`,
          `opacity=${cs.opacity}`,
          `position=${cs.position}`,
          `top=${cs.top}`,
          `right=${cs.right}`,
          `bottom=${cs.bottom}`,
          `left=${cs.left}`,
          `w=${cs.width}`,
          `h=${cs.height}`,
          `z=${cs.zIndex}`,
          `transform=${cs.transform}`,
        ].join(" ");

        const r = trigger.getBoundingClientRect();
        geo["trig.rect"] = `top=${Math.round(r.top)} left=${Math.round(r.left)} w=${Math.round(
          r.width,
        )} h=${Math.round(r.height)}`;
        geo["trig.inViewport"] = String(
          r.top >= 0 &&
            r.left >= 0 &&
            r.bottom <= window.innerHeight &&
            r.right <= window.innerWidth &&
            r.width > 0 &&
            r.height > 0,
        );

        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const topmost = document.elementFromPoint(cx, cy) as HTMLElement | null;
        geo["trig.topmostAtCenter"] = topmost
          ? `${topmost.tagName.toLowerCase()}${topmost.id ? "#" + topmost.id : ""}${
              topmost.className && typeof topmost.className === "string"
                ? "." + topmost.className.trim().split(/\s+/).join(".")
                : ""
            }${topmost === trigger ? " (is trigger)" : ""}`
          : "none";

        const clippers: string[] = [];
        let p = trigger.parentElement;
        while (p) {
          const pcs = getComputedStyle(p);
          if (
            pcs.overflow !== "visible" ||
            pcs.overflowX !== "visible" ||
            pcs.overflowY !== "visible"
          ) {
            clippers.push(
              `${p.tagName.toLowerCase()}${p.id ? "#" + p.id : ""}[${pcs.overflow}/${pcs.overflowX}/${pcs.overflowY}]`,
            );
          }
          p = p.parentElement;
        }
        geo["trig.clippingAncestors"] = clippers.length ? clippers.join(" < ") : "none";
      }

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
        ...geo,
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