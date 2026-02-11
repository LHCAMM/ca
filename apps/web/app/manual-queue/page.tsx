export default async function ManualQueuePage() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/manual-queue`, { cache: "no-store" });
  const queue = res.ok ? await res.json() : [];
  return <pre className="glass p-4 text-xs overflow-auto">{JSON.stringify(queue, null, 2)}</pre>;
}
