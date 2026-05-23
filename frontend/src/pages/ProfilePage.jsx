import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const STATS = [
  { label: "REPORTS GENERATED", value: "—" },
  { label: "SOURCES ANALYZED",  value: "—" },
  { label: "WORDS SYNTHESIZED", value: "—" },
  { label: "RESEARCH HOURS",    value: "—" },
];

export default function ProfilePage() {
  const { user } = useAuth();

  // If user data isn't available yet
  if (!user) {
    return null; 
  }

  const initial = user.username ? user.username.charAt(0).toUpperCase() : "U";
  const memberSince = new Date(user.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long' });

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8 border-b border-outline-variant pb-8">
        <div className="flex gap-2 mb-4">
          <span className="bg-surface-container-high text-outline font-label-caps text-[10px] px-2 py-1 rounded-sm border border-outline-variant">
            ACCOUNT
          </span>
        </div>
        <h1 className="font-display text-[32px] md:text-[40px] font-bold text-primary tracking-tighter">
          User Profile
        </h1>
      </div>

      {/* Profile card */}
      <div className="architectural-card rounded p-8 mb-8 flex flex-col sm:flex-row items-center sm:items-start gap-6">
        {/* Avatar */}
        <div className="w-20 h-20 rounded border border-outline-variant bg-surface-container-high flex items-center justify-center shrink-0">
          <span className="font-headline-lg text-primary text-[32px] font-bold select-none">{initial}</span>
        </div>
        <div className="flex-1 text-center sm:text-left">
          <h2 className="font-headline-md text-primary text-[22px] mb-1">{user.username}</h2>
          <p className="font-label-caps text-outline text-[11px] mb-3">{user.email}</p>
          <div className="flex flex-wrap justify-center sm:justify-start gap-2">
            <span className="font-label-caps text-[10px] text-primary border border-outline-variant px-2 py-1 rounded-sm">PRO PLAN</span>
            <span className="font-label-caps text-[10px] text-[#22c55e] border border-[#22c55e]/40 px-2 py-1 rounded-sm flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />
              ACTIVE
            </span>
          </div>
        </div>
        <Link
          to="/settings"
          className="shrink-0 border border-outline-variant text-primary font-label-caps text-[11px] py-2 px-4 rounded hover:border-primary transition-colors flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[16px]">edit</span>
          EDIT
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {STATS.map(({ label, value }) => (
          <div key={label} className="architectural-card p-5 rounded text-center">
            <span className="font-headline-lg text-primary text-[28px] block mb-1">{value}</span>
            <span className="font-label-caps text-outline text-[10px] tracking-widest">{label}</span>
          </div>
        ))}
      </div>

      {/* Account details */}
      <div className="mb-8">
        <h2 className="font-label-caps text-[10px] text-outline tracking-widest mb-4">ACCOUNT DETAILS</h2>
        <div className="architectural-card rounded px-6">
          {[
            { label: "Plan",         value: "Pro Research" },
            { label: "API Version",  value: "V2.0.4 CORE"  },
            { label: "Data Region",  value: "US-EAST-1"    },
            { label: "Member Since", value: memberSince    },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between py-4 border-b border-outline-variant last:border-0">
              <span className="font-body-sm text-on-surface-variant">{label}</span>
              <span className="font-label-caps text-primary text-[12px]">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <Link to="/settings" className="bg-primary text-background font-label-caps py-2 px-5 rounded hover:opacity-90 transition-opacity">
          SETTINGS
        </Link>
        <Link to="/logout" className="border border-outline-variant text-on-surface-variant font-label-caps py-2 px-5 rounded hover:border-error hover:text-error transition-colors">
          LOGOUT
        </Link>
      </div>
    </div>
  );
}
