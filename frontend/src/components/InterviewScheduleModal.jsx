import { useState, useEffect } from 'react';
import {
  X, Calendar, Clock, Video, Mail, User,
  CheckCircle2, Sparkles, Loader2, Send
} from 'lucide-react';
import { scheduleInterview } from '../api/interviews';
import api from '../api/axios';

const INTERVIEW_TYPES = [
  'Technical Round',
  'HR Screening',
  'Managerial Interview',
  'System Design',
  'Final Round',
];

const DURATIONS = [
  { label: '30 minutes', value: 30 },
  { label: '45 minutes', value: 45 },
  { label: '60 minutes (1 hr)', value: 60 },
  { label: '90 minutes (1.5 hr)', value: 90 },
];

export default function InterviewScheduleModal({
  isOpen,
  onClose,
  candidate = null,
  onScheduled = () => {},
}) {
  const [candidatesList, setCandidatesList] = useState([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState(candidate?.id || '');
  const [interviewType, setInterviewType] = useState('Technical Round');
  const [scheduledDate, setScheduledDate] = useState(() => {
    // Tomorrow at 10:00 AM local
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(10, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [duration, setDuration] = useState(45);
  const [interviewerName, setInterviewerName] = useState('Recruiter Admin');
  const [interviewerEmail, setInterviewerEmail] = useState('admin@miniats.com');
  const [meetingLink, setMeetingLink] = useState('https://meet.google.com/ats-interview-session');
  const [location, setLocation] = useState('Google Meet');
  const [notes, setNotes] = useState('');
  const [sendEmail, setSendEmail] = useState(true);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch candidates if no fixed candidate is passed
  useEffect(() => {
    if (!candidate && isOpen) {
      api.get('/candidates', { params: { limit: 100 } })
        .then((res) => {
          const list = res.data?.candidates || [];
          setCandidatesList(list);
          if (list.length > 0 && !selectedCandidateId) {
            setSelectedCandidateId(list[0].id);
          }
        })
        .catch(() => {});
    }
  }, [candidate, isOpen, selectedCandidateId]);

  useEffect(() => {
    if (candidate) {
      setSelectedCandidateId(candidate.id);
    }
  }, [candidate]);

  // Current active candidate
  const currentCandidate = candidate || candidatesList.find((c) => c.id === parseInt(selectedCandidateId));

  // Sync default email template when fields change
  useEffect(() => {
    if (currentCandidate) {
      const jobTitle = currentCandidate.job_title || 'Open Position';
      const formattedDate = new Date(scheduledDate).toLocaleString(undefined, {
        weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });
      setEmailSubject(`Interview Invitation: ${jobTitle} at Mini ATS`);
      setEmailBody(
`Dear ${currentCandidate.full_name},

Thank you for your application for the ${jobTitle} position at Mini ATS. We were impressed with your qualifications and are delighted to shortlist you for an interview!

Interview Details:
• Stage: ${interviewType}
• Date & Time: ${formattedDate}
• Duration: ${duration} minutes
• Interviewer: ${interviewerName} (${interviewerEmail})
• Platform: ${location}
• Meeting Link: ${meetingLink}

Please confirm your availability by replying to this email. If you need to reschedule or have questions, please reach out to us.

Best regards,
Talent Acquisition Team
Mini ATS`
      );
    }
  }, [currentCandidate, interviewType, scheduledDate, duration, interviewerName, interviewerEmail, location, meetingLink]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCandidateId) {
      setError('Please select a candidate.');
      return;
    }
    if (!scheduledDate) {
      setError('Please select an interview date and time.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        candidate_id: parseInt(selectedCandidateId),
        title: `${interviewType} with ${currentCandidate?.full_name || 'Candidate'}`,
        interview_type: interviewType,
        scheduled_at: new Date(scheduledDate).toISOString(),
        duration_minutes: duration,
        interviewer_name: interviewerName,
        interviewer_email: interviewerEmail,
        meeting_link: meetingLink,
        location: location,
        notes: notes,
        send_email: sendEmail,
        email_subject: emailSubject,
        email_body: emailBody,
      };

      const res = await scheduleInterview(payload);
      onScheduled(res.data);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to schedule interview');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-indigo-100 text-indigo-700 rounded-xl flex items-center justify-center">
              <Calendar size={18} />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-base leading-tight">
                Schedule Interview & Mail Invite
              </h2>
              <p className="text-xs text-slate-500">
                Shortlist candidate, book calendar appointment, and dispatch invite
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
              {error}
            </div>
          )}

          {/* Candidate selection */}
          <div>
            <label className="form-label" htmlFor="candidate-select">
              Candidate to Shortlist & Interview <span className="text-red-500">*</span>
            </label>
            {candidate ? (
              <div className="flex items-center justify-between p-3 bg-indigo-50/50 border border-indigo-100 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                    {candidate.full_name?.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">{candidate.full_name}</p>
                    <p className="text-[11px] text-slate-500">{candidate.email} • {candidate.job_title || 'Applicant'}</p>
                  </div>
                </div>
                <span className="text-[11px] font-semibold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                  Current: {candidate.stage}
                </span>
              </div>
            ) : (
              <select
                id="candidate-select"
                value={selectedCandidateId}
                onChange={(e) => setSelectedCandidateId(e.target.value)}
                className="form-select"
                required
              >
                {candidatesList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name} ({c.job_title || 'General'}) — Current: {c.stage}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Stage transition alert notice */}
          {currentCandidate && currentCandidate.stage !== 'Interview' && (
            <div className="flex items-center gap-2 p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg">
              <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
              <span>
                Scheduling will automatically advance candidate status to <strong>Interview</strong> and record in timeline.
              </span>
            </div>
          )}

          {/* Round & Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Interview Type / Round</label>
              <select
                value={interviewType}
                onChange={(e) => setInterviewType(e.target.value)}
                className="form-select"
              >
                {INTERVIEW_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Duration</label>
              <select
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value))}
                className="form-select"
              >
                {DURATIONS.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Date & Time <span className="text-red-500">*</span></label>
              <input
                type="datetime-local"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="form-input"
                required
              />
            </div>
            <div>
              <label className="form-label">Platform / Format</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Google Meet, Zoom, Office Room 3"
                className="form-input"
              />
            </div>
          </div>

          {/* Interviewer details & Meeting link */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Interviewer Name</label>
              <input
                type="text"
                value={interviewerName}
                onChange={(e) => setInterviewerName(e.target.value)}
                className="form-input"
              />
            </div>
            <div>
              <label className="form-label">Meeting URL Link</label>
              <input
                type="url"
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
                placeholder="https://meet.google.com/..."
                className="form-input"
              />
            </div>
          </div>

          {/* Email Invite Checkbox & Customization */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={sendEmail}
                  onChange={(e) => setSendEmail(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                />
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                  <Mail size={14} className="text-indigo-600" />
                  Send Official Invitation Email to Candidate ({currentCandidate?.email || 'Candidate'})
                </div>
              </label>

              {sendEmail && (
                <button
                  type="button"
                  onClick={() => setShowEmailPreview(!showEmailPreview)}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  {showEmailPreview ? 'Hide Email Preview' : 'Customize Email Template'}
                </button>
              )}
            </div>

            {sendEmail && showEmailPreview && (
              <div className="space-y-3 pt-2 border-t border-slate-200 fade-in">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Email Subject Line:
                  </label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="form-input text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Email Body Content:
                  </label>
                  <textarea
                    rows={6}
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    className="form-textarea text-xs font-mono"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Internal Notes */}
          <div>
            <label className="form-label">Internal Recruiter Notes (Optional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Focus on distributed systems and problem-solving skills"
              className="form-input"
            />
          </div>
        </form>

        {/* Footer actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary btn-sm"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="btn-primary btn-sm"
          >
            {loading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Scheduling & Sending…
              </>
            ) : (
              <>
                <Send size={14} />
                Schedule & Dispatch Email
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
