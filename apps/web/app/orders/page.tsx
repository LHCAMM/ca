export default async function OrdersPage() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders`, { cache: "no-store" });
  const orders = res.ok ? await res.json() : [];
  return (
    <main className="space-y-3">
      <h1 className="text-xl font-semibold">Orders</h1>
      <div className="glass overflow-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left"><th className="p-2">Order</th><th>Email</th><th>Total</th><th>Status</th><th>Source</th></tr></thead>
          <tbody>
            {orders.map((o: any) => <tr key={o.id} className="border-t border-white/10"><td className="p-2">#{o.order_id}</td><td>{o.customer_email}</td><td>{o.total_amount}</td><td>{o.payment_status}</td><td>{o.source}</td></tr>)}
          </tbody>
        </table>
      </div>
    </main>
  );
}
