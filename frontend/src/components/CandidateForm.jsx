import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';

const STAGES = ['Applied', 'Screening', 'Interview', 'Offer', 'Hired', 'Rejected'];
const SOURCES = ['LinkedIn', 'Indeed', 'Referral', 'Company Website', 'Glassdoor', 'Other'];
const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance'];

const INITIAL_STATE = {
  full_name: '',
  email: '',
  phone: '',
  job_id: '',
  stage: 'Applied',
  resume_url: '',
  source: 'LinkedIn',
  notes: '',
  applied_at: '',
};

function Field({ label, error, required, children, htmlFor }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="form-label">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}

export default function CandidateForm({ initialData, onSubmit, onCancel, jobs = [], loading = false }) {
  const [form, setForm] = useState(INITIAL_STATE);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setForm({
        full_name: initialData.full_name || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        job_id: initialData.job_id || '',
        stage: initialData.stage || 'Applied',
        resume_url: initialData.resume_url || '',
        source: initialData.source || 'LinkedIn',
        notes: initialData.notes || '',
        applied_at: initialData.applied_at
          ? new Date(initialData.applied_at).toISOString().split('T')[0]
          : '',
      });
    } else {
      setForm({ ...INITIAL_STATE, applied_at: new Date().toISOString().split('T')[0] });
    }
  }, [initialData]);

  const validate = () => {
    const errs = {};
    if (!form.full_name.trim()) errs.full_name = 'Full name is required';
    if (!form.email.trim()) {
      errs.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = 'Invalid email address';
    }
    if (form.phone && !/^[\d\s\+\-\(\)\.]{7,20}$/.test(form.phone)) {
      errs.phone = 'Invalid phone format';
    }
    return errs;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const payload = {
      ...form,
      job_id: form.job_id ? parseInt(form.job_id) : null,
      applied_at: form.applied_at ? new Date(form.applied_at).toISOString() : undefined,
    };
    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Field label="Full Name" htmlFor="full_name" required error={errors.full_name}>
          <input
            id="full_name"
            name="full_name"
            type="text"
            value={form.full_name}
            onChange={handleChange}
            className={`form-input ${errors.full_name ? 'border-red-400 focus:ring-red-400' : ''}`}
            placeholder="e.g. Aarav Sharma"
            autoComplete="name"
          />
        </Field>

        <Field label="Email Address" htmlFor="email" required error={errors.email}>
          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            className={`form-input ${errors.email ? 'border-red-400 focus:ring-red-400' : ''}`}
            placeholder="candidate@example.com"
            autoComplete="email"
          />
        </Field>

        <Field label="Phone" htmlFor="phone" error={errors.phone}>
          <input
            id="phone"
            name="phone"
            type="tel"
            value={form.phone}
            onChange={handleChange}
            className={`form-input ${errors.phone ? 'border-red-400 focus:ring-red-400' : ''}`}
            placeholder="+91-9876543210"
            autoComplete="tel"
          />
        </Field>

        <Field label="Job Opening" htmlFor="job_id">
          <select
            id="job_id"
            name="job_id"
            value={form.job_id}
            onChange={handleChange}
            className="form-select"
          >
            <option value="">— Not specified —</option>
            {jobs.map((job) => (
              <option key={job.id} value={job.id}>
                {job.title} ({job.department})
              </option>
            ))}
          </select>
        </Field>

        <Field label="Hiring Stage" htmlFor="stage">
          <select
            id="stage"
            name="stage"
            value={form.stage}
            onChange={handleChange}
            className="form-select"
          >
            {STAGES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </Field>

        <Field label="Application Source" htmlFor="source">
          <select
            id="source"
            name="source"
            value={form.source}
            onChange={handleChange}
            className="form-select"
          >
            {SOURCES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </Field>

        <Field label="Application Date" htmlFor="applied_at">
          <input
            id="applied_at"
            name="applied_at"
            type="date"
            value={form.applied_at}
            onChange={handleChange}
            className="form-input"
          />
        </Field>

        <Field label="Resume URL" htmlFor="resume_url">
          <input
            id="resume_url"
            name="resume_url"
            type="url"
            value={form.resume_url}
            onChange={handleChange}
            className="form-input"
            placeholder="https://example.com/resume.pdf"
          />
        </Field>
      </div>

      <Field label="Recruiter Notes" htmlFor="notes">
        <textarea
          id="notes"
          name="notes"
          value={form.notes}
          onChange={handleChange}
          className="form-textarea"
          rows={3}
          placeholder="Add any notes about this candidate..."
        />
      </Field>

      <div className="flex items-center justify-end gap-3 pt-2">
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn-secondary">
            <X size={16} />
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="btn-primary"
          id="submit-candidate-form"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : null}
          {loading ? 'Saving…' : (initialData ? 'Update Candidate' : 'Add Candidate')}
        </button>
      </div>
    </form>
  );
}
