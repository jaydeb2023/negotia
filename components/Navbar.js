import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabaseClient';

export default function Navbar() {
  const router = useRouter();
  const { user, profile, isAdmin } = useAuth();
  const isActive = (path) => router.pathname === path;

  async function logout() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link href="/" className="brand">
          <span className="brand-mark">T</span> Transcend
        </Link>
        {user && (
          <div className="nav-links">
            <Link href="/" className={isActive('/') ? 'active' : ''}>Practice</Link>
            {isAdmin && <Link href="/dashboard" className={isActive('/dashboard') ? 'active' : ''}>Dashboard</Link>}
            {isAdmin && <Link href="/admin" className={isActive('/admin') ? 'active' : ''}>Admin</Link>}
            <a onClick={logout} style={{ cursor: 'pointer' }}>Sign out ({profile?.full_name || user.email})</a>
          </div>
        )}
      </div>
    </nav>
  );
}