"use client";

import { useEffect, type ReactNode } from "react";
import { Loader2, X, type LucideIcon } from "lucide-react";
import { NUTRIENT_BADGE, NUTRIENT_LABEL, VERDICT_META, verdictOf } from "@/lib/rotation";
import type { NutrientDemand, PlantFamily, Verdict } from "@/lib/types";
import { classNames } from "@/lib/utils";

/* --------------------------------- modal --------------------------------- */

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open) return null;

  const width = size === "sm" ? "max-w-md" : size === "lg" ? "max-w-3xl" : "max-w-xl";

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-0 sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Tutup dialog"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-bark-950/45 backdrop-blur-[3px]"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={classNames(
          "relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-lift ring-1 ring-bark-200 animate-pop sm:rounded-3xl",
          width,
        )}
      >
        <header className="flex items-start gap-4 border-b border-bark-100 bg-leaf-50/60 px-5 py-4 sm:px-6">
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold text-bark-900 sm:text-lg">{title}</h2>
            {description ? <p className="mt-1 text-xs leading-relaxed text-bark-600 sm:text-sm">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-bark-500 transition hover:bg-white hover:text-bark-900"
            aria-label="Tutup"
          >
            <X className="size-4" aria-hidden />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
        {footer ? (
          <footer className="flex flex-col-reverse gap-2 border-t border-bark-100 bg-bark-50 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
            {footer}
          </footer>
        ) : null}
      </div>
    </div>
  );
}

/* --------------------------------- badges -------------------------------- */

export function Badge({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={classNames("chip", className)}>{children}</span>;
}

export function FamilyTag({ family, compact = false }: { family: PlantFamily; compact?: boolean }) {
  return (
    <span
      className="chip"
      style={{
        color: family.color,
        backgroundColor: `${family.color}14`,
        boxShadow: `inset 0 0 0 1px ${family.color}33`,
      }}
    >
      <span className="size-2 rounded-full" style={{ backgroundColor: family.color }} aria-hidden />
      {compact ? family.name : `${family.name} · ${family.label}`}
    </span>
  );
}

export function DemandTag({ demand }: { demand: NutrientDemand }) {
  return (
    <span className={classNames("chip", NUTRIENT_BADGE[demand])}>
      Hara {NUTRIENT_LABEL[demand]}
    </span>
  );
}

export function VerdictTag({ verdict }: { verdict: Verdict }) {
  const meta = VERDICT_META[verdict];
  return <span className={classNames("chip", meta.badge)}>{meta.label}</span>;
}

export function ScoreBar({ score, className }: { score: number; className?: string }) {
  const verdict: Verdict = verdictOf(score);
  return (
    <div className={classNames("h-2 w-full overflow-hidden rounded-full bg-bark-100", className)}>
      <div
        className={classNames("h-full rounded-full origin-left animate-grow transition-all", VERDICT_META[verdict].bar)}
        style={{ width: `${score}%` }}
      />
    </div>
  );
}

/* --------------------------------- layout -------------------------------- */

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  icon: Icon,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: LucideIcon;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="mb-1 flex items-center gap-1.5 text-[11px] font-bold tracking-[0.14em] text-leaf-700 uppercase">
            {Icon ? <Icon className="size-3.5" aria-hidden /> : null}
            {eyebrow}
          </p>
        ) : null}
        <h2 className="text-lg font-bold text-bark-900 sm:text-xl">{title}</h2>
        {description ? <p className="mt-1 max-w-2xl text-sm leading-relaxed text-bark-600">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "leaf",
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon: LucideIcon;
  tone?: "leaf" | "clay" | "harvest" | "bark";
}) {
  const tones: Record<string, string> = {
    leaf: "bg-leaf-100 text-leaf-700",
    clay: "bg-clay-100 text-clay-700",
    harvest: "bg-harvest-100 text-harvest-700",
    bark: "bg-bark-100 text-bark-700",
  };
  return (
    <div className="card-pad group relative overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lift">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-wide text-bark-500 uppercase">{label}</p>
          <p className="mt-2 font-display text-3xl leading-none font-extrabold text-bark-900 tabular-nums">{value}</p>
        </div>
        <span className={classNames("grid size-10 shrink-0 place-items-center rounded-xl", tones[tone])}>
          <Icon className="size-5" aria-hidden />
        </span>
      </div>
      {hint ? <p className="mt-3 text-xs leading-relaxed text-bark-500">{hint}</p> : null}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-bark-300 bg-bark-50/60 px-6 py-12 text-center">
      <span className="grid size-14 place-items-center rounded-2xl bg-white text-leaf-600 shadow-soft ring-1 ring-bark-200">
        <Icon className="size-6" aria-hidden />
      </span>
      <h3 className="mt-4 text-base font-bold text-bark-900">{title}</h3>
      <p className="mt-1.5 max-w-md text-sm leading-relaxed text-bark-600">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function Spinner({ label = "Memuat…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-10 text-sm text-bark-500" role="status">
      <Loader2 className="size-4 animate-spin text-leaf-600" aria-hidden />
      {label}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="card space-y-3 p-5">
      <div className="skeleton h-4 w-1/3" />
      <div className="skeleton h-8 w-2/3" />
      <div className="skeleton h-3 w-full" />
      <div className="skeleton h-3 w-4/5" />
      <div className="skeleton h-10 w-full" />
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-2xl border border-clay-200 bg-clay-50 p-5 text-sm text-clay-800">
      <p className="font-semibold">Gagal memuat data</p>
      <p className="mt-1 leading-relaxed">{message}</p>
      {onRetry ? (
        <button type="button" className="btn-secondary mt-4" onClick={onRetry}>
          Coba lagi
        </button>
      ) : null}
    </div>
  );
}

/* ---------------------------------- form --------------------------------- */

export function Field({
  label,
  hint,
  error,
  required,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="label">
        {label}
        {required ? <span className="ml-1 text-clay-500">*</span> : null}
      </span>
      {children}
      {error ? (
        <span className="mt-1.5 block text-xs font-medium text-clay-600">{error}</span>
      ) : hint ? (
        <span className="mt-1.5 block text-xs leading-relaxed text-bark-500">{hint}</span>
      ) : null}
    </label>
  );
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  size = "md",
}: {
  options: { value: T; label: string; icon?: LucideIcon }[];
  value: T;
  onChange: (value: T) => void;
  size?: "sm" | "md";
}) {
  return (
    <div className="inline-flex flex-wrap gap-1 rounded-xl bg-bark-100 p-1">
      {options.map((option) => {
        const Icon = option.icon;
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={active}
            className={classNames(
              "inline-flex items-center gap-1.5 rounded-lg font-semibold transition",
              size === "sm" ? "px-2.5 py-1.5 text-xs" : "px-3.5 py-2 text-sm",
              active ? "bg-white text-leaf-800 shadow-soft" : "text-bark-500 hover:text-bark-800",
            )}
          >
            {Icon ? <Icon className="size-3.5" aria-hidden /> : null}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function Callout({
  level = "info",
  title,
  children,
  icon: Icon,
}: {
  level?: "info" | "sukses" | "peringatan" | "bahaya";
  title: string;
  children?: ReactNode;
  icon?: LucideIcon;
}) {
  const styles: Record<string, { box: string; icon: string }> = {
    info: { box: "border-bark-200 bg-bark-50 text-bark-800", icon: "text-bark-500" },
    sukses: { box: "border-leaf-200 bg-leaf-50 text-leaf-900", icon: "text-leaf-600" },
    peringatan: { box: "border-harvest-300 bg-harvest-100/60 text-bark-900", icon: "text-harvest-700" },
    bahaya: { box: "border-clay-300 bg-clay-50 text-clay-900", icon: "text-clay-600" },
  };
  const style = styles[level];
  return (
    <div className={classNames("rounded-2xl border p-4", style.box)}>
      <p className="flex items-start gap-2 text-sm font-bold">
        {Icon ? <Icon className={classNames("mt-0.5 size-4 shrink-0", style.icon)} aria-hidden /> : null}
        {title}
      </p>
      {children ? <div className="mt-2 space-y-1.5 pl-6 text-sm leading-relaxed">{children}</div> : null}
    </div>
  );
}

export function Progress({
  value,
  className,
  barClassName,
}: {
  value: number;
  className?: string;
  barClassName?: string;
}) {
  return (
    <div className={classNames("h-1.5 w-full overflow-hidden rounded-full bg-bark-100", className)}>
      <div
        className={classNames("h-full rounded-full bg-leaf-500 transition-all duration-500", barClassName)}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}
