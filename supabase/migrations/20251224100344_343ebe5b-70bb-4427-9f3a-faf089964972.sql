-- Create workout_records table for tracking daily workouts
CREATE TABLE public.workout_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  workout_type TEXT NOT NULL,
  workout_name TEXT NOT NULL,
  level TEXT,
  duration_minutes INTEGER,
  notes TEXT,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on workout_records
ALTER TABLE public.workout_records ENABLE ROW LEVEL SECURITY;

-- RLS policies for workout_records
CREATE POLICY "Users can view their own workout records" 
ON public.workout_records 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own workout records" 
ON public.workout_records 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workout records" 
ON public.workout_records 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workout records" 
ON public.workout_records 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add avatar_url column to profiles table if it doesn't exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;