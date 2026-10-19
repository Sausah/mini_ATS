import { Link } from 'react-router-dom';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import StatusBadge from './StatusBadge';

function formatDate(isoString) {
  if (!isoString) return '—';
  return new Date(isoString).toLocaleDateString('en-IN', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

export default function CandidateTable({ candidates, onDelete, loading }) {
  if (loading) {
    return (
      <div className="p-6">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-4 mb-4">
            <div className="skeleton h-4 flex-1" />
            <div className="skeleton h-4 w-32" />
            <div className="skeleton h-4 w-24" />
          </div>
        ))}
      </div>
    );
  }

  if (!candidates || candidates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-400">
        <svg className="w-16 h-16 mb-4 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <p className="text-sm font-medium text-slate-500">No candidates found</p>
        <p className="text-xs mt-1 text-slate-400">Try adjusting your filters or add a new candidate</p>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="table" aria-label="Candidates list">
        <thead>
          <tr>
            <th scope="col">Candidate</th>
            <th scope="col">Job</th>
            <th scope="col">Applied</th>
            <th scope="col">Stage</th>
            <th scope="col">Source</th>
            <th scope="col" className="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {candidates.map((c) => (
            <tr key={c.id}>
              <td>
                <div>
                  <Link
                    to={`/candidates/${c.id}`}
                    className="font-semibold text-slate-900 hover:text-indigo-600 transition-colors"
                  >
                    {c.full_name}
                  </Link>
                  <div className="text-xs text-slate-400 mt-0.5">{c.email}</div>
                </div>
              </td>
              <td>
                <span className="text-slate-600 text-sm">{c.job_title || <span className="text-slate-300">—</span>}</span>
              </td>
              <td>
                <span className="text-slate-500 text-sm">{formatDate(c.applied_at)}</span>
              </td>
              <td>
                <StatusBadge stage={c.stage} />
              </td>
              <td>
                <span className="text-slate-500 text-sm">{c.source || '—'}</span>
              </td>
              <td>
                <div className="flex items-center justify-end gap-1">
                  <Link
                    to={`/candidates/${c.id}`}
                    className="btn btn-ghost btn-sm"
                    aria-label={`View ${c.full_name}`}
                  >
                    <Eye size={14} />
                  </Link>
                  <Link
                    to={`/candidates/${c.id}/edit`}
                    className="btn btn-ghost btn-sm"
                    aria-label={`Edit ${c.full_name}`}
                  >
                    <Pencil size={14} />
                  </Link>
                  <button
                    onClick={() => onDelete(c)}
                    className="btn btn-ghost btn-sm text-red-500 hover:text-red-700 hover:bg-red-50"
                    aria-label={`Delete ${c.full_name}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
