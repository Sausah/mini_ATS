import { useEffect, useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmDialog({ open, title, message, onConfirm, onCancel, confirmLabel = 'Delete', loading = false }) {
  const cancelRef = useRef(null);

  useEffect(() => {
    if (open) {
      cancelRef.current?.focus();
      const handleKey = (e) => { if (e.key === 'Escape') onCancel(); };
      document.addEventListener('keydown', handleKey);
      return () => document.removeEventListener('keydown', handleKey);
    }
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="modal max-w-md">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
              <AlertTriangle size={20} className="text-red-600" aria-hidden="true" />
            </div>
            <div className="flex-1">
              <h2 id="confirm-title" className="text-base font-semibold text-slate-900">{title}</h2>
              <p className="mt-1 text-sm text-slate-500">{message}</p>
            </div>
            <button
              onClick={onCancel}
              className="text-slate-400 hover:text-slate-600 transition-colors"
              aria-label="Close dialog"
            >
              <X size={18} />
            </button>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 rounded-b-2xl border-t border-slate-100">
          <button
            ref={cancelRef}
            onClick={onCancel}
            className="btn-secondary"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="btn-danger"
            disabled={loading}
            id="confirm-delete-btn"
          >
            {loading ? 'Deleting…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
