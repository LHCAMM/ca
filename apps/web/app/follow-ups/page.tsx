import { getJson } from '../../lib/api';

export default async function FollowUpsPage() {
  const tasks = await getJson('/followups');
  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Follow-ups</h1>
      <div className="space-y-3">
        {tasks.map((t: any) => (
          <div key={t.id} className="border border-slate-800 rounded p-3">
            <div>Order #{t.order.orderNumber} | Draft: {t.gmailDraftId ?? 'none'}</div>
            <div className="text-slate-300">{t.messageText}</div>
            <div className="text-slate-500 text-xs">Copy text message version available above.</div>
          </div>
        ))}
      </div>
    </div>
  );
}
