-- Update notify_mentor_meeting to notify both mentor and student when a meeting is scheduled
CREATE OR REPLACE FUNCTION public.notify_mentor_meeting()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Notify mentor: student requested / meeting scheduled (mentor perspective)
  INSERT INTO public.notifications (user_id, type, title, message, link)
  VALUES (
    NEW.mentor_id,
    'mentor_meeting',
    'Meeting scheduled',
    concat('You scheduled a meeting with ', (SELECT coalesce(name,'the student') FROM public.profiles WHERE user_id = NEW.student_id), '. ',
      CASE WHEN NEW.meeting_link IS NOT NULL THEN concat('Join: ', NEW.meeting_link) ELSE '' END
    ),
    COALESCE(NEW.meeting_link, '/notifications')
  );

  -- Notify student: inform them their mentor scheduled a meeting (student perspective)
  INSERT INTO public.notifications (user_id, type, title, message, link)
  VALUES (
    NEW.student_id,
    'mentor_meeting',
    'Your mentor scheduled a meeting',
    concat((SELECT coalesce(name,'Your mentor') FROM public.profiles WHERE user_id = NEW.mentor_id), ' scheduled a meeting for you on ',
      to_char(NEW.scheduled_at AT TIME ZONE 'UTC','Dy, DD Mon YYYY HH24:MI UTC'), '. ',
      CASE WHEN NEW.meeting_link IS NOT NULL THEN concat('Join: ', NEW.meeting_link) ELSE '' END
    ),
    COALESCE(NEW.meeting_link, '/notifications')
  );

  RETURN NEW;
END;
$$;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_new_mentor_meeting ON public.mentor_meetings;
CREATE TRIGGER on_new_mentor_meeting
AFTER INSERT ON public.mentor_meetings
FOR EACH ROW EXECUTE PROCEDURE public.notify_mentor_meeting();
