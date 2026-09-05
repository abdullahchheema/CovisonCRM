"use client";

import { useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { ChevronsUpDown, LogOut, Monitor, Moon, Sun } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const emptySubscribe = () => () => {};

// Same mount-detection pattern as the old theme-toggle.tsx (kept here
// rather than imported — that component is being replaced by this menu in
// the shell; see the (app)/layout.tsx diff).
function useIsMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const chars = parts.length >= 2 ? [parts[0][0], parts[parts.length - 1][0]] : [parts[0]?.[0]];
  return chars.join("").toUpperCase() || "?";
}

interface UserMenuProps {
  name: string;
  email: string;
}

export function UserMenu({ name, email }: UserMenuProps) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const mounted = useIsMounted();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  };

  const themeOptions = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ] as const;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left transition-colors hover:bg-surface-3"
        >
          <Avatar className="size-8">
            <AvatarFallback>{initials(name || email)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{name || email}</p>
            <p className="truncate text-xs text-text-3">{email}</p>
          </div>
          <ChevronsUpDown className="size-4 shrink-0 text-text-3" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>Theme</DropdownMenuLabel>
        {themeOptions.map((option) => {
          const Icon = option.icon;
          const active = mounted && theme === option.value;
          return (
            <DropdownMenuItem
              key={option.value}
              onClick={() => setTheme(option.value)}
              className={cn(active && "bg-brand-soft text-primary")}
            >
              <Icon className="size-4" />
              {option.label}
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="text-danger focus:bg-danger-soft">
          <LogOut className="size-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
