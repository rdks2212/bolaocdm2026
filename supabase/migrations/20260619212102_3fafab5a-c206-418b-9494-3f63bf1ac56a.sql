
ALTER TABLE public.palpites
  ADD COLUMN IF NOT EXISTS pix_payment_code text,
  ADD COLUMN IF NOT EXISTS pix_transaction_id text,
  ADD COLUMN IF NOT EXISTS pix_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS cpf text;

CREATE INDEX IF NOT EXISTS palpites_pix_transaction_id_idx ON public.palpites (pix_transaction_id);
