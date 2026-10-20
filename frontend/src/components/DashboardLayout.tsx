import React, { useState } from 'react';
import { NavLink, Link, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';
import {
  LayoutDashboard,
  User,
  FolderGit2,
  Briefcase,
  FileText,
  Users,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Shield,
  Layers,
  GraduationCap,
  Building2,
} from 'lucide-react';

interface DashboardLayoutProps {
  children?: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getRoleDetails = (role?: string) => {
    switch (role) {
      case 'student':
        return {
          label: 'Student Portal',
          icon: GraduationCap,
          badge: 'Student',
          navItems: [
            { to: '/student/dashboard', label: 'Overview', icon: LayoutDashboard },
            { to: '/student/profile', label: 'My Profile', icon: User },
            { to: '/student/skills-projects', label: 'Skills & Projects', icon: FolderGit2 },
            { to: '/student/opportunities', label: 'Explore Opportunities', icon: Briefcase },
            { to: '/student/applications', label: 'My Applications', icon: FileText },
          ],
        };
      case 'faculty':
        return {
          label: 'Faculty Console',
          icon: Users,
          badge: 'Faculty / Mentor',
          navItems: [
            { to: '/faculty/dashboard', label: 'Console Overview', icon: LayoutDashboard },
            { to: '/faculty/cohorts', label: 'Student Cohorts', icon: GraduationCap },
            { to: '/faculty/opportunities', label: 'Department Listings', icon: Briefcase },
          ],
        };
      case 'placement_officer':
      case 'admin':
        return {
          label: 'Placement Cell',
          icon: Building2,
          badge: 'Placement Officer',
          navItems: [
            { to: '/placement/dashboard', label: 'Placement Console', icon: LayoutDashboard },
            { to: '/placement/opportunities', label: 'Manage Opportunities', icon: Briefcase },
            { to: '/placement/applications', label: 'Student Applications', icon: Layers },
          ],
        };
      default:
        return {
          label: 'Campus Member',
          icon: Shield,
          badge: 'Member',
          navItems: [],
        };
    }
  };

  const roleConfig = getRoleDetails(user?.role);
  const RoleIcon = roleConfig.icon;

  return (
    <div className="min-h-screen bg-[#F4F7FB] flex text-[#14243A]">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200/90 shrink-0">
        {/* Brand Header */}
        <div className="h-16 px-6 flex items-center border-b border-slate-100">
          <Link to="/" className="group flex items-center">
            <Logo size={32} />
          </Link>
        </div>

        {/* Role Portal Label */}
        <div className="px-6 py-4 border-b border-slate-100 bg-[#F4F7FB]/50">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#2878B8]">
            <RoleIcon size={16} />
            <span>{roleConfig.label}</span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
          {roleConfig.navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition ${
                    isActive
                      ? 'bg-[#2878B8] text-white shadow-xs'
                      : 'text-slate-600 hover:text-[#14243A] hover:bg-[#F4F7FB]'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3">
                      <Icon size={18} className={isActive ? 'text-white' : 'text-slate-400'} />
                      <span>{item.label}</span>
                    </div>
                    {isActive && <ChevronRight size={14} className="text-white/80" />}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User Account & Logout in Sidebar Footer */}
        <div className="p-4 border-t border-slate-100 bg-[#F4F7FB]/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-[#2878B8]/10 text-[#2878B8] font-bold text-xs flex items-center justify-center shrink-0">
                {user?.full_name ? user.full_name[0].toUpperCase() : 'U'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#14243A] truncate">{user?.full_name}</p>
                <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/90 flex items-center justify-between px-4 sm:px-6 lg:px-8 z-20">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="hidden sm:block text-xs font-semibold text-slate-500">
              CampusOrbit Portal &middot; Academic Year 2026&ndash;2027
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#2878B8]/10 text-[#2878B8] rounded-full text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2878B8]"></span>
              <span>{roleConfig.badge}</span>
            </span>

            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200 text-xs font-medium text-slate-600">
              <span>{user?.email}</span>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition border border-slate-200/80"
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 p-4 space-y-1.5 shadow-sm">
            <div className="pb-2 mb-2 border-b border-slate-100 flex items-center justify-between text-xs font-semibold text-[#2878B8]">
              <span>{roleConfig.label}</span>
              <span className="text-slate-500">{user?.email}</span>
            </div>
            {roleConfig.navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                      isActive ? 'bg-[#2878B8] text-white' : 'text-slate-600 hover:bg-[#F4F7FB]'
                    }`
                  }
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
            <div className="pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl transition"
              >
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}

        {/* Main Workspace Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">{children ?? <Outlet />}</div>
        </main>
      </div>
    </div>
  );
}
