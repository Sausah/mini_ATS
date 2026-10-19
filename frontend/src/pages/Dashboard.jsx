import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, Briefcase, TrendingUp, CheckCircle2, XCircle,
  Clock, FileCheck, Award, Activity, Loader2, Calendar
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, CartesianGrid, Legend
} from 'recharts';
import MetricCard from '../components/MetricCard';
import StatusBadge from '../components/StatusBadge';
import { getDashboard } from '../api/dashboard';

const STAGE_COLORS = {
  Applied: '#94a3b8',
  Screening: '#3b82f6',
  Interview: '#f59e0b',
  Offer: '#a855f7',
  Hired: '#10b981',
  Rejected: '#ef4444',
};

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getDashboard();
        setData(res.data);
      } catch (err) {
        setError(err.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <Loader2 size={32} className="animate-spin text-indigo-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 text-slate-400">
        <XCircle size={48} className="text-red-300 mb-3" />
        <p className="font-medium text-slate-600">Failed to load dashboard</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  const { metrics, stage_distribution, apps_over_time, recent_activity, source_distribution } = data;

  const pieData = stage_distribution.filter(s => s.count > 0).map(s => ({
    name: s.stage,
    value: s.count,
    color: STAGE_COLORS[s.stage],
  }));

  return (
    <div className="p-6 space-y-6 fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Recruitment Overview</h2>
          <p className="text-sm text-slate-500 mt-1">Live metrics from your database</p>
        </div>

        <Link
          to="/calendar"
          className="btn-secondary btn-sm flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Calendar size={14} className="text-indigo-600" />
          View Interview Calendar
        </Link>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Candidates"
          value={metrics.total_candidates}
          icon={Users}
          iconColor="text-indigo-500"
          bgColor="bg-indigo-50"
          description="All time"
        />
        <MetricCard
          title="Active Applications"
          value={metrics.active_applications}
          icon={Activity}
          iconColor="text-blue-500"
          bgColor="bg-blue-50"
          description="Not hired or rejected"
        />
        <MetricCard
          title="In Interview"
          value={metrics.in_interview}
          icon={Clock}
          iconColor="text-amber-500"
          bgColor="bg-amber-50"
          description="Currently interviewing"
        />
        <MetricCard
          title="Total Hires"
          value={metrics.total_hires}
          icon={CheckCircle2}
          iconColor="text-emerald-500"
          bgColor="bg-emerald-50"
          description="Hired stage"
        />
        <MetricCard
          title="In Screening"
          value={metrics.in_screening}
          icon={FileCheck}
          iconColor="text-cyan-500"
          bgColor="bg-cyan-50"
        />
        <MetricCard
          title="Offers Made"
          value={metrics.offers_made}
          icon={Award}
          iconColor="text-purple-500"
          bgColor="bg-purple-50"
        />
        <MetricCard
          title="Rejections"
          value={metrics.total_rejections}
          icon={XCircle}
          iconColor="text-red-400"
          bgColor="bg-red-50"
        />
        <MetricCard
          title="Open Jobs"
          value={metrics.open_jobs}
          icon={Briefcase}
          iconColor="text-slate-500"
          bgColor="bg-slate-100"
          description={`of ${metrics.total_jobs} total`}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline Funnel - Bar Chart */}
        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold text-slate-900">Pipeline by Stage</h3>
          </div>
          <div className="card-body">
            {metrics.total_candidates === 0 ? (
              <div className="flex items-center justify-center h-40 text-slate-400 text-sm">
                No data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={stage_distribution} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="stage" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
                    cursor={{ fill: '#f8fafc' }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {stage_distribution.map((entry) => (
                      <Cell key={entry.stage} fill={STAGE_COLORS[entry.stage] || '#6366f1'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Applications Over Time */}
        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold text-slate-900">Applications (Last 30 Days)</h3>
          </div>
          <div className="card-body">
            {apps_over_time.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-slate-400 text-sm">
                No applications in the last 30 days
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={apps_over_time} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    tickFormatter={(d) => new Date(d).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
                    labelFormatter={(d) => new Date(d).toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' })}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#6366f1"
                    strokeWidth={2}
                    dot={{ fill: '#6366f1', r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Source Distribution */}
        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold text-slate-900">Application Sources</h3>
          </div>
          <div className="card-body">
            {source_distribution.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-slate-400 text-sm">No data</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={source_distribution}
                    dataKey="value"
                    nameKey="source"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={45}
                    paddingAngle={3}
                  >
                    {source_distribution.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#a855f7', '#ef4444'][i % 6]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
                    formatter={(v, n) => [v, n]}
                  />
                  <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold text-slate-900">Recent Activity</h3>
          </div>
          <div className="card-body p-0">
            {recent_activity.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-slate-400 text-sm">
                No recent activity
              </div>
            ) : (
              <ul className="divide-y divide-slate-100" role="list" aria-label="Recent stage changes">
                {recent_activity.slice(0, 7).map((a) => (
                  <li key={a.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="w-8 h-8 bg-indigo-50 rounded-full flex items-center justify-center flex-shrink-0">
                      <Activity size={14} className="text-indigo-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{a.candidate_name}</p>
                      <p className="text-xs text-slate-400">
                        {a.previous_stage ? `${a.previous_stage} → ` : 'Applied as '}
                        <StatusBadge stage={a.new_stage} />
                      </p>
                    </div>
                    <time className="text-xs text-slate-400 whitespace-nowrap">
                      {formatDate(a.changed_at)}
                    </time>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
