import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ pagination, onChange }) {
  if (!pagination || pagination.total <= pagination.limit) return null;

  const { page, pages, total, has_prev, has_next } = pagination;
  const limit = pagination.limit || 10;

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
      <p className="text-sm text-slate-500">
        Showing{' '}
        <span className="font-medium text-slate-700">
          {(page - 1) * limit + 1}–{Math.min(page * limit, total)}
        </span>{' '}
        of <span className="font-medium text-slate-700">{total}</span> results
      </p>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(page - 1)}
          disabled={!has_prev}
          className="btn btn-ghost btn-sm disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
        </button>

        {[...Array(Math.min(pages, 7))].map((_, i) => {
          let p;
          if (pages <= 7) {
            p = i + 1;
          } else if (page <= 4) {
            p = i < 6 ? i + 1 : pages;
          } else if (page >= pages - 3) {
            p = i === 0 ? 1 : pages - 6 + i;
          } else {
            p = i === 0 ? 1 : i === 6 ? pages : page - 3 + i;
          }
          const isEllipsis = pages > 7 && ((i === 1 && p !== 2) || (i === 5 && p !== pages - 1));
          if (isEllipsis) return <span key={i} className="px-1 text-slate-400">…</span>;
          return (
            <button
              key={i}
              onClick={() => onChange(p)}
              className={`w-8 h-8 text-sm rounded-lg font-medium transition-colors ${
                p === page
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
              aria-label={`Page ${p}`}
              aria-current={p === page ? 'page' : undefined}
            >
              {p}
            </button>
          );
        })}

        <button
          onClick={() => onChange(page + 1)}
          disabled={!has_next}
          className="btn btn-ghost btn-sm disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Next page"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
