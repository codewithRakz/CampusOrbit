import {
  UserPlus,
  LogOut,
  Compass,
  Briefcase,
  Users,
  ArrowRight,
  GraduationCap,
  Building2,
  Code2,
  FolderGit2,
  Sparkles,
  UserCheck,
  Layers,
  LayoutDashboard,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Logo from '../components/Logo';
import { useAuth } from '../context/AuthContext';
import { type UserRole } from '../services/auth';

export default function Home() {
  const { user, logout } = useAuth();
  const isLoggedIn = !!user;

  const getDashboardPath = (role?: UserRole) => {
    switch (role) {
      case 'student':
        return '/student/dashboard';
      case 'faculty':
        return '/faculty/dashboard';
      case 'placement_officer':
      case 'admin':
        return '/placement/dashboard';
      default:
        return '/';
    }
  };

  const getRoleDisplayName = (role?: string) => {
    switch (role) {
      case 'student':
        return 'Student';
      case 'faculty':
        return 'Faculty / Mentor';
      case 'placement_officer':
        return 'Placement Officer';
      case 'admin':
        return 'Administrator';
      default:
        return 'Campus Member';
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7FB] flex flex-col text-[#14243A] selection:bg-[#77BDF2]/30">
      {/* Header and Navigation */}
      <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="group flex items-center">
            <Logo size={34} />
          </Link>

          <nav className="flex items-center gap-3">
            {isLoggedIn && user ? (
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-[#F4F7FB] border border-slate-200/80 rounded-xl text-xs">
                  <div className="w-2 h-2 rounded-full bg-[#2878B8]"></div>
                  <span className="font-semibold text-[#14243A] hidden sm:inline">
                    {user.email}
                  </span>
                  <span className="text-slate-500 text-[11px] bg-white px-2 py-0.5 rounded-md border border-slate-200">
                    {getRoleDisplayName(user.role)}
                  </span>
                </div>
                <Link
                  to={getDashboardPath(user.role)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#2878B8] hover:bg-[#20639B] text-white text-xs font-semibold rounded-xl shadow-xs transition"
                >
                  <LayoutDashboard size={14} />
                  <span>Dashboard</span>
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-red-600 bg-white hover:bg-red-50 border border-slate-200 rounded-xl transition shadow-xs"
                >
                  <LogOut size={14} />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 sm:gap-3">
                <Link
                  to="/login"
                  className="px-3.5 py-2 text-xs sm:text-sm font-semibold text-[#14243A] hover:text-[#2878B8] transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2878B8] hover:bg-[#20639B] text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition"
                >
                  <UserPlus size={15} />
                  <span>Get Started</span>
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1">
        {/* Authenticated Workspace Section (When Logged In) */}
        {isLoggedIn && user && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
            <div className="bg-white/90 backdrop-blur-sm border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-xs">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#2878B8]/10 text-[#2878B8] rounded-md text-xs font-semibold mb-2">
                    <UserCheck size={14} />
                    <span>Workspace Active</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-[#14243A]">
                    Welcome back{user.full_name ? `, ${user.full_name}` : ''}!
                  </h2>
                  <p className="text-sm text-slate-600 mt-1">
                    Your next opportunity starts with your next step. You are signed in as{' '}
                    <span className="font-semibold text-[#14243A]">
                      {getRoleDisplayName(user.role)}
                    </span>.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    to={getDashboardPath(user.role)}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#2878B8] hover:bg-[#20639B] rounded-xl shadow-xs transition"
                  >
                    <LayoutDashboard size={15} />
                    <span>Open Dashboard</span>
                    <ArrowRight size={14} />
                  </Link>
                  <button
                    type="button"
                    onClick={logout}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-600 bg-[#F4F7FB] hover:bg-slate-200 rounded-xl transition"
                  >
                    <LogOut size={14} /> Sign Out
                  </button>
                </div>
              </div>

              {/* Status and quick navigation banner */}
              <div className="mt-5 p-4 bg-[#F4F7FB] border border-slate-200/80 rounded-xl flex items-start gap-3">
                <div className="p-2 bg-[#2878B8]/10 text-[#2878B8] rounded-lg shrink-0 mt-0.5">
                  <Layers size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#14243A] uppercase tracking-wider">
                    Connected to Campus Workspace
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Your authenticated session is active. Jump directly to your designated portal dashboard to view current academic metrics, drives, and campus records.
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Hero Section */}
        <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
            {/* Left: Text & Action Calls */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#2878B8]/10 border border-[#2878B8]/20 rounded-full text-xs font-semibold text-[#2878B8]">
                <Sparkles size={14} />
                <span>Campus Career &amp; Skill Development Platform</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-[44px] font-extrabold tracking-tight text-[#14243A] leading-[1.18]">
                Turn Your Campus Skills Into{' '}
                <span className="text-[#2878B8]">Career Opportunities</span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Build your skills, discover internships, showcase your progress, and connect learning with your next career step.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
                {isLoggedIn && user ? (
                  <Link
                    to={getDashboardPath(user.role)}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#2878B8] hover:bg-[#20639B] text-white text-sm font-semibold rounded-xl shadow-xs transition"
                  >
                    <LayoutDashboard size={16} />
                    <span>Go to My Dashboard</span>
                    <ArrowRight size={16} />
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/register"
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#2878B8] hover:bg-[#20639B] text-white text-sm font-semibold rounded-xl shadow-xs transition"
                    >
                      <span>Build Your Profile</span>
                      <ArrowRight size={16} />
                    </Link>
                    <Link
                      to="/login"
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-slate-50 text-[#14243A] border border-slate-300 text-sm font-semibold rounded-xl shadow-xs transition"
                    >
                      <Briefcase size={16} className="text-[#2878B8]" />
                      <span>Explore Opportunities</span>
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Right: Custom Student Journey Visual */}
            <div className="lg:col-span-5">
              <div className="bg-white/80 backdrop-blur-sm border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-xs relative overflow-hidden">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#14243A]">
                    Student Growth Journey
                  </span>
                  <span className="px-2.5 py-0.5 bg-[#77BDF2]/20 text-[#2878B8] text-[11px] font-semibold rounded-full">
                    Pathway Architecture
                  </span>
                </div>

                {/* Interactive visual timeline nodes */}
                <div className="mt-6 space-y-4">
                  {/* Step 1: Skills */}
                  <div className="p-3.5 bg-[#F4F7FB] border border-slate-200/70 rounded-2xl flex items-start gap-3 transition-transform hover:translate-x-1">
                    <div className="w-10 h-10 rounded-xl bg-[#2878B8] text-white flex items-center justify-center shrink-0">
                      <Code2 size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#14243A]">1. Master Core Skills</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Structured learning roadmaps across software, algorithms, and applied frameworks.
                      </p>
                    </div>
                  </div>

                  {/* Connecting line */}
                  <div className="ml-5 h-4 border-l-2 border-dashed border-[#2878B8]/40"></div>

                  {/* Step 2: Projects */}
                  <div className="p-3.5 bg-[#F4F7FB] border border-slate-200/70 rounded-2xl flex items-start gap-3 transition-transform hover:translate-x-1">
                    <div className="w-10 h-10 rounded-xl bg-[#77BDF2] text-[#14243A] flex items-center justify-center shrink-0">
                      <FolderGit2 size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#14243A]">2. Build Verified Portfolio</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Document major course projects, collaborative repos, and mentor-reviewed milestones.
                      </p>
                    </div>
                  </div>

                  {/* Connecting line */}
                  <div className="ml-5 h-4 border-l-2 border-dashed border-[#2878B8]/40"></div>

                  {/* Step 3: Opportunities */}
                  <div className="p-3.5 bg-[#F4F7FB] border border-slate-200/70 rounded-2xl flex items-start gap-3 transition-transform hover:translate-x-1">
                    <div className="w-10 h-10 rounded-xl bg-[#14243A] text-white flex items-center justify-center shrink-0">
                      <Briefcase size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#14243A]">3. Connect With Opportunities</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Discover verified internships, campus recruitment drives, and research fellowships.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer status inside visual */}
                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Integrated Academic Workflow</span>
                  <span className="text-[#2878B8] font-semibold">CampusOrbit Core</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Core Feature Section (Bento Grid) */}
        <section id="modules" className="py-14 bg-white border-y border-slate-200/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto text-center mb-12">
              <span className="text-xs font-bold uppercase tracking-wider text-[#2878B8]">
                Platform Capabilities
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#14243A] mt-1.5">
                Engineered for Campus Career Growth
              </h2>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                CampusOrbit unifies the skills discovery cycle into three dedicated pillars.
              </p>
            </div>

            {/* Bento-grid cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Bento Card 1: Skill Development */}
              <div className="bg-[#F4F7FB]/70 border border-slate-200 rounded-2xl p-6 flex flex-col justify-between hover:border-[#2878B8]/50 hover:shadow-sm transition-all duration-300">
                <div>
                  <div className="w-11 h-11 rounded-xl bg-[#2878B8]/10 text-[#2878B8] flex items-center justify-center mb-4">
                    <Compass size={22} />
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-[#14243A] text-base">Skill Development</h3>
                    <span className="px-2 py-0.5 bg-slate-200/80 text-slate-700 text-[11px] font-semibold rounded-md">
                      Planned
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Interactive learning pathways and technical skill roadmaps structured to bridge curriculum learning with industry competencies.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-500">
                  <span>Structured Learning</span>
                  <span className="text-[#2878B8] font-medium">Roadmaps</span>
                </div>
              </div>

              {/* Bento Card 2: Internship Discovery */}
              <div className="bg-[#F4F7FB]/70 border border-slate-200 rounded-2xl p-6 flex flex-col justify-between hover:border-[#2878B8]/50 hover:shadow-sm transition-all duration-300">
                <div>
                  <div className="w-11 h-11 rounded-xl bg-[#2878B8]/10 text-[#2878B8] flex items-center justify-center mb-4">
                    <Briefcase size={22} />
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-[#14243A] text-base">Internship Discovery</h3>
                    <span className="px-2 py-0.5 bg-slate-200/80 text-slate-700 text-[11px] font-semibold rounded-md">
                      Planned
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Curated listings for campus internships, industrial projects, hackathons, and company placement drives with transparent eligibility filters.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-500">
                  <span>Placement Opportunities</span>
                  <span className="text-[#2878B8] font-medium">Discovery</span>
                </div>
              </div>

              {/* Bento Card 3: Mentorship & Placement */}
              <div className="bg-[#F4F7FB]/70 border border-slate-200 rounded-2xl p-6 flex flex-col justify-between hover:border-[#2878B8]/50 hover:shadow-sm transition-all duration-300">
                <div>
                  <div className="w-11 h-11 rounded-xl bg-[#2878B8]/10 text-[#2878B8] flex items-center justify-center mb-4">
                    <Users size={22} />
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-[#14243A] text-base">Mentorship &amp; Placement</h3>
                    <span className="px-2 py-0.5 bg-slate-200/80 text-slate-700 text-[11px] font-semibold rounded-md">
                      Planned
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Dedicated faculty guidance consoles and placement officer pipelines to review student readiness and coordinate campus recruitment rounds.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-500">
                  <span>Campus Administration</span>
                  <span className="text-[#2878B8] font-medium">Coordination</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Role-Based Collaboration Section */}
        <section className="py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="max-w-2xl mx-auto text-center mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-[#2878B8]">
              Role-Based Access
            </span>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#14243A] mt-1.5">
              Built for Every Campus Stakeholder
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-2">
              Authentication supports distinct roles to coordinate academic growth and campus recruitment.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center gap-2.5 text-[#2878B8] font-bold text-sm mb-2">
                <GraduationCap size={18} />
                <span>Student</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Build a portfolio of competencies, verify project milestones, and discover eligible internship opportunities.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center gap-2.5 text-[#2878B8] font-bold text-sm mb-2">
                <Users size={18} />
                <span>Faculty / Mentor</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Mentor student cohorts, provide academic feedback, and validate student coursework achievements.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center gap-2.5 text-[#2878B8] font-bold text-sm mb-2">
                <Building2 size={18} />
                <span>Placement Officer</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Publish recruitment drives, verify applicant eligibility, and manage recruiter coordination.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Logo size={24} showWordmark={false} />
            <span className="font-semibold text-[#14243A]">CampusOrbit</span>
            <span>&middot; Learn. Build. Connect.</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Student Career Development</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
