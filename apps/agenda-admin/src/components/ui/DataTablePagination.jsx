import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from './Button';

const DataTablePagination = ({
  currentPage,
  totalPages,
  onPageChange,
  startItem,
  endItem,
  totalItems
}) => {
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
      let endPage = startPage + maxVisiblePages - 1;

      if (endPage > totalPages) {
        endPage = totalPages;
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
      }

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }
    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div className="flex flex-col gap-4 border-t border-slate-200 px-5 py-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between bg-white dark:bg-slate-900 rounded-b-[1.25em]">
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
        Menampilkan <span className="font-bold text-slate-700 dark:text-slate-200">{startItem}</span> - <span className="font-bold text-slate-700 dark:text-slate-200">{endItem}</span> dari <span className="font-bold text-slate-700 dark:text-slate-200">{totalItems}</span>
      </p>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1 || totalItems === 0}
          className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl bg-slate-50 text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-950/50 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          aria-label="Previous Page"
        >
          <ChevronLeft size={18} strokeWidth={2.5} />
        </button>

        {pages.map((page) => {
          const isActive = page === currentPage;
          return (
            <button
              key={`page-${page}`}
              type="button"
              onClick={() => onPageChange(page)}
              className={cn(
                'inline-flex h-9 min-w-[2.25rem] cursor-pointer items-center justify-center rounded-xl text-sm font-bold transition-all px-2',
                isActive
                  ? 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:text-white'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:bg-slate-950/50 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
              )}
            >
              {page}
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage >= totalPages || totalItems === 0}
          className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl bg-slate-50 text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-950/50 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          aria-label="Next Page"
        >
          <ChevronRight size={18} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
};

export default DataTablePagination;
