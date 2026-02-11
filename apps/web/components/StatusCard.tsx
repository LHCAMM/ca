export function StatusCard({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="glass p-4">
      <p className="text-xs text-slate-400">{title}</p>
      <p className="text-2xl font-semibold mt-2">{value}</p>
    </div>
  );
}
