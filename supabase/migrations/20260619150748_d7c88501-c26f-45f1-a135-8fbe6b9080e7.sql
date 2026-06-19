
CREATE TABLE public.jogos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  adversario TEXT NOT NULL,
  data_hora TIMESTAMPTZ NOT NULL,
  fase TEXT NOT NULL DEFAULT 'Fase de Grupos',
  bandeira TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.jogos TO anon, authenticated;
GRANT ALL ON public.jogos TO service_role;

ALTER TABLE public.jogos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Qualquer pessoa pode ver os jogos"
ON public.jogos FOR SELECT
TO anon, authenticated
USING (ativo = true);

ALTER TABLE public.palpites
  ADD COLUMN jogo_id UUID REFERENCES public.jogos(id) ON DELETE SET NULL,
  ADD COLUMN placar_brasil INT,
  ADD COLUMN placar_adversario INT;

INSERT INTO public.jogos (adversario, data_hora, fase, bandeira) VALUES
  ('Haiti',      (CURRENT_DATE + TIME '20:00') AT TIME ZONE 'America/Sao_Paulo', 'Fase de Grupos', '🇭🇹'),
  ('Camarões',   (CURRENT_DATE + INTERVAL '5 days' + TIME '16:00') AT TIME ZONE 'America/Sao_Paulo', 'Fase de Grupos', '🇨🇲'),
  ('Sérvia',     (CURRENT_DATE + INTERVAL '10 days' + TIME '21:00') AT TIME ZONE 'America/Sao_Paulo', 'Fase de Grupos', '🇷🇸');
