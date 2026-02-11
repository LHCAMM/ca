export default async function LogsPage() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/logs`, { cache: "no-store" });
  const logs = res.ok ? await res.json() : [];
  return <pre className="glass p-4 text-xs overflow-auto">{JSON.stringify(logs, null, 2)}</pre>;
}
