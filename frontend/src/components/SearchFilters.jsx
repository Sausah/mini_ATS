import { Search, SlidersHorizontal, X } from 'lucide-react';

const STAGES = ['Applied', 'Screening', 'Interview', 'Offer', 'Hired', 'Rejected'];
const SOURCES = ['LinkedIn', 'Indeed', 'Referral', 'Company Website', 'Glassdoor', 'Other'];
const SORT_OPTIONS = [
  { value: 'applied_at_desc', label: 'Newest First' },
  { value: 'applied_at_asc', label: 'Oldest First' },
  { value: 'full_name_asc', label: 'Name A–Z' },
  { value: 'full_name_desc', label: 'Name Z–A' },
];

export default function SearchFilters({ filters, onChange, jobs = [] }) {
  const { search = '', stage = '', job_id = '', source = '', sort = 'applied_at_desc' } = filters;

  const set = (key, val) => onChange({ ...filters, [key]: val, page: 1 });

  const hasActiveFilters = search || stage || job_id || source || sort !== 'applied_at_desc';

  const clearAll = () => onChange({ search: '', stage: '', job_id: '', source: '', sort: 'applied_at_desc', page: 1 });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {/* Search input */}
        <div className="relative flex-1 min-w-48">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            aria-hidden="true"
          />
          <input
            id="candidate-search"
            type="search"
            value={search}
            onChange={(e) => set('search', e.target.value)}
            placeholder="Search by name or email…"
            className="form-input pl-9"
            aria-label="Search candidates"
          />
        </div>

        {/* Stage filter */}
        <select
          id="filter-stage"
          value={stage}
          onChange={(e) => set('stage', e.target.value)}
          className="form-select w-40"
          aria-label="Filter by stage"
        >
          <option value="">All Stages</option>
          {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>

        {/* Job filter */}
        <select
          id="filter-job"
          value={job_id}
          onChange={(e) => set('job_id', e.target.value)}
          className="form-select w-48"
          aria-label="Filter by job"
        >
          <option value="">All Jobs</option>
          {jobs.map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}
        </select>

        {/* Source filter */}
        <select
          id="filter-source"
          value={source}
          onChange={(e) => set('source', e.target.value)}
          className="form-select w-40"
          aria-label="Filter by source"
        >
          <option value="">All Sources</option>
          {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>

        {/* Sort */}
        <select
          id="filter-sort"
          value={sort}
          onChange={(e) => set('sort', e.target.value)}
          className="form-select w-40"
          aria-label="Sort candidates"
        >
          {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        {/* Clear filters */}
        {hasActiveFilters && (
          <button
            onClick={clearAll}
            className="btn-secondary btn-sm flex items-center gap-1"
            aria-label="Clear all filters"
          >
            <X size={14} />
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
