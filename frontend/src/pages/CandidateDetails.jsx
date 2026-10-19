import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Mail, Phone, Briefcase, Calendar, Link2,
  BarChart2, FileText, Loader2, Clock, ChevronRight, Video,
  CheckCircle2, Sparkles, Send
} from 'lucide-react';
import api from '../api/axios';
import { updateCandidateStage, deleteCandidate } from '../api/candidates';
import StatusBadge from '../components/StatusBadge';
import ConfirmDialog from '../components/ConfirmDialog';
import InterviewScheduleModal from '../components/InterviewScheduleModal';
import { useToast } from '../components/Toast';

const STAGES = ['Applied', 'Screening', 'Interview', 'Offer', 'Hired', 'Rejected'];

function InfoRow({ icon: Icon, label, value, href }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0">
      <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center flex-shrink-0">
        <Icon size={15} className="text-slate-500" />
      </div>
      <div>
        <p className="text-xs text-slate-400 font-medium">{label}</p>
        {href ? (
          <a href={href} target="_blank" rel="noopener noreferrer"
             className="text-sm text-indigo-600 hover:text-indigo-800 font-medium break-all">
            {value}
          </a>
        ) : (
          <p className="text-sm text-slate-800 font-medium">{value || '—'}</p>
        )}
      </div>
    </div>
  );
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

function formatDateTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-IN', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function CandidateDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stageNote, setStageNote] = useState('');
  const [updatingStage, setUpdatingStage] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { show, ToastContainer } = useToast();

  const load = async () => {
    try {
      const res = await api.get(`/candidates/${id}`);
      setCandidate(res.data.candidate);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const handleStageChange = async (newStage) => {
    if (newStage === candidate.stage) return;
    setUpdatingStage(true);
    try {
      const res = await updateCandidateStage(id, newStage, stageNote);
      setCandidate(res.data.candidate);
      await load();  // refresh to get updated history
      setStageNote('');
      show(`Stage updated to ${newStage}`, 'success');
    } catch (err) {
      show(err.message || 'Stage update failed', 'error');
    } finally {
      setUpdatingStage(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteCandidate(id);
      navigate('/candidates');
    } catch (err) {
      show(err.message || 'Delete failed', 'error');
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-64">
      <Loader2 size={32} className="animate-spin text-indigo-500" />
    </div>
  );

  if (error) return (
    <div className="p-6">
      <div className="card p-8 text-center">
        <p className="text-slate-600 font-medium">{error}</p>
        <Link to="/candidates" className="btn-secondary mt-4">Back to Candidates</Link>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-5 fade-in">
      <ToastContainer />

      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <Link to="/candidates" className="btn-ghost btn-sm">
          <ArrowLeft size={15} />
          Candidates
        </Link>
        <ChevronRight size={14} className="text-slate-300" />
        <span className="text-sm font-medium text-slate-600">{candidate.full_name}</span>
      </div>

      {/* Header */}
      <div className="card p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-indigo-700 text-xl font-bold">
                {candidate.full_name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{candidate.full_name}</h2>
              <p className="text-slate-500 text-sm">{candidate.email}</p>
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                <StatusBadge stage={candidate.stage} />
                {candidate.job_title && (
                  <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                    {candidate.job_title}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowScheduleModal(true)}
              className="btn-primary btn-sm flex items-center gap-1.5 shadow-sm"
            >
              <Calendar size={14} />
              Schedule Interview & Send Mail
            </button>
            <Link to={`/candidates/${id}/edit`} className="btn-secondary btn-sm">
              Edit Candidate
            </Link>
            <button
              onClick={() => setShowDeleteDialog(true)}
              className="btn-danger btn-sm"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Shortlist & Schedule Interview Banner */}
      {(candidate.stage === 'Applied' || candidate.stage === 'Screening') && (
        <div className="card p-4 bg-gradient-to-r from-indigo-50/80 via-purple-50/60 to-indigo-50/80 border border-indigo-200/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-md">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Shortlist {candidate.full_name} for an Interview?
              </h3>
              <p className="text-xs text-slate-600">
                Pick a date & time slot, generate a Google Meet link, and dispatch an official interview invitation email.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowScheduleModal(true)}
            className="btn-primary btn-sm whitespace-nowrap self-stretch sm:self-auto justify-center"
          >
            <Calendar size={14} />
            Shortlist & Schedule Now
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Info panel */}
        <div className="space-y-5">
          <div className="card">
            <div className="card-header">
              <h3 className="font-semibold text-slate-900 text-sm">Contact Information</h3>
            </div>
            <div className="px-5">
              <InfoRow icon={Mail} label="Email" value={candidate.email} href={`mailto:${candidate.email}`} />
              <InfoRow icon={Phone} label="Phone" value={candidate.phone} />
              <InfoRow icon={Briefcase} label="Job" value={candidate.job_title} />
              <InfoRow icon={Calendar} label="Applied" value={formatDate(candidate.applied_at)} />
              <InfoRow icon={BarChart2} label="Source" value={candidate.source} />
              {candidate.resume_url && (
                <InfoRow icon={Link2} label="Resume" value="View Resume" href={candidate.resume_url} />
              )}
            </div>
          </div>

          {/* Notes */}
          {candidate.notes && (
            <div className="card">
              <div className="card-header">
                <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                  <FileText size={15} />
                  Recruiter Notes
                </h3>
              </div>
              <div className="p-5">
                <p className="text-sm text-slate-600 whitespace-pre-wrap">{candidate.notes}</p>
              </div>
            </div>
          )}
        </div>

        {/* Stage management + history */}
        <div className="lg:col-span-2 space-y-5">
          {/* Stage update */}
          <div className="card">
            <div className="card-header">
              <h3 className="font-semibold text-slate-900 text-sm">Update Hiring Stage</h3>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex flex-wrap gap-2">
                {STAGES.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleStageChange(s)}
                    disabled={updatingStage || s === candidate.stage}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                      s === candidate.stage
                        ? 'bg-indigo-600 text-white border-indigo-600 cursor-default'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-400 hover:text-indigo-600'
                    } disabled:opacity-50`}
                  >
                    {s === candidate.stage && updatingStage ? (
                      <Loader2 size={12} className="animate-spin inline mr-1" />
                    ) : null}
                    {s}
                  </button>
                ))}
              </div>
              <div>
                <label htmlFor="stage-note" className="form-label">Note (optional)</label>
                <input
                  id="stage-note"
                  type="text"
                  value={stageNote}
                  onChange={(e) => setStageNote(e.target.value)}
                  placeholder="Add a note for this stage change…"
                  className="form-input"
                />
              </div>
            </div>
          </div>

          {/* Stage History */}
          <div className="card">
            <div className="card-header">
              <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                <Clock size={15} />
                Stage History
              </h3>
            </div>
            <div className="p-0">
              {!candidate.stage_history || candidate.stage_history.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-sm">No history yet</div>
              ) : (
                <ol className="relative" aria-label="Stage history timeline">
                  {candidate.stage_history.map((h, i) => (
                    <li key={h.id} className="flex gap-4 px-5 py-3 border-b border-slate-100 last:border-0">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 rounded-full bg-indigo-400 flex-shrink-0 mt-1" />
                        {i < candidate.stage_history.length - 1 && (
                          <div className="w-px flex-1 bg-slate-200 mt-1" />
                        )}
                      </div>
                      <div className="flex-1 pb-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {h.previous_stage ? (
                            <>
                              <StatusBadge stage={h.previous_stage} />
                              <ChevronRight size={12} className="text-slate-400" />
                            </>
                          ) : null}
                          <StatusBadge stage={h.new_stage} />
                        </div>
                        {h.note && <p className="text-xs text-slate-500 mt-1">{h.note}</p>}
                        <time className="text-xs text-slate-400 mt-0.5 block">
                          {formatDateTime(h.changed_at)}
                        </time>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>

          {/* Scheduled Interviews Card */}
          <div className="card">
            <div className="card-header flex items-center justify-between">
              <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                <Calendar size={15} className="text-indigo-600" />
                Scheduled Interviews & Appointments
              </h3>
              <button
                onClick={() => setShowScheduleModal(true)}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
              >
                + Book Interview
              </button>
            </div>
            <div className="p-5">
              {!candidate.interviews || candidate.interviews.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-xs text-slate-400">No interviews currently scheduled for {candidate.full_name}.</p>
                  <button
                    onClick={() => setShowScheduleModal(true)}
                    className="btn-secondary btn-sm mt-3"
                  >
                    Schedule Interview Now
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {candidate.interviews.map((inv) => (
                    <div
                      key={inv.id}
                      className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">{inv.interview_type}</span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              inv.status === 'Completed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : inv.status === 'Cancelled'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {inv.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          📅 {new Date(inv.scheduled_at).toLocaleString(undefined, {
                            weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                          })} ({inv.duration_minutes} min) • Interviewer: {inv.interviewer_name}
                        </p>
                        {inv.email_sent && (
                          <p className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
                            <CheckCircle2 size={12} />
                            Invite email dispatched to {inv.candidate_email}
                          </p>
                        )}
                      </div>

                      {inv.meeting_link && (
                        <a
                          href={inv.meeting_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-primary btn-sm flex items-center gap-1.5 self-start sm:self-auto"
                        >
                          <Video size={13} />
                          Join Meeting
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={showDeleteDialog}
        title="Delete Candidate"
        message={`This will permanently delete ${candidate.full_name} and all their stage history. This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteDialog(false)}
        loading={deleting}
      />

      <InterviewScheduleModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        candidate={candidate}
        onScheduled={() => {
          load();
          show('Interview scheduled successfully and invitation email dispatched!', 'success');
        }}
      />
    </div>
  );
}
