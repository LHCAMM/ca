import Link from 'next/link';

const links = [
  ['Overview', '/'],
  ['Orders', '/orders'],
  ['Payments', '/payments'],
  ['Follow-ups', '/follow-ups'],
  ['Logs', '/logs']
];

export function Nav() {
  return (
    <nav className="flex gap-2 p-4 border-b border-slate-800 sticky top-0 bg-slate-950 z-10">
      {links.map(([label, href]) => (
        <Link key={href} href={href} className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700">
          {label}
        </Link>
      ))}
    </nav>
  );
}
