import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';

const NAV = [
  { to: '/', label: 'Overview', exact: true },
  { to: '/trends', label: 'Trends' },
  { to: '/questions', label: 'Questions' },
  { to: '/users', label: 'Users' },
  { to: '/funnel', label: 'Funnel' },
  { to: '/alerts', label: 'Alerts' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r border-[var(--border)] bg-[var(--bg-1)] flex flex-col">
        <div className="px-4 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-[var(--accent)] flex items-center justify-center text-white text-sm font-bold">C</div>
            <div>
              <div className="text-sm font-semibold text-neutral-50">CertiPractice</div>
              <div className="text-[10px] uppercase tracking-wider text-neutral-500">Admin</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-2">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="p-3 border-t border-[var(--border)]">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <div className="text-xs font-medium text-neutral-200 truncate">{user?.username || user?.email}</div>
              <div className="text-[11px] text-neutral-500">{user?.role}</div>
            </div>
            <button
              onClick={logout}
              className="btn btn-ghost text-xs"
              title="Sign out"
            >
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 overflow-x-hidden">
        <div className="px-8 py-6">
          <Outlet key={location.pathname} />
        </div>
      </main>
    </div>
  );
}
