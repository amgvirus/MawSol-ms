-- =====================================================
-- Poultry Farm Management System - Database Schema
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. PROFILES TABLE (extends Supabase auth.users)
-- =====================================================
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    role TEXT NOT NULL CHECK (role IN ('admin', 'worker')) DEFAULT 'worker',
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on role for faster queries
CREATE INDEX idx_profiles_role ON public.profiles(role);

-- =====================================================
-- 2. SHEDS TABLE
-- =====================================================
CREATE TABLE public.sheds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    variant TEXT NOT NULL CHECK (variant IN ('W', 'B')),
    description TEXT,
    capacity INTEGER DEFAULT 0,
    number_of_birds INTEGER DEFAULT 0 CHECK (number_of_birds >= 0),
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on name for faster lookups
CREATE INDEX idx_sheds_name ON public.sheds(name);
CREATE INDEX idx_sheds_variant ON public.sheds(variant);

-- =====================================================
-- 3. WORKER ASSIGNMENTS TABLE
-- =====================================================
CREATE TABLE public.worker_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    worker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    shed_id UUID NOT NULL REFERENCES public.sheds(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(worker_id, shed_id)
);

-- Create indexes for worker assignments
CREATE INDEX idx_worker_assignments_worker ON public.worker_assignments(worker_id);
CREATE INDEX idx_worker_assignments_shed ON public.worker_assignments(shed_id);

-- =====================================================
-- 4. DAILY ENTRIES TABLE
-- =====================================================
CREATE TABLE public.daily_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shed_id UUID NOT NULL REFERENCES public.sheds(id) ON DELETE CASCADE,
    worker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    production_crates DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (production_crates >= 0),
    production_birds INTEGER NOT NULL DEFAULT 0 CHECK (production_birds >= 0),
    total_birds INTEGER NOT NULL DEFAULT 0 CHECK (total_birds >= 0),
    non_production INTEGER NOT NULL DEFAULT 0 CHECK (non_production >= 0),
    mortality INTEGER NOT NULL DEFAULT 0 CHECK (mortality >= 0),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(shed_id, entry_date)
);

-- Create indexes for daily entries
CREATE INDEX idx_daily_entries_shed ON public.daily_entries(shed_id);
CREATE INDEX idx_daily_entries_worker ON public.daily_entries(worker_id);
CREATE INDEX idx_daily_entries_date ON public.daily_entries(entry_date);
CREATE INDEX idx_daily_entries_shed_date ON public.daily_entries(shed_id, entry_date);

-- =====================================================
-- 5. PRODUCTION SUMMARY TABLE (aggregated monthly)
-- =====================================================
CREATE TABLE public.production_summary (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shed_id UUID NOT NULL REFERENCES public.sheds(id) ON DELETE CASCADE,
    month DATE NOT NULL,
    total_production_crates DECIMAL(12, 2) DEFAULT 0,
    total_production_birds INTEGER DEFAULT 0,
    avg_total_birds DECIMAL(10, 2) DEFAULT 0,
    total_non_production INTEGER DEFAULT 0,
    total_mortality INTEGER DEFAULT 0,
    entry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(shed_id, month)
);

-- Create indexes for production summary
CREATE INDEX idx_production_summary_shed ON public.production_summary(shed_id);
CREATE INDEX idx_production_summary_month ON public.production_summary(month);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to handle new user creation (auto-create profile)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'role', 'worker')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for auto-creating profiles
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers to all tables
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_sheds_updated_at
    BEFORE UPDATE ON public.sheds
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_daily_entries_updated_at
    BEFORE UPDATE ON public.daily_entries
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_production_summary_updated_at
    BEFORE UPDATE ON public.production_summary
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Function to update production summary when daily entry is added/updated
CREATE OR REPLACE FUNCTION public.update_production_summary()
RETURNS TRIGGER AS $$
DECLARE
    entry_month DATE;
BEGIN
    -- Get the first day of the month for the entry
    entry_month := DATE_TRUNC('month', COALESCE(NEW.entry_date, OLD.entry_date))::DATE;
    
    -- Delete existing summary for this shed/month
    DELETE FROM public.production_summary 
    WHERE shed_id = COALESCE(NEW.shed_id, OLD.shed_id) 
    AND month = entry_month;
    
    -- Recalculate and insert new summary
    INSERT INTO public.production_summary (
        shed_id, 
        month, 
        total_production_crates, 
        total_production_birds,
        avg_total_birds,
        total_non_production,
        total_mortality,
        entry_count
    )
    SELECT 
        shed_id,
        DATE_TRUNC('month', entry_date)::DATE,
        SUM(production_crates),
        SUM(production_birds),
        AVG(total_birds),
        SUM(non_production),
        SUM(mortality),
        COUNT(*)
    FROM public.daily_entries
    WHERE shed_id = COALESCE(NEW.shed_id, OLD.shed_id)
    AND DATE_TRUNC('month', entry_date) = DATE_TRUNC('month', COALESCE(NEW.entry_date, OLD.entry_date))
    GROUP BY shed_id, DATE_TRUNC('month', entry_date);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for updating production summary
CREATE TRIGGER update_production_summary_on_entry
    AFTER INSERT OR UPDATE OR DELETE ON public.daily_entries
    FOR EACH ROW EXECUTE FUNCTION public.update_production_summary();

-- =====================================================
-- HELPER VIEWS
-- =====================================================

-- View for shed statistics
CREATE OR REPLACE VIEW public.shed_statistics AS
SELECT 
    s.id,
    s.name,
    s.variant,
    s.is_active,
    COALESCE(ps.total_production_crates, 0) as current_month_crates,
    COALESCE(ps.total_production_birds, 0) as current_month_birds,
    COALESCE(ps.total_mortality, 0) as current_month_mortality,
    (SELECT COUNT(*) FROM public.worker_assignments wa WHERE wa.shed_id = s.id AND wa.is_active = TRUE) as assigned_workers
FROM public.sheds s
LEFT JOIN public.production_summary ps ON s.id = ps.shed_id 
    AND ps.month = DATE_TRUNC('month', CURRENT_DATE)::DATE;

-- View for worker statistics
CREATE OR REPLACE VIEW public.worker_statistics AS
SELECT 
    p.id,
    p.email,
    p.full_name,
    p.role,
    (SELECT COUNT(*) FROM public.worker_assignments wa WHERE wa.worker_id = p.id AND wa.is_active = TRUE) as assigned_sheds,
    (SELECT COUNT(*) FROM public.daily_entries de WHERE de.worker_id = p.id) as total_entries,
    (SELECT MAX(entry_date) FROM public.daily_entries de WHERE de.worker_id = p.id) as last_entry_date
FROM public.profiles p
WHERE p.role = 'worker';
