"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
};

function buildPageItems(currentPage: number, totalPages: number) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, "...", totalPages] as const;
  }

  if (currentPage >= totalPages - 3) {
    return [1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages] as const;
  }

  return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages] as const;
}

export function Pagination({ currentPage, totalPages, onPageChange, className }: PaginationProps) {
  const pageItems = buildPageItems(currentPage, totalPages);
  const disablePrev = currentPage <= 1;
  const disableNext = currentPage >= totalPages;

  return (
    <div className={cn("flex items-center justify-end gap-2", className)}>
      <button
        type="button"
        aria-label="Previous page"
        aria-disabled={disablePrev}
        onClick={() => {
          if (!disablePrev) {
            onPageChange(currentPage - 1);
          }
        }}
        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-600 transition-colors hover:bg-slate-50 aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {pageItems.map((item, index) => {
        if (item === "...") {
          return (
            <span key={`ellipsis-${index}`} className="px-1 text-sm text-slate-500">
              ...
            </span>
          );
        }

        return (
          <button
            key={item}
            type="button"
            onClick={() => onPageChange(item)}
            className={cn(
              "inline-flex h-8 min-w-8 items-center justify-center rounded-md border px-2 text-sm transition-colors",
              item === currentPage
                ? "border-[#72d6d8] bg-[#e9fbfb] text-[#2a8e90]"
                : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50",
            )}
          >
            {item}
          </button>
        );
      })}

      <button
        type="button"
        aria-label="Next page"
        aria-disabled={disableNext}
        onClick={() => {
          if (!disableNext) {
            onPageChange(currentPage + 1);
          }
        }}
        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-600 transition-colors hover:bg-slate-50 aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}