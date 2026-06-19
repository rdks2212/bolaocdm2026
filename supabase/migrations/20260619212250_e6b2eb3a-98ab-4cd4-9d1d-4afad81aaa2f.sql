
CREATE OR REPLACE FUNCTION public.get_payment_status(_tx text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT payment_status FROM public.palpites WHERE pix_transaction_id = _tx LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_payment_status(text) TO anon, authenticated;
