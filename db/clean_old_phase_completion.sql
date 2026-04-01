-- Limpar dados antigos de phase_id = 2 que foi marcado como completo antes da implementação de mission groups
DELETE FROM user_phase_completion 
WHERE phase_id = 2;
