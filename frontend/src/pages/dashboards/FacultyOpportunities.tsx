import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  fetchOpportunities,
  type OpportunityResponse,
} from '../../services/opportunities';
import {
  Briefcase,
  Search,
  Building2,
  MapPin,
  Banknote,
  Award,
  Calendar,
  ArrowLeft,
  Loader2,
  AlertCircle,
  X,
  Filter,
} from 'lucide-react';

export default function FacultyOpportunities() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [opportunities, setOpportunities] = useState<OpportunityResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [locationQuery, setLocationQuery] = useState('');

  // Details modal
  const [selectedOpportunity, setSelectedOpportunity] = useState<OpportunityResponse | null>(null);

  useEffect(() => {
    async function load() {
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
          setErrorMessage('Failed to load opportunities list.');
        }
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [logout, navigate]);

  // Client-side filtering
  const filteredOpportunities = useMemo(() => {
    return opportunities.filter((opp) => {
      // Must be active
      if (!opp.is_active) return false;

      // Type filter
      if (typeFilter !== 'all' && opp.opportunity_type !== typeFilter) {
        return false;
      }

      // Search keyword filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = opp.title.toLowerCase().includes(q);
        const matchesCompany = opp.company_name.toLowerCase().includes(q);
        const matchesDesc = opp.description.toLowerCase().includes(q);
        if (!matchesTitle && !matchesCompany && !matchesDesc) return false;
      }

      // Location filter
      if (locationQuery.trim()) {
        const loc = locationQuery.toLowerCase().trim();
        if (!opp.location.toLowerCase().includes(loc)) return false;
      }

      return true;
    });
  }, [opportunities, typeFilter, searchQuery, locationQuery]);

  const stats = useMemo(() => {
    const total = opportunities.length;
    const internships = opportunities.filter((o) => o.opportunity_type === 'internship').length;
    const placements = opportunities.filter((o) => o.opportunity_type === 'placement').length;
    const research = opportunities.filter((o) => o.opportunity_type === 'research').length;
    return { total, internships, placements, research };
  }, [opportunities]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
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
              <Briefcase size={20} />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#14243A]">
              Campus Internship &amp; Placement Drives
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
            Monitor verified corporate drives, prerequisite CGPA criteria, and internship opportunities posted by the placement cell to guide your student advisees.
          </p>
        </div>

        {errorMessage && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs sm:text-sm flex items-center gap-2">
            <AlertCircle size={16} className="text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Total Active Drives</div>
          <div className="text-xl font-extrabold text-[#14243A] mt-1">{stats.total}</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Internships</div>
          <div className="text-xl font-extrabold text-[#2878B8] mt-1">{stats.internships}</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Full-Time Placements</div>
          <div className="text-xl font-extrabold text-teal-600 mt-1">{stats.placements}</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Research Calls</div>
          <div className="text-xl font-extrabold text-purple-600 mt-1">{stats.research}</div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-5 relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by role title, company, or keywords..."
              className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2878B8]/20 focus:border-[#2878B8] transition"
            />
          </div>

          <div className="sm:col-span-4 relative">
            <Filter size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2878B8]/20 focus:border-[#2878B8] transition appearance-none cursor-pointer"
            >
              <option value="all">All Opportunity Types</option>
              <option value="internship">Internships</option>
              <option value="placement">Full-Time Placements</option>
              <option value="research">Research Projects</option>
            </select>
          </div>

          <div className="sm:col-span-3 relative">
            <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={locationQuery}
              onChange={(e) => setLocationQuery(e.target.value)}
              placeholder="Filter by location..."
              className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2878B8]/20 focus:border-[#2878B8] transition"
            />
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-[#2878B8]" />
            <span className="text-xs">Loading campus opportunities...</span>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredOpportunities.length === 0 && (
          <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-xl space-y-2">
            <Briefcase size={28} className="text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-[#14243A]">No matching opportunities found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              There are currently no active opportunities matching your filter criteria.
            </p>
            {(searchQuery || typeFilter !== 'all' || locationQuery) && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setTypeFilter('all');
                  setLocationQuery('');
                }}
                className="mt-2 text-xs font-semibold text-[#2878B8] hover:underline"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}

        {/* Opportunities List */}
        {!loading && filteredOpportunities.length > 0 && (
          <div className="space-y-3">
            {filteredOpportunities.map((opp) => (
              <div
                key={opp.id}
                className="p-4 bg-white rounded-xl border border-slate-200 hover:border-[#2878B8]/50 transition shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        opp.opportunity_type === 'internship'
                          ? 'bg-blue-50 text-[#2878B8] border border-blue-200'
                          : opp.opportunity_type === 'placement'
                          ? 'bg-teal-50 text-teal-700 border border-teal-200'
                          : 'bg-purple-50 text-purple-700 border border-purple-200'
                      }`}
                    >
                      {opp.opportunity_type}
                    </span>

                    <span className="text-xs text-slate-400">&middot;</span>
                    <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                      <Building2 size={13} className="text-slate-400" />
                      {opp.company_name}
                    </span>

                    <span className="text-xs text-slate-400">&middot;</span>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <MapPin size={13} className="text-slate-400" />
                      {opp.location}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm sm:text-base text-[#14243A]">
                    {opp.title}
                  </h3>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {opp.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-500">
                    {opp.stipend && (
                      <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                        <Banknote size={13} className="text-emerald-600" />
                        <span>{opp.stipend}</span>
                      </span>
                    )}

                    {opp.min_cgpa > 0 && (
                      <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                        <Award size={13} className="text-amber-600" />
                        <span>Min CGPA: {opp.min_cgpa.toFixed(1)}</span>
                      </span>
                    )}

                    {opp.deadline && (
                      <span className="inline-flex items-center gap-1 font-medium text-slate-500">
                        <Calendar size={13} />
                        <span>Deadline: {new Date(opp.deadline).toLocaleDateString()}</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="shrink-0 self-end md:self-center">
                  <button
                    onClick={() => setSelectedOpportunity(opp)}
                    className="px-3.5 py-2 bg-slate-50 hover:bg-[#2878B8] text-[#14243A] hover:text-white border border-slate-200 hover:border-transparent text-xs font-semibold rounded-xl transition"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Opportunity Detail Modal */}
      {selectedOpportunity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in duration-150 space-y-5">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-[#2878B8] border border-blue-200">
                  {selectedOpportunity.opportunity_type}
                </span>
                <h3 className="font-extrabold text-[#14243A] text-lg mt-1">
                  {selectedOpportunity.title}
                </h3>
                <div className="text-xs text-slate-500 font-medium">
                  {selectedOpportunity.company_name} &middot; {selectedOpportunity.location}
                </div>
              </div>
              <button
                onClick={() => setSelectedOpportunity(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl text-xs border border-slate-200/70">
              <div>
                <span className="text-slate-400 block text-[11px]">Stipend / Comp</span>
                <span className="font-bold text-slate-800">
                  {selectedOpportunity.stipend || 'Unspecified'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Prerequisite CGPA</span>
                <span className="font-bold text-[#2878B8]">
                  {selectedOpportunity.min_cgpa > 0
                    ? `${selectedOpportunity.min_cgpa.toFixed(1)} CGPA`
                    : 'Open to all'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Deadline</span>
                <span className="font-bold text-slate-800">
                  {selectedOpportunity.deadline
                    ? new Date(selectedOpportunity.deadline).toLocaleDateString()
                    : 'Rolling'}
                </span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Opportunity Description &amp; Requirements
              </h4>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto">
                {selectedOpportunity.description}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 italic">
                Advise eligible students to apply directly from their portal.
              </span>
              <button
                onClick={() => setSelectedOpportunity(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
