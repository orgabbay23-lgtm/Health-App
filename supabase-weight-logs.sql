-- Create weight_logs table
CREATE TABLE IF NOT EXISTS public.weight_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  weight NUMERIC NOT NULL,
  logged_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.weight_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'weight_logs' AND policyname = 'Users can view own weight logs'
    ) THEN
        CREATE POLICY "Users can view own weight logs" ON public.weight_logs
          FOR SELECT USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'weight_logs' AND policyname = 'Users can insert own weight logs'
    ) THEN
        CREATE POLICY "Users can insert own weight logs" ON public.weight_logs
          FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'weight_logs' AND policyname = 'Users can update own weight logs'
    ) THEN
        CREATE POLICY "Users can update own weight logs" ON public.weight_logs
          FOR UPDATE USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'weight_logs' AND policyname = 'Users can delete own weight logs'
    ) THEN
        CREATE POLICY "Users can delete own weight logs" ON public.weight_logs
          FOR DELETE USING (auth.uid() = user_id);
    END IF;
END
$$;

-- Index for performance
CREATE INDEX IF NOT EXISTS weight_logs_user_id_logged_at_idx ON public.weight_logs (user_id, logged_at DESC);

-- Trigger function to sync weight from profiles to weight_logs
CREATE OR REPLACE FUNCTION public.handle_weight_update()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT' AND NEW.weight IS NOT NULL) OR (TG_OP = 'UPDATE' AND NEW.weight IS DISTINCT FROM OLD.weight AND NEW.weight IS NOT NULL) THEN
    INSERT INTO public.weight_logs (user_id, weight, logged_at)
    VALUES (NEW.id, NEW.weight, now());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on profiles table
DROP TRIGGER IF EXISTS on_weight_change ON public.profiles;
CREATE TRIGGER on_weight_change
  AFTER INSERT OR UPDATE OF weight ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_weight_update();
