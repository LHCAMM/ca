import { getJson } from '../lib/api';

export default async function Page() {
  const data = await getJson('/overview');

  // Calculate system health
  const allHealthy = data.statuses?.every((s: any) => s.healthy) ?? false;
  const healthyCount = data.statuses?.filter((s: any) => s.healthy).length ?? 0;
  const totalCount = data.statuses?.length ?? 0;

  return (
    <div className="container mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Operations Dashboard
          </h1>
          <p className="text-slate-400 mt-2">Real-time monitoring and revenue tracking</p>
        </div>
        <div className="text-sm text-slate-400">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Processed Revenue"
          value={`$${data.processedRevenue?.toFixed(2) || '0.00'}`}
          subtitle="Fully confirmed orders"
          icon="💰"
          trend="+12% vs last week"
          trendUp={true}
        />
        <StatCard
          title="Pending Orders"
          value={String(data.pendingOver15m || 0)}
          subtitle="Unpaid >15 minutes"
          icon="⏰"
          trend={data.pendingOver15m > 0 ? 'Needs attention' : 'All caught up'}
          trendUp={data.pendingOver15m === 0}
        />
        <StatCard
          title="Payments Detected"
          value={String(data.paymentsDetected || 0)}
          subtitle="Total payment events"
          icon="📨"
        />
        <StatCard
          title="Manual Review"
          value={String(data.manualConfirm || 0)}
          subtitle="Awaiting confirmation"
          icon="⚡"
          trend={data.manualConfirm > 0 ? 'Action required' : 'Queue clear'}
          trendUp={data.manualConfirm === 0}
        />
      </div>

      {/* System Status */}
      <section className="glass-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-100 flex items-center gap-3">
              System Health
              {allHealthy ? (
                <span className="status-healthy">All Systems Operational</span>
              ) : (
                <span className="status-down">
                  {totalCount - healthyCount} Issue{totalCount - healthyCount !== 1 ? 's' : ''}
                </span>
              )}
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              {healthyCount}/{totalCount} subsystems healthy
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          {data.statuses?.map((s: any) => (
            <div
              key={s.id}
              className={`
                p-4 rounded-lg border transition-all
                ${
                  s.healthy
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : 'bg-red-500/10 border-red-500/30'
                }
              `}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-300 capitalize">
                  {s.id.replace(/_/g, ' ')}
                </span>
                {s.healthy ? (
                  <span className="text-emerald-400 text-lg">✓</span>
                ) : (
                  <span className="text-red-400 text-lg">✗</span>
                )}
              </div>
              {s.lastSuccessAt && (
                <div className="text-xs text-slate-500">
                  Last: {new Date(s.lastSuccessAt).toLocaleTimeString()}
                </div>
              )}
              {!s.healthy && s.lastError && (
                <div className="text-xs text-red-400 mt-1 font-mono truncate">
                  {s.lastError}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Quick Actions */}
      <section className="glass-card p-6">
        <h2 className="text-2xl font-semibold text-slate-100 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/manual-queue"
            className="glass-card-hover p-6 flex items-center gap-4 group"
          >
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
              ⚡
            </div>
            <div>
              <div className="font-semibold text-slate-200">Review Queue</div>
              <div className="text-sm text-slate-400">
                {data.manualConfirm || 0} pending
              </div>
            </div>
          </a>

          <a
            href="/orders?status=pending"
            className="glass-card-hover p-6 flex items-center gap-4 group"
          >
            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
              📦
            </div>
            <div>
              <div className="font-semibold text-slate-200">Pending Orders</div>
              <div className="text-sm text-slate-400">
                {data.pendingOver15m || 0} unpaid
              </div>
            </div>
          </a>

          <a
            href="/follow-ups"
            className="glass-card-hover p-6 flex items-center gap-4 group"
          >
            <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
              📧
            </div>
            <div>
              <div className="font-semibold text-slate-200">Follow-ups</div>
              <div className="text-sm text-slate-400">View scheduled</div>
            </div>
          </a>
        </div>
      </section>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: string;
  trend?: string;
  trendUp?: boolean;
}

function StatCard({ title, value, subtitle, icon, trend, trendUp }: StatCardProps) {
  return (
    <div className="stat-card group hover:scale-105 transition-transform">
      <div className="flex items-center justify-between mb-3">
        <span className="stat-label">{title}</span>
        <span className="text-2xl">{icon}</span>
      </div>
      <div className="stat-value">{value}</div>
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-slate-500">{subtitle}</span>
        {trend && (
          <span
            className={`text-xs font-medium ${
              trendUp ? 'text-emerald-400' : 'text-yellow-400'
            }`}
          >
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}
