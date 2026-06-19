CREATE TABLE public.palpites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  telefone TEXT NOT NULL,
  palpite TEXT NOT NULL,
  valor NUMERIC(10,2) NOT NULL DEFAULT 20.00,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT INSERT ON public.palpites TO anon;
GRANT INSERT ON public.palpites TO authenticated;
GRANT ALL ON public.palpites TO service_role;

ALTER TABLE public.palpites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Qualquer pessoa pode enviar palpite"
ON public.palpites
FOR INSERT
TO anon, authenticated
WITH CHECK (
  char_length(nome) BETWEEN 2 AND 100
  AND char_length(telefone) BETWEEN 8 AND 20
  AND char_length(palpite) BETWEEN 3 AND 500
);