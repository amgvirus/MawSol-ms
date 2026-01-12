-- =====================================================
-- Seed Data for Poultry Farm Management System
-- =====================================================

-- Insert sheds (M1-M6 with variants)
INSERT INTO public.sheds (name, variant, description, capacity, is_active) VALUES
    ('M1', 'W', 'Main shed 1 - White variant birds', 5000, TRUE),
    ('M2', 'B', 'Main shed 2 - Brown variant birds', 5000, TRUE),
    ('M3', 'W', 'Main shed 3 - White variant birds', 4500, TRUE),
    ('M4', 'W', 'Main shed 4 - White variant birds', 4500, TRUE),
    ('M5', 'B', 'Main shed 5 - Brown variant birds', 4000, TRUE),
    ('M6', 'W', 'Main shed 6 - White variant birds', 5000, TRUE)
ON CONFLICT (name) DO NOTHING;

-- Note: To create an admin user, run this after you've created a user via Supabase Auth:
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'admin@example.com';

-- Sample daily entries (optional - for demo purposes)
-- These should be inserted after you have worker users created and assigned to sheds
-- Uncomment and modify as needed:

/*
-- Get shed IDs for reference
DO $$
DECLARE
    m1_id UUID;
    m2_id UUID;
    m3_id UUID;
BEGIN
    SELECT id INTO m1_id FROM public.sheds WHERE name = 'M1';
    SELECT id INTO m2_id FROM public.sheds WHERE name = 'M2';
    SELECT id INTO m3_id FROM public.sheds WHERE name = 'M3';
    
    -- Sample entries for M1 (last 7 days)
    INSERT INTO public.daily_entries (shed_id, worker_id, entry_date, production_crates, production_birds, total_birds, non_production, mortality)
    SELECT 
        m1_id,
        (SELECT id FROM public.profiles WHERE role = 'worker' LIMIT 1),
        CURRENT_DATE - (i || ' days')::INTERVAL,
        ROUND((RANDOM() * 20 + 80)::NUMERIC, 2),
        ROUND((RANDOM() * 500 + 2000)::NUMERIC)::INTEGER,
        4500,
        ROUND((RANDOM() * 100 + 200)::NUMERIC)::INTEGER,
        ROUND((RANDOM() * 5)::NUMERIC)::INTEGER
    FROM generate_series(0, 6) AS i
    ON CONFLICT (shed_id, entry_date) DO NOTHING;
END $$;
*/

-- Summary of initial data:
-- - 6 sheds (M1-M6)
-- - Variants: M1, M3, M4, M6 = White (W); M2, M5 = Brown (B)
-- - All sheds marked as active
-- - Capacity ranges from 4000-5000 birds
