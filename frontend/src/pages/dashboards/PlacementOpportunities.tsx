import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  fetchOpportunities,
  createOpportunity,
  updateOpportunity,
  deactivateOpportunity,
  type OpportunityResponse,
  type OpportunityType,
} from '../../services/opportunities';
import {
  Briefcase,
  Building2,
  Plus,
  MapPin,
  Banknote,
  Award,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft,
  X,
  Edit2,
  Trash2,
  Users,
} from 'lucide-react';

export default function PlacementOpportunities() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [opportunities, setOpportunities] = useState<OpportunityResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form Modal state (for Create & Edit)
  const [showModal, setShowModal] = useState(false);
  const [editingOpportunity, setEditingOpportunity] = useState<OpportunityResponse | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [location, setLocation] = useState('');
  const [opportunityType, setOpportunityType] = useState<OpportunityType>('internship');
  const [description, setDescription] = useState('');
  const [stipend, setStipend] = useState('');
  const [minCgpa, setMinCgpa] = useState('0.0');
  const [deadline, setDeadline] = useState('');

  // Deactivate Modal state
  const [oppToDeactivate, setOppToDeactivate] = useState<OpportunityResponse | null>(null);
  const [deactivating, setDeactivating] = useState(false);

  const loadOpportunities = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const data = await fetchOpportunities();
      setOpportunities(data);
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
    loadOpportunities();
  }, []);

  const openCreateModal = () => {
    setEditingOpportunity(null);
    setTitle('');
    setCompanyName('');
    setLocation('');
    setOpportunityType('internship');
    setDescription('');
    setStipend('');
    setMinCgpa('6.5');
    setDeadline('');
    setFormError(null);
    setShowModal(true);
  };

  const openEditModal = (opp: OpportunityResponse) => {
    setEditingOpportunity(opp);
    setTitle(opp.title);
    setCompanyName(opp.company_name);
    setLocation(opp.location);
    setOpportunityType(opp.opportunity_type);
    setDescription(opp.description);
    setStipend(opp.stipend || '');
    setMinCgpa(opp.min_cgpa.toString());
    setDeadline(opp.deadline ? opp.deadline.split('T')[0] : '');
    setFormError(null);
    setShowModal(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validation
    if (!title.trim() || title.trim().length < 2) {
      setFormError('Title must be at least 2 characters long.');
      return;
    }
    if (!companyName.trim() || companyName.trim().length < 2) {
      setFormError('Company name must be at least 2 characters long.');
      return;
    }
    if (!location.trim()) {
      setFormError('Please specify the role location.');
      return;
    }
    if (!description.trim() || description.trim().length < 10) {
      setFormError('Description must be at least 10 characters long.');
      return;
    }

    const numCgpa = parseFloat(minCgpa);
    if (isNaN(numCgpa) || numCgpa < 0 || numCgpa > 10) {
      setFormError('Minimum CGPA must be a valid number between 0.0 and 10.0.');
      return;
    }

    try {
      setFormSubmitting(true);

      const payload = {
        title: title.trim(),
        company_name: companyName.trim(),
        location: location.trim(),
        opportunity_type: opportunityType,
        description: description.trim(),
        stipend: stipend.trim() || null,
        min_cgpa: Math.round(numCgpa * 100) / 100,
        deadline: deadline ? `${deadline}T23:59:59Z` : null,
      };

      if (editingOpportunity) {
        // Edit existing
        const updated = await updateOpportunity(editingOpportunity.id, payload);
        setOpportunities((prev) =>
          prev.map((o) => (o.id === updated.id ? updated : o))
        );
        setSuccessMessage(`Opportunity '${updated.title}' updated successfully.`);
      } else {
        // Create new
        const created = await createOpportunity(payload);
        setOpportunities((prev) => [created, ...prev]);
        setSuccessMessage(`Opportunity '${created.title}' created and published.`);
      }

      setShowModal(false);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setFormError(err.message);
      } else {
        setFormError('Failed to save opportunity.');
      }
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleConfirmDeactivate = async () => {
    if (!oppToDeactivate) return;

    try {
      setDeactivating(true);
      await deactivateOpportunity(oppToDeactivate.id);
      setOpportunities((prev) =>
        prev.map((o) => (o.id === oppToDeactivate.id ? { ...o, is_active: false } : o))
      );
      setSuccessMessage(`Opportunity '${oppToDeactivate.title}' has been deactivated.`);
      setOppToDeactivate(null);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to deactivate opportunity.');
      }
    } finally {
      setDeactivating(false);
    }
  };

  const activeCount = opportunities.filter((o) => o.is_active).length;
  const inactiveCount = opportunities.filter((o) => !o.is_active).length;

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/90 p-12 shadow-xs text-center">
        <div className="inline-flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-[#2878B8]" />
          <h3 className="text-base font-semibold text-[#14243A]">Loading opportunities...</h3>
          <p className="text-xs text-slate-500">Retrieving campus placement listings</p>
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
              <Building2 size={15} />
              <span>Placement Officer Operations</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#14243A]">
              Manage Campus Opportunities
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
              Publish and maintain internship and placement opportunities. Set minimum academic eligibility, stipend criteria, and review candidate applications.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-2 bg-[#F4F7FB] border border-slate-200/80 rounded-2xl p-2.5 px-4 text-xs">
              <span className="font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                {activeCount} Active
              </span>
              <span className="font-semibold text-slate-500 bg-slate-200/60 px-2.5 py-1 rounded-lg">
                {inactiveCount} Closed
              </span>
            </div>

            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#2878B8] hover:bg-[#20639B] text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition"
            >
              <Plus size={16} />
              <span>Post Opportunity</span>
            </button>
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

      {/* Opportunities List */}
      {opportunities.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-[#2878B8] flex items-center justify-center mx-auto">
            <Briefcase size={22} />
          </div>
          <h3 className="font-bold text-base text-[#14243A]">No campus opportunities posted</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Create your first campus opportunity to begin accepting student applications for internships and full-time hiring drives.
          </p>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2878B8] hover:bg-[#20639B] text-white text-xs font-semibold rounded-xl shadow-xs transition"
          >
            <Plus size={15} />
            <span>Create First Opportunity</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {opportunities.map((opp) => {
            const isOwner = opp.posted_by_id === user?.id || user?.role === 'admin';

            return (
              <div
                key={opp.id}
                className={`bg-white border rounded-2xl p-5 shadow-xs flex flex-col justify-between transition ${
                  opp.is_active
                    ? 'border-slate-200/90 hover:border-[#2878B8]/40'
                    : 'border-slate-200 bg-slate-50/50 opacity-80'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-xs uppercase tracking-wider text-[#2878B8]">
                      {opp.company_name}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          opp.is_active
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {opp.is_active ? 'Active' : 'Closed'}
                      </span>
                      <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {opp.opportunity_type}
                      </span>
                    </div>
                  </div>

                  <h3 className="font-bold text-base text-[#14243A] leading-snug">
                    {opp.title}
                  </h3>

                  <div className="space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <MapPin size={13} className="text-slate-400 shrink-0" />
                      <span className="truncate">{opp.location}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Banknote size={13} className="text-slate-400 shrink-0" />
                      <span className="truncate">{opp.stipend || 'Undisclosed'}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Award size={13} className="text-slate-400 shrink-0" />
                      <span>Min. CGPA: {opp.min_cgpa.toFixed(2)}</span>
                    </div>

                    {opp.deadline && (
                      <div className="flex items-center gap-2">
                        <Calendar size={13} className="text-slate-400 shrink-0" />
                        <span>Deadline: {new Date(opp.deadline).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed pt-1">
                    {opp.description}
                  </p>
                </div>

                {/* Operations Footer */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <Link
                    to={`/placement/applications?opportunity_id=${opp.id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2878B8] hover:underline"
                  >
                    <Users size={14} />
                    <span>View Applicants</span>
                  </Link>

                  {isOwner && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEditModal(opp)}
                        title="Edit Opportunity"
                        className="p-1.5 text-slate-500 hover:text-[#2878B8] hover:bg-slate-100 rounded-lg transition"
                      >
                        <Edit2 size={14} />
                      </button>
                      {opp.is_active && (
                        <button
                          type="button"
                          onClick={() => setOppToDeactivate(opp)}
                          title="Deactivate Opportunity"
                          className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ============================================================== */}
      {/* OPPORTUNITY CREATE & EDIT MODAL                                */}
      {/* ============================================================== */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-xl w-full shadow-lg p-6 space-y-5 animate-in fade-in duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Briefcase size={18} className="text-[#2878B8]" />
                <h3 className="font-bold text-base text-[#14243A]">
                  {editingOpportunity ? 'Edit Opportunity' : 'Post New Campus Opportunity'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="oppTitle"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1"
                  >
                    Role Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="oppTitle"
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Full-Stack Software Engineering Intern"
                    disabled={formSubmitting}
                    className="block w-full px-3.5 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl bg-white text-[#14243A] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2878B8]/20 focus:border-[#2878B8] transition"
                  />
                </div>

                <div>
                  <label
                    htmlFor="oppCompany"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1"
                  >
                    Company Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="oppCompany"
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Nexus Tech Systems"
                    disabled={formSubmitting}
                    className="block w-full px-3.5 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl bg-white text-[#14243A] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2878B8]/20 focus:border-[#2878B8] transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="oppLocation"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1"
                  >
                    Location <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="oppLocation"
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Bangalore (Hybrid) or Remote"
                    disabled={formSubmitting}
                    className="block w-full px-3.5 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl bg-white text-[#14243A] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2878B8]/20 focus:border-[#2878B8] transition"
                  />
                </div>

                <div>
                  <label
                    htmlFor="oppType"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1"
                  >
                    Opportunity Type
                  </label>
                  <select
                    id="oppType"
                    value={opportunityType}
                    onChange={(e) => setOpportunityType(e.target.value as OpportunityType)}
                    disabled={formSubmitting}
                    className="block w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl bg-white text-[#14243A] focus:outline-none focus:ring-2 focus:ring-[#2878B8]/20 focus:border-[#2878B8] transition"
                  >
                    <option value="internship">Internship</option>
                    <option value="research">Research</option>
                    <option value="placement">Full-time Placement</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="oppStipend"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1"
                  >
                    Stipend / CTC
                  </label>
                  <input
                    id="oppStipend"
                    type="text"
                    value={stipend}
                    onChange={(e) => setStipend(e.target.value)}
                    placeholder="e.g. ₹35,000 / month or ₹8.5 LPA"
                    disabled={formSubmitting}
                    className="block w-full px-3.5 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl bg-white text-[#14243A] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2878B8]/20 focus:border-[#2878B8] transition"
                  />
                </div>

                <div>
                  <label
                    htmlFor="oppMinCgpa"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1"
                  >
                    Min. CGPA Cutoff (0.0 – 10.0)
                  </label>
                  <input
                    id="oppMinCgpa"
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    required
                    value={minCgpa}
                    onChange={(e) => setMinCgpa(e.target.value)}
                    disabled={formSubmitting}
                    className="block w-full px-3.5 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl bg-white text-[#14243A] focus:outline-none focus:ring-2 focus:ring-[#2878B8]/20 focus:border-[#2878B8] transition"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="oppDeadline"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1"
                >
                  Application Deadline Date
                </label>
                <input
                  id="oppDeadline"
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  disabled={formSubmitting}
                  className="block w-full px-3.5 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl bg-white text-[#14243A] focus:outline-none focus:ring-2 focus:ring-[#2878B8]/20 focus:border-[#2878B8] transition"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label
                    htmlFor="oppDescription"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
                  >
                    Opportunity Details &amp; Requirements <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[11px] text-slate-400">{description.length} / 5000</span>
                </div>
                <textarea
                  id="oppDescription"
                  rows={4}
                  maxLength={5000}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Outline responsibilities, team, required technical skills, interview rounds, and work arrangements."
                  disabled={formSubmitting}
                  className="block w-full px-3.5 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl bg-white text-[#14243A] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2878B8]/20 focus:border-[#2878B8] transition"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={formSubmitting}
                  className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-[#2878B8] hover:bg-[#20639B] text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition disabled:opacity-60"
                >
                  {formSubmitting ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      <span>Saving Opportunity...</span>
                    </>
                  ) : (
                    <span>{editingOpportunity ? 'Update Opportunity' : 'Publish Opportunity'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* DEACTIVATE CONFIRMATION MODAL                                  */}
      {/* ============================================================== */}
      {oppToDeactivate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-sm w-full shadow-lg p-6 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 size={20} />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#14243A]">Deactivate Opportunity?</h3>
              <p className="text-xs text-slate-600 mt-1">
                Deactivating{' '}
                <span className="font-semibold text-[#14243A]">{oppToDeactivate.title}</span> will
                close student applications. Previous applications and history are safely preserved.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setOppToDeactivate(null)}
                disabled={deactivating}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeactivate}
                disabled={deactivating}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl transition shadow-xs"
              >
                {deactivating ? <Loader2 size={14} className="animate-spin" /> : null}
                <span>Deactivate</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
