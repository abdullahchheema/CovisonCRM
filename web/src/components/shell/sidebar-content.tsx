import Link from "next/link";
import { CovisonMark } from "@/components/brand/covison-mark";
import { SidebarNav } from "@/components/shell/sidebar-nav";
import { UserMenu } from "@/components/shell/user-menu";

interface SidebarContentProps {
  orgName: string;
  logoSignedUrl: string | null;
  profileName: string;
  profileEmail: string;
  onNavigate?: () => void;
}

// Shared between the always-visible desktop <aside> and MobileSidebar's
// drawer, so the two never drift out of sync — extracted once both needed
// the identical logo block + nav + user menu.
export function SidebarContent({
  orgName,
  logoSignedUrl,
  profileName,
  profileEmail,
  onNavigate,
}: SidebarContentProps) {
  return (
    <>
      <div className="flex items-center gap-2 truncate px-1 font-display text-lg text-foreground">
        {logoSignedUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- signed Supabase Storage URL, not a static asset
          <img
            src={logoSignedUrl}
            alt=""
            className="size-7 shrink-0 rounded-md object-cover"
          />
        ) : (
          <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-brand text-sm text-on-brand">
            {orgName.charAt(0).toUpperCase()}
          </span>
        )}
        <span className="truncate">{orgName}</span>
      </div>

      <SidebarNav onNavigate={onNavigate} />

      <div className="border-t border-line-soft pt-3">
        <UserMenu name={profileName} email={profileEmail} />
      </div>

      {/* Product branding, kept distinct from the workspace identity at the
          top — that block answers "which workspace am I in", this one
          answers "what is this app". Links out to the marketing site. */}
      <Link
        href="/"
        className="flex items-center gap-2 px-2 pb-1 pt-1 text-text-3 transition-colors hover:text-foreground"
      >
        <CovisonMark className="size-6" />
        <span className="font-display text-sm">Covison</span>
      </Link>
    </>
  );
}
