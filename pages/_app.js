import '../styles/globals.css';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import Navbar from '../components/Navbar';
import { AuthProvider, useAuth } from '../lib/AuthContext';

function Guard({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user && router.pathname !== '/login') {
      router.push('/login');
    }
  }, [loading, user, router.pathname]);

  if (loading) return <div className="page">Loading…</div>;
  if (!user && router.pathname !== '/login') return null;
  return children;
}

export default function App({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Navbar />
      <Guard>
        <Component {...pageProps} />
      </Guard>
    </AuthProvider>
  );
}