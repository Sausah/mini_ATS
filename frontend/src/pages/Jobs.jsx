import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Loader2, X, Briefcase, MapPin, Clock, Users } from 'lucide-react';
import { getJobs, createJob, updateJob, deleteJob } from '../api/jobs';
import ConfirmDialog from '../components/ConfirmDialog';
import { useToast } from '../components/Toast';

const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance'];
const JOB_STATUSES = ['Open', 'Closed', 'On Hold'];

const STATUS_COLORS = {
  Open: 'bg-emerald-50 text-emerald-700',
  Closed: 'bg-red-50 text-red-700',
  'On Hold': 'bg-amber-50 text-amber-700',
};

const EMPTY_JOB = {
  title: '', department: '', location: '',
  employment_type: 'Full-time', status: 'Open', description: '',
};

function JobFormModal({ open, job, onSave, onClose, loading }) {
  const [form, setForm] = useState(EMPTY_JOB);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open) {
      setForm(job ? {
        title: job.title,
        department: job.department,
        location: job.location,
        employment_type: job.employment_type,
        status: job.status,
        description: job.description || '',
      } : EMPTY_JOB);
      setErrors({});
    }
  }, [open, job]);

  if (!open) return null;

  const validate = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = 'Title is required';
    if (!form.department.trim()) errs.department = 'Department is required';
    if (!form.location.trim()) errs.location = 'Location is required';
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSave(form);
  };

  const set = (k, v) => {
    setForm(p => ({ ...p, [k]: v }));
    if (errors[k]) setErrors(p => ({ ...p, [k]: '' }));
  };

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal max-w-lg w-full">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">{job ? 'Edit Job' : 'Add Job Opening'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} noValidate>
          <div className="p-6 space-y-4">
            <div>
              <label className="form-label" htmlFor="job-title">Title <span className="text-red-500">*</span></label>
              <input id="job-title" className={`form-input ${errors.title ? 'border-red-400' : ''}`}
                value={form.title} onChange={(e) => set('title', e.target.value)}
                placeholder="e.g. Senior Software Engineer" />
              {errors.title && <p className="form-error">{errors.title}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label" htmlFor="job-dept">Department <span className="text-red-500">*</span></label>
                <input id="job-dept" className={`form-input ${errors.department ? 'border-red-400' : ''}`}
                  value={form.department} onChange={(e) => set('department', e.target.value)}
                  placeholder="Engineering" />
                {errors.department && <p className="form-error">{errors.department}</p>}
              </div>
              <div>
                <label className="form-label" htmlFor="job-location">Location <span className="text-red-500">*</span></label>
                <input id="job-location" className={`form-input ${errors.location ? 'border-red-400' : ''}`}
                  value={form.location} onChange={(e) => set('location', e.target.value)}
                  placeholder="Remote" />
                {errors.location && <p className="form-error">{errors.location}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label" htmlFor="job-type">Employment Type</label>
                <select id="job-type" className="form-select" value={form.employment_type}
                  onChange={(e) => set('employment_type', e.target.value)}>
                  {EMPLOYMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label" htmlFor="job-status">Status</label>
                <select id="job-status" className="form-select" value={form.status}
                  onChange={(e) => set('status', e.target.value)}>
                  {JOB_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="form-label" htmlFor="job-desc">Description</label>
              <textarea id="job-desc" className="form-textarea" rows={3}
                value={form.description} onChange={(e) => set('description', e.target.value)}
                placeholder="Describe the role and requirements…" />
            </div>
          </div>
          <div className="flex justify-end gap-3 px-6 py-4 bg-slate-50 rounded-b-2xl border-t border-slate-100">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary" id="save-job-btn">
              {loading ? <Loader2 size={15} className="animate-spin" /> : null}
              {loading ? 'Saving…' : (job ? 'Update Job' : 'Create Job')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editJob, setEditJob] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const { show, ToastContainer } = useToast();

  const load = async () => {
    try {
      const res = await getJobs();
      setJobs(res.data.jobs);
    } catch (err) {
      show('Failed to load jobs', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (form) => {
    setSaving(true);
    try {
      if (editJob) {
        await updateJob(editJob.id, form);
        show('Job updated', 'success');
      } else {
        await createJob(form);
        show('Job created', 'success');
      }
      setModalOpen(false);
      setEditJob(null);
      load();
    } catch (err) {
      show(err.message || 'Save failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteJob(deleteTarget.id);
      show('Job deleted', 'success');
      setDeleteTarget(null);
      load();
    } catch (err) {
      show(err.message || 'Delete failed', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="p-6 space-y-5 fade-in">
      <ToastContainer />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Job Openings</h2>
          <p className="text-sm text-slate-500 mt-1">{jobs.length} total positions</p>
        </div>
        <button onClick={() => { setEditJob(null); setModalOpen(true); }} className="btn-primary" id="add-job-btn">
          <Plus size={16} />
          Add Job
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card p-5 space-y-3">
              <div className="skeleton h-5 w-2/3" />
              <div className="skeleton h-4 w-1/2" />
              <div className="skeleton h-4 w-1/3" />
            </div>
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="card flex flex-col items-center py-16 text-slate-400">
          <Briefcase size={48} className="mb-4 text-slate-200" />
          <p className="font-medium text-slate-500">No job openings yet</p>
          <button onClick={() => setModalOpen(true)} className="btn-primary mt-4">
            <Plus size={15} />
            Create First Job
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {jobs.map((job) => (
            <div key={job.id} className="card p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                  <Briefcase size={18} className="text-indigo-500" />
                </div>
                <span className={`badge ${STATUS_COLORS[job.status] || 'bg-slate-100 text-slate-600'}`}>
                  {job.status}
                </span>
              </div>

              <h3 className="font-semibold text-slate-900 text-sm leading-tight">{job.title}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{job.department}</p>

              {job.description && (
                <p className="text-xs text-slate-400 mt-2 line-clamp-2">{job.description}</p>
              )}

              <div className="flex items-center gap-3 mt-3 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <MapPin size={11} />
                  {job.location}
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={11} />
                  {job.employment_type}
                </span>
                <span className="flex items-center gap-1">
                  <Users size={11} />
                  {job.candidate_count}
                </span>
              </div>

              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
                <button
                  onClick={() => { setEditJob(job); setModalOpen(true); }}
                  className="btn-ghost btn-sm flex-1 justify-center"
                  aria-label={`Edit ${job.title}`}
                >
                  <Pencil size={13} />
                  Edit
                </button>
                <button
                  onClick={() => setDeleteTarget(job)}
                  className="btn-ghost btn-sm text-red-500 hover:text-red-700 hover:bg-red-50 flex-1 justify-center"
                  aria-label={`Delete ${job.title}`}
                >
                  <Trash2 size={13} />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <JobFormModal
        open={modalOpen}
        job={editJob}
        onSave={handleSave}
        onClose={() => { setModalOpen(false); setEditJob(null); }}
        loading={saving}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Job"
        message={`Delete "${deleteTarget?.title}"? This fails if there are candidates assigned to it.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
