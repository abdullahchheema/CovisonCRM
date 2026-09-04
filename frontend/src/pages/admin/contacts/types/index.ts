export type NoteType = "note" | "call" | "email" | "meeting" | "activity";

export interface INote {
  _id: string;
  type: NoteType;
  body: string;
  author: string;
  createdAt: string;
}

export interface IContact {
  _id: string;
  name: string;
  email: string;
  number: string;
  company: string;
  status: string;
  lastActivity: string;
  createdAt: string;
  jobTitle?: string;
  priority?: string;
  companySize?: number;
  probability?: string;
  linkedinUrl?: string;
  website?: string;
  country?: string;
  city?: string;
  niche?: string;
  tags?: { _id: string; name: string; color: string }[];
  tagIds?: string[];
}

export type Tab = "activity" | "notes" | "deals" | "edit";
