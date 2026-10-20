import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  fetchMyMentorshipNotes,
  type StudentMentorshipItem,
} from '../../services/faculty';
import {
  GraduationCap,
  User,
  FolderGit2,
  Briefcase,
  FileText,
  ArrowRight,
  MessageSquare,
  Calendar,
  Sparkles,
} from 'lucide-react';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [mentorshipNotes, setMentorshipNotes] = useState<StudentMentorshipItem[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(true);

  useEffect(() => {
    async function loadMentorship() {
      try {
        setLoadingNotes(true);
        const notes = await fetchMyMentorshipNotes();
        setMentorshipNotes(notes);
      } catch {
        setMentorshipNotes([]);
      } finally {
        setLoadingNotes(false);
      }
    }

    loadMentorship();
  }, []);

  return (
    <div className="space-y-8">
      {/* Welcome & Profile Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#2878B8]/10 text-[#2878B8] rounded-full text-xs font-semibold">
              <GraduationCap size={15} />
              <span>Student Workspace</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#14243A]">
              Welcome back, {user?.full_name || 'Student'}!
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
              Your central campus workspace. Keep your academic profile up to date, showcase verified skills and projects, and discover campus internship opportunities.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <Link
              to="/student/profile"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#2878B8] hover:bg-[#20639B] text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition"
            >
              <User size={16} />
              <span>Edit Profile</span>
            </Link>
            <Link
              to="/student/opportunities"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-[#14243A] border border-slate-200 text-xs sm:text-sm font-semibold rounded-xl transition"
            >
              <Briefcase size={16} />
              <span>Explore Roles</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Core Workspace Modules */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Module 1: Profile & Bio */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between hover:border-[#2878B8]/40 transition group">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2878B8] flex items-center justify-center">
              <User size={20} />
            </div>
            <div>
              <h3 className="font-bold text-[#14243A] text-sm group-hover:text-[#2878B8] transition">
                Academic Profile
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Department, year of study, cumulative CGPA, social links, and biography.
              </p>
            </div>
          </div>
          <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Personal Details</span>
            <Link
              to="/student/profile"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#2878B8] hover:underline"
            >
              <span>Manage</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>

        {/* Module 2: Skills & Projects */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between hover:border-[#2878B8]/40 transition group">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FolderGit2 size={20} />
            </div>
            <div>
              <h3 className="font-bold text-[#14243A] text-sm group-hover:text-[#2878B8] transition">
                Skills &amp; Projects
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Showcase rated technical proficiencies, project repositories, and live demo links.
              </p>
            </div>
          </div>
          <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Portfolio Showcase</span>
            <Link
              to="/student/skills-projects"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#2878B8] hover:underline"
            >
              <span>Manage</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>

        {/* Module 3: Opportunities */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between hover:border-[#2878B8]/40 transition group">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <Briefcase size={20} />
            </div>
            <div>
              <h3 className="font-bold text-[#14243A] text-sm group-hover:text-[#2878B8] transition">
                Campus Opportunities
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Explore active internships, check CGPA eligibility criteria, and view requirements.
              </p>
            </div>
          </div>
          <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Recruitment Drives</span>
            <Link
              to="/student/opportunities"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#2878B8] hover:underline"
            >
              <span>Browse</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>

        {/* Module 4: My Applications */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between hover:border-[#2878B8]/40 transition group">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <FileText size={20} />
            </div>
            <div>
              <h3 className="font-bold text-[#14243A] text-sm group-hover:text-[#2878B8] transition">
                Application Tracker
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Monitor status updates from Applied to Review, Shortlisted, and Placement offers.
              </p>
            </div>
          </div>
          <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Status History</span>
            <Link
              to="/student/applications"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#2878B8] hover:underline"
            >
              <span>Track</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </div>

      {/* Faculty Mentorship Feedback Section (Real User Data) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#2878B8]/10 text-[#2878B8]">
            <MessageSquare size={18} />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#14243A]">
              Faculty Mentorship Guidance
            </h2>
            <p className="text-xs text-slate-500">
              Personalized academic and career recommendations shared by your faculty advisors
            </p>
          </div>
        </div>

        {!loadingNotes && mentorshipNotes.length > 0 ? (
          <div className="space-y-3 pt-1">
            {mentorshipNotes.map((item) => (
              <div
                key={item.id}
                className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="font-bold text-[#14243A]">
                    {item.faculty_name}
                    <span className="text-slate-400 font-normal ml-1.5">({item.faculty_email})</span>
                  </div>
                  {item.updated_at && (
                    <div className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Calendar size={12} />
                      <span>{new Date(item.updated_at).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed italic">
                  "{item.notes}"
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 bg-slate-50 border border-slate-200/70 rounded-xl text-xs text-slate-600 flex items-start gap-3">
            <Sparkles size={16} className="text-[#2878B8] shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              No faculty guidance shared yet. Once your faculty advisor evaluates your profile and verified projects, their recommendations will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
