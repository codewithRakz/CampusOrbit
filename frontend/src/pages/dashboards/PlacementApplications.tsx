import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  fetchOpportunities,
  type OpportunityResponse,
} from '../../services/opportunities';
import {
  fetchOpportunityApplicants,
  updateApplicationStatus,
  type ApplicationWithApplicantResponse,
  type ApplicationStatus,
} from '../../services/applications';
import {
  Layers,
  Users,
  Briefcase,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft,
} from 'lucide-react';

export default function PlacementApplications() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Opportunities list (for the selector)
  const [opportunities, setOpportunities] = useState<OpportunityResponse[]>([]);
  const [selectedOpportunityId, setSelectedOpportunityId] = useState<number | ''>('');

  // Applicants list for currently selected opportunity
  const [applicants, setApplicants] = useState<ApplicationWithApplicantResponse[]>([]);
  const [loadingOpportunities, setLoadingOpportunities] = useState(true);
  const [loadingApplicants, setLoadingApplicants] = useState(false);

  // Status update operation tracking
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  // Feedback notifications
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Search/Filter applicants by student name or status
  const [applicantFilter, setApplicantFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Initial load of opportunities
  useEffect(() => {
    async function loadOpportunities() {
      try {
        setLoadingOpportunities(true);
        setErrorMessage(null);
        const data = await fetchOpportunities();
        // Show opportunities posted by this officer, or all if admin
        const relevant = data.filter(
          (o) => o.posted_by_id === user?.id || user?.role === 'admin'
        );
        setOpportunities(relevant);

        // Check if opportunity_id was passed via query parameter
        const paramId = searchParams.get('opportunity_id');
        if (paramId) {
          const parsed = parseInt(paramId, 10);
          if (!isNaN(parsed) && relevant.some((o) => o.id === parsed)) {
            setSelectedOpportunityId(parsed);
          } else if (relevant.length > 0) {
            setSelectedOpportunityId(relevant[0].id);
          }
        } else if (relevant.length > 0) {
          setSelectedOpportunityId(relevant[0].id);
        }
      } catch (err: unknown) {
        if (err instanceof Error) {
          if (err.message.includes('session has expired')) {
            logout();
            navigate('/login');
            return;
          }
          setErrorMessage(err.message);
        } else {
          setErrorMessage('Failed to load opportunities list.');
        }
      } finally {
        setLoadingOpportunities(false);
      }
    }

    loadOpportunities();
  }, [user, searchParams, logout, navigate]);

  // 2. Fetch applicants when selected opportunity changes
  useEffect(() => {
    if (!selectedOpportunityId) {
      setApplicants([]);
      return;
    }

    async function loadApplicants() {
      try {
        setLoadingApplicants(true);
        setErrorMessage(null);
        const data = await fetchOpportunityApplicants(Number(selectedOpportunityId));
        setApplicants(data);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setErrorMessage(err.message);
        } else {
          setErrorMessage('Failed to load applicants for this opportunity.');
        }
      } finally {
        setLoadingApplicants(false);
      }
    }

    loadApplicants();
  }, [selectedOpportunityId]);

  // Handle changing opportunity from selector
  const handleOpportunityChange = (id: number) => {
    setSelectedOpportunityId(id);
    setSearchParams({ opportunity_id: id.toString() });
    setSuccessMessage(null);
    setErrorMessage(null);
  };

  // 3. Handle Status Update
  const handleStatusChange = async (applicationId: number, newStatus: ApplicationStatus) => {
    try {
      setUpdatingId(applicationId);
      setErrorMessage(null);
      await updateApplicationStatus(applicationId, newStatus);

      setApplicants((prev) =>
        prev.map((app) =>
          app.id === applicationId ? { ...app, status: newStatus } : app
        )
      );

      setSuccessMessage(`Application status updated to '${newStatus.replace('_', ' ')}'.`);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to update candidate application status.');
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusBadge = (status: ApplicationStatus) => {
    switch (status) {
      case 'applied':
        return 'bg-blue-50 text-[#2878B8] border-blue-200';
      case 'under_review':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'shortlisted':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      case 'accepted':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'rejected':
        return 'bg-rose-50 text-rose-800 border-rose-200';
    }
  };

  const selectedOpp = opportunities.find((o) => o.id === selectedOpportunityId);

  // Filter applicants
  const filteredApplicants = applicants.filter((app) => {
    if (applicantFilter !== 'all' && app.status !== applicantFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = app.student.full_name.toLowerCase().includes(q);
      const matchEmail = app.student.email.toLowerCase().includes(q);
      if (!matchName && !matchEmail) return false;
    }
    return true;
  });

  if (loadingOpportunities) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/90 p-12 shadow-xs text-center">
        <div className="inline-flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-[#2878B8]" />
          <h3 className="text-base font-semibold text-[#14243A]">Loading applicant review console...</h3>
          <p className="text-xs text-slate-500">Retrieving opportunities and candidate submissions</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <div>
        <Link
          to="/placement/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#2878B8] transition"
        >
          <ArrowLeft size={14} />
          <span>Back to Console</span>
        </Link>
      </div>

      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#2878B8]/10 text-[#2878B8] rounded-full text-xs font-semibold">
              <Layers size={15} />
              <span>Placement Officer Review Console</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#14243A]">
              Student Application Reviews
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
              Review submitted student applications for your active campus opportunities. Transition candidates through review stages from initial application to offer acceptance.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/placement/opportunities"
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-[#14243A] text-xs sm:text-sm font-semibold rounded-xl transition"
            >
              <Briefcase size={15} />
              <span>All Opportunities</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Global Alerts */}
      {successMessage && (
        <div
          role="status"
          className="p-4 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-start gap-3 text-emerald-800 text-xs sm:text-sm"
        >
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
          <p className="font-semibold">{successMessage}</p>
        </div>
      )}

      {errorMessage && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-red-50 border border-red-200/80 flex items-start gap-3 text-red-800 text-xs sm:text-sm"
        >
          <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
          <p className="font-semibold">{errorMessage}</p>
        </div>
      )}

      {/* Opportunity Selector & Controls */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          {/* Opportunity Selector Dropdown */}
          <div className="md:col-span-5">
            <label
              htmlFor="opportunitySelector"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
            >
              Select Opportunity to Review
            </label>
            {opportunities.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No opportunities posted yet.</p>
            ) : (
              <select
                id="opportunitySelector"
                value={selectedOpportunityId}
                onChange={(e) => handleOpportunityChange(Number(e.target.value))}
                className="block w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-200 rounded-xl bg-white text-[#14243A] font-semibold focus:outline-none focus:ring-2 focus:ring-[#2878B8]/20 focus:border-[#2878B8] transition"
              >
                {opportunities.map((opp) => (
                  <option key={opp.id} value={opp.id}>
                    {opp.title} &middot; {opp.company_name} ({opp.opportunity_type})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Search Applicant Name/Email */}
          <div className="md:col-span-4">
            <label
              htmlFor="applicantSearch"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
            >
              Search Candidates
            </label>
            <div className="relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="applicantSearch"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search candidate name or email..."
                className="block w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl bg-white text-[#14243A] focus:outline-none focus:ring-2 focus:ring-[#2878B8]/20 focus:border-[#2878B8] transition"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="md:col-span-3">
            <label
              htmlFor="statusFilter"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
            >
              Filter Status
            </label>
            <select
              id="statusFilter"
              value={applicantFilter}
              onChange={(e) => setApplicantFilter(e.target.value)}
              className="block w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl bg-white text-[#14243A] focus:outline-none focus:ring-2 focus:ring-[#2878B8]/20 focus:border-[#2878B8] transition"
            >
              <option value="all">All Stages ({applicants.length})</option>
              <option value="applied">Applied</option>
              <option value="under_review">Under Review</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="accepted">Accepted / Offered</option>
              <option value="rejected">Not Selected</option>
            </select>
          </div>
        </div>

        {/* Selected Opportunity Meta Summary */}
        {selectedOpp && (
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
            <div className="flex items-center gap-3">
              <span>Location: <strong>{selectedOpp.location}</strong></span>
              <span>&middot;</span>
              <span>Min. CGPA: <strong>{selectedOpp.min_cgpa.toFixed(2)}</strong></span>
              <span>&middot;</span>
              <span>Total Applicants: <strong>{applicants.length}</strong></span>
            </div>
            {selectedOpp.deadline && (
              <span>Deadline: {new Date(selectedOpp.deadline).toLocaleDateString()}</span>
            )}
          </div>
        )}
      </div>

      {/* Applicants List */}
      {loadingApplicants ? (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-12 shadow-xs text-center">
          <div className="inline-flex flex-col items-center gap-3">
            <Loader2 size={28} className="animate-spin text-[#2878B8]" />
            <p className="text-xs text-slate-500">Loading applicants...</p>
          </div>
        </div>
      ) : !selectedOpportunityId ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center shadow-xs">
          <p className="text-xs text-slate-500">Select an opportunity above to view applicants.</p>
        </div>
      ) : applicants.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-[#2878B8] flex items-center justify-center mx-auto">
            <Users size={22} />
          </div>
          <h3 className="font-bold text-base text-[#14243A]">No applicants yet</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            No students have submitted applications for '{selectedOpp?.title}' yet. Students will appear here as soon as they apply through their portal.
          </p>
        </div>
      ) : filteredApplicants.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-500">
          No applicants match your search and filter criteria.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[#F4F7FB] text-slate-600 font-semibold uppercase text-[11px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Candidate</th>
                  <th className="px-5 py-3.5">Applied Date</th>
                  <th className="px-5 py-3.5">Application Notes</th>
                  <th className="px-5 py-3.5">Current Status</th>
                  <th className="px-5 py-3.5 text-right">Update Status Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredApplicants.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/70 transition">
                    {/* Candidate Identity */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#2878B8]/10 text-[#2878B8] font-bold text-xs flex items-center justify-center shrink-0">
                          {app.student.full_name ? app.student.full_name[0].toUpperCase() : 'S'}
                        </div>
                        <div>
                          <p className="font-bold text-[#14243A]">{app.student.full_name}</p>
                          <p className="text-xs text-slate-500">{app.student.email}</p>
                          <span className="text-[10px] text-slate-400 font-mono">ID #{app.student.id}</span>
                        </div>
                      </div>
                    </td>

                    {/* Applied Date */}
                    <td className="px-5 py-4 text-slate-600 text-xs whitespace-nowrap">
                      {new Date(app.applied_at).toLocaleDateString()}
                    </td>

                    {/* Candidate Notes */}
                    <td className="px-5 py-4 text-xs text-slate-600 max-w-xs">
                      {app.notes ? (
                        <p className="line-clamp-2 italic text-slate-700 bg-[#F4F7FB] p-2 rounded-lg border border-slate-100">
                          "{app.notes}"
                        </p>
                      ) : (
                        <span className="text-slate-400 italic">No notes provided</span>
                      )}
                    </td>

                    {/* Current Status Badge */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span
                        className={`inline-block text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full border ${getStatusBadge(
                          app.status
                        )}`}
                      >
                        {app.status.replace('_', ' ')}
                      </span>
                    </td>

                    {/* Decision Action Selector */}
                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        {updatingId === app.id ? (
                          <span className="inline-flex items-center gap-1.5 text-xs text-[#2878B8]">
                            <Loader2 size={14} className="animate-spin" />
                            <span>Updating...</span>
                          </span>
                        ) : (
                          <select
                            value={app.status}
                            onChange={(e) =>
                              handleStatusChange(app.id, e.target.value as ApplicationStatus)
                            }
                            className="text-xs font-semibold px-2.5 py-1.5 border border-slate-200 rounded-xl bg-white text-[#14243A] focus:outline-none focus:ring-2 focus:ring-[#2878B8]/20 focus:border-[#2878B8] transition cursor-pointer"
                          >
                            <option value="applied">Applied</option>
                            <option value="under_review">Mark Under Review</option>
                            <option value="shortlisted">Shortlist Candidate</option>
                            <option value="accepted">Accept / Offer</option>
                            <option value="rejected">Not Selected</option>
                          </select>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
