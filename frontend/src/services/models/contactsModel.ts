import { ApiCore } from "../utilities/core";
import { BASE_URL } from "../api";
import { getStoredToken } from "../utilities/auth";
import { invalidateCache } from "../utilities/provider";

const url = "contacts";

export const apiContacts = new ApiCore({
  getAll: true,
  getByParams: true,
  post: true,
  postFormData: true,
  putById: true,
  remove: true,
  url: url,
});

const getToken = getStoredToken;

export const exportContacts = (): Promise<void> =>
  fetch(`${BASE_URL}/contacts/export`, {
    headers: { "auth-token": getToken() ?? "" },
  }).then((res) => {
    if (!res.ok) throw new Error("Export failed");
    return res.blob();
  }).then((blob) => {
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = "contacts.csv";
    a.click();
    URL.revokeObjectURL(href);
  });

export const importContacts = (
  file: File,
  tagIds: string[] = [],
  autoTagNiche = false,
): Promise<{ imported: number; skipped: string[] }> => {
  const form = new FormData();
  form.append("file", file);
  if (tagIds.length > 0) form.append("tagIds", tagIds.join(","));
  if (autoTagNiche) form.append("autoTagNiche", "true");
  return fetch(`${BASE_URL}/contacts/import`, {
    method: "POST",
    headers: { "auth-token": getToken() ?? "" },
    body: form,
  })
    .then((res) => res.json())
    .then((data) => {
      invalidateCache("contacts");
      return data;
    });
};

export const bulkDeleteContacts = (
  ids: string[],
): Promise<{ deleted: number; message?: string }> =>
  fetch(`${BASE_URL}/contacts/bulk-delete`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "auth-token": getToken() ?? "",
    },
    body: JSON.stringify({ ids }),
  })
    .then((res) => res.json())
    .then((data) => {
      invalidateCache("contacts");
      return data;
    });

export const bulkTagContacts = (
  ids: string[],
  tagIds: string[],
  action: "add" | "remove" | "replace",
): Promise<{ updated: number; message?: string }> =>
  fetch(`${BASE_URL}/contacts/bulk-tag`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "auth-token": getToken() ?? "",
    },
    body: JSON.stringify({ ids, tagIds, action }),
  })
    .then((res) => res.json())
    .then((data) => {
      invalidateCache("contacts");
      return data;
    });
