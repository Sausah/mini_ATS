import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6">
      <div className="text-center max-w-md">
        <div className="text-8xl font-black text-indigo-100 mb-2">404</div>
        <h1 className="text-2xl font-bold text-slate-900 mb-3">Page Not Found</h1>
        <p className="text-slate-500 mb-6">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => window.history.back()} className="btn-secondary">
            <ArrowLeft size={15} />
            Go Back
          </button>
          <Link to="/dashboard" className="btn-primary">
            <Home size={15} />
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
