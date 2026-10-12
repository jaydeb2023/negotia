import '../styles/globals.css';
import '../styles/platform.css';
import '../styles/practice.css';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import Head from 'next/head';
import { SessionProvider } from 'next-auth/react';
import { AuthProvider, useAuth } from '../lib/AuthContext';

// Pages that need a signed-in person are wrapped by this.
function Guard({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace(`/login?next=${encodeURIComponent(router.asPath)}`);
  }, [loading, user]);

  if (loading || !user) return <div className="pf-empty" style={{ paddingTop: 120 }}>Loading…</div>;
  return children;
}

// A page can set:  Page.public = true  (no login needed)   Page.getLayout = (page) => <Layout>{page}</Layout>
export default function App({ Component, pageProps }) {
  const getLayout = Component.getLayout || ((page) => page);
  const page = getLayout(<Component {...pageProps} />);

  return (
    <SessionProvider session={pageProps.session}>
      <AuthProvider>
        <Head>
          <title>Transcend | Sales Negotiation Training</title>
          <link rel="icon" type="image/png" href="/favicon.png" />
        </Head>
        {Component.public ? page : <Guard>{page}</Guard>}
      </AuthProvider>
    </SessionProvider>
  );
}
