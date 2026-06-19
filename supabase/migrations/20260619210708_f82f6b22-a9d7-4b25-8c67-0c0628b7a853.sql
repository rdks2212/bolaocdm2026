UPDATE public.jogos SET ativo = false WHERE adversario IN ('Haiti','Camarões','Sérvia');
INSERT INTO public.jogos (adversario, data_hora, fase, bandeira, ativo) VALUES
('Haiti', (CURRENT_DATE + TIME '21:30')::timestamptz, 'Fase de Grupos', '🇭🇹', true),
('Escócia', (CURRENT_DATE + INTERVAL '5 days' + TIME '16:00')::timestamptz, 'Fase de Grupos', '🏴󠁧󠁢󠁳󠁣󠁴󠁿', true);