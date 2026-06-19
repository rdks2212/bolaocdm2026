CREATE OR REPLACE FUNCTION public.get_participantes_count()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::int FROM public.palpites WHERE payment_status = 'paid';
$$;

GRANT EXECUTE ON FUNCTION public.get_participantes_count() TO anon, authenticated;