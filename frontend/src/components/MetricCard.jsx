export default function MetricCard({ title, value, icon: Icon, iconColor = 'text-indigo-500', bgColor = 'bg-indigo-50', description }) {
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-slate-500 font-medium">{title}</p>
          <p className="mt-1 text-3xl font-bold text-slate-900">{value ?? '—'}</p>
          {description && (
            <p className="mt-1 text-xs text-slate-400">{description}</p>
          )}
        </div>
        {Icon && (
          <div className={`w-11 h-11 rounded-xl ${bgColor} flex items-center justify-center flex-shrink-0`}>
            <Icon size={22} className={iconColor} aria-hidden="true" />
          </div>
        )}
      </div>
    </div>
  );
}
