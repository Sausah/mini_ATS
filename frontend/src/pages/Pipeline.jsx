import { useState, useEffect } from 'react';
import { Loader2, ChevronRight, User, Calendar, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getPipeline } from '../api/dashboard';
import { updateCandidateStage } from '../api/candidates';
import StatusBadge from '../components/StatusBadge';
import InterviewScheduleModal from '../components/InterviewScheduleModal';
import { useToast } from '../components/Toast';

const STAGES = ['Applied', 'Screening', 'Interview', 'Offer', 'Hired', 'Rejected'];

const STAGE_COLORS = {
  Applied:   'bg-slate-200 text-slate-700',
  Screening: 'bg-blue-100 text-blue-800',
  Interview: 'bg-amber-100 text-amber-800',
  Offer:     'bg-purple-100 text-purple-800',
  Hired:     'bg-emerald-100 text-emerald-800',
  Rejected:  'bg-red-100 text-red-800',
};

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
}

function CandidateCard({ candidate, onMove, onSchedule, disabled }) {
  const otherStages = STAGES.filter(s => s !== candidate.stage);
  return (
    <div className="bg-white rounded-lg p-3 shadow-sm border border-slate-200 hover:shadow-md hover:border-indigo-200 transition-all group">
      <div className="flex items-start justify-between gap-2">
        <Link
          to={`/candidates/${candidate.id}`}
          className="font-medium text-sm text-slate-900 hover:text-indigo-600 transition-colors truncate leading-tight"
        >
          {candidate.full_name}
        </Link>
        {/* Quick move dropdown */}
        <div className="relative group/menu">
          <button
            className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded bg-slate-100 hover:bg-slate-200 transition-all text-slate-500 text-xs"
            title="Move to stage"
            aria-label={`Move ${candidate.full_name} to a different stage`}
          >
            ···
          </button>
          <div className="absolute right-0 top-7 z-10 bg-white border border-slate-200 rounded-lg shadow-xl hidden group-hover/menu:block min-w-32 py-1">
            {otherStages.map((s) => (
              <button
                key={s}
                onClick={() => onMove(candidate.id, s)}
                disabled={disabled}
                className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Move to {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-400 mt-0.5 truncate">{candidate.email}</p>

      <div className="flex items-center justify-between mt-2">
        {candidate.job_title ? (
          <span className="text-xs bg-slate-50 text-slate-500 px-1.5 py-0.5 rounded truncate max-w-28">
            {candidate.job_title}
          </span>
        ) : (
          <span />
        )}
        <span className="text-xs text-slate-400">{formatDate(candidate.applied_at)}</span>
      </div>

      {/* Stage change dropdown (visible, accessible) */}
      <div className="mt-2 pt-2 border-t border-slate-100">
        <label className="sr-only" htmlFor={`stage-select-${candidate.id}`}>
          Move {candidate.full_name} to stage
        </label>
        <select
          id={`stage-select-${candidate.id}`}
          value={candidate.stage}
          onChange={(e) => onMove(candidate.id, e.target.value)}
          disabled={disabled}
          className="w-full text-xs border border-slate-200 rounded py-1 px-2 bg-slate-50 text-slate-600 cursor-pointer"
          aria-label={`Move ${candidate.full_name} to stage`}
        >
          {STAGES.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Schedule Interview shortcut */}
      <button
        type="button"
        onClick={() => onSchedule(candidate)}
        className="w-full mt-2 py-1 px-2 rounded-md bg-indigo-50/70 hover:bg-indigo-100 text-indigo-700 text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
        title="Schedule Interview & Send Mail"
      >
        <Calendar size={12} />
        Schedule & Mail
      </button>
    </div>
  );
}

export default function Pipeline() {
  const [pipeline, setPipeline] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [moving, setMoving] = useState(false);
  const [schedulingCandidate, setSchedulingCandidate] = useState(null);
  const { show, ToastContainer } = useToast();

  const load = async () => {
    try {
      const res = await getPipeline();
      setPipeline(res.data.pipeline);
    } catch (err) {
      setError(err.message || 'Failed to load pipeline');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleMove = async (candidateId, newStage) => {
    setMoving(true);
    try {
      await updateCandidateStage(candidateId, newStage);
      show(`Moved to ${newStage}`, 'success');
      load();
    } catch (err) {
      show(err.message || 'Move failed', 'error');
    } finally {
      setMoving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-64">
      <Loader2 size={32} className="animate-spin text-indigo-500" />
    </div>
  );

  if (error) return (
    <div className="p-6">
      <div className="card p-8 text-center text-red-500">{error}</div>
    </div>
  );

  return (
    <div className="p-6 fade-in">
      <ToastContainer />

      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Hiring Pipeline</h2>
          <p className="text-sm text-slate-500 mt-1">
            Drag-free Kanban — use the stage dropdown or schedule interview directly
          </p>
        </div>

        <Link
          to="/calendar"
          className="btn-secondary btn-sm flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Calendar size={14} className="text-indigo-600" />
          View Appointments Calendar
        </Link>
      </div>

      {/* Kanban Board */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max">
          {STAGES.map((stage) => {
            const cards = pipeline[stage] || [];
            return (
              <div key={stage} className="pipeline-column" role="region" aria-label={`${stage} stage`}>
                {/* Column header */}
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${
                      stage === 'Applied' ? 'bg-slate-400' :
                      stage === 'Screening' ? 'bg-blue-400' :
                      stage === 'Interview' ? 'bg-amber-400' :
                      stage === 'Offer' ? 'bg-purple-400' :
                      stage === 'Hired' ? 'bg-emerald-400' :
                      'bg-red-400'
                    }`} />
                    <h3 className="font-semibold text-sm text-slate-800">{stage}</h3>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${STAGE_COLORS[stage]}`}>
                    {cards.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="space-y-2 flex-1 overflow-y-auto max-h-screen">
                  {cards.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                      <User size={24} className="mb-2 opacity-40" />
                      <p className="text-xs">No candidates</p>
                    </div>
                  ) : (
                    cards.map((c) => (
                      <CandidateCard
                        key={c.id}
                        candidate={c}
                        onMove={handleMove}
                        onSchedule={(cand) => setSchedulingCandidate(cand)}
                        disabled={moving}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <InterviewScheduleModal
        isOpen={!!schedulingCandidate}
        onClose={() => setSchedulingCandidate(null)}
        candidate={schedulingCandidate}
        onScheduled={() => {
          load();
          show('Interview scheduled successfully & invitation email sent!', 'success');
        }}
      />
    </div>
  );
}
