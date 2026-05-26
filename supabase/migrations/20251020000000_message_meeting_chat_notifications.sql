-- =============================================
-- TRIGGER 1: Notify when someone sends a Direct Message
-- =============================================
CREATE OR REPLACE FUNCTION public.notify_new_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sender_name TEXT;
BEGIN
  -- Get sender name
  SELECT name INTO sender_name
  FROM public.profiles
  WHERE user_id = NEW.sender_id;

  -- Insert notification for the receiver
  INSERT INTO public.notifications (user_id, type, title, message, link)
  VALUES (
    NEW.receiver_id,
    'new_message',
    'New Message 💬',
    COALESCE(sender_name, 'Someone') || ' sent you a message',
    '/messages'
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_new_message ON public.messages;
CREATE TRIGGER on_new_message
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_message();


-- =============================================
-- TRIGGER 2: Notify all project members when a meeting is scheduled
-- =============================================
CREATE OR REPLACE FUNCTION public.notify_new_project_meeting()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  project_title TEXT;
  project_creator UUID;
  scheduler_name TEXT;
  member_record RECORD;
BEGIN
  -- Get project details
  SELECT title, creator_id INTO project_title, project_creator
  FROM public.projects
  WHERE id = NEW.project_id;

  -- Get scheduler name
  SELECT name INTO scheduler_name
  FROM public.profiles
  WHERE user_id = NEW.created_by;

  -- Notify project creator (if they are NOT the one who scheduled)
  IF project_creator IS NOT NULL AND project_creator != NEW.created_by THEN
    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (
      project_creator,
      'meeting_scheduled',
      'New Meeting Scheduled 📅',
      COALESCE(scheduler_name, 'A team member') || ' scheduled "' || NEW.title || '" for project "' || project_title || '"',
      '/project/' || NEW.project_id
    );
  END IF;

  -- Notify all accepted members (except the scheduler)
  FOR member_record IN
    SELECT user_id FROM public.project_members
    WHERE project_id = NEW.project_id
    AND status = 'accepted'
    AND user_id != NEW.created_by
  LOOP
    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (
      member_record.user_id,
      'meeting_scheduled',
      'New Meeting Scheduled 📅',
      COALESCE(scheduler_name, 'A team member') || ' scheduled "' || NEW.title || '" for project "' || project_title || '"',
      '/project/' || NEW.project_id
    );
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_new_project_meeting ON public.project_meetings;
CREATE TRIGGER on_new_project_meeting
  AFTER INSERT ON public.project_meetings
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_project_meeting();


-- =============================================
-- TRIGGER 3: Notify project members when a new chat message is sent
-- (Only notifies if they haven't been notified in the last 5 minutes to avoid spam)
-- =============================================
CREATE OR REPLACE FUNCTION public.notify_new_project_chat()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  project_title TEXT;
  project_creator UUID;
  sender_name TEXT;
  member_record RECORD;
  recent_notif_exists BOOLEAN;
BEGIN
  -- Get project details
  SELECT title, creator_id INTO project_title, project_creator
  FROM public.projects
  WHERE id = NEW.project_id;

  -- Get sender name
  SELECT name INTO sender_name
  FROM public.profiles
  WHERE user_id = NEW.user_id;

  -- Notify project creator (if not the sender)
  IF project_creator IS NOT NULL AND project_creator != NEW.user_id THEN
    -- Check if we already sent a chat notification in the last 5 minutes
    SELECT EXISTS (
      SELECT 1 FROM public.notifications
      WHERE user_id = project_creator
      AND type = 'project_chat'
      AND link = '/project/' || NEW.project_id
      AND created_at > NOW() - INTERVAL '5 minutes'
    ) INTO recent_notif_exists;

    IF NOT recent_notif_exists THEN
      INSERT INTO public.notifications (user_id, type, title, message, link)
      VALUES (
        project_creator,
        'project_chat',
        'New Team Chat Message 💬',
        COALESCE(sender_name, 'A team member') || ' sent a message in "' || project_title || '"',
        '/project/' || NEW.project_id
      );
    END IF;
  END IF;

  -- Notify all accepted members (except the sender)
  FOR member_record IN
    SELECT user_id FROM public.project_members
    WHERE project_id = NEW.project_id
    AND status = 'accepted'
    AND user_id != NEW.user_id
  LOOP
    SELECT EXISTS (
      SELECT 1 FROM public.notifications
      WHERE user_id = member_record.user_id
      AND type = 'project_chat'
      AND link = '/project/' || NEW.project_id
      AND created_at > NOW() - INTERVAL '5 minutes'
    ) INTO recent_notif_exists;

    IF NOT recent_notif_exists THEN
      INSERT INTO public.notifications (user_id, type, title, message, link)
      VALUES (
        member_record.user_id,
        'project_chat',
        'New Team Chat Message 💬',
        COALESCE(sender_name, 'A team member') || ' sent a message in "' || project_title || '"',
        '/project/' || NEW.project_id
      );
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_new_project_chat ON public.project_messages;
CREATE TRIGGER on_new_project_chat
  AFTER INSERT ON public.project_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_project_chat();
