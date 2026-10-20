interface LogoProps {
  size?: number;
  className?: string;
  showWordmark?: boolean;
}

export default function Logo({ size = 32, className = '', showWordmark = true }: LogoProps) {
  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Custom Vector Icon: Orbital rings with progress nodes & core star */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform duration-300 group-hover:scale-105"
        aria-hidden="true"
      >
        <rect width="40" height="40" rx="10" fill="#2878B8" fillOpacity="0.1" />
        
        {/* Outer Orbit Path */}
        <ellipse
          cx="20"
          cy="20"
          rx="14"
          ry="7"
          transform="rotate(-28 20 20)"
          stroke="#2878B8"
          strokeWidth="2"
          strokeDasharray="2 1.5"
          className="opacity-80"
        />

        {/* Inner Counter Orbit Path */}
        <ellipse
          cx="20"
          cy="20"
          rx="12"
          ry="6"
          transform="rotate(35 20 20)"
          stroke="#77BDF2"
          strokeWidth="1.5"
          className="opacity-70"
        />

        {/* Central Core Star / Nucleus */}
        <circle cx="20" cy="20" r="3.5" fill="#2878B8" />
        <circle cx="20" cy="20" r="1.5" fill="#FFFFFF" />

        {/* Orbital Journey Nodes */}
        {/* Node 1: Skill Node */}
        <circle cx="9" cy="24" r="2.2" fill="#2878B8" />
        <circle cx="9" cy="24" r="1" fill="#FFFFFF" />

        {/* Node 2: Opportunity Node */}
        <circle cx="31" cy="16" r="2.8" fill="#77BDF2" />
        <circle cx="31" cy="16" r="1.2" fill="#FFFFFF" />

        {/* Node 3: Project Node */}
        <circle cx="23" cy="9" r="1.8" fill="#14243A" />
      </svg>

      {showWordmark && (
        <span className="font-bold text-lg tracking-tight text-[#14243A]">
          Campus<span className="text-[#2878B8]">Orbit</span>
        </span>
      )}
    </div>
  );
}
