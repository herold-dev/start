-- Responsável no card do funil CRM
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS responsible_name TEXT;

-- Reuniões
CREATE TABLE IF NOT EXISTS public.meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  lead_id UUID REFERENCES crm_leads(id) ON DELETE SET NULL,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  meeting_date TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  location TEXT,
  meeting_url TEXT,
  status TEXT DEFAULT 'agendada' CHECK (status IN ('agendada', 'realizada', 'cancelada')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all meetings" ON meetings;
CREATE POLICY "Allow all meetings" ON meetings FOR ALL USING (true) WITH CHECK (true);

-- Captações
CREATE TABLE IF NOT EXISTS public.captures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  capture_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  location TEXT,
  type TEXT DEFAULT 'foto' CHECK (type IN ('foto', 'video', 'foto_video')),
  status TEXT DEFAULT 'agendada' CHECK (status IN ('agendada', 'realizada', 'cancelada')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE captures ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all captures" ON captures;
CREATE POLICY "Allow all captures" ON captures FOR ALL USING (true) WITH CHECK (true);
