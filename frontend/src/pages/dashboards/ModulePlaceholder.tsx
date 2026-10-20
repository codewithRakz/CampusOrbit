import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Sparkles,
  Code2,
  CheckCircle2,
  type LucideIcon,
} from 'lucide-react';

interface ModulePlaceholderProps {
  title: string;
  subtitle: string;
  phaseBadge: string;
  phaseName: string;
  apiEndpoints: string[];
  backLink: string;
  icon: LucideIcon;
  features: string[];
}

export default function ModulePlaceholder({
  title,
  subtitle,
  phaseBadge,
  phaseName,
  apiEndpoints,
  backLink,
  icon: Icon,
  features,
}: ModulePlaceholderProps) {
  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link
          to={backLink}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#2878B8] transition"
        >
          <ArrowLeft size={14} />
          <span>Back to Overview</span>
        </Link>
      </div>

      {/* Main Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 bg-[#2878B8]/10 text-[#2878B8] rounded-full text-xs font-semibold">
                {phaseBadge}
              </span>
              <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200/80 rounded-full text-xs font-semibold">
                {phaseName}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#2878B8]/10 text-[#2878B8] flex items-center justify-center shrink-0">
                <Icon size={24} />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#14243A]">
                {title}
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
              {subtitle}
            </p>
          </div>

          <div className="shrink-0">
            <Link
              to={backLink}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-[#14243A] text-xs font-semibold rounded-xl transition"
            >
              <ArrowLeft size={14} />
              <span>Dashboard Home</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Capabilities Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Left: Backend Services Status */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#2878B8]">
            <Code2 size={16} />
            <span>Campus Data Integration</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            The following verified service endpoints are connected to this module workspace:
          </p>
          <div className="space-y-2">
            {apiEndpoints.map((ep) => (
              <div
                key={ep}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#F4F7FB] border border-slate-200/70 text-xs font-mono text-[#14243A]"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                <span>{ep}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Key Capabilities */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#2878B8]">
            <Sparkles size={16} />
            <span>Module Capabilities</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Key functional features available within this module:
          </p>
          <div className="space-y-2.5">
            {features.map((feat) => (
              <div key={feat} className="flex items-start gap-2.5 text-xs text-slate-700">
                <CheckCircle2 size={15} className="text-[#2878B8] shrink-0 mt-0.5" />
                <span>{feat}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
