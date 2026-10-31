"use client";

import { useCallback, useMemo, useState } from "react";

import { useTable } from "@tanstack/react-table";
import { Search } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, useCurrency, useLocale, useMessages } from "@/core/i18n/client";
import { dataTableFeatures } from "@/ds/data-table";

import { categories, type Product, statuses } from "./data";
import { productsMessageKey } from "./messages";
import { ProductForm } from "./product-form";
import { createProductsColumns } from "./products-columns";
import { ProductsTable } from "./products-table";

export function Products({ initialProducts }: { initialProducts: Product[] }) {
  const text = useMessages(productsMessageKey);
  const locale = useLocale();
  const currency = useCurrency();
  const [products, setProducts] = useState(initialProducts);
  const [editor, setEditor] = useState<Product | null>(null);

  const editProduct = useCallback((product: Product) => setEditor(product), []);
  const duplicateProduct = useCallback(
    (product: Product) => {
      const id = crypto.randomUUID();
      setProducts((current) => [
        {
          ...product,
          id,
          name: format(text.row.copyOf, locale, { name: product.name }),
          sku: `COPY-${id.replaceAll("-", "")}`,
          status: "draft",
          sold: 0,
        },
        ...current,
      ]);
      toast.success(text.toasts.duplicated);
    },
    [text, locale],
  );
  const columns = useMemo(
    () => createProductsColumns({ text, locale, currency, onEdit: editProduct, onDuplicate: duplicateProduct }),
    [text, locale, currency, editProduct, duplicateProduct],
  );

  const table = useTable({
    features: dataTableFeatures,
    data: products,
    columns,
    initialState: {
      columnVisibility: { search: false },
      pagination: { pageIndex: 0, pageSize: 10 },
    },
    getRowId: (row) => row.id,
    autoResetPageIndex: false,
    enableRowSelection: true,
    enableSorting: false,
  });

  const search = (table.getColumn("search")?.getFilterValue() as string | undefined) ?? "";
  const status = (table.getColumn("status")?.getFilterValue() as string | undefined) ?? "all";
  const category = (table.getColumn("category")?.getFilterValue() as string | undefined) ?? "all";

  function filterColumn(id: string, value: string) {
    table.getColumn(id)?.setFilterValue(!value || (id !== "search" && value === "all") ? undefined : value);
    table.setPageIndex(0);
  }

  function resetFilters() {
    table.resetColumnFilters();
    table.setPageIndex(0);
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 px-4 md:px-6">
        <InputGroup className="h-7 w-full rounded-[min(var(--radius-md),10px)] sm:w-64">
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupInput
            className="h-7"
            type="text"
            aria-label={text.search.label}
            placeholder={text.search.placeholder}
            value={search}
            onChange={(event) => filterColumn("search", event.target.value)}
          />
        </InputGroup>
        <div className="flex flex-wrap items-center gap-2">
          {(search || status !== "all" || category !== "all") && (
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              {text.clearFilters}
            </Button>
          )}
          <Select value={status} onValueChange={(value) => filterColumn("status", value)}>
            <SelectTrigger size="sm" aria-label={text.filters.statusLabel} className="min-w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectGroup>
                <SelectItem value="all">{text.filters.allStatuses}</SelectItem>
                {statuses.map((item) => (
                  <SelectItem key={item} value={item}>
                    {text.statuses[item]}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <Select value={category} onValueChange={(value) => filterColumn("category", value)}>
            <SelectTrigger size="sm" aria-label={text.filters.categoryLabel} className="min-w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectGroup>
                <SelectItem value="all">{text.filters.allCategories}</SelectItem>
                {categories.map((item) => (
                  <SelectItem key={item} value={item}>
                    {text.categories[item]}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>
      <ProductsTable table={table} onReset={resetFilters} />

      {editor && (
        <ProductForm
          product={editor}
          products={products}
          onClose={() => setEditor(null)}
          onSave={(product) => {
            setProducts((current) => current.map((p) => (p.id === product.id ? product : p)));
            setEditor(null);
            resetFilters();
            toast.success(text.toasts.saved);
          }}
        />
      )}
    </div>
  );
}
