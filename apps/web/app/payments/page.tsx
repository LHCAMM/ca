export default async function PaymentsPage() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments`, { cache: "no-store" });
  const items = res.ok ? await res.json() : [];
  return <pre className="glass p-4 text-xs overflow-auto">{JSON.stringify(items, null, 2)}</pre>;
}
