-- Function to notify project creator when someone requests to join
CREATE OR REPLACE FUNCTION public.notify_project_join_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  project_title TEXT;
  project_creator_id UUID;
  sender_name TEXT;
BEGIN
  -- Get project details
  SELECT title, creator_id INTO project_title, project_creator_id 
  FROM public.projects 
  WHERE id = NEW.project_id;

  -- Get sender name
  SELECT name INTO sender_name 
  FROM public.profiles 
  WHERE user_id = NEW.user_id;

  -- Insert notification for the project creator
  IF NEW.status = 'pending' THEN
    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (
      project_creator_id,
      'project_request',
      'New Project Request',
      COALESCE(sender_name, 'A student') || ' requested to join your project "' || project_title || '"',
      '/project/' || NEW.project_id
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Function to notify requester when their request is accepted/rejected
CREATE OR REPLACE FUNCTION public.notify_project_request_status_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  project_title TEXT;
BEGIN
  -- Get project title
  SELECT title INTO project_title 
  FROM public.projects 
  WHERE id = NEW.project_id;

  -- Insert notification for the requester
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (
      NEW.user_id,
      'project_accepted',
      'Project Request Accepted 🎉',
      'Your request to join the project "' || project_title || '" has been accepted!',
      '/project/' || NEW.project_id
    );
  ELSIF NEW.status = 'rejected' AND OLD.status = 'pending' THEN
    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (
      NEW.user_id,
      'project_rejected',
      'Project Request Rejected',
      'Your request to join the project "' || project_title || '" was not accepted.',
      '/projects'
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Create triggers for project_members
DROP TRIGGER IF EXISTS on_project_join_request ON public.project_members;
CREATE TRIGGER on_project_join_request
  AFTER INSERT ON public.project_members
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_project_join_request();

DROP TRIGGER IF EXISTS on_project_request_status_update ON public.project_members;
CREATE TRIGGER on_project_request_status_update
  AFTER UPDATE ON public.project_members
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_project_request_status_update();

-- Enable Realtime for project_members
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'project_members'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.project_members;
  END IF;
END $$;
