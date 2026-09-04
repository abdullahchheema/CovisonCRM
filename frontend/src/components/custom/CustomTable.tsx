import React, { useState, useMemo } from "react";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
} from "@tanstack/react-table";
import {
  Download,
  Search,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  Columns,
  Filter,
  GripVertical,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toLabel } from "@/utils";
import { cn } from "@/lib/utils";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface TableColumn {
  name: string;
  label: string;
  options?: {
    customBodyRender?: (value: any, rowIndex?: number) => React.ReactNode;
    sortable?: boolean;
    sortValue?: (row: any) => string | number;
    /** If false, this column starts hidden but can still be re-enabled via the Columns toggle. */
    defaultVisible?: boolean;
  };
}

export interface RowSelectionProps<TData> {
  selectedIds: string[];
  onSelectedIdsChange: (ids: string[]) => void;
  getRowId: (row: TData) => string;
  /** Total rows matching current filters across all pages (for "select all N" prompt). */
  totalMatching?: number;
  /** Called when the user clicks "select all N matching contacts". Should fetch all matching IDs and call onSelectedIdsChange. */
  onSelectAllMatching?: () => void | Promise<void>;
}

export interface ServerSideColumnFilter {
  type?: "select" | "text" | "date"; // default: "select"
  options?: string[];                 // select only
  value: string;
  onChange: (value: string) => void;
  valueTo?: string;                   // date range end
  onChangeTo?: (value: string) => void;
}

export interface ServerSideProps {
  total: number;
  page: number; // 1-indexed
  pageSize: number;
  onPageChange: (page: number) => void;
  onSearchChange: (search: string) => void;
  /** If provided, shows an editable "rows per page" input that lets the user type a custom page size. */
  onPageSizeChange?: (pageSize: number) => void;
  loading?: boolean;
  columnFilters?: Record<string, ServerSideColumnFilter>;
}

interface CustomTableProps<
  TData extends Record<string, any> = Record<string, any>,
> {
  columns: TableColumn[];
  data: TData[];
  title?: string;
  downloadName?: string;
  pageSize?: number;
  serverSide?: ServerSideProps;
  rowSelection?: RowSelectionProps<TData>;
  /** When set, clicking anywhere on a row (except interactive cells) invokes this with the row's data. */
  onRowClick?: (row: TData) => void;
  /** When set, column visibility + order are saved to localStorage under this key and restored on reload. */
  persistKey?: string;
}

function loadPersisted<T>(key: string | undefined, suffix: string): T | null {
  if (!key) return null;
  try {
    const raw = localStorage.getItem(`tinycrm-table-prefs:${key}:${suffix}`);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function savePersisted(key: string | undefined, suffix: string, value: unknown): void {
  if (!key) return;
  try {
    localStorage.setItem(`tinycrm-table-prefs:${key}:${suffix}`, JSON.stringify(value));
  } catch {
    // ignore storage errors (e.g. quota, privacy mode)
  }
}

const CustomTable = <TData extends Record<string, any>>({
  columns: colDefs,
  data,
  title = "Table",
  downloadName = "file",
  pageSize = 10,
  serverSide,
  rowSelection,
  onRowClick,
  persistKey,
}: CustomTableProps<TData>) => {
  const [globalFilter, setGlobalFilter] = useState("");
  const [serverSearch, setServerSearch] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    () => {
      const saved = loadPersisted<VisibilityState>(persistKey, "visibility");
      if (saved) return saved;
      return colDefs.reduce<VisibilityState>((acc, c) => {
        if (c.options?.defaultVisible === false) acc[c.name] = false;
        return acc;
      }, {});
    },
  );
  const [showColumnFilters, setShowColumnFilters] = useState(false);
  const [columnOrder, setColumnOrder] = useState<string[]>(() => {
    const defaultOrder = colDefs.map((c) => c.name);
    const saved = loadPersisted<string[]>(persistKey, "order");
    // Only trust the saved order if it contains exactly the same columns —
    // otherwise a column added/removed since the last visit would silently
    // disappear or be missing from the table.
    if (
      saved &&
      saved.length === defaultOrder.length &&
      defaultOrder.every((c) => saved.includes(c))
    ) {
      return saved;
    }
    return defaultOrder;
  });

  // Persist whenever visibility or order changes
  React.useEffect(() => {
    savePersisted(persistKey, "visibility", columnVisibility);
  }, [persistKey, columnVisibility]);
  React.useEffect(() => {
    savePersisted(persistKey, "order", columnOrder);
  }, [persistKey, columnOrder]);
  const [selectAllLoading, setSelectAllLoading] = useState(false);
  const [pageSizeInput, setPageSizeInput] = useState(
    String(serverSide?.pageSize ?? pageSize),
  );

  // Keep the input in sync if pageSize changes from outside (e.g. on mount/reset)
  React.useEffect(() => {
    if (serverSide) setPageSizeInput(String(serverSide.pageSize));
  }, [serverSide?.pageSize]); // eslint-disable-line react-hooks/exhaustive-deps

  const commitPageSize = () => {
    if (!serverSide?.onPageSizeChange) return;
    const parsed = parseInt(pageSizeInput, 10);
    if (!Number.isFinite(parsed) || parsed < 1) {
      setPageSizeInput(String(serverSide.pageSize));
      return;
    }
    const clamped = Math.min(parsed, 10000);
    serverSide.onPageSizeChange(clamped);
    setPageSizeInput(String(clamped));
  };

  // Debounce server-side search
  React.useEffect(() => {
    if (!serverSide) return;
    const t = setTimeout(() => serverSide.onSearchChange(serverSearch), 350);
    return () => clearTimeout(t);
  }, [serverSearch]); // eslint-disable-line react-hooks/exhaustive-deps

  const columns = useMemo<ColumnDef<TData>[]>(
    () =>
      colDefs.map((col) => ({
        id: col.name,
        accessorKey: col.name,
        header: col.label,
        enableSorting: col.options?.sortable ?? !col.options?.customBodyRender,
        enableColumnFilter: !col.options?.customBodyRender,
        ...(col.options?.sortValue && {
          sortingFn: (rowA: any, rowB: any) => {
            const a = col.options!.sortValue!(rowA.original);
            const b = col.options!.sortValue!(rowB.original);
            return a < b ? -1 : a > b ? 1 : 0;
          },
        }),
        cell: col.options?.customBodyRender
          ? ({ getValue, row }) =>
              col.options!.customBodyRender!(getValue(), row.index)
          : ({ getValue }) => (getValue() as string) ?? "—",
      })),
    [colDefs],
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter: serverSide ? "" : globalFilter,
      columnFilters: serverSide ? [] : columnFilters,
      columnVisibility,
      columnOrder,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: serverSide ? undefined : setGlobalFilter,
    onColumnFiltersChange: serverSide ? undefined : setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnOrderChange: setColumnOrder,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    ...(serverSide
      ? {}
      : {
          getFilteredRowModel: getFilteredRowModel(),
          getPaginationRowModel: getPaginationRowModel(),
          initialState: { pagination: { pageSize } },
        }),
  });

  const activeFilterCount = serverSide?.columnFilters
    ? Object.values(serverSide.columnFilters).filter((f) => f.value || f.valueTo).length
    : columnFilters.length;

  const downloadCSV = () => {
    const visibleCols = colDefs.filter(
      (c) => columnVisibility[c.name] !== false,
    );
    const headers = visibleCols.map((c) => c.label).join(",");
    const rows = data.map((row) =>
      visibleCols.map((col) => `"${row[col.name] ?? ""}"`).join(","),
    );
    const csv = [headers, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${downloadName}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Row selection (checkboxes) — driven entirely by the rowSelection prop
  // rather than TanStack's own row-selection state, so the parent page owns it.
  const visibleRows = table.getRowModel().rows;
  const visibleRowIds = rowSelection
    ? visibleRows.map((r) => rowSelection.getRowId(r.original))
    : [];
  const selectedOnPage = rowSelection
    ? visibleRowIds.filter((id) => rowSelection.selectedIds.includes(id))
    : [];
  const allOnPageSelected =
    visibleRowIds.length > 0 && selectedOnPage.length === visibleRowIds.length;
  const someOnPageSelected =
    selectedOnPage.length > 0 && !allOnPageSelected;

  const toggleSelectAllOnPage = () => {
    if (!rowSelection) return;
    if (allOnPageSelected) {
      rowSelection.onSelectedIdsChange(
        rowSelection.selectedIds.filter((id) => !visibleRowIds.includes(id)),
      );
    } else {
      const merged = new Set([...rowSelection.selectedIds, ...visibleRowIds]);
      rowSelection.onSelectedIdsChange(Array.from(merged));
    }
  };

  const toggleSelectRow = (id: string) => {
    if (!rowSelection) return;
    if (rowSelection.selectedIds.includes(id)) {
      rowSelection.onSelectedIdsChange(
        rowSelection.selectedIds.filter((sid) => sid !== id),
      );
    } else {
      rowSelection.onSelectedIdsChange([...rowSelection.selectedIds, id]);
    }
  };

  const handleSelectAllMatching = async () => {
    if (!rowSelection?.onSelectAllMatching) return;
    setSelectAllLoading(true);
    try {
      await rowSelection.onSelectAllMatching();
    } finally {
      setSelectAllLoading(false);
    }
  };

  const handleColumnDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const reordered = Array.from(columnOrder);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    setColumnOrder(reordered);
  };

  const canSelectAllMatching =
    rowSelection &&
    serverSide &&
    rowSelection.totalMatching !== undefined &&
    allOnPageSelected &&
    rowSelection.totalMatching > visibleRowIds.length &&
    rowSelection.selectedIds.length < rowSelection.totalMatching;

  // Pagination display values
  const totalRows = serverSide
    ? serverSide.total
    : table.getFilteredRowModel().rows.length;
  const { pageIndex, pageSize: currentPageSize } = table.getState().pagination;
  const displayPage = serverSide ? serverSide.page : pageIndex + 1;
  const displayPageSize = serverSide ? serverSide.pageSize : currentPageSize;
  const displayPageCount = serverSide
    ? Math.ceil(serverSide.total / serverSide.pageSize) || 1
    : table.getPageCount() || 1;
  const from = totalRows === 0 ? 0 : (displayPage - 1) * displayPageSize + 1;
  const to = Math.min(displayPage * displayPageSize, totalRows);

  return (
    <div className="w-full rounded-lg border bg-card shadow-sm">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b gap-3 flex-wrap">
        <h2 className="text-base font-semibold">{title}</h2>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {/* Global / server search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search..."
              value={serverSide ? serverSearch : globalFilter}
              onChange={(e) =>
                serverSide
                  ? setServerSearch(e.target.value)
                  : setGlobalFilter(e.target.value)
              }
              className="pl-8 pr-7 h-8 w-56 text-sm"
            />
            {(serverSide ? serverSearch : globalFilter) && (
              <button
                onClick={() =>
                  serverSide ? setServerSearch("") : setGlobalFilter("")
                }
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          {/* Toggle column filters */}
          {(!serverSide || serverSide.columnFilters) && (
            <Button
              variant={showColumnFilters ? "secondary" : "outline"}
              size="sm"
              onClick={() => setShowColumnFilters((v) => !v)}
              className="h-8 gap-1.5"
            >
              <Filter className="size-4" />
              Filter
              {activeFilterCount > 0 && (
                <span className="ml-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold w-4 h-4 flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          )}

          {/* Column visibility + drag-to-reorder */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1.5">
                <Columns className="size-4" />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel className="text-xs">
                Toggle & drag to reorder
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DragDropContext onDragEnd={handleColumnDragEnd}>
                <Droppable droppableId="custom-table-column-order">
                  {(droppableProvided) => (
                    <div
                      ref={droppableProvided.innerRef}
                      {...droppableProvided.droppableProps}
                    >
                      {columnOrder.map((colId, index) => {
                        const col = table.getColumn(colId);
                        if (!col || !col.getCanHide()) return null;
                        const label =
                          colDefs.find((c) => c.name === colId)?.label ??
                          colId;
                        return (
                          <Draggable
                            key={colId}
                            draggableId={colId}
                            index={index}
                          >
                            {(dragProvided, snapshot) => (
                              <div
                                ref={dragProvided.innerRef}
                                {...dragProvided.draggableProps}
                                style={{ ...dragProvided.draggableProps.style }}
                                className={cn(
                                  "flex items-center gap-1.5 rounded-sm px-1.5 py-1.5 text-xs",
                                  snapshot.isDragging && "bg-muted",
                                )}
                              >
                                <span
                                  {...dragProvided.dragHandleProps}
                                  className="cursor-grab text-muted-foreground/60 hover:text-muted-foreground"
                                >
                                  <GripVertical className="size-3.5" />
                                </span>
                                <Checkbox
                                  checked={col.getIsVisible()}
                                  onCheckedChange={(v) =>
                                    col.toggleVisibility(!!v)
                                  }
                                />
                                <span className="capitalize select-none">
                                  {label}
                                </span>
                              </div>
                            )}
                          </Draggable>
                        );
                      })}
                      {droppableProvided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* CSV download */}
          <Button
            variant="outline"
            size="sm"
            onClick={downloadCSV}
            className="h-8"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Select-all-across-pages prompt */}
      {canSelectAllMatching && (
        <div className="flex items-center justify-center gap-2 border-b bg-primary/5 px-4 py-2 text-xs">
          <span className="text-muted-foreground">
            All {visibleRowIds.length} on this page are selected.
          </span>
          <button
            onClick={handleSelectAllMatching}
            disabled={selectAllLoading}
            className="font-medium text-primary hover:underline disabled:opacity-50"
          >
            {selectAllLoading
              ? "Selecting…"
              : `Select all ${rowSelection!.totalMatching} rows`}
          </button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <React.Fragment key={headerGroup.id}>
                {/* Column headers */}
                <tr className="border-b bg-muted/50">
                  {rowSelection && (
                    <th className="px-4 py-3 w-10">
                      <Checkbox
                        checked={allOnPageSelected}
                        indeterminate={someOnPageSelected}
                        onCheckedChange={toggleSelectAllOnPage}
                        aria-label="Select all rows on this page"
                      />
                    </th>
                  )}
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap"
                    >
                      {header.isPlaceholder ? null : (
                        <div
                          className={
                            header.column.getCanSort()
                              ? "flex items-center gap-1 cursor-pointer select-none hover:text-foreground transition-colors"
                              : ""
                          }
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                          {header.column.getCanSort() && (
                            <span className="text-muted-foreground/50">
                              {header.column.getIsSorted() === "asc" ? (
                                <ChevronUp className="size-4" />
                              ) : header.column.getIsSorted() === "desc" ? (
                                <ChevronDown className="size-4" />
                              ) : (
                                <ChevronsUpDown className="size-4" />
                              )}
                            </span>
                          )}
                        </div>
                      )}
                    </th>
                  ))}
                </tr>

                {/* Per-column filter inputs */}
                {showColumnFilters && (
                  <tr className="border-b bg-muted/20">
                    {rowSelection && <th className="px-3 py-2" />}
                    {headerGroup.headers.map((header) => {
                      const serverFilter =
                        serverSide?.columnFilters?.[header.id];
                      return (
                        <th key={`filter-${header.id}`} className="px-3 py-2">
                          {serverFilter?.type === "text" ? (
                            <div className="relative">
                              <Input
                                value={serverFilter.value}
                                onChange={(e) => serverFilter.onChange(e.target.value)}
                                placeholder="Filter…"
                                className="h-7 text-xs pr-6"
                              />
                              {serverFilter.value && (
                                <button
                                  onClick={() => serverFilter.onChange("")}
                                  className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          ) : serverFilter?.type === "date" ? (
                            <div className="flex flex-col gap-1">
                              <Input
                                type="date"
                                value={serverFilter.value}
                                onChange={(e) => serverFilter.onChange(e.target.value)}
                                className="h-6 text-[10px] px-1.5"
                              />
                              <Input
                                type="date"
                                value={serverFilter.valueTo ?? ""}
                                onChange={(e) => serverFilter.onChangeTo?.(e.target.value)}
                                className="h-6 text-[10px] px-1.5"
                              />
                            </div>
                          ) : serverFilter ? (
                            <Select
                              value={serverFilter.value || "all"}
                              onValueChange={(v) =>
                                serverFilter.onChange(v === "all" ? "" : v)
                              }
                            >
                              <SelectTrigger className="h-7 text-xs">
                                <SelectValue placeholder="All" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All</SelectItem>
                                {(serverFilter.options ?? []).map((opt) => (
                                  <SelectItem key={opt} value={opt}>
                                    {toLabel(opt)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : !serverSide && header.column.getCanFilter() ? (
                            <div className="relative">
                              <Input
                                value={
                                  (header.column.getFilterValue() as string) ??
                                  ""
                                }
                                onChange={(e) =>
                                  header.column.setFilterValue(
                                    e.target.value || undefined,
                                  )
                                }
                                placeholder={`Filter…`}
                                className="h-7 text-xs pr-6"
                              />
                              {header.column.getFilterValue() && (
                                <button
                                  onClick={() =>
                                    header.column.setFilterValue(undefined)
                                  }
                                  className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          ) : null}
                        </th>
                      );
                    })}
                  </tr>
                )}
              </React.Fragment>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={
                    table.getVisibleLeafColumns().length +
                    (rowSelection ? 1 : 0)
                  }
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  No records found
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => {
                const rowId = rowSelection
                  ? rowSelection.getRowId(row.original)
                  : undefined;
                return (
                  <tr
                    key={row.id}
                    onClick={
                      onRowClick
                        ? () => onRowClick(row.original)
                        : undefined
                    }
                    className={cn(
                      "border-b last:border-0 hover:bg-muted/30 transition-colors",
                      onRowClick && "cursor-pointer",
                    )}
                  >
                    {rowSelection && (
                      <td
                        className="px-4 py-3 w-10"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Checkbox
                          checked={rowSelection.selectedIds.includes(rowId!)}
                          onCheckedChange={() => toggleSelectRow(rowId!)}
                          aria-label="Select row"
                        />
                      </td>
                    )}
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3 whitespace-nowrap">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-3 border-t text-xs text-muted-foreground flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <span>
            {from}–{to} of {totalRows} rows
          </span>
          {serverSide?.onPageSizeChange && (
            <span className="flex items-center gap-1.5">
              Show
              <Input
                value={pageSizeInput}
                onChange={(e) =>
                  setPageSizeInput(e.target.value.replace(/[^0-9]/g, ""))
                }
                onBlur={commitPageSize}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.currentTarget.blur();
                  }
                }}
                inputMode="numeric"
                className="h-6 w-14 px-1.5 text-xs text-center"
              />
              per page
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            className="size-7 p-0"
            onClick={() =>
              serverSide
                ? serverSide.onPageChange(serverSide.page - 1)
                : table.previousPage()
            }
            disabled={
              serverSide ? serverSide.page <= 1 : !table.getCanPreviousPage()
            }
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="px-2">
            Page {displayPage} of {displayPageCount}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="size-7 p-0"
            onClick={() =>
              serverSide
                ? serverSide.onPageChange(serverSide.page + 1)
                : table.nextPage()
            }
            disabled={
              serverSide
                ? serverSide.page >= displayPageCount
                : !table.getCanNextPage()
            }
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CustomTable;
