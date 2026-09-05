"use client";

import { useState } from "react";
import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { SidebarContent } from "@/components/shell/sidebar-content";

interface MobileSidebarProps {
  orgName: string;
  logoSignedUrl: string | null;
  profileName: string;
  profileEmail: string;
}

// The drawer sidebar the plan calls for on mobile — the desktop <aside> in
// (app)/layout.tsx is hidden below md, and this fills the same role there.
// Kept as its own client component (rather than making the whole layout a
// client component) since only the open/close state needs the browser.
export function MobileSidebar({ orgName, logoSignedUrl, profileName, profileEmail }: MobileSidebarProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button type="button" variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetTitle>Navigation</SheetTitle>
        <SidebarContent
          orgName={orgName}
          logoSignedUrl={logoSignedUrl}
          profileName={profileName}
          profileEmail={profileEmail}
          onNavigate={() => setOpen(false)}
        />
      </SheetContent>
    </Sheet>
  );
}
