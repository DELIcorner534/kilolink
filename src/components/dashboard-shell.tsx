"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const dashboardLinks = [
  { href: "/dashboard", label: "Vue globale" },
  { href: "/publish-trip", label: "Publier trajet" },
  { href: "/booking/new", label: "Reserver espace" },
  { href: "/messages", label: "Messagerie" },
];

type DashboardShellProps = {
  title: string;
  children: ReactNode;
};

export function DashboardShell({ title, children }: DashboardShellProps) {
  const pathname = usePathname();

  return (
    <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[220px_1fr]">
      <aside className="h-fit rounded-3xl border border-slate-200/80 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
        <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">Navigation</p>
        <nav className="space-y-2">
          {dashboardLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`block rounded-xl px-3 py-2 text-sm font-medium transition ${
                pathname === link.href
                  ? "bg-[#0b1f4d] !text-white shadow-sm"
                  : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.06)] md:p-8">
        <h1 className="mb-6 font-display text-3xl font-semibold tracking-tight text-slate-900">{title}</h1>
        {children}
      </main>
    </div>
  );
}
