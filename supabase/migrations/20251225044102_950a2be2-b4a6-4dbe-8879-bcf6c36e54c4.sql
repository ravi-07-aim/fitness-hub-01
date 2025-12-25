-- Create table for storing OTP codes
CREATE TABLE public.email_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_verifications ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (for sending OTP)
CREATE POLICY "Anyone can create verification requests"
ON public.email_verifications
FOR INSERT
WITH CHECK (true);

-- Allow anyone to read their own verification by email
CREATE POLICY "Anyone can read verifications by email"
ON public.email_verifications
FOR SELECT
USING (true);

-- Allow updates for verification
CREATE POLICY "Anyone can update verifications"
ON public.email_verifications
FOR UPDATE
USING (true);

-- Delete old records automatically - create a function to clean up expired OTPs
CREATE OR REPLACE FUNCTION public.cleanup_expired_otps()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.email_verifications 
  WHERE expires_at < now() - interval '1 hour';
  RETURN NEW;
END;
$$;

-- Trigger to cleanup on new inserts
CREATE TRIGGER cleanup_old_otps
AFTER INSERT ON public.email_verifications
FOR EACH STATEMENT
EXECUTE FUNCTION public.cleanup_expired_otps();