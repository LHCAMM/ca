import { getJson } from '../lib/api';

export default async function Page() {
  const data = await getJson('/overview');

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">ClawBot Mission Control</h1>
      <div className="grid md:grid-cols-5 gap-3">
        <Card title="Processed Revenue" value={`$${data.processedRevenue}`} />
        <Card title="Pending >15m" value={String(data.pendingOver15m)} />
        <Card title="Payments Detected" value={String(data.paymentsDetected)} />
        <Card title="Manual Confirm" value={String(data.manualConfirm)} />
        <Card title="System Health" value={data.statuses?.every((s: any) => s.healthy) ? 'Healthy' : 'Attention'} />
      </div>
      <section>
        <h2 className="font-semibold mb-2">Status badges</h2>
        <div className="flex flex-wrap gap-2">
          {data.statuses?.map((s: any) => (
            <span key={s.id} className={`px-3 py-1 rounded-full text-sm ${s.healthy ? 'bg-emerald-700' : 'bg-rose-700'}`}>
              {s.id}: {s.healthy ? 'ok' : 'error'}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}

function Card({ title, value }: { title: string; value: string }) {
  return <div className="bg-slate-900 border border-slate-800 rounded p-4"><div className="text-sm text-slate-400">{title}</div><div className="text-xl font-semibold">{value}</div></div>;
}
