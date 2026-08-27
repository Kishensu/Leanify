"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/library", label: "Process library" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/lss-expert", label: "LSS expert" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-56 shrink-0 flex-col border-r border-ink-100 bg-white">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-teal-500 font-mono text-xs font-bold text-white">
          L
        </div>
        <span className="text-sm font-semibold tracking-tight text-ink-900">Leanify</span>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 px-3">
        {NAV.map((item) => {
          const active = pathname === item.href || pathname?.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-teal-50 text-teal-700"
                  : "text-ink-600 hover:bg-ink-50 hover:text-ink-900"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 pb-4">
        <Link
          href="/add-process"
          className="block rounded-md bg-teal-500 px-3 py-2 text-center text-sm font-medium text-white transition-colors hover:bg-teal-600"
        >
          + Add process
        </Link>
      </div>
    </aside>
  );
}
