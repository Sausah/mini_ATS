import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { getJobs } from '../api/jobs';
import { createCandidate, updateCandidate } from '../api/candidates';
import api from '../api/axios';
import CandidateForm from '../components/CandidateForm';
import { useToast } from '../components/Toast';

export default function CandidateFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [initialData, setInitialData] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(isEdit);
  const [fetchError, setFetchError] = useState(null);
  const { show, ToastContainer } = useToast();

  useEffect(() => {
    getJobs().then(r => setJobs(r.data.jobs)).catch(() => {});
    if (isEdit) {
      api.get(`/candidates/${id}`)
        .then(r => setInitialData(r.data.candidate))
        .catch(e => setFetchError(e.message || 'Failed to load candidate'))
        .finally(() => setFetchLoading(false));
    }
  }, [id, isEdit]);

  const handleSubmit = async (data) => {
    setLoading(true);
    try {
      if (isEdit) {
        await updateCandidate(id, data);
        show('Candidate updated successfully', 'success');
        navigate(`/candidates/${id}`);
      } else {
        const res = await createCandidate(data);
        show('Candidate added successfully', 'success');
        navigate(`/candidates/${res.data.candidate.id}`);
      }
    } catch (err) {
      const msg = err.message || 'Save failed';
      const details = err.details;
      if (details) {
        const msgs = Object.entries(details)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
          .join(' | ');
        show(`Validation: ${msgs}`, 'error');
      } else {
        show(msg, 'error');
      }
      setLoading(false);
    }
  };

  if (fetchLoading) return (
    <div className="flex items-center justify-center min-h-64">
      <Loader2 size={32} className="animate-spin text-indigo-500" />
    </div>
  );

  if (fetchError) return (
    <div className="p-6">
      <div className="card p-8 text-center">
        <p className="text-red-500">{fetchError}</p>
        <Link to="/candidates" className="btn-secondary mt-4">Go Back</Link>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-5 fade-in">
      <ToastContainer />

      <div className="flex items-center gap-3">
        <Link to={isEdit ? `/candidates/${id}` : '/candidates'} className="btn-ghost btn-sm">
          <ArrowLeft size={15} />
          {isEdit ? 'Back to Candidate' : 'Candidates'}
        </Link>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="font-semibold text-slate-900">
            {isEdit ? `Edit: ${initialData?.full_name || '…'}` : 'Add New Candidate'}
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            {isEdit ? 'Update the candidate details below' : 'Fill in the details to add a new candidate'}
          </p>
        </div>
        <div className="card-body">
          <CandidateForm
            initialData={initialData}
            jobs={jobs}
            onSubmit={handleSubmit}
            onCancel={() => navigate(isEdit ? `/candidates/${id}` : '/candidates')}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
}
