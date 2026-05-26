-- Mentorship requests table
CREATE TABLE IF NOT EXISTS public.mentor_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  mentor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(mentor_id, student_id)
);

ALTER TABLE public.mentor_requests ENABLE ROW LEVEL SECURITY;

-- Students can see their own requests
CREATE POLICY "Students can view own requests" ON public.mentor_requests
  FOR SELECT USING (auth.uid() = student_id);

-- Mentors can see requests sent to them
CREATE POLICY "Mentors can view incoming requests" ON public.mentor_requests
  FOR SELECT USING (auth.uid() = mentor_id);

-- Students can send requests
CREATE POLICY "Students can send requests" ON public.mentor_requests
  FOR INSERT WITH CHECK (auth.uid() = student_id);

-- Mentors can update request status
CREATE POLICY "Mentors can update request status" ON public.mentor_requests
  FOR UPDATE USING (auth.uid() = mentor_id);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.mentor_requests;

-- Trigger: Notify mentor when a student requests mentorship
CREATE OR REPLACE FUNCTION public.notify_mentor_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  student_name TEXT;
BEGIN
  SELECT name INTO student_name FROM public.profiles WHERE user_id = NEW.student_id;

  IF NEW.status = 'pending' THEN
    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (
      NEW.mentor_id,
      'mentor_request',
      'New Mentorship Request 🎓',
      COALESCE(student_name, 'A student') || ' wants you as their mentor',
      '/mentors'
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_mentor_request ON public.mentor_requests;
CREATE TRIGGER on_mentor_request
  AFTER INSERT ON public.mentor_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_mentor_request();

-- Trigger: Notify student when mentor accepts/rejects
CREATE OR REPLACE FUNCTION public.notify_mentor_request_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  mentor_name TEXT;
BEGIN
  SELECT name INTO mentor_name FROM public.profiles WHERE user_id = NEW.mentor_id;

  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (
      NEW.student_id,
      'mentor_accepted',
      'Mentorship Accepted! 🎉',
      COALESCE(mentor_name, 'A mentor') || ' accepted your mentorship request! You can now message them.',
      '/messages'
    );
  ELSIF NEW.status = 'rejected' AND OLD.status = 'pending' THEN
    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (
      NEW.student_id,
      'mentor_rejected',
      'Mentorship Request Update',
      'Your mentorship request was not accepted at this time.',
      '/mentors'
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_mentor_request_update ON public.mentor_requests;
CREATE TRIGGER on_mentor_request_update
  AFTER UPDATE ON public.mentor_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_mentor_request_update();
