import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Trophy, User, Phone, FileText, Check } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Bolão da Copa do Mundo 2026" },
      { name: "description", content: "Entre no bolão da Copa do Mundo. Aposte R$ 20 e concorra ao prêmio." },
      { property: "og:title", content: "Bolão da Copa do Mundo 2026" },
      { property: "og:description", content: "Entre no bolão da Copa do Mundo. Aposte R$ 20 e concorra ao prêmio." },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700&display=swap" },
    ],
  }),
  component: Index,
});

const schema = z.object({
  nome: z.string().trim().min(2, "Informe seu nome completo").max(100),
  telefone: z.string().trim().min(10, "Telefone inválido").max(20),
  palpite: z.string().trim().min(3, "Informe seu palpite").max(500),
});

function formatPhone(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function Index() {
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [palpite, setPalpite] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const result = schema.safeParse({ nome, telefone, palpite });
    if (!result.success) {
      toast.error(result.error.issues[0].message);
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("palpites").insert({
      nome: result.data.nome,
      telefone: result.data.telefone,
      palpite: result.data.palpite,
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

  return (
    <main className="min-h-screen px-4 py-10 sm:py-16">
      <Toaster position="top-center" />
      <div className="mx-auto max-w-xl">
        <header className="mb-8 text-center">
          <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-gold text-gold-foreground shadow-lg shadow-gold/30">
            <Trophy className="h-8 w-8" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold">Copa do Mundo 2026</p>
          <h1 className="mt-2 text-5xl sm:text-6xl font-display text-foreground">
            Bolão da Copa
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Faça seu palpite, pague R$ 20 e dispute o prêmio do bolão.
          </p>
        </header>

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
                onClick={() => { setSent(false); setNome(""); setTelefone(""); setPalpite(""); }}
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

              <Field icon={<FileText className="h-4 w-4" />} label="Seu palpite do bolão">
                <textarea
                  value={palpite}
                  onChange={(e) => setPalpite(e.target.value)}
                  placeholder="Ex: Brasil 3 x 1 Argentina na final"
                  rows={3}
                  maxLength={500}
                  className="w-full resize-none bg-transparent outline-none placeholder:text-muted-foreground/60"
                />
              </Field>

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
        {icon}
        {label}
      </span>
      <div className="rounded-xl border border-border bg-input/60 px-4 py-3 transition focus-within:border-gold focus-within:ring-2 focus-within:ring-gold/30">
        {children}
      </div>
    </label>
  );
}
