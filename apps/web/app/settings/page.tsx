import { getJson } from '../../lib/api';

export default async function SettingsPage() {
  // In a real implementation, this would fetch from /api/settings
  const settings = {
    auto_send_followups: false,
    followup_threshold_minutes: 15,
    payment_match_threshold: 0.85,
    daily_report_time: '08:00',
    daily_report_enabled: true,
  };

  return (
    <div className="container mx-auto px-6 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          Settings
        </h1>
        <p className="text-slate-400 mt-1">Configure Mission Control behavior and thresholds</p>
      </div>

      {/* Follow-up Settings */}
      <section className="glass-card p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-100">Follow-up Automation</h2>
            <p className="text-sm text-slate-400 mt-1">
              Configure automatic follow-up emails for unpaid orders
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Auto-send Toggle */}
          <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg border border-slate-800">
            <div>
              <label className="font-medium text-slate-200">Auto-Send Follow-ups</label>
              <p className="text-sm text-slate-400 mt-1">
                Automatically send follow-up emails (default: OFF for safety)
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`text-sm font-medium ${
                  settings.auto_send_followups ? 'text-emerald-400' : 'text-slate-400'
                }`}
              >
                {settings.auto_send_followups ? 'Enabled' : 'Disabled'}
              </span>
              <button
                className={`
                  relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                  ${settings.auto_send_followups ? 'bg-emerald-600' : 'bg-slate-700'}
                `}
              >
                <span
                  className={`
                    inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                    ${settings.auto_send_followups ? 'translate-x-6' : 'translate-x-1'}
                  `}
                />
              </button>
            </div>
          </div>

          {/* Follow-up Threshold */}
          <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-800">
            <label className="block font-medium text-slate-200 mb-2">
              Follow-up Threshold (minutes)
            </label>
            <p className="text-sm text-slate-400 mb-3">
              Wait this long before sending first follow-up for unpaid orders
            </p>
            <input
              type="number"
              value={settings.followup_threshold_minutes}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
              disabled
            />
          </div>
        </div>
      </section>

      {/* Payment Matching */}
      <section className="glass-card p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-100">Payment Matching</h2>
            <p className="text-sm text-slate-400 mt-1">
              Configure automatic payment-to-order matching behavior
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Confidence Threshold */}
          <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-800">
            <label className="block font-medium text-slate-200 mb-2">
              Auto-Approve Threshold
            </label>
            <p className="text-sm text-slate-400 mb-3">
              Automatically approve matches with confidence score above this value
            </p>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="0.5"
                max="1.0"
                step="0.05"
                value={settings.payment_match_threshold}
                className="flex-1"
                disabled
              />
              <span className="text-xl font-bold text-blue-400">
                {Math.round(settings.payment_match_threshold * 100)}%
              </span>
            </div>
          </div>

          {/* Matching Factors */}
          <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-800">
            <label className="block font-medium text-slate-200 mb-3">Matching Factors</label>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Amount Match</span>
                <span className="text-slate-300 font-medium">40% weight</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Email Match</span>
                <span className="text-slate-300 font-medium">30% weight</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Name Match</span>
                <span className="text-slate-300 font-medium">20% weight</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Order Number in Email</span>
                <span className="text-slate-300 font-medium">10% weight</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Daily Reports */}
      <section className="glass-card p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-100">Daily Reports</h2>
            <p className="text-sm text-slate-400 mt-1">
              Automated daily summary reports via email
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg border border-slate-800">
            <div>
              <label className="font-medium text-slate-200">Enable Daily Reports</label>
              <p className="text-sm text-slate-400 mt-1">
                Send automated daily summary at {settings.daily_report_time} (America/New_York)
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`text-sm font-medium ${
                  settings.daily_report_enabled ? 'text-emerald-400' : 'text-slate-400'
                }`}
              >
                {settings.daily_report_enabled ? 'Enabled' : 'Disabled'}
              </span>
              <button
                className={`
                  relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                  ${settings.daily_report_enabled ? 'bg-emerald-600' : 'bg-slate-700'}
                `}
              >
                <span
                  className={`
                    inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                    ${settings.daily_report_enabled ? 'translate-x-6' : 'translate-x-1'}
                  `}
                />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Info Box */}
      <div className="glass-card p-6 border-blue-500/30">
        <div className="flex items-start gap-3">
          <div className="text-2xl">ℹ️</div>
          <div>
            <h3 className="font-semibold text-slate-200 mb-1">Note on Settings</h3>
            <p className="text-sm text-slate-400">
              Settings modifications are currently view-only. To change these values, update them in
              your .env file and restart the services. A full settings management UI with database
              persistence will be added in a future update.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
