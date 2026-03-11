import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../../hooks/useAuth';
import { useAlerts } from '../../hooks/useAlerts';
import { Activity, BarChart2, LogIn, LogOut, Shield } from 'lucide-react';
import clsx from 'clsx';
import { ReactNode } from 'react';

export default function Layout({ children }: { children: ReactNode }) {
  const { user, signIn, signOut } = useAuth();
  const { connected } = useAlerts();
  const router = useRouter();

  return (
    <div className="min-h-screen bg-brand-dark flex flex-col">
      {/* Top nav */}
      <nav className="border-b border-brand-border sticky top-0 z-50 bg-brand-dark/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 text-white font-bold text-lg">
            <span className="text-2xl">🦅</span>
            <span>Tarsier<span className="text-brand-accent">Alpha</span></span>
            <span className="text-xs text-gray-500 font-normal mt-0.5">v2</span>
          </Link>

          {/* Nav links */}
          <div className="hidden sm:flex items-center gap-1">
            <NavLink href="/" active={router.pathname === '/'}>
              <Activity size={15} /> Scanner
            </NavLink>
            <NavLink href="/dashboard" active={router.pathname === '/dashboard'}>
              <BarChart2 size={15} /> Portfolio
            </NavLink>
            <NavLink href="/blog/short-risks" active={false}>
              <Shield size={15} /> Risk Docs
            </NavLink>
          </div>

          {/* Right: WS status + auth */}
          <div className="flex items-center gap-3">
            {/* Live indicator */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className={clsx('w-2 h-2 rounded-full', connected ? 'bg-green-400 animate-pulse' : 'bg-gray-600')} />
              <span className={connected ? 'text-green-400' : 'text-gray-500'}>
                {connected ? 'Live' : 'Offline'}
              </span>
            </div>

            {user ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 hidden sm:block">{user.email}</span>
                <button onClick={() => signOut()} className="p-1.5 rounded-lg hover:bg-brand-border transition-colors text-gray-400 hover:text-white">
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <button onClick={signIn} className="flex items-center gap-1.5 text-sm px-3 py-1.5 bg-brand-accent/20 hover:bg-brand-accent/30 text-brand-accent rounded-lg transition-colors border border-brand-accent/30">
                <LogIn size={14} /> Sign In
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        {children}
      </main>

      <footer className="border-t border-brand-border py-4 text-center text-xs text-gray-600">
        TarsierAlpha — Paper trades only. Not financial advice.&nbsp;
        <Link href="/blog/short-risks" className="underline hover:text-gray-400">Learn about short risks</Link>
      </footer>
    </div>
  );
}

function NavLink({ href, active, children }: { href: string; active: boolean; children: ReactNode }) {
  return (
    <Link
      href={href}
      className={clsx(
        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors',
        active
          ? 'bg-brand-accent/20 text-brand-accent'
          : 'text-gray-400 hover:text-white hover:bg-brand-border'
      )}
    >
      {children}
    </Link>
  );
}
