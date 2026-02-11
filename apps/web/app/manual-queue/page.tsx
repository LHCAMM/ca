import { getJson } from '../../lib/api';

export default async function ManualQueuePage() {
  // Get pending payment events that need manual review
  const payments = await getJson('/payments?decision=manual_confirm');

  return (
    <div className="container mx-auto px-6 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Manual Action Queue
          </h1>
          <p className="text-slate-400 mt-1">
            Review and approve payment matches that need manual confirmation
          </p>
        </div>
        <div className="stat-card">
          <div className="stat-label">Pending Review</div>
          <div className="stat-value text-2xl">{payments?.length || 0}</div>
        </div>
      </div>

      {/* Queue Items */}
      <div className="space-y-4">
        {payments && payments.length > 0 ? (
          payments.map((payment: any) => (
            <div key={payment.id} className="glass-card p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-semibold">
                      {payment.provider.toUpperCase()} Payment
                    </span>
                    <span className="status-badge bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                      {Math.round((payment.confidence || 0) * 100)}% confidence
                    </span>
                  </div>
                  <p className="text-sm text-slate-400">
                    Detected {new Date(payment.detectedAt).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-emerald-400">
                    {payment.currency} {payment.amount}
                  </div>
                </div>
              </div>

              {/* Payment Details */}
              <div className="grid md:grid-cols-2 gap-4 pt-4 border-t border-slate-800">
                <div>
                  <h3 className="text-sm font-semibold text-slate-300 mb-2">Payment Info</h3>
                  <div className="space-y-1 text-sm">
                    {payment.payerEmail && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Email:</span>
                        <span className="text-slate-200">{payment.payerEmail}</span>
                      </div>
                    )}
                    {payment.payerName && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Name:</span>
                        <span className="text-slate-200">{payment.payerName}</span>
                      </div>
                    )}
                    {payment.matchMethod && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Match Method:</span>
                        <span className="text-slate-200 font-mono text-xs">
                          {payment.matchMethod}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {payment.matchedOrder && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-300 mb-2">
                      Matched Order
                    </h3>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Order #:</span>
                        <span className="text-slate-200 font-semibold">
                          {payment.matchedOrder.orderNumber}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Customer:</span>
                        <span className="text-slate-200">
                          {payment.matchedOrder.customerFirstName}{' '}
                          {payment.matchedOrder.customerLastName}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Order Total:</span>
                        <span className="text-slate-200">
                          {payment.matchedOrder.currency} {payment.matchedOrder.total}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Status:</span>
                        <span className="px-2 py-0.5 rounded text-xs bg-slate-800 text-slate-300">
                          {payment.matchedOrder.status}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Email Snippet */}
              {payment.rawSnippet && (
                <div className="pt-4 border-t border-slate-800">
                  <h3 className="text-sm font-semibold text-slate-300 mb-2">Email Preview</h3>
                  <div className="bg-slate-950/50 rounded-lg p-3 text-sm text-slate-400 font-mono">
                    {payment.rawSnippet}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="pt-4 border-t border-slate-800 flex gap-3">
                <form action={`/payments/${payment.id}/approve`} method="POST" className="flex-1">
                  <button type="submit" className="btn-success w-full">
                    ✓ Approve & Process Order
                  </button>
                </form>
                <form action={`/payments/${payment.id}/deny`} method="POST" className="flex-1">
                  <button type="submit" className="btn-danger w-full">
                    ✗ Reject Match
                  </button>
                </form>
              </div>
            </div>
          ))
        ) : (
          <div className="glass-card p-12 text-center">
            <div className="text-6xl mb-4">✓</div>
            <h2 className="text-2xl font-semibold mb-2">All Caught Up!</h2>
            <p className="text-slate-400">No payments need manual review right now.</p>
          </div>
        )}
      </div>
    </div>
  );
}
