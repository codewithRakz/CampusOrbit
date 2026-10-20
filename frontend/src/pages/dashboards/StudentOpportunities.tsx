import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  fetchOpportunities,
  type OpportunityResponse,
} from '../../services/opportunities';
import {
  fetchMyApplications,
  applyForOpportunity,
  type ApplicationWithOpportunityResponse,
} from '../../services/applications';
import {
  fetchStudentProfile,
  type StudentProfileResponse,
} from '../../services/profile';
import {
  Briefcase,
  Search,
  MapPin,
  Banknote,
  Award,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft,
  X,
  Clock,
  ChevronRight,
  Filter,
} from 'lucide-react';

export default function StudentOpportunities() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  // Data states
  const [opportunities, setOpportunities] = useState<OpportunityResponse[]>([]);
  const [myApplications, setMyApplications] = useState<ApplicationWithOpportunityResponse[]>([]);
  const [studentProfile, setStudentProfile] = useState<StudentProfileResponse | null>(null);

  // Filter states
  const [keyword, setKeyword] = useState('');
  const [location, setLocation] = useState('');
  const [opportunityType, setOpportunityType] = useState<string>('all');
  const [onlyEligible, setOnlyEligible] = useState(false);

  // UI status
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Apply Modal state
  const [selectedOpportunity, setSelectedOpportunity] = useState<OpportunityResponse | null>(null);
  const [applicationNotes, setApplicationNotes] = useState('');
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);

      const [opps, apps, prof] = await Promise.all([
        fetchOpportunities(),
        fetchMyApplications().catch(() => []),
        fetchStudentProfile().catch(() => null),
      ]);

      setOpportunities(opps);
      setMyApplications(apps);
      setStudentProfile(prof);
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.message.includes('session has expired')) {
          logout();
          navigate('/login');
          return;
        }
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to load opportunities. Please refresh.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Set of internship IDs the student has applied to
  const appliedOpportunityIds = new Set(myApplications.map((app) => app.internship_id));

  // Client-side filtering
  const filteredOpportunities = opportunities.filter((opp) => {
    // Keyword match
    if (keyword.trim()) {
      const q = keyword.toLowerCase();
      const matchTitle = opp.title.toLowerCase().includes(q);
      const matchCompany = opp.company_name.toLowerCase().includes(q);
      const matchDesc = opp.description.toLowerCase().includes(q);
      if (!matchTitle && !matchCompany && !matchDesc) return false;
    }

    // Location match
    if (location.trim()) {
      if (!opp.location.toLowerCase().includes(location.trim().toLowerCase())) {
        return false;
      }
    }

    // Opportunity type match
    if (opportunityType !== 'all') {
      if (opp.opportunity_type !== opportunityType) return false;
    }

    // CGPA eligibility match
    if (onlyEligible && studentProfile && studentProfile.cgpa !== null) {
      if (opp.min_cgpa > studentProfile.cgpa) return false;
    }

    return true;
  });

  // Handle application submission
  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOpportunity) return;

    try {
      setApplying(true);
      setApplyError(null);

      const newApp = await applyForOpportunity(selectedOpportunity.id, applicationNotes);

      // Add to applied IDs
      setMyApplications((prev) => [
        {
          ...newApp,
          internship: selectedOpportunity,
        },
        ...prev,
      ]);

      setSuccessMessage(`Application for '${selectedOpportunity.title}' at ${selectedOpportunity.company_name} submitted successfully!`);
      setSelectedOpportunity(null);
      setApplicationNotes('');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setApplyError(err.message);
      } else {
        setApplyError('Failed to submit application. Please try again.');
      }
    } finally {
      setApplying(false);
    }
  };

  // Helper check if deadline has passed
  const isDeadlinePassed = (deadlineStr: string | null) => {
    if (!deadlineStr) return false;
    return new Date(deadlineStr) < new Date();
  };

  const resetFilters = () => {
    setKeyword('');
    setLocation('');
    setOpportunityType('all');
    setOnlyEligible(false);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/90 p-12 shadow-xs text-center">
        <div className="inline-flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-[#2878B8]" />
          <h3 className="text-base font-semibold text-[#14243A]">Loading opportunities...</h3>
          <p className="text-xs text-slate-500">Retrieving active campus drives and internships</p>
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
              <Briefcase size={15} />
              <span>Campus Career Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#14243A]">
              Explore Opportunities
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
              Discover official campus recruitment drives, summer internships, and research apprenticeships. Check eligibility and apply directly.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-[#F4F7FB] border border-slate-200/80 rounded-2xl px-5 py-3 text-center min-w-[100px]">
              <span className="block text-xl font-extrabold text-[#2878B8]">
                {opportunities.length}
              </span>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Active Drives
              </span>
            </div>
            <Link
              to="/student/applications"
              className="bg-[#F4F7FB] hover:bg-slate-200/70 border border-slate-200/80 rounded-2xl px-5 py-3 text-center min-w-[100px] transition"
            >
              <span className="block text-xl font-extrabold text-[#14243A]">
                {myApplications.length}
              </span>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-center gap-1">
                <span>Applied</span>
                <ChevronRight size={12} />
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/* Profile Notice if CGPA is missing */}
      {(!studentProfile || studentProfile.cgpa === null) && (
        <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-1.5 rounded-lg bg-amber-100 text-amber-700 shrink-0 mt-0.5">
              <AlertCircle size={16} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                Profile Incomplete
              </h4>
              <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                Add your cumulative CGPA in your Academic Profile so the portal can automatically verify your eligibility for corporate drives.
              </p>
            </div>
          </div>
          <Link
            to="/student/profile"
            className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition"
          >
            <span>Set CGPA</span>
          </Link>
        </div>
      )}

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

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          {/* Keyword Search */}
          <div className="sm:col-span-5 relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Search title, company, or keywords..."
              className="block w-full pl-10 pr-4 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl bg-white text-[#14243A] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2878B8]/20 focus:border-[#2878B8] transition"
            />
          </div>

          {/* Location Filter */}
          <div className="sm:col-span-3 relative">
            <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Location (e.g. Remote, Bangalore)"
              className="block w-full pl-10 pr-4 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl bg-white text-[#14243A] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2878B8]/20 focus:border-[#2878B8] transition"
            />
          </div>

          {/* Opportunity Type Dropdown */}
          <div className="sm:col-span-2">
            <select
              value={opportunityType}
              onChange={(e) => setOpportunityType(e.target.value)}
              className="block w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl bg-white text-[#14243A] focus:outline-none focus:ring-2 focus:ring-[#2878B8]/20 focus:border-[#2878B8] transition"
            >
              <option value="all">All Types</option>
              <option value="internship">Internship</option>
              <option value="research">Research</option>
              <option value="placement">Full-time</option>
            </select>
          </div>

          {/* Reset Filters */}
          <div className="sm:col-span-2">
            <button
              type="button"
              onClick={resetFilters}
              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            >
              <Filter size={13} />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* CGPA Eligibility Filter Pill Toggle */}
        {studentProfile?.cgpa !== null && studentProfile?.cgpa !== undefined && (
          <div className="pt-2 flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => setOnlyEligible(!onlyEligible)}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold transition ${
                onlyEligible
                  ? 'bg-[#2878B8] text-white border-[#2878B8]'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Award size={13} />
              <span>Only show roles I qualify for (CGPA &le; {studentProfile.cgpa.toFixed(2)})</span>
            </button>
          </div>
        )}
      </div>

      {/* Opportunities List Grid */}
      {filteredOpportunities.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-[#2878B8] flex items-center justify-center mx-auto">
            <Briefcase size={22} />
          </div>
          <h3 className="font-bold text-base text-[#14243A]">No opportunities found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            No active campus opportunities matched your current search filters. Try adjusting your keyword or clearing filters.
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-1 px-4 py-2 bg-[#2878B8] hover:bg-[#20639B] text-white text-xs font-semibold rounded-xl shadow-xs transition"
          >
            <span>Clear Filters</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredOpportunities.map((opp) => {
            const hasApplied = appliedOpportunityIds.has(opp.id);
            const deadlinePassed = isDeadlinePassed(opp.deadline);
            const isEligible =
              studentProfile?.cgpa !== null && studentProfile?.cgpa !== undefined
                ? studentProfile.cgpa >= opp.min_cgpa
                : null;

            const typeColor = {
              internship: 'bg-blue-50 text-[#2878B8] border-blue-200/80',
              research: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
              placement: 'bg-purple-50 text-purple-700 border-purple-200/80',
            }[opp.opportunity_type];

            return (
              <div
                key={opp.id}
                className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-[#2878B8]/40 transition group"
              >
                <div className="space-y-3">
                  {/* Top Bar: Company & Type */}
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-xs uppercase tracking-wider text-[#2878B8]">
                      {opp.company_name}
                    </span>
                    <span
                      className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${typeColor}`}
                    >
                      {opp.opportunity_type}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="font-bold text-base text-[#14243A] leading-snug group-hover:text-[#2878B8] transition">
                    {opp.title}
                  </h3>

                  {/* Metadata Chips */}
                  <div className="space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <MapPin size={13} className="text-slate-400 shrink-0" />
                      <span className="truncate">{opp.location}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Banknote size={13} className="text-slate-400 shrink-0" />
                      <span className="truncate">{opp.stipend || 'Stipend undisclosed'}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Award size={13} className="text-slate-400 shrink-0" />
                      <span>Min. CGPA: {opp.min_cgpa.toFixed(2)}</span>
                    </div>

                    {opp.deadline && (
                      <div className="flex items-center gap-2">
                        <Clock size={13} className="text-slate-400 shrink-0" />
                        <span className={deadlinePassed ? 'text-red-600 font-semibold' : ''}>
                          {deadlinePassed ? 'Deadline Passed' : `Deadline: ${new Date(opp.deadline).toLocaleDateString()}`}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Truncated Description */}
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed pt-1">
                    {opp.description}
                  </p>
                </div>

                {/* Bottom Actions & Eligibility Tag */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div>
                    {hasApplied ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                        <CheckCircle2 size={12} />
                        <span>Applied</span>
                      </span>
                    ) : isEligible === false ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                        CGPA below {opp.min_cgpa.toFixed(1)}
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400 font-medium">
                        Open for applications
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedOpportunity(opp);
                      setApplyError(null);
                      setApplicationNotes('');
                    }}
                    className={`inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition shadow-2xs ${
                      hasApplied
                        ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        : deadlinePassed
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : 'bg-[#2878B8] hover:bg-[#20639B] text-white'
                    }`}
                  >
                    <span>{hasApplied ? 'View Details' : 'View & Apply'}</span>
                    <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ============================================================== */}
      {/* OPPORTUNITY DETAIL & APPLY MODAL                               */}
      {/* ============================================================== */}
      {selectedOpportunity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-xl w-full shadow-lg p-6 space-y-5 animate-in fade-in duration-150 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#2878B8]">
                  {selectedOpportunity.company_name}
                </span>
                <h3 className="text-lg font-bold text-[#14243A] mt-0.5">
                  {selectedOpportunity.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOpportunity(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            {/* Opportunity Full Specs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-[#F4F7FB] rounded-xl text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Type</span>
                <span className="font-semibold text-[#14243A] uppercase text-[11px]">
                  {selectedOpportunity.opportunity_type}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Location</span>
                <span className="font-semibold text-[#14243A] truncate block">
                  {selectedOpportunity.location}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Min. CGPA</span>
                <span className="font-semibold text-[#2878B8]">
                  {selectedOpportunity.min_cgpa.toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Stipend</span>
                <span className="font-semibold text-[#14243A] truncate block">
                  {selectedOpportunity.stipend || 'Undisclosed'}
                </span>
              </div>
            </div>

            {/* Eligibility Banner inside Modal */}
            {studentProfile?.cgpa !== null && studentProfile?.cgpa !== undefined && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                  studentProfile.cgpa >= selectedOpportunity.min_cgpa
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}
              >
                {studentProfile.cgpa >= selectedOpportunity.min_cgpa ? (
                  <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle size={15} className="text-amber-600 shrink-0" />
                )}
                <span>
                  Your CGPA: <strong>{studentProfile.cgpa.toFixed(2)}</strong> &middot; Required:{' '}
                  <strong>{selectedOpportunity.min_cgpa.toFixed(2)}</strong>{' '}
                  {studentProfile.cgpa >= selectedOpportunity.min_cgpa
                    ? '(You meet the academic cutoff)'
                    : '(Below requested criteria, but you may still submit)'}
                </span>
              </div>
            )}

            {/* Description */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Job &amp; Internship Description
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line bg-slate-50 p-4 rounded-xl border border-slate-100 max-h-48 overflow-y-auto">
                {selectedOpportunity.description}
              </p>
            </div>

            {/* Error Message inside modal */}
            {applyError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{applyError}</span>
              </div>
            )}

            {/* Application Section */}
            {appliedOpportunityIds.has(selectedOpportunity.id) ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-1">
                <CheckCircle2 size={24} className="text-emerald-600 mx-auto" />
                <h4 className="text-sm font-bold text-emerald-900">Application Submitted</h4>
                <p className="text-xs text-emerald-700">
                  You have already applied for this role. Track review progress on your Applications tab.
                </p>
              </div>
            ) : isDeadlinePassed(selectedOpportunity.deadline) ? (
              <div className="p-4 bg-slate-100 border border-slate-200 rounded-xl text-center space-y-1">
                <Clock size={24} className="text-slate-400 mx-auto" />
                <h4 className="text-sm font-bold text-slate-700">Application Window Closed</h4>
                <p className="text-xs text-slate-500">
                  The deadline for this opportunity was{' '}
                  {new Date(selectedOpportunity.deadline!).toLocaleDateString()}.
                </p>
              </div>
            ) : (
              <form onSubmit={handleApply} className="space-y-3 pt-2 border-t border-slate-100">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label
                      htmlFor="appNotes"
                      className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
                    >
                      Application Note / Cover Note (Optional)
                    </label>
                    <span className="text-[11px] text-slate-400">
                      {applicationNotes.length} / 1000
                    </span>
                  </div>
                  <textarea
                    id="appNotes"
                    rows={3}
                    maxLength={1000}
                    value={applicationNotes}
                    onChange={(e) => setApplicationNotes(e.target.value)}
                    placeholder="Briefly state why you're interested in this role and highlight key projects or relevant skills."
                    disabled={applying}
                    className="block w-full px-3.5 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl bg-white text-[#14243A] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2878B8]/20 focus:border-[#2878B8] transition"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedOpportunity(null)}
                    disabled={applying}
                    className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={applying}
                    className="inline-flex items-center gap-2 px-5 py-2 bg-[#2878B8] hover:bg-[#20639B] text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition disabled:opacity-60"
                  >
                    {applying ? (
                      <>
                        <Loader2 size={15} className="animate-spin" />
                        <span>Submitting Application...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={15} />
                        <span>Confirm &amp; Submit Application</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
