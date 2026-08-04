import { supabase } from "@/integrations/supabase/client";

export type OverrideScope = "global" | "page";

export async function getOverrides(scope: OverrideScope, scopeKey: string) {
  const { data, error } = await supabase
    .from("editor_overrides")
    .select("*")
    .or(`scope.eq.global,and(scope.eq.page,scope_key.eq.${scopeKey})`);

  if (error) throw error;
  // `scope` is accepted for API symmetry; filtering above always includes globals.
  void scope;
  return data ?? [];
}

export async function upsertOverride(
  elementId: string,
  scope: string,
  scopeKey: string,
  data: object,
) {
  const { data: row, error } = await supabase
    .from("editor_overrides")
    .upsert(
      {
        element_id: elementId,
        scope,
        scope_key: scopeKey,
        data: data as never,
      },
      { onConflict: "element_id" },
    )
    .select()
    .single();

  if (error) throw error;
  return row;
}