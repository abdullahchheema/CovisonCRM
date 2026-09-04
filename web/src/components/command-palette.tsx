"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, KanbanSquare, ListTodo, User } from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { createClient } from "@/lib/supabase/client";

interface SearchData {
  contacts: { id: string; name: string }[];
  companies: { id: string; name: string }[];
  deals: { id: string; name: string }[];
  tasks: { id: string; title: string }[];
}

const EMPTY_DATA: SearchData = { contacts: [], companies: [], deals: [], tasks: [] };

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [data, setData] = useState<SearchData>(EMPTY_DATA);
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (!open || loaded) return;

    const supabase = createClient();
    Promise.all([
      supabase.from("contacts").select("id, name").is("deleted_at", null).order("name"),
      supabase.from("companies").select("id, name").is("deleted_at", null).order("name"),
      supabase.from("deals").select("id, name").is("deleted_at", null).order("name"),
      supabase.from("tasks").select("id, title").is("deleted_at", null).order("title"),
    ]).then(([contacts, companies, deals, tasks]) => {
      setData({
        contacts: contacts.data ?? [],
        companies: companies.data ?? [],
        deals: deals.data ?? [],
        tasks: tasks.data ?? [],
      });
      setLoaded(true);
    });
  }, [open, loaded]);

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted"
      >
        <span>Search...</span>
        <kbd className="ml-4 rounded border border-border bg-muted px-1.5 py-0.5 text-xs">
          ⌘K
        </kbd>
      </button>
      <CommandDialog open={open} onOpenChange={setOpen} title="Search">
      <CommandInput placeholder="Search contacts, companies, deals, tasks..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {data.contacts.length > 0 && (
          <CommandGroup heading="Contacts">
            {data.contacts.map((contact) => (
              <CommandItem
                key={contact.id}
                value={`contact ${contact.name}`}
                onSelect={() => go(`/contacts/${contact.id}`)}
              >
                <User className="size-4 text-muted-foreground" />
                {contact.name}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {data.companies.length > 0 && (
          <CommandGroup heading="Companies">
            {data.companies.map((company) => (
              <CommandItem
                key={company.id}
                value={`company ${company.name}`}
                onSelect={() => go(`/companies/${company.id}`)}
              >
                <Building2 className="size-4 text-muted-foreground" />
                {company.name}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {data.deals.length > 0 && (
          <CommandGroup heading="Deals">
            {data.deals.map((deal) => (
              <CommandItem
                key={deal.id}
                value={`deal ${deal.name}`}
                onSelect={() => go("/pipeline")}
              >
                <KanbanSquare className="size-4 text-muted-foreground" />
                {deal.name}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {data.tasks.length > 0 && (
          <CommandGroup heading="Tasks">
            {data.tasks.map((task) => (
              <CommandItem
                key={task.id}
                value={`task ${task.title}`}
                onSelect={() => go("/tasks")}
              >
                <ListTodo className="size-4 text-muted-foreground" />
                {task.title}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
      </CommandDialog>
    </>
  );
}
