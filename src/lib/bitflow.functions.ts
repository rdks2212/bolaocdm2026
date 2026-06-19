import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const BITFLOW_BASE_URL = process.env.BITFLOW_API_URL || "https://api.bitflowpay.com";

async function getAccessToken() {
  const clientId = process.env.BITFLOW_CLIENT_ID;
  const clientSecret = process.env.BITFLOW_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("BITFLOW credentials not configured");

  const res = await fetch(`${BITFLOW_BASE_URL}/auth/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Bitflow auth failed (${res.status}): ${txt.slice(0, 300)}`);
  }
  const json = (await res.json()) as { access_token: string };
  return { accessToken: json.access_token, clientId };
}

const inputSchema = z.object({
  nome: z.string().min(2).max(100),
  cpf: z.string().regex(/^\d{11}$/, "CPF deve conter 11 dígitos"),
  telefone: z.string().min(8).max(20),
  email: z.string().email().optional(),
  jogoId: z.string().uuid(),
  placarBrasil: z.number().int().min(0).max(20),
  placarAdversario: z.number().int().min(0).max(20),
  palpiteTexto: z.string().min(3).max(500),
  descricao: z.string().max(200),
  amountCents: z.number().int().positive(),
});

export const criarCobrancaPix = createServerFn({ method: "POST" })
  .inputValidator((d: z.infer<typeof inputSchema>) => inputSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: inserted, error: insErr } = await supabaseAdmin
      .from("palpites")
      .insert({
        nome: data.nome,
        telefone: data.telefone,
        palpite: data.palpiteTexto,
        placar_brasil: data.placarBrasil,
        placar_adversario: data.placarAdversario,
        jogo_id: data.jogoId,
        valor: data.amountCents / 100,
        cpf: data.cpf,
      })
      .select("id")
      .single();
    if (insErr || !inserted) {
      throw new Error(`Falha ao registrar palpite: ${insErr?.message ?? "unknown"}`);
    }
    const palpiteId = inserted.id;

    const { accessToken, clientId } = await getAccessToken();
    const origin = process.env.PUBLIC_SITE_URL || "https://project--0a20947b-4eeb-49fb-b6ae-46231e255a60.lovable.app";
    const urlCallBack = `${origin}/api/public/bitflow-webhook`;

    const body = {
      amountCents: data.amountCents,
      description: data.descricao,
      customer: {
        name: data.nome,
        email: data.email || `${data.cpf}@bolao.local`,
        cpf: data.cpf,
        phone: data.telefone.replace(/\D/g, ""),
        externaRef: palpiteId,
      },
      items: [
        { title: data.descricao, quantity: 1, unitPriceCents: data.amountCents, tangible: false },
      ],
      urlCallBack,
    };

    const res = await fetch(`${BITFLOW_BASE_URL}/cashin/api`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        "X-API-Key": clientId,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Bitflow cashin failed (${res.status}): ${txt.slice(0, 500)}`);
    }
    const charge = (await res.json()) as {
      id: number | string;
      paymentCode: string;
      status: string;
      expiresAt?: string;
    };

    await supabaseAdmin
      .from("palpites")
      .update({
        pix_payment_code: charge.paymentCode,
        pix_transaction_id: String(charge.id),
        pix_expires_at: charge.expiresAt ?? null,
      })
      .eq("id", palpiteId);

    return {
      palpiteId,
      paymentCode: charge.paymentCode,
      transactionId: String(charge.id),
      expiresAt: charge.expiresAt ?? null,
    };
  });
