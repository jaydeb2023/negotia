import { createContext, useContext } from 'react';
import { useSession } from 'next-auth/react';

const AuthContext = createContext({ user: null, profile: null, loading: true, isAdmin: false });

// Same shape as before ({ user, profile, loading, isAdmin }) so the pages need no changes,
// but now backed by our own login (NextAuth) instead of Supabase.
export function AuthProvider({ children }) {
  const { data: session, status } = useSession();
  const u = session?.user || null;

  const value = {
    user: u ? { id: u.id, email: u.email } : null,
    profile: u ? { full_name: u.full_name, role: u.role } : null,
    loading: status === 'loading',
    isAdmin: u?.role === 'admin',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
