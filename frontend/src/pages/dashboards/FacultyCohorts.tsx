import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  fetchAdvisees,
  assignAdvisee,
  fetchAdviseePortfolio,
  updateMentorshipFeedback,
  unassignAdvisee,
  type FacultyAdviseeResponse,
  type AdviseePortfolioResponse,
} from '../../services/faculty';
import {
  GraduationCap,
  Users,
  Search,
  Plus,
  X,
  Award,
  Briefcase,
  ExternalLink,
  Code2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Trash2,
  Eye,
  EyeOff,
  MessageSquare,
  FolderGit2,
  Calendar,
} from 'lucide-react';

export default function FacultyCohorts() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  // Advisees list state
  const [advisees, setAdvisees] = useState<FacultyAdviseeResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [newStudentNotes, setNewStudentNotes] = useState('');
  const [newStudentVisible, setNewStudentVisible] = useState(false);
  const [submittingAdd, setSubmittingAdd] = useState(false);
  const [addModalError, setAddModalError] = useState<string | null>(null);

  // Portfolio inspection modal state
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [portfolioData, setPortfolioData] = useState<AdviseePortfolioResponse | null>(null);
  const [loadingPortfolio, setLoadingPortfolio] = useState(false);
  const [portfolioError, setPortfolioError] = useState<string | null>(null);

  // Mentorship feedback form state inside modal
  const [feedbackNotes, setFeedbackNotes] = useState('');
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [savingFeedback, setSavingFeedback] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  // Unassign confirmation modal state
  const [unassigningTarget, setUnassigningTarget] = useState<FacultyAdviseeResponse | null>(null);
  const [unassigning, setUnassigning] = useState(false);

  // 1. Initial Load of Advisees
  const loadAdvisees = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const data = await fetchAdvisees();
      setAdvisees(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.message.includes('session has expired')) {
          logout();
          navigate('/login');
          return;
        }
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to load advisees cohort.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdvisees();
  }, []);

  // Filtered Advisees
  const filteredAdvisees = useMemo(() => {
    if (!searchQuery.trim()) return advisees;
    const q = searchQuery.toLowerCase().trim();
    return advisees.filter(
      (a) =>
        a.student.full_name.toLowerCase().includes(q) ||
        a.student.email.toLowerCase().includes(q) ||
        (a.student.department && a.student.department.toLowerCase().includes(q))
    );
  }, [advisees, searchQuery]);

  // Cohort Stats
  const stats = useMemo(() => {
    const total = advisees.length;
    const withFeedback = advisees.filter((a) => !!a.notes).length;
    const visibleFeedback = advisees.filter((a) => !!a.notes && a.is_student_visible).length;
    return { total, withFeedback, visibleFeedback };
  }, [advisees]);

  // 2. Open Portfolio Modal
  const handleOpenPortfolio = async (studentId: number) => {
    setSelectedStudentId(studentId);
    setPortfolioData(null);
    setPortfolioError(null);
    setFeedbackSuccess(null);
    setFeedbackError(null);
    setLoadingPortfolio(true);

    try {
      const data = await fetchAdviseePortfolio(studentId);
      setPortfolioData(data);
      setFeedbackNotes(data.mentorship_notes || '');
      setFeedbackVisible(data.is_student_visible);
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.message.includes('session has expired')) {
          logout();
          navigate('/login');
          return;
        }
        setPortfolioError(err.message);
      } else {
        setPortfolioError('Failed to load advisee portfolio.');
      }
    } finally {
      setLoadingPortfolio(false);
    }
  };

  // 3. Save Mentorship Feedback
  const handleSaveFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) return;

    try {
      setSavingFeedback(true);
      setFeedbackError(null);
      setFeedbackSuccess(null);

      const updated = await updateMentorshipFeedback(selectedStudentId, {
        notes: feedbackNotes,
        is_student_visible: feedbackVisible,
      });

      // Update in portfolio state
      if (portfolioData) {
        setPortfolioData({
          ...portfolioData,
          mentorship_notes: updated.notes,
          is_student_visible: updated.is_student_visible,
          updated_at: updated.updated_at,
        });
      }

      // Update in advisees list state
      setAdvisees((prev) =>
        prev.map((a) => (a.student_id === selectedStudentId ? updated : a))
      );

      setFeedbackSuccess('Mentorship feedback updated successfully.');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setFeedbackError(err.message);
      } else {
        setFeedbackError('Failed to save mentorship feedback.');
      }
    } finally {
      setSavingFeedback(false);
    }
  };

  // 4. Add Advisee
  const handleAddAdvisee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentEmail.trim()) {
      setAddModalError('Please enter a valid student institutional email.');
      return;
    }

    try {
      setSubmittingAdd(true);
      setAddModalError(null);

      const created = await assignAdvisee({
        student_email: newStudentEmail.trim(),
        notes: newStudentNotes.trim() || undefined,
        is_student_visible: newStudentVisible,
      });

      setAdvisees((prev) => [created, ...prev]);
      setShowAddModal(false);
      setNewStudentEmail('');
      setNewStudentNotes('');
      setNewStudentVisible(false);
      setSuccessMessage(`Successfully added ${created.student.full_name} to your cohort.`);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setAddModalError(err.message);
      } else {
        setAddModalError('Failed to assign student advisee.');
      }
    } finally {
      setSubmittingAdd(false);
    }
  };

  // 5. Unassign Advisee
  const handleConfirmUnassign = async () => {
    if (!unassigningTarget) return;

    try {
      setUnassigning(true);
      await unassignAdvisee(unassigningTarget.student_id);

      setAdvisees((prev) =>
        prev.filter((a) => a.student_id !== unassigningTarget.student_id)
      );

      if (selectedStudentId === unassigningTarget.student_id) {
        setSelectedStudentId(null);
        setPortfolioData(null);
      }

      setSuccessMessage(`Unassigned ${unassigningTarget.student.full_name} from your cohort.`);
      setUnassigningTarget(null);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to unassign advisee.');
      }
    } finally {
      setUnassigning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <Link
              to="/faculty/dashboard"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2878B8] hover:underline"
            >
              <ArrowLeft size={14} />
              <span>Back to Faculty Dashboard</span>
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#2878B8] flex items-center justify-center font-bold">
                <GraduationCap size={20} />
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#14243A]">
                Student Advisee Cohort
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
              Review assigned students, inspect verified technical skill portfolios, track placement progress, and provide mentorship feedback.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => {
                setAddModalError(null);
                setShowAddModal(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#2878B8] hover:bg-[#20639B] text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition"
            >
              <Plus size={16} />
              <span>Assign New Advisee</span>
            </button>
          </div>
        </div>

        {/* Global Feedback Notifications */}
        {successMessage && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs sm:text-sm flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}
        {errorMessage && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs sm:text-sm flex items-center gap-2">
            <AlertCircle size={16} className="text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Cohort Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2878B8] flex items-center justify-center shrink-0">
            <Users size={18} />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Assigned Advisees</div>
            <div className="text-xl font-extrabold text-[#14243A]">{stats.total}</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <MessageSquare size={18} />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Mentorship Notes</div>
            <div className="text-xl font-extrabold text-[#14243A]">{stats.withFeedback}</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Eye size={18} />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Shared with Students</div>
            <div className="text-xl font-extrabold text-[#14243A]">{stats.visibleFeedback}</div>
          </div>
        </div>
      </div>

      {/* Search & Advisee List */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search advisees by name, email, or department..."
              className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2878B8]/20 focus:border-[#2878B8] transition"
            />
          </div>

          <div className="text-xs text-slate-500 font-medium self-end sm:self-center">
            Showing {filteredAdvisees.length} of {advisees.length} advisee(s)
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-[#2878B8]" />
            <span className="text-xs">Loading advisee cohort...</span>
          </div>
        )}

        {/* Empty States */}
        {!loading && advisees.length === 0 && (
          <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-xl space-y-3">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-[#2878B8] flex items-center justify-center mx-auto">
              <GraduationCap size={24} />
            </div>
            <h3 className="text-sm font-bold text-[#14243A]">No advisees assigned yet</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              You do not have any students assigned to your cohort. Click below to add an advisee by their institutional student email.
            </p>
            <button
              onClick={() => {
                setAddModalError(null);
                setShowAddModal(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#2878B8] text-white text-xs font-semibold rounded-xl hover:bg-[#20639B] transition shadow-xs"
            >
              <Plus size={14} />
              <span>Assign First Advisee</span>
            </button>
          </div>
        )}

        {!loading && advisees.length > 0 && filteredAdvisees.length === 0 && (
          <div className="p-8 text-center text-slate-500 text-xs">
            No advisees matching "{searchQuery}".
            <button
              onClick={() => setSearchQuery('')}
              className="ml-2 font-semibold text-[#2878B8] hover:underline"
            >
              Clear search
            </button>
          </div>
        )}

        {/* Advisee Roster Table */}
        {!loading && filteredAdvisees.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/70">
                  <th className="py-3 px-3.5">Student Details</th>
                  <th className="py-3 px-3.5">Department &amp; Year</th>
                  <th className="py-3 px-3.5">CGPA</th>
                  <th className="py-3 px-3.5">Mentorship Feedback</th>
                  <th className="py-3 px-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredAdvisees.map((adv) => (
                  <tr key={adv.id} className="hover:bg-slate-50/60 transition group">
                    <td className="py-3.5 px-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-[#2878B8] font-bold flex items-center justify-center shrink-0 text-xs">
                          {adv.student.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-[#14243A]">
                            {adv.student.full_name}
                          </div>
                          <div className="text-[11px] text-slate-500">{adv.student.email}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-3.5">
                      <div className="text-slate-700 font-medium">
                        {adv.student.department || (
                          <span className="text-slate-400 italic">Not set</span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {adv.student.year_of_study ? `Year ${adv.student.year_of_study}` : 'Year unassigned'}
                      </div>
                    </td>

                    <td className="py-3.5 px-3.5">
                      {adv.student.cgpa !== null && adv.student.cgpa !== undefined ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full font-bold text-[11px] bg-blue-50 text-[#2878B8] border border-blue-200">
                          {adv.student.cgpa.toFixed(2)} CGPA
                        </span>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">N/A</span>
                      )}
                    </td>

                    <td className="py-3.5 px-3.5">
                      {adv.notes ? (
                        <div className="space-y-1 max-w-xs">
                          <p className="text-[11px] text-slate-700 truncate" title={adv.notes}>
                            {adv.notes}
                          </p>
                          {adv.is_student_visible ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                              <Eye size={10} />
                              <span>Shared with student</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                              <EyeOff size={10} />
                              <span>Private faculty note</span>
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">No feedback yet</span>
                      )}
                    </td>

                    <td className="py-3.5 px-3.5 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => handleOpenPortfolio(adv.student_id)}
                          className="px-3 py-1.5 bg-[#2878B8]/10 hover:bg-[#2878B8] text-[#2878B8] hover:text-white font-semibold rounded-lg text-xs transition"
                        >
                          Review Portfolio
                        </button>
                        <button
                          onClick={() => setUnassigningTarget(adv)}
                          title="Unassign advisee"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: Add Advisee */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-[#2878B8]" />
                <h3 className="font-bold text-[#14243A] text-base">Assign New Advisee</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddAdvisee} className="mt-4 space-y-4">
              {addModalError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-start gap-2">
                  <AlertCircle size={15} className="shrink-0 mt-0.5" />
                  <span>{addModalError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Student Institutional Email <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. alice.smith@campusorbit.edu"
                  value={newStudentEmail}
                  onChange={(e) => setNewStudentEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2878B8]/20 focus:border-[#2878B8]"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Must match an existing registered user with the student role.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Initial Mentorship Guidance / Notes (Optional)
                </label>
                <textarea
                  rows={3}
                  value={newStudentNotes}
                  onChange={(e) => setNewStudentNotes(e.target.value)}
                  placeholder="e.g. Advisee focusing on systems programming and cloud internships."
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2878B8]/20 focus:border-[#2878B8]"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="newStudentVisible"
                  checked={newStudentVisible}
                  onChange={(e) => setNewStudentVisible(e.target.checked)}
                  className="rounded border-slate-300 text-[#2878B8] focus:ring-[#2878B8]"
                />
                <label htmlFor="newStudentVisible" className="text-xs text-slate-700 select-none">
                  Make initial guidance visible to the student
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAdd}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#2878B8] hover:bg-[#20639B] text-white text-xs font-semibold rounded-xl shadow-xs transition disabled:opacity-60"
                >
                  {submittingAdd && <Loader2 size={14} className="animate-spin" />}
                  <span>Assign Advisee</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Portfolio Review & Mentorship Drawer */}
      {selectedStudentId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 shrink-0 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#2878B8] flex items-center justify-center font-bold text-sm">
                  {portfolioData?.student.full_name.charAt(0).toUpperCase() || 'S'}
                </div>
                <div>
                  <h3 className="font-extrabold text-[#14243A] text-base sm:text-lg">
                    {portfolioData?.student.full_name || 'Loading Advisee...'}
                  </h3>
                  <div className="text-xs text-slate-500">
                    {portfolioData?.student.email} &middot;{' '}
                    {portfolioData?.student.department || 'Department Unassigned'}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedStudentId(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
              {loadingPortfolio && (
                <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-8 h-8 animate-spin text-[#2878B8]" />
                  <span className="text-xs">Loading complete portfolio and records...</span>
                </div>
              )}

              {portfolioError && (
                <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{portfolioError}</span>
                </div>
              )}

              {portfolioData && !loadingPortfolio && (
                <>
                  {/* Academic Profile Section */}
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#14243A] uppercase tracking-wider">
                        Academic Standing
                      </span>
                      {portfolioData.student.cgpa !== null && portfolioData.student.cgpa !== undefined && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-[#2878B8] text-white">
                          {portfolioData.student.cgpa.toFixed(2)} CGPA
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[11px]">Department</span>
                        <span className="font-semibold text-slate-800">
                          {portfolioData.student.department || 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Year of Study</span>
                        <span className="font-semibold text-slate-800">
                          {portfolioData.student.year_of_study
                            ? `Year ${portfolioData.student.year_of_study}`
                            : 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Advisee Since</span>
                        <span className="font-semibold text-slate-800">
                          {new Date(portfolioData.assigned_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {portfolioData.profile?.bio && (
                      <div className="pt-2 border-t border-slate-200/60">
                        <span className="text-slate-400 block text-[11px] mb-1">Biography</span>
                        <p className="text-xs text-slate-700 leading-relaxed italic">
                          "{portfolioData.profile.bio}"
                        </p>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-3 pt-2 text-xs">
                      {portfolioData.profile?.github_url && (
                        <a
                          href={portfolioData.profile.github_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-[#2878B8] font-semibold hover:underline"
                        >
                          <FolderGit2 size={14} />
                          <span>GitHub Profile</span>
                          <ExternalLink size={12} />
                        </a>
                      )}
                      {portfolioData.profile?.linkedin_url && (
                        <a
                          href={portfolioData.profile.linkedin_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-[#2878B8] font-semibold hover:underline"
                        >
                          <ExternalLink size={14} />
                          <span>LinkedIn Profile</span>
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Skills Section */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Award size={16} className="text-[#2878B8]" />
                      <h4 className="font-bold text-[#14243A] text-xs uppercase tracking-wider">
                        Verified Technical Skills ({portfolioData.skills.length})
                      </h4>
                    </div>

                    {portfolioData.skills.length === 0 ? (
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-400 text-xs italic">
                        No skills listed on this student's profile yet.
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {portfolioData.skills.map((s) => (
                          <div
                            key={s.id}
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs shadow-2xs"
                          >
                            <span className="font-bold text-[#14243A]">{s.skill.name}</span>
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                s.proficiency_level === 'advanced'
                                  ? 'bg-purple-50 text-purple-700'
                                  : s.proficiency_level === 'intermediate'
                                  ? 'bg-blue-50 text-[#2878B8]'
                                  : 'bg-emerald-50 text-emerald-700'
                              }`}
                            >
                              {s.proficiency_level.toUpperCase()}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Projects Section */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Code2 size={16} className="text-[#2878B8]" />
                      <h4 className="font-bold text-[#14243A] text-xs uppercase tracking-wider">
                        Technical Projects ({portfolioData.projects.length})
                      </h4>
                    </div>

                    {portfolioData.projects.length === 0 ? (
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-400 text-xs italic">
                        No projects submitted on this student's profile yet.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {portfolioData.projects.map((p) => (
                          <div
                            key={p.id}
                            className="p-3 bg-white rounded-xl border border-slate-200 space-y-2 shadow-2xs"
                          >
                            <div className="font-bold text-xs text-[#14243A]">{p.title}</div>
                            {p.description && (
                              <p className="text-[11px] text-slate-600 line-clamp-2">
                                {p.description}
                              </p>
                            )}
                            {p.tech_stack && (
                              <div className="text-[10px] font-semibold text-slate-500">
                                Stack: {p.tech_stack}
                              </div>
                            )}
                            <div className="flex items-center gap-2 pt-1 text-[11px]">
                              {p.repo_url && (
                                <a
                                  href={p.repo_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[#2878B8] hover:underline flex items-center gap-1 font-semibold"
                                >
                                  <FolderGit2 size={12} /> Repo
                                </a>
                              )}
                              {p.live_url && (
                                <a
                                  href={p.live_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[#2878B8] hover:underline flex items-center gap-1 font-semibold"
                                >
                                  <ExternalLink size={12} /> Live Demo
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Applications History Section */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Briefcase size={16} className="text-[#2878B8]" />
                      <h4 className="font-bold text-[#14243A] text-xs uppercase tracking-wider">
                        Recruitment Applications ({portfolioData.applications.length})
                      </h4>
                    </div>

                    {portfolioData.applications.length === 0 ? (
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-400 text-xs italic">
                        Student has not submitted applications for campus opportunities yet.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {portfolioData.applications.map((app) => (
                          <div
                            key={app.id}
                            className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs"
                          >
                            <div>
                              <div className="font-bold text-[#14243A]">
                                {app.internship.title}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                {app.internship.company_name} &middot;{' '}
                                {new Date(app.applied_at).toLocaleDateString()}
                              </div>
                            </div>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                app.status === 'accepted'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : app.status === 'shortlisted'
                                  ? 'bg-purple-100 text-purple-800'
                                  : app.status === 'under_review'
                                  ? 'bg-amber-100 text-amber-800'
                                  : app.status === 'rejected'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {app.status.replace('_', ' ').toUpperCase()}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Mentorship Feedback Console */}
                  <div className="pt-4 border-t border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MessageSquare size={16} className="text-[#2878B8]" />
                        <h4 className="font-bold text-[#14243A] text-xs uppercase tracking-wider">
                          Faculty Mentorship Guidance &amp; Feedback
                        </h4>
                      </div>
                      {portfolioData.updated_at && (
                        <div className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Calendar size={12} />
                          <span>
                            Updated {new Date(portfolioData.updated_at).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>

                    {feedbackSuccess && (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
                        <CheckCircle2 size={15} className="shrink-0 text-emerald-600" />
                        <span>{feedbackSuccess}</span>
                      </div>
                    )}

                    {feedbackError && (
                      <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
                        <AlertCircle size={15} className="shrink-0 text-rose-600" />
                        <span>{feedbackError}</span>
                      </div>
                    )}

                    <form onSubmit={handleSaveFeedback} className="space-y-3">
                      <textarea
                        rows={4}
                        value={feedbackNotes}
                        onChange={(e) => setFeedbackNotes(e.target.value)}
                        placeholder="Provide academic advice, recommended skills, placement preparation recommendations, or review notes..."
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2878B8]/20 focus:border-[#2878B8] transition"
                      />

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="feedbackVisible"
                            checked={feedbackVisible}
                            onChange={(e) => setFeedbackVisible(e.target.checked)}
                            className="rounded border-slate-300 text-[#2878B8] focus:ring-[#2878B8]"
                          />
                          <label
                            htmlFor="feedbackVisible"
                            className="text-xs font-medium text-slate-700 select-none flex items-center gap-1.5"
                          >
                            {feedbackVisible ? (
                              <Eye size={14} className="text-emerald-600" />
                            ) : (
                              <EyeOff size={14} className="text-slate-400" />
                            )}
                            <span>
                              {feedbackVisible
                                ? 'Shared with student (Visible in their dashboard)'
                                : 'Keep as private faculty observation'}
                            </span>
                          </label>
                        </div>

                        <button
                          type="submit"
                          disabled={savingFeedback}
                          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#2878B8] hover:bg-[#20639B] text-white text-xs font-semibold rounded-xl shadow-xs transition disabled:opacity-60"
                        >
                          {savingFeedback && <Loader2 size={13} className="animate-spin" />}
                          <span>Save Feedback</span>
                        </button>
                      </div>
                    </form>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Unassign Confirmation */}
      {unassigningTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in duration-150 space-y-4">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Trash2 size={20} />
            </div>

            <div>
              <h3 className="font-bold text-[#14243A] text-sm">
                Unassign {unassigningTarget.student.full_name}?
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                This removes the student from your advisee cohort. The student's account, skills, and projects will remain completely intact.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setUnassigningTarget(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={unassigning}
                onClick={handleConfirmUnassign}
                className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-xs transition disabled:opacity-60"
              >
                {unassigning && <Loader2 size={14} className="animate-spin" />}
                <span>Confirm Unassign</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
