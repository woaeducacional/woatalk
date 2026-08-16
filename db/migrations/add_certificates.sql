-- ============================================================
-- WOA EDUCACIONAL — CERTIFICAÇÕES OFICIAIS
-- Sprint 4
-- ============================================================
--
-- Objetivo:
-- Criar uma estrutura de certificação verificável e preparada
-- para uso profissional, acadêmico e institucional.
--
-- Oceanos inicialmente habilitados:
-- 1 = Pacífico
-- 2 = Atlântico
-- 3 = Índico
-- 4 = Ártico
--
-- Elegibilidade:
-- Starter ou Premium
--
-- Download:
-- ilimitado.
--
-- Nova emissão:
-- somente após 30 dias da última emissão do mesmo Oceano.
--
-- IMPORTANTE:
-- Os dados de carga horária, atividades, XP, WOA Coins,
-- competências e conteúdos devem ser calculados pelo servidor
-- a partir do progresso real do aluno.
-- Nunca confiar nesses valores enviados pelo frontend.
-- ============================================================


CREATE TABLE IF NOT EXISTS certificates (

  -- Identificação
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id UUID NOT NULL
    REFERENCES users(id)
    ON DELETE CASCADE,


  -- ==========================================================
  -- IDENTIFICAÇÃO ACADÊMICA
  -- ==========================================================

  phase_id INTEGER NOT NULL,

  ocean_name VARCHAR(100) NOT NULL,

  certificate_type VARCHAR(30) NOT NULL
    DEFAULT 'journey',

  -- Ex.: A1, A2
  level VARCHAR(10),

  -- Nome oficial do programa
  program_name VARCHAR(150)
    NOT NULL DEFAULT 'WOA Educacional — Jornada de Idiomas',

  -- Versão da certificação
  certificate_version VARCHAR(20)
    NOT NULL DEFAULT '1.0',


  -- ==========================================================
  -- PLANO / ELEGIBILIDADE
  -- ==========================================================

  plan VARCHAR(30) NOT NULL,


  -- ==========================================================
  -- CARGA HORÁRIA
  -- ==========================================================

  -- Minutos reais contabilizados pelo sistema
  total_study_minutes INTEGER NOT NULL DEFAULT 0,

  -- Horas exibidas no certificado.
  -- Ex.: 12.5
  total_study_hours NUMERIC(8,2) NOT NULL DEFAULT 0,


  -- ==========================================================
  -- ATIVIDADES / APROVEITAMENTO
  -- ==========================================================

  total_activities INTEGER NOT NULL DEFAULT 0,

  completed_activities INTEGER NOT NULL DEFAULT 0,

  -- Percentual final de aproveitamento
  completion_percentage NUMERIC(5,2) NOT NULL DEFAULT 0,

  -- XP obtido durante a Jornada
  total_xp INTEGER NOT NULL DEFAULT 0,

  -- WOA Coins obtidas durante a Jornada
  total_woa_coins INTEGER NOT NULL DEFAULT 0,


  -- ==========================================================
  -- CONTEÚDO E COMPETÊNCIAS
  -- ==========================================================

  -- Resumo dos conteúdos estudados
  content_summary TEXT,

  -- Competências desenvolvidas
  skills JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Resultados de aprendizagem
  learning_outcomes JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Tipos de atividades realizadas
  activity_types JSONB NOT NULL DEFAULT '[]'::jsonb,


  -- ==========================================================
  -- EVIDÊNCIAS DA FORMAÇÃO
  -- ==========================================================

  -- Snapshot dos dados utilizados para gerar o certificado.
  --
  -- Exemplo:
  -- {
  --   "mission_groups": [0,1,2,3,4],
  --   "activities_completed": 42,
  --   "xp": 410,
  --   "coins": 100,
  --   "study_minutes": 720
  -- }
  --
  -- Isso preserva a fotografia acadêmica do aluno
  -- no momento da emissão.
  evidence_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,


  -- ==========================================================
  -- IDENTIDADE / AUTENTICIDADE
  -- ==========================================================

  -- Código único público do certificado
  certificate_code VARCHAR(80) NOT NULL UNIQUE,

  -- Identificador externo para validação
  verification_code VARCHAR(80) NOT NULL UNIQUE,

  -- URL pública de validação.
  -- Será preenchida pela aplicação.
  verification_url TEXT,


  -- ==========================================================
  -- EMISSOR
  -- ==========================================================

  issuer_name VARCHAR(150) NOT NULL
    DEFAULT 'WOA Educacional',

  issuer_description TEXT
    DEFAULT 'Certificação educacional emitida pela WOA Educacional.',

  -- Nome que aparecerá como instituição emissora
  issuing_organization VARCHAR(150)
    NOT NULL DEFAULT 'WOA Educacional',


  -- ==========================================================
  -- DATAS
  -- ==========================================================

  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Data a partir da qual nova emissão poderá ocorrer.
  next_eligible_issuance_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),


  -- ==========================================================
  -- STATUS
  -- ==========================================================

  -- issued = válido
  -- revoked = revogado
  -- superseded = substituído por nova emissão
  status VARCHAR(20) NOT NULL DEFAULT 'issued'
    CHECK (status IN ('issued', 'revoked', 'superseded'))

);


-- ============================================================
-- ÍNDICES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_certificates_user
  ON certificates(user_id);

CREATE INDEX IF NOT EXISTS idx_certificates_user_phase
  ON certificates(user_id, phase_id);

CREATE INDEX IF NOT EXISTS idx_certificates_user_phase_issued
  ON certificates(user_id, phase_id, issued_at DESC);

CREATE INDEX IF NOT EXISTS idx_certificates_code
  ON certificates(certificate_code);

CREATE INDEX IF NOT EXISTS idx_certificates_verification
  ON certificates(verification_code);

CREATE INDEX IF NOT EXISTS idx_certificates_status
  ON certificates(status);


-- ============================================================
-- DOCUMENTAÇÃO DO BANCO
-- ============================================================

COMMENT ON TABLE certificates IS
'Certificados oficiais da WOA Educacional. Cada emissão representa uma certificação verificável de uma Jornada/Oceano.';

COMMENT ON COLUMN certificates.phase_id IS
'ID da Jornada/Oceano concluído pelo aluno.';

COMMENT ON COLUMN certificates.ocean_name IS
'Nome do Oceano correspondente à Jornada certificada.';

COMMENT ON COLUMN certificates.level IS
'Nível linguístico associado à certificação, como A1 ou A2.';

COMMENT ON COLUMN certificates.total_study_minutes IS
'Tempo total de estudo contabilizado pelo sistema em minutos.';

COMMENT ON COLUMN certificates.total_study_hours IS
'Carga horária total de estudo apresentada no certificado.';

COMMENT ON COLUMN certificates.total_activities IS
'Quantidade total de atividades previstas para a Jornada.';

COMMENT ON COLUMN certificates.completed_activities IS
'Quantidade de atividades efetivamente concluídas.';

COMMENT ON COLUMN certificates.completion_percentage IS
'Percentual final de conclusão da Jornada.';

COMMENT ON COLUMN certificates.total_xp IS
'XP total obtido pelo aluno durante a Jornada.';

COMMENT ON COLUMN certificates.total_woa_coins IS
'WOA Coins obtidas pelo aluno durante a Jornada.';

COMMENT ON COLUMN certificates.content_summary IS
'Resumo oficial dos conteúdos estudados durante a Jornada.';

COMMENT ON COLUMN certificates.skills IS
'Competências desenvolvidas durante a Jornada em formato JSON.';

COMMENT ON COLUMN certificates.learning_outcomes IS
'Resultados de aprendizagem associados à certificação.';

COMMENT ON COLUMN certificates.activity_types IS
'Tipos de atividades realizadas pelo aluno.';

COMMENT ON COLUMN certificates.evidence_snapshot IS
'Snapshot imutável dos dados acadêmicos utilizados para emissão do certificado.';

COMMENT ON COLUMN certificates.certificate_code IS
'Código público único do certificado.';

COMMENT ON COLUMN certificates.verification_code IS
'Código utilizado para validação da autenticidade do certificado.';

COMMENT ON COLUMN certificates.verification_url IS
'URL pública utilizada para verificar a autenticidade do certificado.';

COMMENT ON COLUMN certificates.issued_at IS
'Data e hora oficial da emissão.';

COMMENT ON COLUMN certificates.next_eligible_issuance_at IS
'Data a partir da qual o aluno poderá solicitar nova emissão do mesmo Oceano.';

COMMENT ON COLUMN certificates.status IS
'Estado do certificado: issued, revoked ou superseded.';


-- ============================================================
-- OCEANOS INICIALMENTE HABILITADOS
-- ============================================================
--
-- A aplicação controlará a disponibilidade:
--
-- phase_id 1 → Pacífico
-- phase_id 2 → Atlântico
-- phase_id 3 → Índico
-- phase_id 4 → Ártico
--
-- Novos Oceanos poderão ser adicionados posteriormente
-- sem alteração estrutural desta tabela.
-- ============================================================
