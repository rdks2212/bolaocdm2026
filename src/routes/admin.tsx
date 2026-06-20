import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Lock, MessageCircle, Download, LogOut, Shield } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { listarPalpitesAdmin } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin · Bolão" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: AdminPage,
});

type Row = {
  id: string;
  nome: string;
  telefone: string;
  cpf: string | null;
  placar_brasil: number | null;
  placar_adversario: number | null;
  adversario: string | null;
  data_jogo: string | null;
  payment_status: string;
  valor: number;
  created_at: string;
};

const ADMIN_USER = "adminrdgbr";

function AdminPage() {
  const listar = useServerFn(listarPalpitesAdmin);
  const [user, setUser] = useState("");
  const [senha, setSenha] = useState("");
  const [rows, setRows] = useState<Row[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "paid" | "pending">("paid");

  async function onLogin(e: FormEvent) {
    e.preventDefault();
    if (user.trim() !== ADMIN_USER) {
      toast.error("Usuário ou senha incorretos");
      return;
    }
    setLoading(true);
    try {
      const data = await listar({ data: { senha } });
      setRows(data as Row[]);
      toast.success("Bem-vindo!");
    } catch {
      toast.error("Usuário ou senha incorretos");
    } finally {
      setLoading(false);
    }
  }

  async function refresh() {
    setLoading(true);
    try {
      const data = await listar({ data: { senha } });
      setRows(data as Row[]);
    } catch {
      toast.error("Sessão expirada. Faça login novamente.");
      setRows(null);
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    setRows(null);
    setSenha("");
    setUser("");
  }

  function exportCsv() {
    if (!rows) return;
    const header = ["Nome", "Telefone", "CPF", "Adversário", "Palpite", "Status", "Valor", "Data Jogo", "Criado em"];
    const lines = filtered.map((r) => [
      r.nome,
      r.telefone,
      r.cpf ?? "",
      r.adversario ?? "",
      `${r.placar_brasil ?? "?"}x${r.placar_adversario ?? "?"}`,
      r.payment_status,
      r.valor.toString().replace(".", ","),
      r.data_jogo ? new Date(r.data_jogo).toLocaleString("pt-BR") : "",
      new Date(r.created_at).toLocaleString("pt-BR"),
    ]);
    const csv = [header, ...lines]
      .map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";"))
      .join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `palpites-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const filtered = (rows ?? []).filter((r) => filter === "all" || r.payment_status === filter);
  const totalPaid = (rows ?? []).filter((r) => r.payment_status === "paid").length;
  const totalReceita = (rows ?? [])
    .filter((r) => r.payment_status === "paid")
    .reduce((s, r) => s + Number(r.valor), 0);

  function whatsappLink(tel: string) {
    const digits = tel.replace(/\D/g, "");
    const full = digits.startsWith("55") ? digits : `55${digits}`;
    return `https://wa.me/${full}`;
  }

  if (!rows) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <Toaster position="top-center" />
        <div className="w-full max-w-sm rounded-2xl border border-gold/30 bg-card/80 p-8 shadow-2xl">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 inline-flex h-14 w-14 items-center justify-center rounded-full bg-gold text-gold-foreground">
              <Shield className="h-7 w-7" />
            </div>
            <h1 className="font-display text-3xl">Painel Admin</h1>
            <p className="mt-1 text-xs text-muted-foreground">Acesso restrito</p>
          </div>
          <form onSubmit={onLogin} className="space-y-4">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Usuário</span>
              <input
                value={user}
                onChange={(e) => setUser(e.target.value)}
                autoComplete="username"
                className="w-full rounded-xl border border-border bg-input/60 px-4 py-3 outline-none focus:border-gold focus:ring-2 focus:ring-gold/30"
              />
            </label>
            <label className="block">
              <span className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Lock className="h-3 w-3" /> Senha
              </span>
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                autoComplete="current-password"
                className="w-full rounded-xl border border-border bg-input/60 px-4 py-3 outline-none focus:border-gold focus:ring-2 focus:ring-gold/30"
              />
            </label>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gold py-3 font-display text-lg tracking-wider text-gold-foreground transition hover:brightness-110 disabled:opacity-60"
            >
              {loading ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : "Entrar"}
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-8">
      <Toaster position="top-center" />
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-4xl">Painel Admin</h1>
            <p className="text-sm text-muted-foreground">{rows.length} registro(s) · {totalPaid} pagos · R$ {totalReceita.toFixed(2).replace(".", ",")}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={refresh} disabled={loading} className="rounded-lg border border-border bg-card px-3 py-2 text-sm hover:border-gold/50">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Atualizar"}
            </button>
            <button onClick={exportCsv} className="inline-flex items-center gap-1.5 rounded-lg bg-gold px-3 py-2 text-sm font-semibold text-gold-foreground hover:brightness-110">
              <Download className="h-4 w-4" /> CSV
            </button>
            <button onClick={logout} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-sm hover:border-destructive/50">
              <LogOut className="h-4 w-4" /> Sair
            </button>
          </div>
        </header>

        <div className="mb-4 flex gap-2">
          {(["paid", "pending", "all"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wider transition ${
                filter === f ? "bg-gold text-gold-foreground" : "border border-border bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              {f === "paid" ? "Pagos" : f === "pending" ? "Pendentes" : "Todos"}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto rounded-2xl border border-border bg-card/60">
          <table className="w-full text-sm">
            <thead className="bg-background/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">Nome</th>
                <th className="px-3 py-2 text-left">WhatsApp</th>
                <th className="px-3 py-2 text-left">CPF</th>
                <th className="px-3 py-2 text-left">Jogo</th>
                <th className="px-3 py-2 text-left">Palpite</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Criado</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-t border-border/50">
                  <td className="px-3 py-2 font-medium">{r.nome}</td>
                  <td className="px-3 py-2">
                    <a href={whatsappLink(r.telefone)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-gold hover:underline">
                      <MessageCircle className="h-3.5 w-3.5" />
                      {r.telefone}
                    </a>
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">{r.cpf ?? "—"}</td>
                  <td className="px-3 py-2">Brasil x {r.adversario ?? "?"}</td>
                  <td className="px-3 py-2 font-display">
                    {r.placar_brasil ?? "?"} × {r.placar_adversario ?? "?"}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                        r.payment_status === "paid" ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {r.payment_status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleString("pt-BR")}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-3 py-8 text-center text-muted-foreground">Nenhum registro</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
