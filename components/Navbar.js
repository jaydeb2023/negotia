import Link from 'next/link';
import { useRouter } from 'next/router';

export default function Navbar() {
  const router = useRouter();
  const isActive = (path) => router.pathname === path;

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link href="/" className="brand">
          <span className="brand-mark">N</span> Negotia
        </Link>
        <div className="nav-links">
          <Link href="/" className={isActive('/') ? 'active' : ''}>Practice</Link>
          <Link href="/dashboard" className={isActive('/dashboard') ? 'active' : ''}>Dashboard</Link>
          <Link href="/admin" className={isActive('/admin') ? 'active' : ''}>Admin</Link>
        </div>
      </div>
    </nav>
  );
}