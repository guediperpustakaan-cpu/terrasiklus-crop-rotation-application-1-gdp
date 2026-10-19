"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  BookOpen,
  Database,
  LayoutDashboard,
  Leaf,
  Menu,
  NotebookPen,
  Sprout,
  X,
} from "lucide-react";
import { classNames } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Dasbor", icon: LayoutDashboard },
  { href: "/kebun", label: "Kebun & Petak", icon: Sprout },
  { href: "/riwayat", label: "Riwayat Tanam", icon: NotebookPen },
  { href: "/katalog", label: "Katalog Tanaman", icon: Leaf },
  { href: "/panduan", label: "Panduan Rotasi", icon: BookOpen },
];

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="group flex items-center gap-2.5" aria-label="TerraSiklus beranda">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-leaf-700 text-white shadow-[0_10px_20px_-12px_rgba(24,61,36,1)] transition group-hover:bg-leaf-600">
        <Leaf className="size-5" aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block font-display text-[17px] leading-none font-extrabold tracking-tight text-bark-900">
          Terra<span className="text-leaf-700">Siklus</span>
        </span>
        {compact ? null : (
          <span className="mt-1 block text-[10.5px] leading-none font-semibold tracking-[0.12em] text-bark-500 uppercase">
            Rotasi & Tanah
          </span>
        )}
      </span>
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="min-h-screen bg-paper lg:pl-72">
      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-72 flex-col border-r border-bark-200/80 bg-white lg:flex">
        <div className="border-b border-bark-100 px-5 py-5">
          <Brand />
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5" aria-label="Navigasi utama">
          <p className="px-3 pb-2 text-[10.5px] font-bold tracking-[0.16em] text-bark-400 uppercase">Menu</p>
          {NAV.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={classNames("nav-link", isActive(item.href) && "nav-link-active")}
                aria-current={isActive(item.href) ? "page" : undefined}
              >
                <Icon className="size-4.5 shrink-0" aria-hidden />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-bark-100 p-4">
          <div className="rounded-2xl bg-leaf-50 p-4 ring-1 ring-leaf-100">
            <p className="flex items-center gap-2 text-xs font-bold text-leaf-800">
              <Database className="size-3.5" aria-hidden />
              Neon PostgreSQL
            </p>
            <p className="mt-1.5 text-[11px] leading-relaxed text-leaf-800/70">
              Data kebun, riwayat tanam, dan hasil uji tanah tersimpan permanen.
            </p>
          </div>
          <div className="mt-4 flex items-center gap-2.5 px-1">
            <span className="grid size-8 place-items-center rounded-full bg-bark-800 text-[11px] font-bold text-white">
              PD
            </span>
            <span className="min-w-0">
              <span className="block truncate text-xs font-bold text-bark-800">Petani Demo</span>
              <span className="block truncate text-[11px] text-bark-500">petani-demo</span>
            </span>
          </div>
        </div>
      </aside>

      {/* Topbar mobile */}
      <header className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-bark-200/80 bg-paper/90 px-4 py-3 backdrop-blur-md lg:hidden">
        <Brand compact />
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          className="rounded-xl border border-bark-200 bg-white p-2 text-bark-700 shadow-soft transition hover:text-leaf-700"
          aria-label={menuOpen ? "Tutup menu" : "Buka menu"}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
        </button>
      </header>

      {menuOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Tutup menu"
            className="absolute inset-0 cursor-default bg-bark-950/40 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
          />
          <nav className="absolute inset-x-3 top-16 space-y-1 rounded-2xl bg-white p-3 shadow-lift ring-1 ring-bark-200 animate-pop">
            {NAV.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={classNames("nav-link", isActive(item.href) && "nav-link-active")}
                >
                  <Icon className="size-4.5 shrink-0" aria-hidden />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      ) : null}

      <main className="mx-auto w-full max-w-7xl px-4 pt-5 pb-28 sm:px-6 lg:px-10 lg:pt-8 lg:pb-14">{children}</main>

      {/* Navigasi bawah mobile */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-bark-200 bg-white/95 backdrop-blur-md lg:hidden"
        aria-label="Navigasi cepat"
      >
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={classNames(
                "flex flex-col items-center gap-1 px-1 py-2.5 text-[10px] font-semibold transition",
                active ? "text-leaf-700" : "text-bark-500",
              )}
              aria-current={active ? "page" : undefined}
            >
              <span
                className={classNames(
                  "grid size-8 place-items-center rounded-xl transition",
                  active ? "bg-leaf-100" : "bg-transparent",
                )}
              >
                <Icon className="size-4.5" aria-hidden />
              </span>
              <span className="truncate">{item.label.split(" ")[0]}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between animate-fade-up">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="mb-1.5 text-[11px] font-bold tracking-[0.16em] text-leaf-700 uppercase">{eyebrow}</p>
        ) : null}
        <h1 className="font-display text-2xl leading-tight font-extrabold text-bark-900 sm:text-[32px]">{title}</h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-bark-600 sm:text-[15px]">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}
