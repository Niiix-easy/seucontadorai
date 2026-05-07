-- Check and create notifications table if it doesn't exist (it should based on previous runs, but let's be sure)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notifications') THEN
        CREATE TABLE public.notifications (
            id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            type TEXT NOT NULL, -- 'nfe', 'nfse', 'audit', 'system'
            read BOOLEAN DEFAULT false,
            link TEXT,
            metadata JSONB DEFAULT '{}'::jsonb,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );

        ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

        CREATE POLICY "Users can manage their own notifications"
        ON public.notifications
        FOR ALL
        USING (auth.uid() = user_id);
    END IF;
END $$;

-- Create notification preferences table
CREATE TABLE IF NOT EXISTS public.notification_preferences (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    nfe BOOLEAN DEFAULT true,
    nfse BOOLEAN DEFAULT true,
    audit BOOLEAN DEFAULT true,
    email BOOLEAN DEFAULT true,
    push BOOLEAN DEFAULT true,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own preferences"
ON public.notification_preferences
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
ON public.notification_preferences
FOR ALL -- Using ALL to handle insert/update easily
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_notification_preferences_updated_at
    BEFORE UPDATE ON public.notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Fix search_path security issue for functions
ALTER FUNCTION update_updated_at_column() SET search_path = public;
