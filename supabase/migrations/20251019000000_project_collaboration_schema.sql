-- Create project_messages table for team chat
CREATE TABLE IF NOT EXISTS public.project_messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create project_meetings table for team scheduling
CREATE TABLE IF NOT EXISTS public.project_meetings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  meeting_link text NOT NULL,
  scheduled_at timestamp with time zone NOT NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.project_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_meetings ENABLE ROW LEVEL SECURITY;

-- Helper function to check if a user is an accepted member or creator of a project
CREATE OR REPLACE FUNCTION public.is_project_collaborator(proj_id uuid, usr_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.projects 
    WHERE id = proj_id AND creator_id = usr_id
  ) OR EXISTS (
    SELECT 1 FROM public.project_members 
    WHERE project_id = proj_id AND user_id = usr_id AND status = 'accepted'
  );
END;
$$;

-- RLS Policies for project_messages
CREATE POLICY "Collaborators can read messages" ON public.project_messages
  FOR SELECT USING (public.is_project_collaborator(project_id, auth.uid()));

CREATE POLICY "Collaborators can post messages" ON public.project_messages
  FOR INSERT WITH CHECK (
    public.is_project_collaborator(project_id, auth.uid()) 
    AND auth.uid() = user_id
  );

-- RLS Policies for project_meetings
CREATE POLICY "Collaborators can read meetings" ON public.project_meetings
  FOR SELECT USING (public.is_project_collaborator(project_id, auth.uid()));

CREATE POLICY "Collaborators can schedule meetings" ON public.project_meetings
  FOR INSERT WITH CHECK (
    public.is_project_collaborator(project_id, auth.uid()) 
    AND auth.uid() = created_by
  );

CREATE POLICY "Collaborators can delete meetings" ON public.project_meetings
  FOR DELETE USING (
    public.is_project_collaborator(project_id, auth.uid()) 
    AND (
      auth.uid() = created_by 
      OR EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND creator_id = auth.uid())
    )
  );

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_meetings;
