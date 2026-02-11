'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { label: 'Overview', href: '/', icon: '📊' },
  { label: 'Orders', href: '/orders', icon: '📦' },
  { label: 'Payments', href: '/payments', icon: '💰' },
  { label: 'Follow-ups', href: '/follow-ups', icon: '📧' },
  { label: 'Manual Queue', href: '/manual-queue', icon: '⚡' },
  { label: 'Settings', href: '/settings', icon: '⚙️' },
  { label: 'Logs', href: '/logs', icon: '📝' },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="glass-card border-b-0 rounded-none sticky top-0 z-50 backdrop-blur-2xl">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-xl font-bold">
              🎯
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Mission Control
              </h1>
              <p className="text-xs text-slate-400">24/7 Operations</p>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center gap-2">
            {links.map(({ label, href, icon }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`
                    px-4 py-2 rounded-lg font-medium text-sm transition-all
                    flex items-center gap-2
                    ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/50'
                        : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
                    }
                  `}
                >
                  <span>{icon}</span>
                  <span>{label}</span>
                </Link>
              );
            })}
          </div>

          {/* Status Indicator */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
              <span className="text-xs font-medium text-emerald-400">Live</span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
