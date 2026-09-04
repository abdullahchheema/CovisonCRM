export type Frequency = "one-time" | "daily" | "weekly" | "monthly";
export type Status = "active" | "draft" | "paused";
export type RecipientType = "email-group" | "custom-emails";

export type GroupType = "static" | "dynamic";
export type TagMatch = "any" | "all";

export interface EmailGroup {
  _id: string;
  name: string;
  description: string;
  contactIds: string[];
  type?: GroupType;
  tagIds?: string[];
  tagMatch?: TagMatch;
  /** Resolved member count — static: len(contactIds); dynamic: live tag-rule match. */
  contactCount?: number;
}

export interface EmailTemplate {
  _id: string;
  name: string;
  subject: string;
  body: string;
  recipient: string;
  frequency: Frequency;
  sendDate: string;
  sendTime: string;
  dayOfWeek: string;
  dayOfMonth: string;
  status: Status;
}

export type SendSourceType = "template" | "custom";
export type SendRecipientMode = "group" | "individual";
export type SendStatus = "sent" | "failed";

export interface SentEmailSummary {
  contactId: string;
  contactName: string;
  contactEmail: string;
  subject: string;
  body: string;
  sourceType: SendSourceType;
  sourceTemplateId?: string;
  sourceTemplateName?: string;
  recipientMode: SendRecipientMode;
  groupId?: string;
  groupName?: string;
  status: SendStatus;
  errorMessage?: string;
  lastSendId: string;
  sentAt: string;
  updatedAt: string;
}

export interface SentEmail {
  _id: string;
  contactId: string;
  contactName: string;
  contactEmail: string;
  subject: string;
  body: string;
  sourceType: SendSourceType;
  sourceTemplateId?: string;
  sourceTemplateName?: string;
  recipientMode: SendRecipientMode;
  groupId?: string;
  groupName?: string;
  status: SendStatus;
  errorMessage?: string;
  sentAt: string;
  createdAt: string;
}

export interface SendEmailResult {
  contactId: string;
  contactName: string;
  contactEmail: string;
  success: boolean;
  error?: string;
}

export interface SendEmailResponse {
  scheduled: boolean;
  results?: SendEmailResult[];
}
