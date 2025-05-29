-- Create a function to check if a user has the 'admin' role
CREATE OR REPLACE FUNCTION check_admin_role(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Assuming a 'user_roles' table exists with 'user_id' and 'role' columns
  -- and 'admin' is a valid role.
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_roles.user_id = check_admin_role.user_id
    AND user_roles.role = 'admin'
  );
END;
$$;

-- Grant usage to authenticated users
GRANT EXECUTE ON FUNCTION check_admin_role(UUID) TO authenticated;