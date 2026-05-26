-- Allow mentors to create mentor_meetings as well as students
DROP POLICY IF EXISTS "Students can insert mentor meetings" ON public.mentor_meetings;

CREATE POLICY "Students or mentors can insert mentor meetings" ON public.mentor_meetings
  FOR INSERT WITH CHECK (auth.uid() = student_id OR auth.uid() = mentor_id);

-- Ensure select/delete policies still allow involved users
DROP POLICY IF EXISTS "Mentor or student can read" ON public.mentor_meetings;
CREATE POLICY "Mentor or student can read" ON public.mentor_meetings
  FOR SELECT USING (auth.uid() = mentor_id OR auth.uid() = student_id);

DROP POLICY IF EXISTS "Mentor or student can delete" ON public.mentor_meetings;
CREATE POLICY "Mentor can delete" ON public.mentor_meetings
  FOR DELETE USING (auth.uid() = mentor_id);
