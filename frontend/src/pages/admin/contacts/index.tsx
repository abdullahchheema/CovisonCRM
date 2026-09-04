import { useEffect, useState } from "react";
import {
  CustomTable,
  TableSkeleton,
  PageHeader,
  DeleteIconButton,
  EditIconButton,
  AddPrimaryButton,
  CustomModal,
} from "@/components/custom";
import { useEnums } from "@/hooks/useEnums";
import { convertDateToDateWithoutTime } from "@/utils";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileDown, Trash2, Tags as TagsIcon, Upload } from "lucide-react";
import {
  apiContacts,
  importContacts,
  bulkDeleteContacts,
  bulkTagContacts,
} from "@/services/models/contactsModel";
import { Link } from "react-router-dom";
import ContactPanel from "./components/ContactPanel";
import ImportDialog from "./components/ImportDialog";
import TagFilterBar from "./components/TagFilterBar";
import toast from "react-hot-toast";
import usePermissions from "@/hooks/usePermissions";
import { useAuth } from "@/context/AuthContext";
import { confirmToast } from "@/utils/confirmToast";
import { CSV_TEMPLATE, PAGE_SIZE } from "./constants";
import { StatusBadge, TagBadge, TagSelector } from "@/components/common";

const downloadTemplate = () => {
  const blob = new Blob([CSV_TEMPLATE], { type: "text/csv" });
  const href = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = href;
  a.download = "contacts_template.csv";
  a.click();
  URL.revokeObjectURL(href);
};

const Contacts = () => {
  const { has } = usePermissions();
  const { user } = useAuth();
  const { contactStatuses, contactPriorities } = useEnums();
  const [contacts, setContacts] = useState<any[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZE);
  const [search, setSearch] = useState<string>("");
  const [filters, setFilters] = useState<Record<string, string>>({});

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [panelContact, setPanelContact] = useState<any>(null);
  const [panelOpen, setPanelOpen] = useState<boolean>(false);
  const [panelDefaultTab, setPanelDefaultTab] = useState<"activity" | "edit">(
    "activity",
  );
  const [importing, setImporting] = useState<boolean>(false);
  const [showImportDialog, setShowImportDialog] = useState<boolean>(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDeleting, setBulkDeleting] = useState<boolean>(false);

  // Tag filtering (req #5): include by any/all of N tags, exclude a separate set.
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [tagMatch, setTagMatch] = useState<"any" | "all">("any");
  const [excludeTagIds, setExcludeTagIds] = useState<string[]>([]);

  // Bulk tag action (req #7): add / remove / replace tags on selected contacts.
  const [showBulkTagDialog, setShowBulkTagDialog] = useState(false);
  const [bulkTagAction, setBulkTagAction] = useState<"add" | "remove" | "replace">("add");
  const [bulkTagIds, setBulkTagIds] = useState<string[]>([]);
  const [bulkTagging, setBulkTagging] = useState(false);
  // Bumped to force a refetch of the current page (e.g. after bulk tagging,
  // where none of the other effect dependencies necessarily change).
  const [refreshKey, setRefreshKey] = useState(0);

  const buildFilterParams = (): Record<string, unknown> => {
    const params: Record<string, unknown> = {};
    if (search) params.search = search;
    if (filters.name) params.name = filters.name;
    if (filters.email) params.email = filters.email;
    if (filters.phone) params.phone = filters.phone;
    if (filters.status) params.status = filters.status;
    if (filters.priority) params.priority = filters.priority;
    if (filters.company) params.company = filters.company;
    if (filters.lastActivityFrom)
      params.lastActivityFrom = filters.lastActivityFrom;
    if (filters.lastActivityTo) params.lastActivityTo = filters.lastActivityTo;
    if (filters.dateFrom) params.dateFrom = filters.dateFrom;
    if (filters.dateTo) params.dateTo = filters.dateTo;
    if (tagIds.length > 0) {
      params.tagIds = tagIds.join(",");
      params.tagMatch = tagMatch;
    }
    if (excludeTagIds.length > 0) params.excludeTagIds = excludeTagIds.join(",");
    return params;
  };

  const handleSelectAllMatching = async () => {
    const params = { ...buildFilterParams(), page: 1, limit: Math.max(total, 1) };
    const res = await apiContacts.getByParams!(
      params,
      new AbortController().signal,
      "",
      true,
    );
    if (res?.data) {
      setSelectedIds(res.data.map((c: any) => c._id));
    }
  };

  useEffect(() => {
    let cancelled = false;
    const ctrl = new AbortController();
    setIsLoading(true);
    setSelectedIds([]);
    const params: Record<string, unknown> = {
      ...buildFilterParams(),
      page,
      limit: pageSize,
    };
    apiContacts.getByParams!(params, ctrl.signal, "", true).then((res) => {
      if (cancelled) return;
      if (res?.data) {
        setContacts(res.data);
        setTotal(res.total ?? 0);
      }
      setIsLoading(false);
    });
    return () => {
      cancelled = true;
      ctrl.abort();
    };
  }, [page, pageSize, search, filters, tagIds, tagMatch, excludeTagIds, refreshKey]);

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(1);
  };

  const handleTagIdsChange = (ids: string[]) => {
    setTagIds(ids);
    setPage(1);
  };
  const handleExcludeTagIdsChange = (ids: string[]) => {
    setExcludeTagIds(ids);
    setPage(1);
  };
  const handleTagMatchChange = (match: "any" | "all") => {
    setTagMatch(match);
    setPage(1);
  };

  const openPanel = (contact: any, tab: "activity" | "edit" = "activity") => {
    setPanelContact(contact);
    setPanelDefaultTab(tab);
    setPanelOpen(true);
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    confirmToast({
      title: `Delete ${selectedIds.length} selected contact${selectedIds.length !== 1 ? "s" : ""}?`,
      onConfirm: async () => {
        setBulkDeleting(true);
        try {
          const res = await bulkDeleteContacts(selectedIds);
          if (res?.deleted) {
            toast.success(
              `Deleted ${res.deleted} contact${res.deleted !== 1 ? "s" : ""}`,
            );
            setContacts((prev) =>
              prev.filter((c) => !selectedIds.includes(c._id)),
            );
            setTotal((t) => Math.max(0, t - res.deleted));
            setSelectedIds([]);
            if (panelContact && selectedIds.includes(panelContact._id)) {
              setPanelOpen(false);
            }
          } else {
            toast.error(res?.message ?? "Failed to delete contacts");
          }
        } finally {
          setBulkDeleting(false);
        }
      },
    });
  };

  const handleImport = (file: File, importTagIds: string[], autoTagNiche: boolean) => {
    setImporting(true);
    importContacts(file, importTagIds, autoTagNiche)
      .then((res) => {
        if (res.imported > 0) {
          toast.success(
            `Imported ${res.imported} contact${res.imported !== 1 ? "s" : ""}`,
          );
          setPage(1);
          setSearch("");
          setShowImportDialog(false);
        }
        if (res.skipped?.length) {
          toast.error(`${res.skipped.length} row(s) skipped — missing name`);
        }
      })
      .catch(() => toast.error("Import failed"))
      .finally(() => setImporting(false));
  };

  const handleBulkTag = async () => {
    if (selectedIds.length === 0 || (bulkTagAction !== "remove" && bulkTagIds.length === 0))
      return;
    setBulkTagging(true);
    try {
      const res = await bulkTagContacts(selectedIds, bulkTagIds, bulkTagAction);
      if (typeof res?.updated === "number") {
        toast.success(`Updated tags on ${res.updated} contact${res.updated !== 1 ? "s" : ""}`);
        setShowBulkTagDialog(false);
        setBulkTagIds([]);
        setSelectedIds([]);
        setRefreshKey((k) => k + 1);
      } else {
        toast.error(res?.message ?? "Failed to update tags");
      }
    } finally {
      setBulkTagging(false);
    }
  };

  const columns = [
    { label: "Name", name: "name" },
    { label: "Email", name: "email" },
    { label: "Phone No.", name: "number" },
    { label: "Company", name: "company" },
    {
      label: "Tags",
      name: "tags",
      options: {
        customBodyRender: (val: { _id: string; name: string; color: string }[]) =>
          val && val.length > 0 ? (
            <div className="flex flex-wrap gap-1 max-w-[200px]">
              {val.map((t) => (
                <TagBadge key={t._id} tag={t} />
              ))}
            </div>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
    },
    {
      label: "LinkedIn",
      name: "linkedinUrl",
      options: {
        defaultVisible: false,
        customBodyRender: (val: string) =>
          val ? (
            <a
              href={val.startsWith("http") ? val : `https://${val}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Profile
            </a>
          ) : (
            <span>—</span>
          ),
      },
    },
    {
      label: "Website",
      name: "website",
      options: {
        defaultVisible: false,
        customBodyRender: (val: string) =>
          val ? (
            <a
              href={val.startsWith("http") ? val : `https://${val}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Visit
            </a>
          ) : (
            <span>—</span>
          ),
      },
    },
    { label: "Country", name: "country", options: { defaultVisible: false } },
    { label: "City", name: "city", options: { defaultVisible: false } },
    { label: "Niche", name: "niche", options: { defaultVisible: false } },
    {
      label: "Last Activity",
      name: "lastActivity",
      options: {
        sortable: true,
        customBodyRender: (data: string) => (
          <span>{convertDateToDateWithoutTime(data)}</span>
        ),
      },
    },
    {
      label: "Lead Status",
      name: "status",
      options: {
        sortable: true,
        customBodyRender: (val: string) => <StatusBadge value={val} />,
      },
    },
    {
      label: "Created At",
      name: "createdAt",
      options: {
        sortable: true,
        customBodyRender: (data: string) => (
          <span>{convertDateToDateWithoutTime(data)}</span>
        ),
      },
    },
    {
      label: "Actions",
      name: "url",
      options: {
        customBodyRender: (_val: any, rowIdx = 0) => {
          const contact = contacts[rowIdx];
          return (
            <div className="flex items-center gap-1">
              {has("contacts-edit") && (
                <EditIconButton onClick={() => openPanel(contact, "edit")} />
              )}
              {has("contacts-delete") && (
                <DeleteIconButton
                  onClick={() =>
                    confirmToast({
                      title: `Delete "${contact?.name}"?`,
                      onConfirm: async () => {
                        const res = await apiContacts.remove!(
                          contact._id,
                          "",
                          true,
                        );
                        if (res?.message === "Contact deleted" || !res?.error) {
                          setContacts((prev) =>
                            prev.filter((c) => c._id !== contact._id),
                          );
                          setTotal((t) => t - 1);
                          if (panelContact?._id === contact._id)
                            setPanelOpen(false);
                          toast.success("Contact deleted");
                        } else {
                          toast.error(
                            res?.message ?? "Failed to delete contact",
                          );
                        }
                      },
                    })
                  }
                />
              )}
            </div>
          );
        },
      },
    },
  ];

  return (
    <section className="space-y-6">
      <PageHeader
        title="Contacts"
        description="Manage and track your leads and customers"
        actions={
          has("contacts-edit") && (
            <>
              <Link to="/dashboard/contacts/tags">
                <Button variant="outline">
                  <TagsIcon className="size-4" /> Manage Tags
                </Button>
              </Link>
              <Button variant="outline" onClick={downloadTemplate}>
                <FileDown className="size-4" /> Template
              </Button>
              <Button variant="outline" onClick={() => setShowImportDialog(true)}>
                <Upload className="size-4" /> Import CSV
              </Button>
              <Link to="/dashboard/contacts/add-contact">
                <AddPrimaryButton text="Add Contact" onClick={() => {}} />
              </Link>
            </>
          )
        }
      />

      <ImportDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        importing={importing}
        onImport={handleImport}
      />

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <TagFilterBar
          tagIds={tagIds}
          onTagIdsChange={handleTagIdsChange}
          tagMatch={tagMatch}
          onTagMatchChange={handleTagMatchChange}
          excludeTagIds={excludeTagIds}
          onExcludeTagIdsChange={handleExcludeTagIdsChange}
        />
      </div>

      {has("contacts-edit") && selectedIds.length > 0 && (
        <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-2.5">
          <span className="text-sm text-muted-foreground">
            {selectedIds.length} selected
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowBulkTagDialog(true)}>
              <TagsIcon className="size-4" /> Edit Tags
            </Button>
            {has("contacts-delete") && (
              <Button
                variant="destructive"
                size="sm"
                loading={bulkDeleting}
                onClick={handleBulkDelete}
              >
                <Trash2 className="size-4" /> Delete Selected
              </Button>
            )}
          </div>
        </div>
      )}

      <CustomModal
        title="Edit Tags"
        size="sm"
        open={showBulkTagDialog}
        onOpenChange={(open) => {
          if (!open) {
            setShowBulkTagDialog(false);
            setBulkTagIds([]);
          }
        }}
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Applying to {selectedIds.length} selected contact{selectedIds.length !== 1 ? "s" : ""}.
          </p>
          <Select value={bulkTagAction} onValueChange={(v) => setBulkTagAction(v as typeof bulkTagAction)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="add">Add tags</SelectItem>
              <SelectItem value="remove">Remove tags</SelectItem>
              <SelectItem value="replace">Replace all tags with</SelectItem>
            </SelectContent>
          </Select>
          <TagSelector selectedIds={bulkTagIds} onChange={setBulkTagIds} />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowBulkTagDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkTag} loading={bulkTagging}>
              Apply
            </Button>
          </div>
        </div>
      </CustomModal>

      {isLoading && contacts.length === 0 ? (
        <TableSkeleton rows={6} cols={8} />
      ) : (
        <CustomTable
          columns={columns}
          data={contacts}
          title="Contacts"
          persistKey={user?.id ? `contacts-${user.id}` : undefined}
          rowSelection={
            has("contacts-delete")
              ? {
                  selectedIds,
                  onSelectedIdsChange: setSelectedIds,
                  getRowId: (c: any) => c._id,
                  totalMatching: total,
                  onSelectAllMatching: handleSelectAllMatching,
                }
              : undefined
          }
          serverSide={{
            total,
            page,
            pageSize,
            onPageChange: setPage,
            onPageSizeChange: handlePageSizeChange,
            onSearchChange: (s) => {
              setSearch(s);
              setPage(1);
            },
            loading: isLoading,
            columnFilters: {
              name: {
                type: "text",
                value: filters.name ?? "",
                onChange: (v) => handleFilterChange("name", v),
              },
              email: {
                type: "text",
                value: filters.email ?? "",
                onChange: (v) => handleFilterChange("email", v),
              },
              number: {
                type: "text",
                value: filters.phone ?? "",
                onChange: (v) => handleFilterChange("phone", v),
              },
              status: {
                options: contactStatuses,
                value: filters.status ?? "",
                onChange: (v) => handleFilterChange("status", v),
              },
              priority: {
                options: contactPriorities,
                value: filters.priority ?? "",
                onChange: (v) => handleFilterChange("priority", v),
              },
              company: {
                type: "text",
                value: filters.company ?? "",
                onChange: (v) => handleFilterChange("company", v),
              },
              lastActivity: {
                type: "date",
                value: filters.lastActivityFrom ?? "",
                onChange: (v) => handleFilterChange("lastActivityFrom", v),
                valueTo: filters.lastActivityTo ?? "",
                onChangeTo: (v) => handleFilterChange("lastActivityTo", v),
              },
              createdAt: {
                type: "date",
                value: filters.dateFrom ?? "",
                onChange: (v) => handleFilterChange("dateFrom", v),
                valueTo: filters.dateTo ?? "",
                onChangeTo: (v) => handleFilterChange("dateTo", v),
              },
            },
          }}
        />
      )}

      <ContactPanel
        contact={panelContact}
        open={panelOpen}
        defaultTab={panelDefaultTab}
        onClose={() => setPanelOpen(false)}
        onUpdate={(updated) => {
          setContacts((prev) =>
            prev.map((c) => (c._id === updated._id ? updated : c)),
          );
          setPanelContact(updated);
        }}
        onDelete={(id) => {
          setContacts((prev) => prev.filter((c) => c._id !== id));
          setTotal((t) => t - 1);
          setPanelOpen(false);
        }}
      />
    </section>
  );
};

export default Contacts;
