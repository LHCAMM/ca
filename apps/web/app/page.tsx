import { StatusCard } from "../components/StatusCard";

async function getOverview() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/overview`, { cache: "no-store" });
  return res.ok ? res.json() : {};
}

async function getStatus() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/status`, { cache: "no-store" });
  return res.ok ? res.json() : {};
}

export default async function OverviewPage() {
  const overview = await getOverview();
  const status = await getStatus();
  return (
    <main className="space-y-4">
      <h1 className="text-2xl font-bold">Mission Control Overview</h1>
      <div className="grid md:grid-cols-3 gap-3">
        <StatusCard title="Live Revenue (Processed Only)" value={`$${Number(overview.today_revenue ?? 0).toFixed(2)}`} />
        <StatusCard title="Processed Orders" value={overview.processed_orders ?? 0} />
        <StatusCard title="Unpaid >15m" value={overview.unpaid_over_15 ?? 0} />
        <StatusCard title="Matched Payments (24h)" value={overview.matched_payments_24h ?? 0} />
        <StatusCard title="7 Day Revenue" value={`$${Number(overview.seven_day_revenue ?? 0).toFixed(2)}`} />
        <StatusCard title="MTD Revenue" value={`$${Number(overview.month_revenue ?? 0).toFixed(2)}`} />
      </div>
      <pre className="glass p-4 text-xs overflow-auto">{JSON.stringify(status, null, 2)}</pre>
    </main>
  );
}
