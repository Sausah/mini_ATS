import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

export function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  const icons = {
    success: <CheckCircle2 size={18} />,
    error: <XCircle size={18} />,
    info: <Info size={18} />,
  };

  const cls = {
    success: 'toast-success',
    error: 'toast-error',
    info: 'toast-info',
  };

  return (
    <div className={cls[type] || 'toast-info'} role="alert" aria-live="polite">
      {icons[type]}
      <span className="flex-1">{message}</span>
      <button onClick={onClose} className="opacity-75 hover:opacity-100 transition-opacity" aria-label="Dismiss">
        <X size={16} />
      </button>
    </div>
  );
}

export function useToast() {
  const [toast, setToast] = useState(null);

  const show = (message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
  };

  const hide = () => setToast(null);

  const ToastContainer = () =>
    toast ? <Toast key={toast.id} message={toast.message} type={toast.type} onClose={hide} /> : null;

  return { show, ToastContainer };
}
