import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  getPortfolioData,
  addStudentSkill,
  removeStudentSkill,
  addStudentProject,
  deleteStudentProject,
  type SkillProficiency,
} from '../../services/portfolio';
import {
  type StudentSkillItem,
  type StudentProjectItem,
  type StudentProfileResponse,
} from '../../services/profile';
import {
  FolderGit2,
  Sparkles,
  Plus,
  Trash2,
  ExternalLink,
  Globe,
  Code2,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  X,
} from 'lucide-react';

const COMMON_SKILLS = [
  { name: 'Python', category: 'Backend' },
  { name: 'JavaScript', category: 'Frontend' },
  { name: 'TypeScript', category: 'Frontend' },
  { name: 'React', category: 'Frontend' },
  { name: 'Node.js', category: 'Backend' },
  { name: 'FastAPI', category: 'Backend' },
  { name: 'Django', category: 'Backend' },
  { name: 'Java', category: 'Backend' },
  { name: 'C++', category: 'Core CS' },
  { name: 'PostgreSQL', category: 'Database' },
  { name: 'MySQL', category: 'Database' },
  { name: 'MongoDB', category: 'Database' },
  { name: 'Docker', category: 'Cloud & DevOps' },
  { name: 'Kubernetes', category: 'Cloud & DevOps' },
  { name: 'AWS', category: 'Cloud & DevOps' },
  { name: 'Git', category: 'Tools' },
  { name: 'Tailwind CSS', category: 'Frontend' },
  { name: 'PyTorch', category: 'AI & Data Science' },
  { name: 'TensorFlow', category: 'AI & Data Science' },
  { name: 'Machine Learning', category: 'AI & Data Science' },
];

const SKILL_CATEGORIES = [
  'Frontend',
  'Backend',
  'Database',
  'Cloud & DevOps',
  'AI & Data Science',
  'Mobile',
  'Core CS',
  'Tools',
  'General',
];

export default function StudentSkillsProjects() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  // Portfolio data states
  const [profile, setProfile] = useState<StudentProfileResponse | null>(null);
  const [skills, setSkills] = useState<StudentSkillItem[]>([]);
  const [projects, setProjects] = useState<StudentProjectItem[]>([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Skill Form states
  const [skillName, setSkillName] = useState('');
  const [skillCategory, setSkillCategory] = useState('Frontend');
  const [skillProficiency, setSkillProficiency] = useState<SkillProficiency>('intermediate');
  const [addingSkill, setAddingSkill] = useState(false);
  const [skillError, setSkillError] = useState<string | null>(null);
  const [skillToDelete, setSkillToDelete] = useState<StudentSkillItem | null>(null);
  const [deletingSkillId, setDeletingSkillId] = useState<number | null>(null);

  // Project Form states
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [projectTitle, setProjectTitle] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectTechStack, setProjectTechStack] = useState('');
  const [projectRepoUrl, setProjectRepoUrl] = useState('');
  const [projectLiveUrl, setProjectLiveUrl] = useState('');
  const [addingProject, setAddingProject] = useState(false);
  const [projectError, setProjectError] = useState<string | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<StudentProjectItem | null>(null);
  const [deletingProjectId, setDeletingProjectId] = useState<number | null>(null);

  // Filter skills by category
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('All');

  const loadData = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const data = await getPortfolioData();
      setProfile(data.profile);
      setSkills(data.skills);
      setProjects(data.projects);
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.message.includes('session has expired')) {
          logout();
          navigate('/login');
          return;
        }
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to load portfolio items. Please refresh.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle auto-matching skill category when choosing from suggestion
  const handleSkillNameChange = (name: string) => {
    setSkillName(name);
    setSkillError(null);
    const matched = COMMON_SKILLS.find((s) => s.name.toLowerCase() === name.trim().toLowerCase());
    if (matched) {
      setSkillCategory(matched.category);
    }
  };

  // 1. Submit Add Skill
  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    setSkillError(null);
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanName = skillName.trim();
    if (!cleanName) {
      setSkillError('Please enter a skill name.');
      return;
    }

    if (cleanName.length > 50) {
      setSkillError('Skill name cannot exceed 50 characters.');
      return;
    }

    // Check client-side duplicate before sending
    const duplicate = skills.some(
      (s) => s.skill.name.toLowerCase() === cleanName.toLowerCase()
    );
    if (duplicate) {
      setSkillError(`Skill '${cleanName}' is already added to your profile.`);
      return;
    }

    try {
      setAddingSkill(true);
      const newSkill = await addStudentSkill({
        name: cleanName,
        category: skillCategory.trim() || 'General',
        proficiency_level: skillProficiency,
      });

      setSkills((prev) => [newSkill, ...prev]);
      setSkillName('');
      setSuccessMessage(`Skill '${newSkill.skill.name}' added successfully!`);
      // Clear success notification after 4 seconds
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setSkillError(err.message);
      } else {
        setSkillError('Failed to add skill. Please try again.');
      }
    } finally {
      setAddingSkill(false);
    }
  };

  // 2. Remove Skill
  const handleConfirmRemoveSkill = async () => {
    if (!skillToDelete) return;
    const item = skillToDelete;

    try {
      setDeletingSkillId(item.id);
      await removeStudentSkill(item.id);
      setSkills((prev) => prev.filter((s) => s.id !== item.id));
      setSuccessMessage(`Removed '${item.skill.name}' from your portfolio.`);
      setSkillToDelete(null);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to remove skill.');
      }
    } finally {
      setDeletingSkillId(null);
    }
  };

  // Helper URL validator
  const isValidUrl = (url: string) => {
    if (!url.trim()) return true;
    try {
      const parsed = new URL(url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  };

  // 3. Submit Add Project
  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setProjectError(null);
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanTitle = projectTitle.trim();
    if (!cleanTitle || cleanTitle.length < 2) {
      setProjectError('Project title must be at least 2 characters long.');
      return;
    }

    if (cleanTitle.length > 150) {
      setProjectError('Project title cannot exceed 150 characters.');
      return;
    }

    if (projectRepoUrl.trim() && !isValidUrl(projectRepoUrl)) {
      setProjectError('Please enter a valid repository URL (e.g. https://github.com/user/repo).');
      return;
    }

    if (projectLiveUrl.trim() && !isValidUrl(projectLiveUrl)) {
      setProjectError('Please enter a valid live demo URL.');
      return;
    }

    const formatUrl = (url: string) => {
      const trimmed = url.trim();
      if (!trimmed) return undefined;
      return trimmed.startsWith('http://') || trimmed.startsWith('https://') ? trimmed : `https://${trimmed}`;
    };

    try {
      setAddingProject(true);
      const newProject = await addStudentProject({
        title: cleanTitle,
        description: projectDescription.trim() || undefined,
        tech_stack: projectTechStack.trim() || undefined,
        repo_url: formatUrl(projectRepoUrl),
        live_url: formatUrl(projectLiveUrl),
      });

      setProjects((prev) => [newProject, ...prev]);
      setShowProjectModal(false);
      setProjectTitle('');
      setProjectDescription('');
      setProjectTechStack('');
      setProjectRepoUrl('');
      setProjectLiveUrl('');
      setSuccessMessage(`Project '${newProject.title}' published to your portfolio!`);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setProjectError(err.message);
      } else {
        setProjectError('Failed to add project. Please try again.');
      }
    } finally {
      setAddingProject(false);
    }
  };

  // 4. Delete Project
  const handleConfirmDeleteProject = async () => {
    if (!projectToDelete) return;
    const proj = projectToDelete;

    try {
      setDeletingProjectId(proj.id);
      await deleteStudentProject(proj.id);
      setProjects((prev) => prev.filter((p) => p.id !== proj.id));
      setSuccessMessage(`Project '${proj.title}' deleted successfully.`);
      setProjectToDelete(null);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to delete project.');
      }
    } finally {
      setDeletingProjectId(null);
    }
  };

  // Filtered skills list
  const filteredSkills =
    selectedCategoryFilter === 'All'
      ? skills
      : skills.filter((s) => s.skill.category === selectedCategoryFilter);

  // Available categories in the student's skills
  const activeCategories = ['All', ...Array.from(new Set(skills.map((s) => s.skill.category)))];

  // Proficiency count stats
  const advancedCount = skills.filter((s) => s.proficiency_level === 'advanced').length;
  const intermediateCount = skills.filter((s) => s.proficiency_level === 'intermediate').length;
  const beginnerCount = skills.filter((s) => s.proficiency_level === 'beginner').length;

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/90 p-12 shadow-xs text-center">
        <div className="inline-flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-[#2878B8]" />
          <h3 className="text-base font-semibold text-[#14243A]">Loading skills &amp; projects...</h3>
          <p className="text-xs text-slate-500">Retrieving portfolio catalog from campus database</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
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
              <FolderGit2 size={15} />
              <span>Verified Portfolio Showcase</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#14243A]">
              Skills &amp; Project Portfolio
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
              Showcase your technical proficiencies, frameworks, and software projects. Recruiters and placement officers review your stack during opportunity matching.
            </p>
          </div>

          {/* Quick Metrics Badge Card */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0">
            <div className="bg-[#F4F7FB] border border-slate-200/80 rounded-2xl px-5 py-3 text-center min-w-[100px]">
              <span className="block text-xl font-extrabold text-[#2878B8]">{skills.length}</span>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Skills
              </span>
            </div>
            <div className="bg-[#F4F7FB] border border-slate-200/80 rounded-2xl px-5 py-3 text-center min-w-[100px]">
              <span className="block text-xl font-extrabold text-[#14243A]">{projects.length}</span>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Projects
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Alert if Profile has not been filled out yet */}
      {!profile && (
        <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-1.5 rounded-lg bg-amber-100 text-amber-700 shrink-0 mt-0.5">
              <AlertCircle size={16} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                Academic Profile Not Configured
              </h4>
              <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                You can add skills and projects right now, but remember to record your department and CGPA to qualify for placement drives.
              </p>
            </div>
          </div>
          <Link
            to="/student/profile"
            className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition"
          >
            <span>Complete Profile</span>
          </Link>
        </div>
      )}

      {/* Global Notifications */}
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

      {/* ============================================================== */}
      {/* SECTION 1: TECHNICAL SKILLS                                    */}
      {/* ============================================================== */}
      <section className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Code2 size={20} className="text-[#2878B8]" />
              <h2 className="text-lg font-bold text-[#14243A]">Technical Skill Stack</h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Add technical competencies with realistic proficiency levels.
            </p>
          </div>

          {/* Proficiency Breakdown Pills */}
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200/60 text-[11px]">
              {advancedCount} Advanced
            </span>
            <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200/60 text-[11px]">
              {intermediateCount} Intermediate
            </span>
            <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-semibold border border-slate-200 text-[11px]">
              {beginnerCount} Beginner
            </span>
          </div>
        </div>

        {/* Add Skill Form Bar */}
        <form onSubmit={handleAddSkill} className="bg-[#F4F7FB] p-4 sm:p-5 rounded-2xl border border-slate-200/80 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
            {/* Skill Name Input */}
            <div className="sm:col-span-5">
              <label
                htmlFor="skillName"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1"
              >
                Skill Name <span className="text-red-500">*</span>
              </label>
              <input
                id="skillName"
                list="skills-suggestions"
                type="text"
                required
                value={skillName}
                onChange={(e) => handleSkillNameChange(e.target.value)}
                placeholder="e.g. React, Python, PostgreSQL, Docker"
                disabled={addingSkill}
                className="block w-full px-3.5 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl bg-white text-[#14243A] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2878B8]/20 focus:border-[#2878B8] transition"
              />
              <datalist id="skills-suggestions">
                {COMMON_SKILLS.map((s) => (
                  <option key={s.name} value={s.name} />
                ))}
              </datalist>
            </div>

            {/* Category Dropdown */}
            <div className="sm:col-span-3">
              <label
                htmlFor="skillCategory"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1"
              >
                Category
              </label>
              <select
                id="skillCategory"
                value={skillCategory}
                onChange={(e) => setSkillCategory(e.target.value)}
                disabled={addingSkill}
                className="block w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl bg-white text-[#14243A] focus:outline-none focus:ring-2 focus:ring-[#2878B8]/20 focus:border-[#2878B8] transition"
              >
                {SKILL_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Proficiency Level Selector */}
            <div className="sm:col-span-2">
              <label
                htmlFor="skillProficiency"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1"
              >
                Proficiency
              </label>
              <select
                id="skillProficiency"
                value={skillProficiency}
                onChange={(e) => setSkillProficiency(e.target.value as SkillProficiency)}
                disabled={addingSkill}
                className="block w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl bg-white text-[#14243A] focus:outline-none focus:ring-2 focus:ring-[#2878B8]/20 focus:border-[#2878B8] transition"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            {/* Submit Button */}
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={addingSkill}
                className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#2878B8] hover:bg-[#20639B] text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition disabled:opacity-60"
              >
                {addingSkill ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>Adding...</span>
                  </>
                ) : (
                  <>
                    <Plus size={16} />
                    <span>Add Skill</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {skillError && (
            <p className="text-xs text-red-600 flex items-center gap-1 pt-1">
              <AlertCircle size={13} /> {skillError}
            </p>
          )}
        </form>

        {/* Category Filters */}
        {skills.length > 0 && activeCategories.length > 2 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-2">
            <span className="text-xs font-semibold text-slate-400 mr-1 shrink-0">Filter:</span>
            {activeCategories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategoryFilter(cat)}
                className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 transition ${
                  selectedCategoryFilter === cat
                    ? 'bg-[#2878B8] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Skills Grid */}
        {skills.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 bg-[#F4F7FB]/50 space-y-2">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-[#2878B8] flex items-center justify-center mx-auto">
              <Sparkles size={18} />
            </div>
            <h4 className="text-sm font-bold text-[#14243A]">No skills cataloged yet</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Use the form above to catalog your programming languages, web frameworks, and cloud tools with your self-assessed proficiency.
            </p>
          </div>
        ) : filteredSkills.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500">
            No skills found under '{selectedCategoryFilter}' category.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredSkills.map((item) => {
              const proficiencyColors = {
                beginner: 'bg-slate-100 text-slate-700 border-slate-200',
                intermediate: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
                advanced: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
              }[item.proficiency_level];

              return (
                <div
                  key={item.id}
                  className="bg-white border border-slate-200/90 rounded-xl p-3.5 flex items-center justify-between gap-3 shadow-2xs hover:border-[#2878B8]/40 transition group"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs sm:text-sm text-[#14243A] truncate">
                        {item.skill.name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium px-1.5 py-0.5 rounded bg-slate-100">
                        {item.skill.category}
                      </span>
                    </div>
                    <div className="mt-1">
                      <span
                        className={`inline-block text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${proficiencyColors}`}
                      >
                        {item.proficiency_level}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSkillToDelete(item)}
                    title={`Remove ${item.skill.name}`}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition shrink-0 opacity-70 group-hover:opacity-100"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ============================================================== */}
      {/* SECTION 2: PROJECTS PORTFOLIO                                 */}
      {/* ============================================================== */}
      <section className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <FolderGit2 size={20} className="text-[#2878B8]" />
              <h2 className="text-lg font-bold text-[#14243A]">Engineering Projects</h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Coursework, hackathon solutions, capstones, and personal open-source projects.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setProjectError(null);
              setShowProjectModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#2878B8] hover:bg-[#20639B] text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition shrink-0"
          >
            <Plus size={16} />
            <span>Add Project</span>
          </button>
        </div>

        {/* Projects List */}
        {projects.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 bg-[#F4F7FB]/50 space-y-3">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-[#2878B8] flex items-center justify-center mx-auto">
              <FolderGit2 size={22} />
            </div>
            <h4 className="text-sm font-bold text-[#14243A]">No projects showcased yet</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Recruiters place high emphasis on tangible software projects. Add your major capstone or independent development project with GitHub links.
            </p>
            <button
              type="button"
              onClick={() => {
                setProjectError(null);
                setShowProjectModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2878B8] hover:bg-[#20639B] text-white text-xs font-semibold rounded-xl shadow-xs transition"
            >
              <Plus size={15} />
              <span>Add First Project</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {projects.map((proj) => {
              const techTags = proj.tech_stack
                ? proj.tech_stack.split(/[,|]/).map((t) => t.trim()).filter(Boolean)
                : [];

              return (
                <div
                  key={proj.id}
                  className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-[#2878B8]/40 transition group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-bold text-sm sm:text-base text-[#14243A] leading-snug group-hover:text-[#2878B8] transition">
                        {proj.title}
                      </h3>
                      <button
                        type="button"
                        onClick={() => setProjectToDelete(proj)}
                        title={`Delete ${proj.title}`}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition shrink-0 opacity-70 group-hover:opacity-100"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    {proj.description && (
                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                        {proj.description}
                      </p>
                    )}

                    {techTags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {techTags.map((tech, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md bg-[#2878B8]/10 text-[#2878B8] text-[11px] font-semibold"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Project Links Footer */}
                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      {proj.repo_url && (
                        <a
                          href={proj.repo_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#14243A] hover:underline"
                        >
                          <FolderGit2 size={14} />
                          <span>Repository</span>
                        </a>
                      )}
                      {proj.live_url && (
                        <a
                          href={proj.live_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2878B8] hover:underline"
                        >
                          <Globe size={14} />
                          <span>Live Demo</span>
                          <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {new Date(proj.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ============================================================== */}
      {/* MODAL 1: ADD PROJECT                                           */}
      {/* ============================================================== */}
      {showProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full shadow-lg p-6 space-y-5 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FolderGit2 size={18} className="text-[#2878B8]" />
                <h3 className="font-bold text-base text-[#14243A]">Add Engineering Project</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowProjectModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            {projectError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{projectError}</span>
              </div>
            )}

            <form onSubmit={handleAddProject} className="space-y-4">
              <div>
                <label
                  htmlFor="projectTitle"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1"
                >
                  Project Title <span className="text-red-500">*</span>
                </label>
                <input
                  id="projectTitle"
                  type="text"
                  required
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  placeholder="e.g. Distributed Task Queue & Scheduler"
                  disabled={addingProject}
                  className="block w-full px-3.5 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl bg-white text-[#14243A] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2878B8]/20 focus:border-[#2878B8] transition"
                />
              </div>

              <div>
                <label
                  htmlFor="projectTechStack"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1"
                >
                  Technologies Used (Comma-separated)
                </label>
                <input
                  id="projectTechStack"
                  type="text"
                  value={projectTechStack}
                  onChange={(e) => setProjectTechStack(e.target.value)}
                  placeholder="e.g. Python, FastAPI, Redis, Docker, React"
                  disabled={addingProject}
                  className="block w-full px-3.5 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl bg-white text-[#14243A] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2878B8]/20 focus:border-[#2878B8] transition"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label
                    htmlFor="projectDescription"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
                  >
                    Description &amp; Highlights
                  </label>
                  <span className="text-[11px] text-slate-400">{projectDescription.length}/2000</span>
                </div>
                <textarea
                  id="projectDescription"
                  rows={3}
                  maxLength={2000}
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  placeholder="Architectural design, system benchmarks, database models, and outcomes."
                  disabled={addingProject}
                  className="block w-full px-3.5 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl bg-white text-[#14243A] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2878B8]/20 focus:border-[#2878B8] transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="projectRepoUrl"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1"
                  >
                    GitHub Repository URL
                  </label>
                  <input
                    id="projectRepoUrl"
                    type="url"
                    value={projectRepoUrl}
                    onChange={(e) => setProjectRepoUrl(e.target.value)}
                    placeholder="https://github.com/user/repo"
                    disabled={addingProject}
                    className="block w-full px-3.5 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl bg-white text-[#14243A] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2878B8]/20 focus:border-[#2878B8] transition"
                  />
                </div>

                <div>
                  <label
                    htmlFor="projectLiveUrl"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1"
                  >
                    Live Demo / Deployment URL
                  </label>
                  <input
                    id="projectLiveUrl"
                    type="url"
                    value={projectLiveUrl}
                    onChange={(e) => setProjectLiveUrl(e.target.value)}
                    placeholder="https://demo.app"
                    disabled={addingProject}
                    className="block w-full px-3.5 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl bg-white text-[#14243A] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2878B8]/20 focus:border-[#2878B8] transition"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowProjectModal(false)}
                  disabled={addingProject}
                  className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingProject}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-[#2878B8] hover:bg-[#20639B] text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition disabled:opacity-60"
                >
                  {addingProject ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Publish Project</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: CONFIRM DELETE SKILL                                  */}
      {/* ============================================================== */}
      {skillToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-sm w-full shadow-lg p-6 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 size={20} />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#14243A]">Remove Skill Assignment?</h3>
              <p className="text-xs text-slate-600 mt-1">
                Are you sure you want to remove{' '}
                <span className="font-semibold text-[#14243A]">{skillToDelete.skill.name}</span> from your verified skills?
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSkillToDelete(null)}
                disabled={deletingSkillId !== null}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRemoveSkill}
                disabled={deletingSkillId !== null}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl transition shadow-xs"
              >
                {deletingSkillId ? <Loader2 size={14} className="animate-spin" /> : null}
                <span>Remove Skill</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 3: CONFIRM DELETE PROJECT                                */}
      {/* ============================================================== */}
      {projectToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-sm w-full shadow-lg p-6 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 size={20} />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#14243A]">Delete Project?</h3>
              <p className="text-xs text-slate-600 mt-1">
                Are you sure you want to delete{' '}
                <span className="font-semibold text-[#14243A]">{projectToDelete.title}</span>? This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setProjectToDelete(null)}
                disabled={deletingProjectId !== null}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteProject}
                disabled={deletingProjectId !== null}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl transition shadow-xs"
              >
                {deletingProjectId ? <Loader2 size={14} className="animate-spin" /> : null}
                <span>Delete Project</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
