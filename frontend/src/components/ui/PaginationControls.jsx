import React from 'react';

const PaginationControls = ({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="px-4 py-3 bg-gray-50/70 border-t border-gray-200/80 flex items-center justify-between gap-3" aria-hidden="true">
        <div className="h-3 w-28 rounded bg-slate-200/80 animate-pulse" />
        <div className="h-8 w-40 rounded-lg bg-slate-200/80 animate-pulse" />
      </div>
    );
  }

  if (!totalPages || totalPages <= 1) {
    return (
      <div className="px-5 py-3 bg-gray-50/70 border-t border-gray-200/80 text-xs text-gray-500 flex items-center justify-between">
        <span>
          Showing {total === 0 ? 0 : Math.min((page - 1) * limit + 1, total)}-{Math.min(page * limit, total)} of {total}
        </span>
      </div>
    );
  }

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);
  const startIndex = Math.max(1, page - 1);
  const visiblePages = pages.filter((p) => p >= startIndex && p <= Math.min(totalPages, startIndex + 2));

  return (
    <div className="px-4 py-3 bg-gray-50/70 border-t border-gray-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
      <span>
        Showing {Math.min((page - 1) * limit + 1, total)}-{Math.min(page * limit, total)} of {total}
      </span>

      <div className="flex items-center gap-1 flex-wrap justify-center">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="h-8 min-w-8 px-2 rounded-lg border border-gray-200 bg-white text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
        >
          Prev
        </button>

        {page > 3 && totalPages > 4 && (
          <>
            <button type="button" onClick={() => onPageChange(1)} className="h-8 min-w-8 px-2 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors">1</button>
            <span className="px-1 text-gray-400">…</span>
          </>
        )}

        {visiblePages.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            className={`h-8 min-w-8 px-2 rounded-lg border transition-colors ${
              p === page
                ? 'border-purple-600 bg-purple-600 text-white shadow-xs'
                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            {p}
          </button>
        ))}

        {page < totalPages - 2 && totalPages > 4 && (
          <>
            <span className="px-1 text-gray-400">…</span>
            <button type="button" onClick={() => onPageChange(totalPages)} className="h-8 min-w-8 px-2 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors">{totalPages}</button>
          </>
        )}

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="h-8 min-w-8 px-2 rounded-lg border border-gray-200 bg-white text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default PaginationControls;
