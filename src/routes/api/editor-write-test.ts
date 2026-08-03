import { createFileRoute } from "@tanstack/react-router";
import { writeFile } from "node:fs/promises";
import path from "node:path";

export const Route = createFileRoute("/api/editor-write-test")({
  server: {
    handlers: {
      POST: async () => {
        const timestamp = new Date().toISOString();
        const target = path.resolve(process.cwd(), "public/editor-data-smoketest.json");
        const payload = {
          "page-index__footer-copyright-smoketest": {
            text: `SMOKE TEST OK — write path works, written at ${timestamp}`,
          },
        };

        try {
          await writeFile(target, JSON.stringify(payload, null, 2) + "\n", "utf8");
          return Response.json({ ok: true, path: target, timestamp });
        } catch (error) {
          return Response.json(
            { ok: false, error: error instanceof Error ? error.message : String(error) },
            { status: 500 },
          );
        }
      },
    },
  },
});