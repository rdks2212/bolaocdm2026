import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Trophy, User, Phone, Check, Calendar, Clock, Loader2, Instagram } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import wcBg from "@/assets/wc-bg.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Bolão da Copa do Mundo 2026" },
      { name: "description", content: "Entre no bolão do próximo jogo do Brasil. Faça seu palpite por R$ 20." },
      { property: "og:title", content: "Bolão da Copa do Mundo 2026" },
      { property: "og:description", content: "Entre no bolão do próximo jogo do Brasil. Faça seu palpite por R$ 20." },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700&display=swap" },
    ],
  }),
  component: Index,
});

type Jogo = {
  id: string;
  adversario: string;
  data_hora: string;
  fase: string;
  bandeira: string | null;
};

const schema = z.object({
  nome: z.string().trim().min(2, "Informe seu nome completo").max(100),
  telefone: z.string().trim().min(10, "Telefone inválido").max(20),
  placar_brasil: z.number().int().min(0).max(20),
  placar_adversario: z.number().int().min(0).max(20),
});

function formatPhone(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

async function fetchProximoJogo(): Promise<Jogo | null> {
  const { data, error } = await supabase
    .from("jogos")
    .select("id, adversario, data_hora, fase, bandeira")
    .gte("data_hora", new Date().toISOString())
    .order("data_hora", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data as Jogo | null;
}

function Countdown({ target }: { target: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const diff = Math.max(0, new Date(target).getTime() - now);
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  const Cell = ({ v, l }: { v: number; l: string }) => (
    <div className="flex flex-col items-center rounded-lg bg-background/50 px-3 py-2 min-w-[58px]">
      <span className="font-display text-2xl text-foreground tabular-nums">{String(v).padStart(2, "0")}</span>
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{l}</span>
    </div>
  );
  return (
    <div className="flex justify-center gap-2">
      <Cell v={d} l="dias" /><Cell v={h} l="hrs" /><Cell v={m} l="min" /><Cell v={s} l="seg" />
    </div>
  );
}

function Index() {
  const { data: jogo, isLoading } = useQuery({ queryKey: ["proximo-jogo"], queryFn: fetchProximoJogo });

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [placarBrasil, setPlacarBrasil] = useState("");
  const [placarAdv, setPlacarAdv] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!jogo) return;
    const result = schema.safeParse({
      nome,
      telefone,
      placar_brasil: parseInt(placarBrasil, 10),
      placar_adversario: parseInt(placarAdv, 10),
    });
    if (!result.success) {
      toast.error(result.error.issues[0].message);
      return;
    }
    setLoading(true);
    const palpiteTexto = `Brasil ${result.data.placar_brasil} x ${result.data.placar_adversario} ${jogo.adversario}`;
    const { error } = await supabase.from("palpites").insert({
      nome: result.data.nome,
      telefone: result.data.telefone,
      palpite: palpiteTexto,
      placar_brasil: result.data.placar_brasil,
      placar_adversario: result.data.placar_adversario,
      jogo_id: jogo.id,
      valor: 20,
    });
    setLoading(false);
    if (error) {
      toast.error("Não foi possível registrar. Tente novamente.");
      return;
    }
    setSent(true);
    toast.success("Palpite registrado! Boa sorte 🏆");
  }

  const dataFmt = jogo
    ? new Date(jogo.data_hora).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })
    : "";
  const horaFmt = jogo
    ? new Date(jogo.data_hora).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    : "";

  return (
    <main className="min-h-screen px-4 py-10 sm:py-16">
      <Toaster position="top-center" />
      <div className="mx-auto max-w-xl">
        <header className="mb-8 text-center">
          <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-gold text-gold-foreground shadow-lg shadow-gold/30">
            <Trophy className="h-8 w-8" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold">Copa do Mundo 2026</p>
          <h1 className="mt-2 text-5xl sm:text-6xl font-display text-foreground">Bolão da Copa</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            O próximo jogo da Seleção entra no bolão automaticamente.
          </p>
        </header>

        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-gold" /></div>
        ) : !jogo ? (
          <div className="rounded-2xl border border-border bg-card/80 p-10 text-center">
            <Trophy className="mx-auto h-10 w-10 text-muted-foreground" />
            <h2 className="mt-4 font-display text-2xl">Sem jogos do Brasil agendados</h2>
            <p className="mt-2 text-sm text-muted-foreground">Volte em breve para o próximo bolão.</p>
          </div>
        ) : (
          <>
            {/* Card do próximo jogo */}
            <div className="mb-6 rounded-2xl border border-gold/30 bg-gradient-to-br from-card to-card/40 p-6 shadow-2xl">
              <p className="text-center text-xs uppercase tracking-[0.25em] text-gold">Próximo jogo</p>
              <div className="my-5 flex items-center justify-center gap-5">
                <div className="text-center">
                  <div className="text-5xl">🇧🇷</div>
                  <p className="mt-1 font-display text-xl">Brasil</p>
                </div>
                <span className="font-display text-3xl text-muted-foreground">×</span>
                <div className="text-center">
                  <div className="text-5xl">{jogo.bandeira ?? "🏳️"}</div>
                  <p className="mt-1 font-display text-xl">{jogo.adversario}</p>
                </div>
              </div>
              <div className="mb-4 flex flex-wrap justify-center gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />{dataFmt}</span>
                <span className="inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />{horaFmt}</span>
                <span className="rounded-full bg-gold/15 px-2 py-0.5 text-gold">{jogo.fase}</span>
              </div>
              <Countdown target={jogo.data_hora} />
            </div>

            {/* Formulário do bolão */}
            <div className="rounded-2xl border border-border bg-card/80 backdrop-blur p-6 sm:p-8 shadow-2xl">
              {sent ? (
                <div className="py-10 text-center">
                  <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check className="h-7 w-7" />
                  </div>
                  <h2 className="text-3xl font-display">Você está no bolão!</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Entraremos em contato pelo telefone informado para confirmar o pagamento de R$ 20.
                  </p>
                  <button
                    onClick={() => { setSent(false); setNome(""); setTelefone(""); setPlacarBrasil(""); setPlacarAdv(""); }}
                    className="mt-6 text-sm font-semibold text-gold hover:underline"
                  >
                    Cadastrar outro palpite
                  </button>
                </div>
              ) : (
                <form onSubmit={onSubmit} className="space-y-5">
                  <Field icon={<User className="h-4 w-4" />} label="Nome completo">
                    <input
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      placeholder="Seu nome"
                      className="w-full bg-transparent outline-none placeholder:text-muted-foreground/60"
                      maxLength={100}
                    />
                  </Field>

                  <Field icon={<Phone className="h-4 w-4" />} label="Telefone / WhatsApp">
                    <input
                      value={telefone}
                      onChange={(e) => setTelefone(formatPhone(e.target.value))}
                      placeholder="(11) 99999-9999"
                      inputMode="tel"
                      className="w-full bg-transparent outline-none placeholder:text-muted-foreground/60"
                    />
                  </Field>

                  <div>
                    <span className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      <Trophy className="h-4 w-4" /> Seu palpite do placar
                    </span>
                    <div className="flex items-center gap-3">
                      <ScoreInput label={`Brasil 🇧🇷`} value={placarBrasil} onChange={setPlacarBrasil} />
                      <span className="font-display text-2xl text-muted-foreground">×</span>
                      <ScoreInput label={`${jogo.adversario} ${jogo.bandeira ?? ""}`} value={placarAdv} onChange={setPlacarAdv} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-gold/40 bg-gold/10 px-4 py-3">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-gold">Valor do bolão</p>
                      <p className="font-display text-3xl text-foreground">R$ 20,00</p>
                    </div>
                    <Trophy className="h-8 w-8 text-gold" />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl bg-gold py-4 font-display text-xl tracking-wider text-gold-foreground transition hover:brightness-110 active:scale-[0.99] shadow-lg shadow-gold/20 disabled:opacity-60"
                  >
                    {loading ? "Enviando..." : "Entrar no bolão"}
                  </button>

                  <p className="text-center text-xs text-muted-foreground">
                    Ao entrar, você concorda em pagar R$ 20 para participar.
                  </p>
                </form>
              )}
            </div>
          </>
        )}

        <footer className="mt-8 text-center text-xs text-muted-foreground">
          ⚽ Que vença o melhor palpiteiro
        </footer>
      </div>
    </main>
  );
}

function Field({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {icon}{label}
      </span>
      <div className="rounded-xl border border-border bg-input/60 px-4 py-3 transition focus-within:border-gold focus-within:ring-2 focus-within:ring-gold/30">
        {children}
      </div>
    </label>
  );
}

function ScoreInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex-1">
      <span className="mb-1 block text-center text-xs text-muted-foreground truncate">{label}</span>
      <input
        type="number"
        min={0}
        max={20}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 2))}
        placeholder="0"
        className="w-full rounded-xl border border-border bg-input/60 px-4 py-4 text-center font-display text-4xl outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/30"
      />
    </label>
  );
}
