import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/bitflow-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let payload: any;
        try {
          payload = await request.json();
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }

        const event = payload?.event;
        const data = payload?.data;
        if (!event || !data) return new Response("Missing fields", { status: 400 });

        if (event !== "cashin.status_changed") {
          return new Response("ignored", { status: 200 });
        }

        const status: string = data.status;
        const cashInId = data.cashInId != null ? String(data.cashInId) : null;
        if (!cashInId) return new Response("Missing cashInId", { status: 400 });

        const statusMap: Record<string, string> = {
          PAID: "paid",
          EXPIRED: "expired",
          CANCELLED: "cancelled",
          MED: "med",
          REFUNDED: "refunded",
        };
        const newStatus = statusMap[status] ?? status.toLowerCase();

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { error } = await supabaseAdmin
          .from("palpites")
          .update({ payment_status: newStatus })
          .eq("pix_transaction_id", cashInId);

        if (error) {
          console.error("[bitflow-webhook] update failed", error);
          return new Response("DB error", { status: 500 });
        }
        return new Response("ok", { status: 200 });
      },
    },
  },
});
