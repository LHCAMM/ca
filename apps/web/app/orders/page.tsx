import { getJson } from '../../lib/api';

export default async function OrdersPage() {
  const orders = await getJson('/orders');
  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Orders</h1>
      <table className="w-full text-sm">
        <thead><tr className="text-left"><th>#</th><th>Status</th><th>Total</th><th>Customer</th><th>Confirmed</th></tr></thead>
        <tbody>
          {orders.map((o: any) => (
            <tr key={o.id} className="border-t border-slate-800">
              <td>{o.orderNumber}</td><td>{o.status}</td><td>{o.currency} {o.total}</td><td>{o.customerFirstName} {o.customerLastName}</td><td>{o.paymentConfirmed ? 'yes' : 'no'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
