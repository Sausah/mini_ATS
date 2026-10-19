const STAGE_CONFIG = {
  Applied:   { cls: 'badge-applied',   dot: 'bg-slate-500' },
  Screening: { cls: 'badge-screening', dot: 'bg-blue-500' },
  Interview: { cls: 'badge-interview', dot: 'bg-amber-500' },
  Offer:     { cls: 'badge-offer',     dot: 'bg-purple-500' },
  Hired:     { cls: 'badge-hired',     dot: 'bg-emerald-500' },
  Rejected:  { cls: 'badge-rejected',  dot: 'bg-red-500' },
};

export default function StatusBadge({ stage }) {
  const config = STAGE_CONFIG[stage] || { cls: 'badge bg-slate-100 text-slate-700', dot: 'bg-slate-400' };
  return (
    <span className={config.cls} role="status" aria-label={`Stage: ${stage}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} aria-hidden="true" />
      {stage}
    </span>
  );
}
