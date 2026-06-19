import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ShieldCheck, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import wcBg from "@/assets/wc-bg.jpg";

export const Route = createFileRoute("/transparencia")({
  head: () => ({
    meta: [
      { title: "Transparência — Bolão da Copa 2026" },
      { name: "description", content: "Veja todos os palpites confirmados no bolão da Copa do Mundo 2026." },
      { property: "og:title", content: "Transparência — Bolão da Copa 2026" },
      { property: "og:description", content: "Lista pública de todos os palpites confirmados." },
    ],
  }),
  component: Transparencia,
  errorComponent: ({ error }) => (
    <div className="min-h-screen flex items-center justify-center p-6 text-white bg-slate-900">
      <p>Erro ao carregar: {error.message}</p>
    </div>
  ),
  notFoundComponent: () => <div className="p-6 text-white">Não encontrado</div>,
});

type PalpitePublico = {
  nome_mascarado: string;
  placar_brasil: number | null;
  placar_adversario: number | null;
  adversario: string | null;
  created_at: string;
};

async function fetchPalpitesPublicos(): Promise<PalpitePublico[]> {
  const { data, error } = await supabase.rpc("get_palpites_publicos");
  if (error) throw error;
  return (data ?? []) as PalpitePublico[];
}

function Transparencia() {
  const { data: palpites, isLoading } = useQuery({
    queryKey: ["palpites-publicos"],
    queryFn: fetchPalpitesPublicos,
    refetchInterval: 15000,
  });

  const total = palpites?.length ?? 0;

  return (
    <div className="relative min-h-screen text-white overflow-hidden">
      <div
        className="fixed inset-0 -z-10 bg-cover bg-center"
        style={{ backgroundImage: `url(${wcBg})` }}
      />
      <div className="fixed inset-0 -z-10 bg-gradient-to-b from-slate-950/85 via-slate-900/80 to-emerald-950/90" />

      <header className="max-w-3xl mx-auto px-4 pt-6 pb-4 flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-white/80 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Link>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs font-semibold">
          <ShieldCheck className="w-3.5 h-3.5" />
          Transparência
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pb-16">
        <div className="text-center mb-6">
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.02em" }}>
            Palpites do Bolão
          </h1>
          <p className="text-white/70 mt-2 text-sm sm:text-base">
            Lista pública de todos os palpites com pagamento confirmado.
          </p>
        </div>

        <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 px-4 py-3 mb-4 flex items-center gap-3">
          <div className="p-2 rounded-full bg-yellow-400/20 border border-yellow-300/30">
            <Users className="w-5 h-5 text-yellow-300" />
          </div>
          <div>
            <div className="text-xs text-white/70">Total de participantes confirmados</div>
            <div className="text-2xl font-bold leading-tight">{total}</div>
          </div>
        </div>

        <div className="rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-white/70">Carregando palpites...</div>
          ) : total === 0 ? (
            <div className="p-8 text-center text-white/70">
              Nenhum palpite confirmado ainda. Seja o primeiro!
            </div>
          ) : (
            <ul className="divide-y divide-white/10">
              {palpites!.map((p, i) => (
                <li key={i} className="flex items-center justify-between px-4 py-3 gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{p.nome_mascarado}</div>
                    <div className="text-xs text-white/60 truncate">
                      {p.adversario ? `Brasil x ${p.adversario}` : "Brasil"} ·{" "}
                      {new Date(p.created_at).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                  <div className="shrink-0 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-400/30 font-bold tabular-nums">
                    <span>{p.placar_brasil ?? "-"}</span>
                    <span className="text-white/50">x</span>
                    <span>{p.placar_adversario ?? "-"}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="text-center text-xs text-white/50 mt-6">
          Nomes parcialmente ocultos para proteger a privacidade dos participantes.
        </p>
      </main>
    </div>
  );
}
