import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export const listarPalpitesAdmin = createServerFn({ method: "POST" })
  .inputValidator((data: { senha: string }) => data)
  .handler(async ({ data }) => {
    const supabase = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
    );
    const { data: rows, error } = await supabase.rpc("admin_listar_palpites", {
      _senha: data.senha,
    });
    if (error) throw new Error("Senha incorreta");
    return rows ?? [];
  });
