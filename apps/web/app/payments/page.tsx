import { getJson } from '../../lib/api';
import { approve, deny } from './actions';

export default async function PaymentsPage() {
  const payments = await getJson('/payments');
  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Payments / Manual Confirm</h1>
      <div className="space-y-3">
        {payments.map((p: any) => (
          <div key={p.id} className="border border-slate-800 rounded p-3 flex justify-between gap-4">
            <div>
              <div>{p.provider} ${p.amount} confidence {p.confidence}</div>
              <div className="text-slate-400 text-sm">Decision: {p.decision} | Order: {p.matchedOrder?.orderNumber ?? 'none'}</div>
            </div>
            {p.decision === 'manual_confirm' && (
              <div className="flex gap-2">
                <form action={approve.bind(null, p.id)}><button className="px-3 py-1 bg-emerald-700 rounded">Approve</button></form>
                <form action={deny.bind(null, p.id)}><button className="px-3 py-1 bg-rose-700 rounded">Deny</button></form>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
