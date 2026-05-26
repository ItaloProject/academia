-- ============================================================
-- ACADEMIA - Schema Inicial
-- Execute este arquivo no SQL Editor do Supabase
-- ============================================================

-- Membros
CREATE TABLE IF NOT EXISTS members (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT        NOT NULL,
  email        TEXT        UNIQUE,
  cpf          TEXT        UNIQUE,
  phone        TEXT,
  birth_date   DATE,
  photo_url    TEXT,
  face_descriptor JSONB,
  status       TEXT        NOT NULL DEFAULT 'active'
                           CHECK (status IN ('active','inactive','suspended')),
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Planos disponíveis
CREATE TABLE IF NOT EXISTS plans (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT        NOT NULL,
  description   TEXT,
  duration_days INTEGER     NOT NULL,
  price         NUMERIC(10,2) NOT NULL,
  active        BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Assinaturas (membro <-> plano)
CREATE TABLE IF NOT EXISTS member_plans (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id   UUID        NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  plan_id     UUID        NOT NULL REFERENCES plans(id),
  start_date  DATE        NOT NULL,
  end_date    DATE        NOT NULL,
  status      TEXT        NOT NULL DEFAULT 'active'
              CHECK (status IN ('active','expired','cancelled')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Pagamentos
CREATE TABLE IF NOT EXISTS payments (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id       UUID        NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  member_plan_id  UUID        REFERENCES member_plans(id),
  amount          NUMERIC(10,2) NOT NULL,
  due_date        DATE        NOT NULL,
  paid_date       DATE,
  status          TEXT        NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','paid','overdue','cancelled')),
  payment_method  TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Log de acessos
CREATE TABLE IF NOT EXISTS access_logs (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id   UUID        REFERENCES members(id) ON DELETE SET NULL,
  accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  method      TEXT        NOT NULL DEFAULT 'facial'
              CHECK (method IN ('facial','manual')),
  allowed     BOOLEAN     NOT NULL DEFAULT TRUE,
  notes       TEXT
);

-- ============================================================
-- Trigger: atualiza updated_at em members
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER members_updated_at
  BEFORE UPDATE ON members
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- Trigger: expira member_plans automaticamente
-- ============================================================
CREATE OR REPLACE FUNCTION expire_member_plans()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE member_plans
     SET status = 'expired'
   WHERE end_date < CURRENT_DATE
     AND status = 'active';
  RETURN NULL;
END;
$$;

-- ============================================================
-- RLS (Row Level Security) — habilitar + políticas permissivas
-- para uso via service_role (server-side)
-- ============================================================
ALTER TABLE members      ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans        ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments     ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_logs  ENABLE ROW LEVEL SECURITY;

-- Políticas: service_role bypass RLS por padrão no Supabase.
-- Para o client anon/autenticado, liberar tudo (ajuste conforme necessário):
CREATE POLICY "allow_all_authenticated" ON members      FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_authenticated" ON plans        FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_authenticated" ON member_plans FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_authenticated" ON payments     FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_authenticated" ON access_logs  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- Dados iniciais: planos de exemplo
-- ============================================================
INSERT INTO plans (name, description, duration_days, price) VALUES
  ('Mensal',    'Acesso por 30 dias',  30,  89.90),
  ('Trimestral','Acesso por 90 dias',  90, 239.90),
  ('Semestral', 'Acesso por 180 dias',180, 429.90),
  ('Anual',     'Acesso por 365 dias',365, 799.90)
ON CONFLICT DO NOTHING;
