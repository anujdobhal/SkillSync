-- Add mentor_status column for verification flow
-- Values: NULL (not applied), 'pending' (applied, awaiting review), 'approved' (verified mentor), 'rejected'
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS mentor_status text DEFAULT NULL;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_mentor boolean DEFAULT false;

-- Ensure all mentor profile fields exist in the remote database.
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS mentor_expertise text[] DEFAULT '{}';

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS mentor_bio text;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS mentor_linkedin text;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS years_experience integer;

-- When mentor_status becomes 'approved', auto-set is_mentor = true
-- When rejected or null, set is_mentor = false
CREATE OR REPLACE FUNCTION public.sync_mentor_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.mentor_status = 'approved' THEN
    NEW.is_mentor := true;
  ELSE
    NEW.is_mentor := false;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_mentor_status_trigger ON public.profiles;
CREATE TRIGGER sync_mentor_status_trigger
  BEFORE UPDATE OF mentor_status ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_mentor_status();

-- Notify user when their mentor application is reviewed
CREATE OR REPLACE FUNCTION public.notify_mentor_application_review()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.mentor_status = 'approved' AND (OLD.mentor_status IS NULL OR OLD.mentor_status = 'pending') THEN
    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (
      NEW.user_id,
      'mentor_approved',
      'Mentor Application Approved! 🎓✅',
      'Congratulations! Your mentor application has been approved. You are now listed as a mentor.',
      '/mentors'
    );
  ELSIF NEW.mentor_status = 'rejected' AND (OLD.mentor_status IS NULL OR OLD.mentor_status = 'pending') THEN
    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (
      NEW.user_id,
      'mentor_rejected',
      'Mentor Application Update',
      'Your mentor application was not approved at this time. You can re-apply later.',
      '/mentors'
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_mentor_application_review ON public.profiles;
CREATE TRIGGER on_mentor_application_review
  AFTER UPDATE OF mentor_status ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_mentor_application_review();
