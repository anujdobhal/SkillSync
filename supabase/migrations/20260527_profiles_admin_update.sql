-- Allow admins to update profiles (so they can approve mentors)
-- This makes sure users can update their own profile and admins can update any profile

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;
CREATE POLICY "Admins can update profiles" ON public.profiles FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));
