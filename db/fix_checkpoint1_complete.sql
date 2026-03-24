-- Fix checkpoint 1 (phase 2): complete_en was a plain question, should have ___ blank
UPDATE journey_checkpoints
SET
  complete_en      = 'The man plays soccer ___ a week.',
  complete_pt      = 'O homem joga futebol ___ por semana.',
  complete_options = 'once|twice|every day',
  complete_answer  = 'twice'
WHERE phase_id = 2 AND checkpoint_number = 1;
