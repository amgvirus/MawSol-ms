-- =====================================================
-- Row Level Security (RLS) Policies
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sheds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worker_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_summary ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- HELPER FUNCTIONS FOR RLS
-- =====================================================

-- Function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if current user is assigned to a shed
CREATE OR REPLACE FUNCTION public.is_assigned_to_shed(shed_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.worker_assignments 
        WHERE worker_id = auth.uid() 
        AND shed_id = shed_uuid 
        AND is_active = TRUE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PROFILES POLICIES
-- =====================================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
    ON public.profiles FOR SELECT
    USING (public.is_admin());

-- Users can update their own profile (except role)
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Admins can update any profile
CREATE POLICY "Admins can update any profile"
    ON public.profiles FOR UPDATE
    USING (public.is_admin());

-- Admins can delete profiles (except their own)
CREATE POLICY "Admins can delete profiles"
    ON public.profiles FOR DELETE
    USING (public.is_admin() AND auth.uid() != id);

-- =====================================================
-- SHEDS POLICIES
-- =====================================================

-- Admins can do anything with sheds
CREATE POLICY "Admins have full access to sheds"
    ON public.sheds FOR ALL
    USING (public.is_admin());

-- Workers can view sheds they are assigned to
CREATE POLICY "Workers can view assigned sheds"
    ON public.sheds FOR SELECT
    USING (public.is_assigned_to_shed(id));

-- =====================================================
-- WORKER ASSIGNMENTS POLICIES
-- =====================================================

-- Admins can manage all assignments
CREATE POLICY "Admins have full access to assignments"
    ON public.worker_assignments FOR ALL
    USING (public.is_admin());

-- Workers can view their own assignments
CREATE POLICY "Workers can view own assignments"
    ON public.worker_assignments FOR SELECT
    USING (auth.uid() = worker_id);

-- =====================================================
-- DAILY ENTRIES POLICIES
-- =====================================================

-- Admins can do anything with daily entries
CREATE POLICY "Admins have full access to daily entries"
    ON public.daily_entries FOR ALL
    USING (public.is_admin());

-- Workers can insert entries for their assigned sheds
CREATE POLICY "Workers can insert entries for assigned sheds"
    ON public.daily_entries FOR INSERT
    WITH CHECK (
        auth.uid() = worker_id 
        AND public.is_assigned_to_shed(shed_id)
    );

-- Workers can view their own entries
CREATE POLICY "Workers can view own entries"
    ON public.daily_entries FOR SELECT
    USING (auth.uid() = worker_id);

-- Workers can update their own entries (same day only)
CREATE POLICY "Workers can update own entries same day"
    ON public.daily_entries FOR UPDATE
    USING (
        auth.uid() = worker_id 
        AND entry_date = CURRENT_DATE
    )
    WITH CHECK (
        auth.uid() = worker_id 
        AND entry_date = CURRENT_DATE
    );

-- =====================================================
-- PRODUCTION SUMMARY POLICIES
-- =====================================================

-- Admins can do anything with production summary
CREATE POLICY "Admins have full access to production summary"
    ON public.production_summary FOR ALL
    USING (public.is_admin());

-- Workers can view summary for their assigned sheds
CREATE POLICY "Workers can view summary for assigned sheds"
    ON public.production_summary FOR SELECT
    USING (public.is_assigned_to_shed(shed_id));
