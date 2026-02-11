import Link from "next/link";

const items = [
  ["Overview", "/"],
  ["Orders", "/orders"],
  ["Payments", "/payments"],
  ["Follow Ups", "/follow-ups"],
  ["Manual Queue", "/manual-queue"],
  ["Settings", "/settings"],
  ["Logs", "/logs"]
];

export function Nav() {
  return (
    <nav className="glass p-3 flex flex-wrap gap-2">
      {items.map(([label, href]) => (
        <Link key={href} href={href} className="px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-700 text-sm">
          {label}
        </Link>
      ))}
    </nav>
  );
}
