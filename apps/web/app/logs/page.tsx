import { getJson } from '../../lib/api';

export default async function LogsPage() {
  const logs = await getJson('/logs');
  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Audit Logs</h1>
      <div className="space-y-2">
        {logs.map((l: any) => (
          <div key={l.id} className="border border-slate-800 rounded p-2 text-sm">
            <span className="text-slate-400">{new Date(l.createdAt).toLocaleString()} </span>
            <span className="font-semibold">{l.action}</span>
            <pre className="text-xs text-slate-300 overflow-x-auto">{JSON.stringify(l.details, null, 2)}</pre>
          </div>
        ))}
      </div>
    </div>
  );
}
