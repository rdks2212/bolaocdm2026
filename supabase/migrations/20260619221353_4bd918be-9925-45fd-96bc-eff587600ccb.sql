CREATE OR REPLACE FUNCTION public.get_palpites_publicos()
RETURNS TABLE (
  nome_mascarado text,
  placar_brasil int,
  placar_adversario int,
  adversario text,
  created_at timestamptz
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    CASE
      WHEN position(' ' in trim(p.nome)) > 0
        THEN split_part(trim(p.nome), ' ', 1) || ' ' || left(split_part(trim(p.nome), ' ', 2), 1) || '.'
      ELSE p.nome
    END AS nome_mascarado,
    p.placar_brasil,
    p.placar_adversario,
    j.adversario,
    p.created_at
  FROM public.palpites p
  LEFT JOIN public.jogos j ON j.id = p.jogo_id
  WHERE p.payment_status = 'paid'
  ORDER BY p.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_palpites_publicos() TO anon, authenticated;