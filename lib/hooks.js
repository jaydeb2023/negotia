import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { api } from './http';
import { useAuth } from './AuthContext';
import { homeFor } from './roles';

// Loads JSON from our API. Pass null to skip. Returns { data, error, loading, reload }.
export function useApi(path) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(!!path);

  const load = useCallback(async () => {
    if (!path) return;
    setLoading(true);
    try {
      setData(await api(path));
      setError('');
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }, [path]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, error, loading, reload: load };
}

// Sends people who are not allowed on a page to their own home. Returns true when access is OK.
export function useRequireRole(roles) {
  const { role, loading } = useAuth();
  const router = useRouter();
  const allowed = !!role && roles.includes(role);
  useEffect(() => {
    if (!loading && role && !allowed) router.replace(homeFor(role));
  }, [loading, role, allowed]);
  return !loading && allowed;
}

// Company pages: a company admin is locked to their company. A super admin picks one with ?companyId=...
export function useCompanyScope() {
  const router = useRouter();
  const { role, loading } = useAuth();
  const isSuper = role === 'super_admin';
  const companyId = typeof router.query.companyId === 'string' ? router.query.companyId : '';
  const qs = isSuper && companyId ? `companyId=${companyId}` : '';
  const withQs = (path) => (qs ? `${path}${path.includes('?') ? '&' : '?'}${qs}` : path);

  useEffect(() => {
    if (!loading && router.isReady && isSuper && !companyId) router.replace('/super/companies');
  }, [loading, router.isReady, isSuper, companyId]);

  const ready = !loading && router.isReady && (role === 'company_admin' || (isSuper && !!companyId));
  return { ready, isSuper, companyId, qs, withQs };
}
