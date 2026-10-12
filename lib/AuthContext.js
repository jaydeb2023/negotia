import { createContext, useContext } from 'react';
import { useSession } from 'next-auth/react';

const AuthContext = createContext({ user: null, profile: null, loading: true, isAdmin: false, role: null });

// Login state for the whole app (NextAuth). `role` is one of:
// super_admin | company_admin | employee | individual
export function AuthProvider({ children }) {
  const { data: session, status } = useSession();
  const u = session?.user || null;

  const value = {
    user: u ? { id: u.id, email: u.email, company_id: u.company_id || null } : null,
    profile: u
      ? { full_name: u.full_name, role: u.role, company_id: u.company_id || null, company_name: u.company_name || null }
      : null,
    loading: status === 'loading',
    role: u?.role || null,
    isAdmin: u?.role === 'super_admin', // kept for older code: "admin" means super admin
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
