import { useEffect, useMemo, useState } from "react";
import {
  CustomTable,
  TableSkeleton,
  StatCard,
  PageHeader,
} from "@/components/custom";
import { AddPrimaryButton } from "@/components/custom";
import { apiEmailSends } from "@/services/models/emailSendsModel";
import { apiEmailTemplates } from "@/services/models/emailTemplatesModel";
import { apiEmailGroups } from "@/services/models/emailGroupsModel";
import { EmailGroup, EmailTemplate, SentEmailSummary } from "../types";
import SendEmailDialog from "../components/SendEmailDialog";
import SentEmailHistoryPanel from "../components/SentEmailHistoryPanel";
import { StatusBadge } from "@/components/common";

const EmailsSent = () => {
  const [sends, setSends] = useState<SentEmailSummary[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [groups, setGroups] = useState<EmailGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [panelContact, setPanelContact] = useState<SentEmailSummary | null>(
    null,
  );
  const [panelOpen, setPanelOpen] = useState(false);

  const loadSends = () => {
    const controller = new AbortController();
    apiEmailSends.getAll!(controller.signal, true).then((res) => {
      if (Array.isArray(res)) setSends(res);
      setIsLoading(false);
    });
    return controller;
  };

  useEffect(() => {
    setIsLoading(true);
    const controller = loadSends();
    Promise.all([
      apiEmailTemplates.getAll!(new AbortController().signal, true),
      apiEmailGroups.getAll!(new AbortController().signal, true),
    ]).then(([tmplRes, groupRes]) => {
      if (Array.isArray(tmplRes)) setTemplates(tmplRes);
      if (Array.isArray(groupRes)) setGroups(groupRes);
    });
    return () => controller.abort();
  }, []);

  const filteredSends = useMemo(() => {
    if (!search) return sends;
    const s = search.toLowerCase();
    return sends.filter(
      (row) =>
        row.contactName?.toLowerCase().includes(s) ||
        row.contactEmail?.toLowerCase().includes(s) ||
        row.subject?.toLowerCase().includes(s),
    );
  }, [sends, search]);

  const openHistory = (row: SentEmailSummary) => {
    setPanelContact(row);
    setPanelOpen(true);
  };

  const columns = [
    {
      label: "Contact",
      name: "contactName",
      options: {
        customBodyRender: (val: any, rowIndex?: number) => {
          const row = filteredSends[rowIndex ?? -1];
          return (
            <div>
              <span className="font-medium block">{val}</span>
              <span className="text-xs text-muted-foreground">
                {row?.contactEmail}
              </span>
            </div>
          );
        },
      },
    },
    { label: "Subject", name: "subject" },
    {
      label: "Source",
      name: "sourceType",
      options: {
        customBodyRender: (val: any) => <StatusBadge value={val} />,
      },
    },
    {
      label: "Recipient Mode",
      name: "recipientMode",
      options: {
        customBodyRender: (val: any) => <StatusBadge value={val} />,
      },
    },
    {
      label: "Status",
      name: "status",
      options: {
        customBodyRender: (val: any, rowIndex?: number) => {
          const row = filteredSends[rowIndex ?? -1];
          return (
            <div className="flex items-center gap-1.5">
              <StatusBadge value={val} />
              {val === "failed" && row?.errorMessage && (
                <span
                  className="text-xs text-destructive truncate max-w-[180px]"
                  title={row.errorMessage}
                >
                  {row.errorMessage}
                </span>
              )}
            </div>
          );
        },
      },
    },
    {
      label: "Last Sent",
      name: "sentAt",
      options: {
        sortable: true,
        customBodyRender: (val: any) =>
          val ? new Date(val).toLocaleString() : "—",
      },
    },
  ];

  return (
    <section className="space-y-6">
      <PageHeader
        title="Sent Emails"
        description="Ad-hoc emails sent to your contacts"
        actions={
          <SendEmailDialog
            templates={templates}
            groups={groups}
            onSent={loadSends}
            trigger={<AddPrimaryButton text="Send Email" onClick={() => {}} />}
          />
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total Contacts" value={sends.length} />
        <StatCard
          label="Sent"
          value={sends.filter((s) => s.status === "sent").length}
        />
        <StatCard
          label="Failed"
          value={sends.filter((s) => s.status === "failed").length}
        />
      </div>

      {isLoading ? (
        <TableSkeleton rows={6} cols={6} />
      ) : (
        <CustomTable
          columns={columns}
          data={filteredSends}
          title="Sent Emails"
          downloadName="sent-emails"
          onRowClick={openHistory}
          serverSide={{
            total: filteredSends.length,
            page: 1,
            pageSize: filteredSends.length || 1,
            onPageChange: () => {},
            onSearchChange: setSearch,
            loading: false,
          }}
        />
      )}

      <SentEmailHistoryPanel
        contact={panelContact}
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        onChanged={loadSends}
      />
    </section>
  );
};

export default EmailsSent;
