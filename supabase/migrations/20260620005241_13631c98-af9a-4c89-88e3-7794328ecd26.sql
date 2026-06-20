
CREATE OR REPLACE FUNCTION public.get_participantes_count()
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::int
  FROM public.palpites p
  WHERE p.payment_status = 'paid'
    AND p.jogo_id = (
      SELECT id FROM public.jogos
      WHERE ativo = true AND data_hora >= now()
      ORDER BY data_hora ASC
      LIMIT 1
    );
$$;

CREATE OR REPLACE FUNCTION public.get_palpites_publicos()
RETURNS TABLE(nome_mascarado text, placar_brasil integer, placar_adversario integer, adversario text, created_at timestamp with time zone)
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
    AND p.jogo_id = (
      SELECT id FROM public.jogos
      WHERE ativo = true AND data_hora >= now()
      ORDER BY data_hora ASC
      LIMIT 1
    )
  ORDER BY p.created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.admin_listar_palpites(_senha text)
RETURNS TABLE(
  id uuid,
  nome text,
  telefone text,
  cpf text,
  placar_brasil integer,
  placar_adversario integer,
  adversario text,
  data_jogo timestamp with time zone,
  payment_status text,
  valor numeric,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _senha IS DISTINCT FROM 'bolaocdmxyz' THEN
    RAISE EXCEPTION 'Não autorizado';
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.nome,
    p.telefone,
    p.cpf,
    p.placar_brasil,
    p.placar_adversario,
    j.adversario,
    j.data_hora AS data_jogo,
    p.payment_status,
    p.valor,
    p.created_at
  FROM public.palpites p
  LEFT JOIN public.jogos j ON j.id = p.jogo_id
  ORDER BY p.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_listar_palpites(text) TO anon, authenticated;
