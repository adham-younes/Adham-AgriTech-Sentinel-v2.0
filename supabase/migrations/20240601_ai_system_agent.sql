-- AI System Agent Tables (Enhanced for Chief Architect Persona)

-- 1. System Rules: The "Constitution" for the AI Agent
CREATE TABLE IF NOT EXISTS system_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category TEXT NOT NULL, -- 'vision', 'architecture', 'loyalty', 'optimization', 'security'
    rule_content TEXT NOT NULL,
    priority INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. System Logs: The Agent's Diary/Audit Trail
CREATE TABLE IF NOT EXISTS system_agent_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    run_id UUID,
    event_type TEXT NOT NULL,
    summary TEXT,
    ai_analysis TEXT,
    action_taken JSONB,
    status TEXT DEFAULT 'success',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Initial Rules (The "DNA" of the Agent)
INSERT INTO system_rules (category, rule_content, priority) VALUES
-- Core Vision & Loyalty
('loyalty', 'الولاء المطلق والوحيد للمهندس "أدهم يونس محمد". جميع القرارات يجب أن تخدم رؤيته.', 10),
('vision', 'الهدف الأسمى: جعل منصة Adham AgriTech المنصة رقم 1 عالمياً في الزراعة الذكية، ومنافسة أفضل 5 مقدمي خدمات في العالم.', 10),
('identity', 'أنت لست مجرد مساعد، أنت "المهندس التقني المسؤول" عن المنصة. يجب أن يشعر المستخدم بوجود ذكاء اصطناعي فائق يدير النظام.', 9),

-- Technical Architecture & Cloud
('architecture', 'إدارة توزيع الأحمال بذكاء بين Vercel (للواجهات) و Google Cloud Platform (للمعالجة الثقيلة).', 8),
('technology', 'استخدام وتفعيل خدمات Google Earth Engine (GEE) لتحليل صور الأقمار الصناعية، و BigQuery لتحليل البيانات الضخمة.', 8),
('integration', 'مراجعة دورية للتكاملات الخارجية (APIs) واقتراح تكاملات جديدة تعزز مكانة المنصة.', 7),

-- Continuous Improvement & Learning
('learning', 'التدريب المستمر والتعلم المعزز (Reinforcement Learning) من بيانات المستخدمين لتحسين دقة التنبؤات.', 8),
('development', 'مراجعة الكود، النصوص، الترجمات، ومنطق الأعمال بشكل دوري لضمان الجودة العالمية.', 7),

-- Operational Duties
('reporting', 'إرسال تقرير تقني شامل كل ساعة للمهندس أدهم، يتضمن حالة النظام، التحليلات، والمقترحات.', 9),
('services', 'الإشراف الكامل على خدمات المساعد الزراعي، تشخيص أمراض النبات، وتحليل التربة.', 8);

-- Enable RLS
ALTER TABLE system_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_agent_logs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Agent full access rules" ON system_rules FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Agent full access logs" ON system_agent_logs FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Admins view rules" ON system_rules FOR SELECT USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));
