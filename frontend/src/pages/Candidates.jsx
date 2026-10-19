import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Loader2 } from 'lucide-react';
import api from '../api/axios';
import { deleteCandidate } from '../api/candidates';
import { getJobs } from '../api/jobs';
import CandidateTable from '../components/CandidateTable';
import SearchFilters from '../components/SearchFilters';
import Pagination from '../components/Pagination';
import ConfirmDialog from '../components/ConfirmDialog';
import { useToast } from '../components/Toast';

const DEFAULT_FILTERS = {
  search: '', stage: '', job_id: '', source: '', sort: 'applied_at_desc', page: 1, limit: 10,
};

export default function Candidates() {
  const [candidates, setCandidates] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const { show, ToastContainer } = useToast();

  // Parse sort into sort_by + sort_order
  const buildParams = useCallback((f) => {
    const [sort_by, sort_order] = (f.sort || 'applied_at_desc').split('_').reduce((acc, part, i, arr) => {
      if (i < arr.length - 1) acc[0] = (acc[0] ? acc[0] + '_' : '') + part;
      else acc[1] = part;
      return acc;
    }, ['', '']);
    return {
      search: f.search,
      stage: f.stage,
      job_id: f.job_id,
      source: f.source,
      sort_by: sort_by || 'applied_at',
      sort_order: sort_order || 'desc',
      page: f.page,
      limit: f.limit,
    };
  }, []);

  const fetchCandidates = useCallback(async (f) => {
    setLoading(true);
    setError(null);
    try {
      const params = buildParams(f);
      const res = await api.get('/candidates', { params });
      setCandidates(res.data.candidates);
      setPagination(res.data.pagination);
    } catch (err) {
      setError(err.message || 'Failed to load candidates');
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  useEffect(() => {
    fetchCandidates(filters);
  }, [filters, fetchCandidates]);

  useEffect(() => {
    getJobs().then(r => setJobs(r.data.jobs)).catch(() => {});
  }, []);

  const handleFilterChange = (newFilters) => setFilters(newFilters);

  const handlePageChange = (page) => setFilters(prev => ({ ...prev, page }));

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteCandidate(deleteTarget.id);
      show(`${deleteTarget.full_name} deleted`, 'success');
      setDeleteTarget(null);
      fetchCandidates(filters);
    } catch (err) {
      show(err.message || 'Delete failed', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="p-6 space-y-5 fade-in">
      <ToastContainer />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Candidates</h2>
          <p className="text-sm text-slate-500 mt-1">
            {pagination ? `${pagination.total} total` : 'Loading…'}
          </p>
        </div>
        <Link to="/candidates/new" className="btn-primary" id="add-candidate-btn">
          <Plus size={16} />
          Add Candidate
        </Link>
      </div>

      {/* Filters */}
      <SearchFilters filters={filters} onChange={handleFilterChange} jobs={jobs} />

      {/* Table */}
      <div className="card overflow-hidden">
        {error ? (
          <div className="p-8 text-center text-red-500">
            <p className="font-medium">Error loading candidates</p>
            <p className="text-sm mt-1 text-slate-400">{error}</p>
            <button onClick={() => fetchCandidates(filters)} className="btn-primary mt-4">
              Retry
            </button>
          </div>
        ) : (
          <>
            <CandidateTable
              candidates={candidates}
              loading={loading}
              onDelete={setDeleteTarget}
            />
            <Pagination pagination={pagination} onChange={handlePageChange} />
          </>
        )}
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Candidate"
        message={`Are you sure you want to delete ${deleteTarget?.full_name}? This action cannot be undone and will remove all their stage history.`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
