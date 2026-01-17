import { Routes, Route, NavLink, Navigate } from 'react-router';
import { User, Plug, Users, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProfileSettings } from './ProfileSettings';
import { IntegrationsSettings } from './IntegrationsSettings';
import { TeamSettings } from './TeamSettings';
import { CompanySettings } from './CompanySettings';

const settingsNav = [
  { path: 'profile', label: 'Profile', icon: User },
  { path: 'integrations', label: 'Integrations', icon: Plug },
  { path: 'team', label: 'Team', icon: Users },
  { path: 'company', label: 'Company', icon: Building2 },
];

export function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-cool-dark">Settings</h1>
        <p className="text-sm text-grey">Manage your account and preferences</p>
      </div>

      <div className="flex gap-8">
        {/* Sidebar Navigation */}
        <nav className="w-48 shrink-0 space-y-1">
          {settingsNav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-brand-violet text-white'
                      : 'text-grey hover:bg-flash-white hover:text-cool-dark'
                  )
                }
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        {/* Content */}
        <div className="flex-1">
          <Routes>
            <Route index element={<Navigate to="profile" replace />} />
            <Route path="profile" element={<ProfileSettings />} />
            <Route path="integrations" element={<IntegrationsSettings />} />
            <Route path="team" element={<TeamSettings />} />
            <Route path="company" element={<CompanySettings />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}
