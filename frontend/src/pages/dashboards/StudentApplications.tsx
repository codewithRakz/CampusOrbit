import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  fetchMyApplications,
  type ApplicationWithOpportunityResponse,
  type ApplicationStatus,
} from '../../services/applications';
import {
  FileText,
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  ArrowLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

export default function StudentApplications() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [applications, setApplications] = useState<ApplicationWithOpportunityResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadApplications = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const data = await fetchMyApplications();
      setApplications(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.message.includes('session has expired')) {
          logout();
          navigate('/login');
          return;
        }
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to load application history. Please refresh.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, []);

  // Compute metrics from actual application records
  const totalCount = applications.length;
  const underReviewCount = applications.filter((a) => a.status === 'under_review').length;
  const shortlistedCount = applications.filter((a) => a.status === 'shortlisted').length;
  const acceptedCount = applications.filter((a) => a.status === 'accepted').length;

  const getStatusBadge = (status: ApplicationStatus) => {
    switch (status) {
      case 'applied':
        return {
          label: 'Applied',
          color: 'bg-blue-50 text-[#2878B8] border-blue-200',
          icon: Clock,
        };
      case 'under_review':
        return {
          label: 'Under Review',
          color: 'bg-amber-50 text-amber-800 border-amber-200',
          icon: Clock,
        };
      case 'shortlisted':
        return {
          label: 'Shortlisted',
          color: 'bg-purple-50 text-purple-800 border-purple-200',
          icon: Sparkles,
        };
      case 'accepted':
        return {
          label: 'Accepted / Offered',
          color: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          icon: CheckCircle2,
        };
      case 'rejected':
        return {
          label: 'Not Selected',
          color: 'bg-rose-50 text-rose-800 border-rose-200',
          icon: AlertCircle,
        };
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/90 p-12 shadow-xs text-center">
        <div className="inline-flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-[#2878B8]" />
          <h3 className="text-base font-semibold text-[#14243A]">Loading your applications...</h3>
          <p className="text-xs text-slate-500">Checking recruitment pipeline records</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <div>
        <Link
          to="/student/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#2878B8] transition"
        >
          <ArrowLeft size={14} />
          <span>Back to Overview</span>
        </Link>
      </div>

      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#2878B8]/10 text-[#2878B8] rounded-full text-xs font-semibold">
              <FileText size={15} />
              <span>Application Pipeline &middot; Live Status</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#14243A]">
              My Applications
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
              Track the progress of your submitted internship and placement applications. Review status updates from campus recruiters in real time.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 shrink-0">
            <div className="bg-[#F4F7FB] border border-slate-200/80 rounded-2xl px-4 py-3 text-center min-w-[80px]">
              <span className="block text-lg font-extrabold text-[#14243A]">{totalCount}</span>
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                Total
              </span>
            </div>
            <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl px-4 py-3 text-center min-w-[80px]">
              <span className="block text-lg font-extrabold text-amber-800">{underReviewCount}</span>
              <span className="text-[10px] font-semibold text-amber-700 uppercase tracking-wider">
                In Review
              </span>
            </div>
            <div className="bg-purple-50/60 border border-purple-200/80 rounded-2xl px-4 py-3 text-center min-w-[80px]">
              <span className="block text-lg font-extrabold text-purple-800">{shortlistedCount}</span>
              <span className="text-[10px] font-semibold text-purple-700 uppercase tracking-wider">
                Shortlisted
              </span>
            </div>
            <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl px-4 py-3 text-center min-w-[80px]">
              <span className="block text-lg font-extrabold text-emerald-800">{acceptedCount}</span>
              <span className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wider">
                Offers
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Global Alerts */}
      {errorMessage && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-red-50 border border-red-200/80 flex items-start gap-3 text-red-800 text-xs sm:text-sm"
        >
          <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
          <p className="font-semibold">{errorMessage}</p>
        </div>
      )}

      {/* Applications List */}
      {applications.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-[#2878B8] flex items-center justify-center mx-auto">
            <FileText size={22} />
          </div>
          <h3 className="font-bold text-base text-[#14243A]">No applications yet</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            You haven't submitted any internship applications. Browse active opportunities posted by campus recruiters to get started.
          </p>
          <div className="pt-1">
            <Link
              to="/student/opportunities"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2878B8] hover:bg-[#20639B] text-white text-xs font-semibold rounded-xl shadow-xs transition"
            >
              <Briefcase size={14} />
              <span>Explore Opportunities</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => {
            const statusConfig = getStatusBadge(app.status);
            const StatusIcon = statusConfig.icon;

            return (
              <div
                key={app.id}
                className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5 hover:border-[#2878B8]/40 transition group"
              >
                {/* Left: Opportunity & Company Info */}
                <div className="space-y-2 max-w-xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-xs uppercase tracking-wider text-[#2878B8]">
                      {app.internship.company_name}
                    </span>
                    <span className="text-slate-300">&middot;</span>
                    <span className="text-xs text-slate-500">{app.internship.location}</span>
                    <span className="text-slate-300">&middot;</span>
                    <span className="text-[11px] uppercase font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                      {app.internship.opportunity_type}
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-[#14243A] leading-snug group-hover:text-[#2878B8] transition">
                    {app.internship.title}
                  </h3>

                  {app.notes && (
                    <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 italic">
                      "{app.notes}"
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={13} />
                      <span>Applied: {new Date(app.applied_at).toLocaleDateString()}</span>
                    </div>
                    {app.internship.stipend && (
                      <div className="flex items-center gap-1.5">
                        <span>Stipend: {app.internship.stipend}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Status Pill & View Opportunity Link */}
                <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-3 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border ${statusConfig.color}`}
                  >
                    <StatusIcon size={14} />
                    <span>{statusConfig.label}</span>
                  </span>

                  <Link
                    to="/student/opportunities"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#2878B8] hover:underline"
                  >
                    <span>View Role</span>
                    <ChevronRight size={13} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
