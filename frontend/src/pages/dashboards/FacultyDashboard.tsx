import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Users,
  GraduationCap,
  Briefcase,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export default function FacultyDashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#2878B8]/10 text-[#2878B8] rounded-full text-xs font-semibold">
              <Users size={15} />
              <span>Faculty &amp; Mentor Console</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#14243A]">
              Welcome, {user?.full_name || 'Professor'}!
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
              Monitor your assigned academic advisees, review verified project portfolios and skill stacks, and explore live campus placement drives.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <Link
              to="/faculty/cohorts"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#2878B8] hover:bg-[#20639B] text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition"
            >
              <GraduationCap size={16} />
              <span>View Cohorts</span>
            </Link>
            <Link
              to="/faculty/opportunities"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-[#14243A] border border-slate-200 text-xs sm:text-sm font-semibold rounded-xl transition"
            >
              <Briefcase size={16} />
              <span>View Opportunities</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Operational Modules - Exactly matching available working features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Module 1: Student Cohorts */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs flex flex-col justify-between hover:border-[#2878B8]/40 transition group">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#2878B8] flex items-center justify-center">
              <GraduationCap size={24} />
            </div>
            <div>
              <h3 className="font-bold text-[#14243A] text-base group-hover:text-[#2878B8] transition">
                Student Cohorts &amp; Mentorship
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
                Review assigned student advisees, inspect comprehensive technical project repositories, verified skill tags, and provide private or student-visible mentorship guidance.
              </p>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Advisee Roster &amp; Feedback</span>
            <Link
              to="/faculty/cohorts"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2878B8] hover:underline"
            >
              <span>Open Console</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* Module 2: Department Listings */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs flex flex-col justify-between hover:border-[#2878B8]/40 transition group">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <Briefcase size={24} />
            </div>
            <div>
              <h3 className="font-bold text-[#14243A] text-base group-hover:text-[#2878B8] transition">
                Campus Placement &amp; Internship Drives
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
                Browse verified corporate recruitment listings, minimum CGPA requirements, stipend offerings, and application deadlines to recommend suitable opportunities to your students.
              </p>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Institutional Opportunities</span>
            <Link
              to="/faculty/opportunities"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2878B8] hover:underline"
            >
              <span>Explore Listings</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>

      {/* Advisory Guidance Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-xs">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="p-2 rounded-xl bg-[#2878B8]/10 text-[#2878B8]">
            <Sparkles size={18} />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-[#14243A]">
              Faculty Advisory Guidelines
            </h2>
            <p className="text-xs text-slate-500">
              Guidance for effective student portfolio evaluation and mentorship
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-600 pt-2">
          <div className="p-3 bg-slate-50 border border-slate-200/70 rounded-xl space-y-1">
            <div className="font-semibold text-[#14243A]">Portfolio Verification</div>
            <p className="text-slate-500 leading-relaxed">
              Check students' GitHub repositories and live URLs to verify technical project complexity before interviews.
            </p>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200/70 rounded-xl space-y-1">
            <div className="font-semibold text-[#14243A]">Mentorship Privacy</div>
            <p className="text-slate-500 leading-relaxed">
              Use the visibility toggle to keep preliminary faculty notes private, or share recommendations directly with the student.
            </p>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200/70 rounded-xl space-y-1">
            <div className="font-semibold text-[#14243A]">Prerequisite Matching</div>
            <p className="text-slate-500 leading-relaxed">
              Verify minimum CGPA requirements against student standing before recommending high-demand corporate placement drives.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
