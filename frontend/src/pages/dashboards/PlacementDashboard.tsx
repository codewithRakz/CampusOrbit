import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  fetchOpportunities,
  type OpportunityResponse,
} from '../../services/opportunities';
import {
  Building2,
  Briefcase,
  Layers,
  PlusCircle,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Users,
} from 'lucide-react';

export default function PlacementDashboard() {
  const { user } = useAuth();
  const [opportunities, setOpportunities] = useState<OpportunityResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadStats() {
      try {
        setLoading(true);
        const data = await fetchOpportunities();
        setOpportunities(data);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setErrorMessage(err.message);
        } else {
          setErrorMessage('Could not load placement statistics.');
        }
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  const totalDrives = opportunities.length;
  const activeDrives = opportunities.filter((o) => o.is_active).length;
  const myDrives = opportunities.filter(
    (o) => o.posted_by_id === user?.id || user?.role === 'admin'
  ).length;

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#2878B8]/10 text-[#2878B8] rounded-full text-xs font-semibold">
              <Building2 size={15} />
              <span>Placement Cell &middot; Administrative Console</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#14243A]">
              Welcome, {user?.full_name || 'Placement Officer'}!
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
              Campus placement operations console. Publish corporate opportunities, verify prerequisite CGPA criteria, and review candidate applicant pipelines.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <Link
              to="/placement/opportunities"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#2878B8] hover:bg-[#20639B] text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition"
            >
              <PlusCircle size={16} />
              <span>Manage Opportunities</span>
            </Link>
            <Link
              to="/placement/applications"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-[#14243A] border border-slate-200 text-xs sm:text-sm font-semibold rounded-xl transition"
            >
              <Layers size={16} />
              <span>Review Applications</span>
            </Link>
          </div>
        </div>

        {errorMessage && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Real Live Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#2878B8] flex items-center justify-center shrink-0">
            <Briefcase size={22} />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Total Opportunities</div>
            <div className="text-2xl font-extrabold text-[#14243A]">
              {loading ? <Loader2 size={18} className="animate-spin text-slate-400 mt-1" /> : totalDrives}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Active Campus Drives</div>
            <div className="text-2xl font-extrabold text-emerald-700">
              {loading ? <Loader2 size={18} className="animate-spin text-slate-400 mt-1" /> : activeDrives}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Users size={22} />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Posted by Your Office</div>
            <div className="text-2xl font-extrabold text-purple-700">
              {loading ? <Loader2 size={18} className="animate-spin text-slate-400 mt-1" /> : myDrives}
            </div>
          </div>
        </div>
      </div>

      {/* Core Action Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Module 1: Manage Opportunities */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs flex flex-col justify-between hover:border-[#2878B8]/40 transition group">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2878B8] flex items-center justify-center">
              <Briefcase size={20} />
            </div>
            <div>
              <h3 className="font-bold text-[#14243A] text-base group-hover:text-[#2878B8] transition">
                Opportunity Management
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
                Publish new internship and placement drives, configure CGPA eligibility thresholds, set compensation terms, and safely deactivate concluded drives.
              </p>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Recruitment Drives</span>
            <Link
              to="/placement/opportunities"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2878B8] hover:underline"
            >
              <span>Manage Drives</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* Module 2: Candidate Review */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs flex flex-col justify-between hover:border-[#2878B8]/40 transition group">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <Layers size={20} />
            </div>
            <div>
              <h3 className="font-bold text-[#14243A] text-base group-hover:text-[#2878B8] transition">
                Application Review Console
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
                Inspect incoming student submissions, verify candidate portfolios and academic standings, and update applicant review statuses in real time.
              </p>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Candidate Pipelines</span>
            <Link
              to="/placement/applications"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2878B8] hover:underline"
            >
              <span>Review Candidates</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
