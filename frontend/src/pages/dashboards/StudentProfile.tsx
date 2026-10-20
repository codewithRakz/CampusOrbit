import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  fetchStudentProfile,
  updateStudentProfile,
  type StudentProfileResponse,
} from '../../services/profile';
import {
  GraduationCap,
  BookOpen,
  Award,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft,
  ExternalLink,
  Save,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Globe,
} from 'lucide-react';

const COMMON_DEPARTMENTS = [
  'Computer Science & Engineering',
  'Information Technology',
  'Electronics & Communication Engineering',
  'Electrical & Electronics Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Chemical Engineering',
  'Aerospace Engineering',
  'Biotechnology',
  'Data Science & Artificial Intelligence',
];

export default function StudentProfile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Profile data states
  const [department, setDepartment] = useState('');
  const [yearOfStudy, setYearOfStudy] = useState<number | ''>('');
  const [cgpa, setCgpa] = useState<string>('');
  const [bio, setBio] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');

  // Initial fetched snapshot for revert/comparison
  const [savedProfile, setSavedProfile] = useState<StudentProfileResponse | null>(null);

  // UI status states
  const [initialLoading, setInitialLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isFirstTime, setIsFirstTime] = useState(false);

  // Field validation errors
  const [fieldErrors, setFieldErrors] = useState<{
    department?: string;
    yearOfStudy?: string;
    cgpa?: string;
    githubUrl?: string;
    linkedinUrl?: string;
  }>({});

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      try {
        setInitialLoading(true);
        setErrorMessage(null);
        const data = await fetchStudentProfile();

        if (!isMounted) return;

        if (data) {
          setSavedProfile(data);
          setDepartment(data.department || '');
          setYearOfStudy(data.year_of_study ?? '');
          setCgpa(data.cgpa !== null && data.cgpa !== undefined ? data.cgpa.toString() : '');
          setBio(data.bio || '');
          setGithubUrl(data.github_url || '');
          setLinkedinUrl(data.linkedin_url || '');
          setIsFirstTime(false);
        } else {
          // 404 response: profile does not exist yet
          setIsFirstTime(true);
          setSavedProfile(null);
        }
      } catch (err: unknown) {
        if (!isMounted) return;
        if (err instanceof Error) {
          if (err.message.includes('session has expired')) {
            logout();
            navigate('/login');
            return;
          }
          setErrorMessage(err.message);
        } else {
          setErrorMessage('Failed to load profile. Please refresh the page.');
        }
      } finally {
        if (isMounted) {
          setInitialLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [logout, navigate]);

  // Compute completion score honestly from existing fields
  const calculateCompletionScore = () => {
    let score = 0;
    if (department.trim()) score += 20;
    if (yearOfStudy !== '' && Number(yearOfStudy) >= 1 && Number(yearOfStudy) <= 5) score += 15;
    const numCgpa = parseFloat(cgpa);
    if (!isNaN(numCgpa) && numCgpa >= 0.0 && numCgpa <= 10.0) score += 20;
    if (bio.trim().length >= 10) score += 15;
    if (githubUrl.trim().length > 0) score += 15;
    if (linkedinUrl.trim().length > 0) score += 15;
    return score;
  };

  const completionScore = calculateCompletionScore();

  // Validate URL format
  const isValidUrl = (url: string) => {
    if (!url.trim()) return true;
    try {
      const parsed = new URL(url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const validateForm = (): boolean => {
    const errors: typeof fieldErrors = {};

    if (!department.trim()) {
      errors.department = 'Please select or enter your academic department.';
    } else if (department.trim().length > 100) {
      errors.department = 'Department name cannot exceed 100 characters.';
    }

    if (yearOfStudy === '') {
      errors.yearOfStudy = 'Please choose your current year of study (1–5).';
    } else {
      const yr = Number(yearOfStudy);
      if (isNaN(yr) || yr < 1 || yr > 5) {
        errors.yearOfStudy = 'Year of study must be between 1 and 5.';
      }
    }

    if (!cgpa.trim()) {
      errors.cgpa = 'Please enter your current cumulative CGPA.';
    } else {
      const numCgpa = parseFloat(cgpa);
      if (isNaN(numCgpa)) {
        errors.cgpa = 'CGPA must be a valid decimal number.';
      } else if (numCgpa < 0.0 || numCgpa > 10.0) {
        errors.cgpa = 'CGPA must be between 0.00 and 10.00.';
      }
    }

    if (githubUrl.trim()) {
      if (!isValidUrl(githubUrl)) {
        errors.githubUrl = 'Please enter a valid GitHub profile URL (e.g. https://github.com/username).';
      } else if (githubUrl.trim().length > 255) {
        errors.githubUrl = 'URL cannot exceed 255 characters.';
      }
    }

    if (linkedinUrl.trim()) {
      if (!isValidUrl(linkedinUrl)) {
        errors.linkedinUrl = 'Please enter a valid LinkedIn profile URL (e.g. https://linkedin.com/in/username).';
      } else if (linkedinUrl.trim().length > 255) {
        errors.linkedinUrl = 'URL cannot exceed 255 characters.';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);

      const parsedCgpa = parseFloat(cgpa);
      const parsedYear = Number(yearOfStudy);

      // Normalise URLs to include https:// if missing
      const formatUrl = (url: string) => {
        const trimmed = url.trim();
        if (!trimmed) return null;
        if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
          return trimmed;
        }
        return `https://${trimmed}`;
      };

      const payload = {
        department: department.trim(),
        year_of_study: parsedYear,
        cgpa: Math.round(parsedCgpa * 100) / 100, // round to 2 decimals
        bio: bio.trim() || null,
        github_url: formatUrl(githubUrl),
        linkedin_url: formatUrl(linkedinUrl),
      };

      const updated = await updateStudentProfile(payload);

      setSavedProfile(updated);
      setIsFirstTime(false);
      setSuccessMessage(
        isFirstTime
          ? 'Profile created successfully! Your academic record is now registered.'
          : 'Profile updated successfully! Changes have been saved.'
      );

      // Scroll to top of window to display success toast smoothly
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.message.includes('session has expired')) {
          logout();
          navigate('/login');
          return;
        }
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to save profile. Please check your connection and try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setFieldErrors({});
    setErrorMessage(null);
    setSuccessMessage(null);

    if (savedProfile) {
      setDepartment(savedProfile.department || '');
      setYearOfStudy(savedProfile.year_of_study ?? '');
      setCgpa(savedProfile.cgpa !== null && savedProfile.cgpa !== undefined ? savedProfile.cgpa.toString() : '');
      setBio(savedProfile.bio || '');
      setGithubUrl(savedProfile.github_url || '');
      setLinkedinUrl(savedProfile.linkedin_url || '');
    } else {
      setDepartment('');
      setYearOfStudy('');
      setCgpa('');
      setBio('');
      setGithubUrl('');
      setLinkedinUrl('');
    }
  };

  if (initialLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/90 p-12 shadow-xs text-center">
        <div className="inline-flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-[#2878B8]" />
          <h3 className="text-base font-semibold text-[#14243A]">Loading student profile...</h3>
          <p className="text-xs text-slate-500">Retrieving academic records from campus database</p>
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
              <GraduationCap size={15} />
              <span>Academic Profile &middot; Official Student Record</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#14243A]">
              Academic Profile &amp; Bio
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
              Your academic department, current CGPA, and professional links are used by placement officers and corporate recruiters to evaluate eligibility for campus internship drives.
            </p>
          </div>

          {/* Profile Completion Meter */}
          <div className="bg-[#F4F7FB] border border-slate-200/80 rounded-2xl p-4 sm:p-5 w-full md:w-64 shrink-0 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#14243A] uppercase tracking-wider text-[11px]">
                Profile Health
              </span>
              <span className="font-extrabold text-[#2878B8]">{completionScore}%</span>
            </div>
            <div className="w-full bg-slate-200/70 h-2.5 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  completionScore >= 80
                    ? 'bg-emerald-500'
                    : completionScore >= 50
                    ? 'bg-[#2878B8]'
                    : 'bg-amber-500'
                }`}
                style={{ width: `${completionScore}%` }}
              ></div>
            </div>
            <p className="text-[11px] text-slate-500 leading-tight">
              {completionScore === 100
                ? 'Profile 100% complete. Ready for recruiter review.'
                : completionScore >= 50
                ? 'Core academic details filled. Add social links & bio.'
                : 'Initial profile setup needed to unlock opportunities.'}
            </p>
          </div>
        </div>
      </div>

      {/* First-time Profile Info Notice */}
      {isFirstTime && (
        <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200/80 flex items-start gap-3">
          <div className="p-1.5 rounded-lg bg-[#2878B8]/10 text-[#2878B8] shrink-0 mt-0.5">
            <Sparkles size={16} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#14243A] uppercase tracking-wider">
              Initialize Your Student Profile
            </h4>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Welcome to CampusOrbit! Fill in your department, year, and current CGPA below to activate your student workspace and prepare for internship applications.
            </p>
          </div>
        </div>
      )}

      {/* Success Notification */}
      {successMessage && (
        <div
          role="status"
          className="p-4 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-start gap-3 text-emerald-800 text-xs sm:text-sm"
        >
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">{successMessage}</p>
          </div>
        </div>
      )}

      {/* Global Error Notification */}
      {errorMessage && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-red-50 border border-red-200/80 flex items-start gap-3 text-red-800 text-xs sm:text-sm"
        >
          <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Unable to save profile</p>
            <p className="text-xs text-red-700 mt-0.5 leading-relaxed">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Profile Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Form (8 Columns) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-xs">
          <form onSubmit={handleSubmit} noValidate className="space-y-6">
            {/* Academic Information Section */}
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#14243A] pb-3 border-b border-slate-100 flex items-center gap-2">
                <BookOpen size={16} className="text-[#2878B8]" />
                <span>1. Academic Information</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-5">
                {/* Department Field */}
                <div className="sm:col-span-2">
                  <label
                    htmlFor="department"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
                  >
                    Academic Department <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="department"
                    list="departments-list"
                    type="text"
                    required
                    value={department}
                    onChange={(e) => {
                      setDepartment(e.target.value);
                      if (fieldErrors.department) {
                        setFieldErrors({ ...fieldErrors, department: undefined });
                      }
                    }}
                    placeholder="e.g. Computer Science & Engineering"
                    disabled={saving}
                    className={`block w-full px-3.5 py-2.5 text-xs sm:text-sm border rounded-xl bg-white text-[#14243A] placeholder:text-slate-400 focus:outline-none focus:ring-2 transition ${
                      fieldErrors.department
                        ? 'border-red-300 focus:ring-red-200 focus:border-red-500'
                        : 'border-slate-200 focus:ring-[#2878B8]/20 focus:border-[#2878B8]'
                    }`}
                  />
                  <datalist id="departments-list">
                    {COMMON_DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept} />
                    ))}
                  </datalist>
                  {fieldErrors.department ? (
                    <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle size={13} /> {fieldErrors.department}
                    </p>
                  ) : (
                    <p className="mt-1 text-[11px] text-slate-400">
                      Choose from suggestions or type your exact university branch name.
                    </p>
                  )}
                </div>

                {/* Year of Study Field */}
                <div>
                  <label
                    htmlFor="yearOfStudy"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
                  >
                    Year of Study <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="yearOfStudy"
                    required
                    value={yearOfStudy}
                    onChange={(e) => {
                      setYearOfStudy(e.target.value ? Number(e.target.value) : '');
                      if (fieldErrors.yearOfStudy) {
                        setFieldErrors({ ...fieldErrors, yearOfStudy: undefined });
                      }
                    }}
                    disabled={saving}
                    className={`block w-full px-3.5 py-2.5 text-xs sm:text-sm border rounded-xl bg-white text-[#14243A] focus:outline-none focus:ring-2 transition ${
                      fieldErrors.yearOfStudy
                        ? 'border-red-300 focus:ring-red-200 focus:border-red-500'
                        : 'border-slate-200 focus:ring-[#2878B8]/20 focus:border-[#2878B8]'
                    }`}
                  >
                    <option value="">Select current year</option>
                    <option value={1}>1st Year (Freshman)</option>
                    <option value={2}>2nd Year (Sophomore)</option>
                    <option value={3}>3rd Year (Junior)</option>
                    <option value={4}>4th Year (Senior / Final Year)</option>
                    <option value={5}>5th Year (Dual Degree / Integrated)</option>
                  </select>
                  {fieldErrors.yearOfStudy ? (
                    <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle size={13} /> {fieldErrors.yearOfStudy}
                    </p>
                  ) : (
                    <p className="mt-1 text-[11px] text-slate-400">Valid range: Years 1 through 5.</p>
                  )}
                </div>

                {/* CGPA Field */}
                <div>
                  <label
                    htmlFor="cgpa"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
                  >
                    Cumulative CGPA <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="cgpa"
                      type="number"
                      step="0.01"
                      min="0"
                      max="10"
                      required
                      value={cgpa}
                      onChange={(e) => {
                        setCgpa(e.target.value);
                        if (fieldErrors.cgpa) {
                          setFieldErrors({ ...fieldErrors, cgpa: undefined });
                        }
                      }}
                      placeholder="e.g. 8.75"
                      disabled={saving}
                      className={`block w-full px-3.5 py-2.5 text-xs sm:text-sm border rounded-xl bg-white text-[#14243A] placeholder:text-slate-400 focus:outline-none focus:ring-2 transition ${
                        fieldErrors.cgpa
                          ? 'border-red-300 focus:ring-red-200 focus:border-red-500'
                          : 'border-slate-200 focus:ring-[#2878B8]/20 focus:border-[#2878B8]'
                      }`}
                    />
                    <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-xs text-slate-400 font-semibold">
                      / 10.0
                    </div>
                  </div>
                  {fieldErrors.cgpa ? (
                    <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle size={13} /> {fieldErrors.cgpa}
                    </p>
                  ) : (
                    <p className="mt-1 text-[11px] text-slate-400">Decimal scale from 0.00 to 10.00.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Professional Summary Section */}
            <div className="pt-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#14243A] pb-3 border-b border-slate-100 flex items-center gap-2">
                <FileText size={16} className="text-[#2878B8]" />
                <span>2. Professional Biography</span>
              </h2>

              <div className="mt-5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="bio"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
                  >
                    Short Biography &amp; Career Objective
                  </label>
                  <span className="text-[11px] text-slate-400">{bio.length} / 1000</span>
                </div>
                <textarea
                  id="bio"
                  rows={4}
                  maxLength={1000}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="e.g. Passionate full-stack software developer interested in distributed systems and scalable backend engineering. Experienced in Python, React, and PostgreSQL."
                  disabled={saving}
                  className="block w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-200 rounded-xl bg-white text-[#14243A] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2878B8]/20 focus:border-[#2878B8] transition resize-y"
                />
                <p className="text-[11px] text-slate-400">
                  Highlight key engineering passions, preferred tech stacks, and career focus.
                </p>
              </div>
            </div>

            {/* Social & Portfolio Links Section */}
            <div className="pt-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#14243A] pb-3 border-b border-slate-100 flex items-center gap-2">
                <Globe size={16} className="text-[#2878B8]" />
                <span>3. Verified Portfolio Links</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-5">
                {/* GitHub URL */}
                <div>
                  <label
                    htmlFor="githubUrl"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
                  >
                    GitHub Profile URL
                  </label>
                  <div className="relative">
                    <input
                      id="githubUrl"
                      type="url"
                      value={githubUrl}
                      onChange={(e) => {
                        setGithubUrl(e.target.value);
                        if (fieldErrors.githubUrl) {
                          setFieldErrors({ ...fieldErrors, githubUrl: undefined });
                        }
                      }}
                      placeholder="https://github.com/username"
                      disabled={saving}
                      className={`block w-full px-3.5 py-2.5 text-xs sm:text-sm border rounded-xl bg-white text-[#14243A] placeholder:text-slate-400 focus:outline-none focus:ring-2 transition ${
                        fieldErrors.githubUrl
                          ? 'border-red-300 focus:ring-red-200 focus:border-red-500'
                          : 'border-slate-200 focus:ring-[#2878B8]/20 focus:border-[#2878B8]'
                      }`}
                    />
                    {githubUrl.trim() && isValidUrl(githubUrl) && (
                      <a
                        href={githubUrl.startsWith('http') ? githubUrl : `https://${githubUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        title="Preview GitHub Link"
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-[#2878B8]"
                      >
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                  {fieldErrors.githubUrl ? (
                    <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle size={13} /> {fieldErrors.githubUrl}
                    </p>
                  ) : (
                    <p className="mt-1 text-[11px] text-slate-400">Used to verify open-source projects.</p>
                  )}
                </div>

                {/* LinkedIn URL */}
                <div>
                  <label
                    htmlFor="linkedinUrl"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
                  >
                    LinkedIn Profile URL
                  </label>
                  <div className="relative">
                    <input
                      id="linkedinUrl"
                      type="url"
                      value={linkedinUrl}
                      onChange={(e) => {
                        setLinkedinUrl(e.target.value);
                        if (fieldErrors.linkedinUrl) {
                          setFieldErrors({ ...fieldErrors, linkedinUrl: undefined });
                        }
                      }}
                      placeholder="https://linkedin.com/in/username"
                      disabled={saving}
                      className={`block w-full px-3.5 py-2.5 text-xs sm:text-sm border rounded-xl bg-white text-[#14243A] placeholder:text-slate-400 focus:outline-none focus:ring-2 transition ${
                        fieldErrors.linkedinUrl
                          ? 'border-red-300 focus:ring-red-200 focus:border-red-500'
                          : 'border-slate-200 focus:ring-[#2878B8]/20 focus:border-[#2878B8]'
                      }`}
                    />
                    {linkedinUrl.trim() && isValidUrl(linkedinUrl) && (
                      <a
                        href={linkedinUrl.startsWith('http') ? linkedinUrl : `https://${linkedinUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        title="Preview LinkedIn Link"
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-[#2878B8]"
                      >
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                  {fieldErrors.linkedinUrl ? (
                    <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle size={13} /> {fieldErrors.linkedinUrl}
                    </p>
                  ) : (
                    <p className="mt-1 text-[11px] text-slate-400">Used for recruiter talent sourcing.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Form Actions Footer */}
            <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleReset}
                disabled={saving}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-[#14243A] bg-[#F4F7FB] hover:bg-slate-200 rounded-xl transition disabled:opacity-50"
              >
                <RotateCcw size={15} />
                <span>Reset to Saved</span>
              </button>

              <button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-[#2878B8] hover:bg-[#20639B] text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Saving Profile...</span>
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    <span>{isFirstTime ? 'Create Profile' : 'Save Profile Changes'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Sidebar Info Card (4 Columns) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Student Identity Card */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-12 h-12 rounded-full bg-[#2878B8]/10 text-[#2878B8] font-extrabold text-base flex items-center justify-center shrink-0">
                {user?.full_name ? user.full_name[0].toUpperCase() : 'S'}
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-[#14243A] text-sm truncate">{user?.full_name}</h3>
                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-semibold text-[#2878B8] bg-[#2878B8]/10 px-2 py-0.5 rounded-md">
                  <ShieldCheck size={11} /> Verified Student Account
                </span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span className="text-slate-400">Account ID:</span>
                <span className="font-mono font-semibold text-[#14243A]">#{user?.id}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span className="text-slate-400">Department:</span>
                <span className="font-medium text-[#14243A] text-right truncate max-w-[160px]">
                  {department || 'Not registered'}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span className="text-slate-400">Current Standing:</span>
                <span className="font-medium text-[#14243A]">
                  {yearOfStudy ? `Year ${yearOfStudy}` : 'Not specified'}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span className="text-slate-400">Cumulative CGPA:</span>
                <span className="font-bold text-[#2878B8]">
                  {cgpa ? `${parseFloat(cgpa).toFixed(2)} / 10.0` : 'Not recorded'}
                </span>
              </div>
            </div>
          </div>

          {/* Eligibility Guidance Card */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#2878B8]">
              <Award size={16} />
              <span>Drive Eligibility Guidance</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Placement officers reference your cumulative CGPA and department when shortlisting candidates for internships and campus recruitment drives.
            </p>
            <div className="pt-2 border-t border-slate-100">
              <Link
                to="/student/skills-projects"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2878B8] hover:text-[#14243A] transition-colors"
              >
                <span>Manage Skills &amp; Projects &rarr;</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
