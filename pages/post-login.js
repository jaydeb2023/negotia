import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../lib/AuthContext';
import { homeFor } from '../lib/roles';

// After signing in (email or Google): send each person to their own home screen.
export default function PostLogin() {
  const { role, loading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!loading && role) router.replace(homeFor(role));
  }, [loading, role]);
  return <div className="pf-empty" style={{ paddingTop: 120 }}>Signing you in…</div>;
}
