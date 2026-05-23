import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-full p-8 text-center">
      <div className="w-20 h-20 rounded border border-outline-variant bg-surface-container-high flex items-center justify-center mb-8">
        <span className="material-symbols-outlined text-outline text-[40px]">search_off</span>
      </div>

      <span className="font-headline-lg text-[96px] text-outline-variant font-bold leading-none tracking-tighter mb-4 select-none">
        404
      </span>

      <h1 className="font-display text-[28px] md:text-[36px] font-bold text-primary tracking-tighter mb-3">
        Page Not Found
      </h1>
      <p className="font-body-sm text-on-surface-variant max-w-sm leading-relaxed mb-10">
        This route doesn't exist in the Archon system. You may have mistyped the URL or the page was moved.
      </p>

      <div className="flex flex-wrap gap-4 justify-center">
        <Link
          to="/research"
          className="bg-primary text-background font-label-caps py-3 px-8 rounded flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          <span className="material-symbols-outlined text-[16px]">home</span>
          RETURN HOME
        </Link>
        <Link
          to="/help"
          className="border border-outline-variant text-primary font-label-caps py-3 px-6 rounded flex items-center gap-2 hover:border-primary transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">help_outline</span>
          HELP
        </Link>
      </div>
    </div>
  );
}
