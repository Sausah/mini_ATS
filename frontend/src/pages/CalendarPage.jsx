import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar as CalendarIcon, Clock, Video, Mail, CheckCircle2,
  XCircle, ChevronLeft, ChevronRight, Plus, Loader2,
  ExternalLink, User, AlertCircle, RefreshCw, Sparkles
} from 'lucide-react';
import { getInterviews, updateInterview, deleteInterview, resendInterviewEmail } from '../api/interviews';
import InterviewScheduleModal from '../components/InterviewScheduleModal';
import { useToast } from '../components/Toast';

export default function CalendarPage() {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [emailModalData, setEmailModalData] = useState(null);
  const { show, ToastContainer } = useToast();

  const formattedDateParam = selectedDate.toISOString().slice(0, 10); // YYYY-MM-DD

  const fetchInterviews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getInterviews({
        date: formattedDateParam,
        status: statusFilter || undefined,
      });
      setInterviews(res.data?.interviews || []);
    } catch (err) {
      show(err.message || 'Failed to fetch appointments', 'error');
    } finally {
      setLoading(false);
    }
  }, [formattedDateParam, statusFilter]);

  useEffect(() => {
    fetchInterviews();
  }, [fetchInterviews]);

  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d);
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateInterview(id, { status: newStatus });
      show(`Interview marked as ${newStatus}`, 'success');
      fetchInterviews();
    } catch (err) {
      show(err.message || 'Update failed', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this interview appointment?')) return;
    try {
      await deleteInterview(id);
      show('Interview cancelled and removed', 'success');
      fetchInterviews();
    } catch (err) {
      show(err.message || 'Cancellation failed', 'error');
    }
  };

  const handleResendEmail = async (id) => {
    try {
      const res = await resendInterviewEmail(id);
      show(res.data?.message || 'Email re-sent to candidate', 'success');
      fetchInterviews();
    } catch (err) {
      show(err.message || 'Failed to send email', 'error');
    }
  };

  const isToday = new Date().toDateString() === selectedDate.toDateString();

  return (
    <div className="p-6 space-y-6 fade-in">
      <ToastContainer />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <CalendarIcon size={24} className="text-indigo-600" />
            Interview Calendar & Daily Appointments
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Manage daily candidate interview schedules, video meeting links, and automated invites
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary self-start sm:self-auto"
        >
          <Plus size={16} />
          Schedule Interview
        </button>
      </div>

      {/* Calendar Bar & Date Controls */}
      <div className="card p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Navigation buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevDay}
            className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 cursor-pointer"
            aria-label="Previous day"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={handleToday}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
              isToday
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                : 'border-slate-200 hover:bg-slate-50 text-slate-600'
            }`}
          >
            Today
          </button>
          <button
            onClick={handleNextDay}
            className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 cursor-pointer"
            aria-label="Next day"
          >
            <ChevronRight size={16} />
          </button>

          <span className="ml-2 font-bold text-slate-900 text-sm">
            {selectedDate.toLocaleDateString(undefined, {
              weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
            })}
          </span>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={formattedDateParam}
            onChange={(e) => {
              if (e.target.value) {
                const [y, m, d] = e.target.value.split('-').map(Number);
                setSelectedDate(new Date(y, m - 1, d));
              }
            }}
            className="form-input text-xs py-1.5 px-3 w-auto cursor-pointer"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="form-select text-xs py-1.5 w-auto"
          >
            <option value="">All Statuses</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Daily Timeline Appointments List */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-900 text-sm">
              Appointments for {selectedDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">
              {interviews.length} {interviews.length === 1 ? 'appointment' : 'appointments'}
            </span>
          </div>

          <button
            onClick={fetchInterviews}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-50 transition-colors"
            title="Refresh appointments"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={28} className="animate-spin text-indigo-500" />
            </div>
          ) : interviews.length === 0 ? (
            <div className="text-center py-12 max-w-sm mx-auto">
              <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <CalendarIcon size={24} />
              </div>
              <h4 className="font-bold text-slate-800 text-sm">No interviews scheduled</h4>
              <p className="text-xs text-slate-400 mt-1">
                There are no interview appointments on this date. Click below to shortlist a candidate and send an invite.
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="btn-primary btn-sm mt-4 mx-auto"
              >
                <Plus size={14} />
                Schedule for this date
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {interviews.map((appt) => {
                const dt = new Date(appt.scheduled_at);
                const timeString = dt.toLocaleTimeString(undefined, {
                  hour: '2-digit', minute: '2-digit'
                });

                return (
                  <div
                    key={appt.id}
                    className="p-4 border border-slate-200 rounded-xl hover:border-indigo-200 transition-all bg-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    {/* Time & Candidate Info */}
                    <div className="flex items-start gap-4">
                      {/* Time pill */}
                      <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-2 text-center flex-shrink-0 min-w-20">
                        <span className="block text-xs font-bold text-indigo-700">{timeString}</span>
                        <span className="block text-[10px] text-indigo-500 font-medium">
                          {appt.duration_minutes}m
                        </span>
                      </div>

                      {/* Candidate & Job */}
                      <div>
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/candidates/${appt.candidate_id}`}
                            className="font-bold text-slate-900 hover:text-indigo-600 transition-colors text-sm"
                          >
                            {appt.candidate_name || 'Candidate'}
                          </Link>
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                            {appt.interview_type}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              appt.status === 'Completed'
                                ? 'bg-emerald-50 text-emerald-700'
                                : appt.status === 'Cancelled'
                                ? 'bg-red-50 text-red-700'
                                : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            {appt.status}
                          </span>
                        </div>

                        <p className="text-xs text-slate-500 mt-1">
                          Role: <strong className="text-slate-700">{appt.job_title || 'General Opening'}</strong> • Interviewer: {appt.interviewer_name}
                        </p>

                        {/* Email dispatch badge */}
                        <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
                          {appt.email_sent ? (
                            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                              <CheckCircle2 size={13} />
                              Invitation Email Sent to {appt.candidate_email}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 font-medium">
                              <AlertCircle size={13} />
                              Email not sent
                            </span>
                          )}

                          {appt.email_body && (
                            <button
                              onClick={() => setEmailModalData(appt)}
                              className="text-[11px] text-indigo-600 hover:underline font-medium cursor-pointer"
                            >
                              View Sent Email
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 self-end md:self-auto flex-wrap">
                      {appt.meeting_link && (
                        <a
                          href={appt.meeting_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-primary btn-sm inline-flex items-center gap-1.5"
                        >
                          <Video size={14} />
                          Join Meeting
                        </a>
                      )}

                      {appt.status === 'Scheduled' && (
                        <button
                          onClick={() => handleStatusChange(appt.id, 'Completed')}
                          className="btn-secondary btn-sm text-emerald-700 hover:bg-emerald-50"
                          title="Mark as Completed"
                        >
                          <CheckCircle2 size={14} />
                          Done
                        </button>
                      )}

                      <button
                        onClick={() => handleResendEmail(appt.id)}
                        className="btn-ghost btn-sm text-slate-500 hover:text-slate-800"
                        title="Resend email invitation"
                      >
                        <Mail size={14} />
                      </button>

                      <button
                        onClick={() => handleDelete(appt.id)}
                        className="btn-ghost btn-sm text-red-500 hover:bg-red-50"
                        title="Cancel interview"
                      >
                        <XCircle size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Schedule Modal */}
      <InterviewScheduleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onScheduled={() => {
          show('Interview scheduled successfully & candidate shortlisted!', 'success');
          fetchInterviews();
        }}
      />

      {/* View Email Content Modal */}
      {emailModalData && (
        <div className="modal-overlay" onClick={() => setEmailModalData(null)}>
          <div className="modal max-w-lg w-full p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Mail size={16} className="text-indigo-600" />
                Invitation Email Sent to Candidate
              </h3>
              <button
                onClick={() => setEmailModalData(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold mb-1">To: {emailModalData.candidate_email}</p>
              <p className="text-xs text-slate-700 font-bold mb-2">Subject: {emailModalData.email_subject}</p>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 whitespace-pre-wrap max-h-60 overflow-y-auto">
                {emailModalData.email_body}
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button onClick={() => setEmailModalData(null)} className="btn-secondary btn-sm">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
