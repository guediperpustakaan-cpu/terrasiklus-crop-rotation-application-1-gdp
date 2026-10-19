"use client";

import { useState } from "react";
import type { PlantFamily } from "@/lib/types";

function polar(cx: number, cy: number, radius: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
}

function donutSegment(cx: number, cy: number, outer: number, inner: number, startAngle: number, endAngle: number) {
  const startOuter = polar(cx, cy, outer, endAngle);
  const endOuter = polar(cx, cy, outer, startAngle);
  const startInner = polar(cx, cy, inner, startAngle);
  const endInner = polar(cx, cy, inner, endAngle);
  const largeArc = endAngle - startAngle <= 180 ? 0 : 1;
  return [
    `M ${startOuter.x} ${startOuter.y}`,
    `A ${outer} ${outer} 0 ${largeArc} 0 ${endOuter.x} ${endOuter.y}`,
    `L ${startInner.x} ${startInner.y}`,
    `A ${inner} ${inner} 0 ${largeArc} 1 ${endInner.x} ${endInner.y}`,
    "Z",
  ].join(" ");
}

export function RotationWheel({
  families,
  activeFamilyId,
  onSelect,
  size = 380,
  centerTitle = "Siklus Rotasi",
  centerSubtitle,
}: {
  families: PlantFamily[];
  activeFamilyId?: string | null;
  onSelect?: (family: PlantFamily) => void;
  size?: number;
  centerTitle?: string;
  centerSubtitle?: string;
}) {
  const [hovered, setHovered] = useState<PlantFamily | null>(null);
  const list = families.slice(0, 12);
  const cx = size / 2;
  const cy = size / 2;
  const outer = size / 2 - 6;
  const inner = outer * 0.62;
  const slice = 360 / list.length;
  const focus = hovered ?? list.find((family) => family.id === activeFamilyId) ?? null;

  return (
    <div className="relative mx-auto" style={{ width: size, height: size, maxWidth: "100%" }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full" role="img" aria-label="Diagram siklus rotasi famili tanaman">
        <circle cx={cx} cy={cy} r={inner - 12} className="fill-white" />
        {list.map((family, index) => {
          const startAngle = index * slice + 1.4;
          const endAngle = (index + 1) * slice - 1.4;
          const isActive = family.id === activeFamilyId;
          const isHovered = hovered?.id === family.id;
          return (
            <g key={family.id}>
              <path
                d={donutSegment(cx, cy, isHovered || isActive ? outer + 4 : outer, inner, startAngle, endAngle)}
                fill={family.color}
                opacity={focus && focus.id !== family.id ? 0.34 : isActive ? 1 : 0.88}
                className="cursor-pointer transition-all duration-200"
                onMouseEnter={() => setHovered(family)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => onSelect?.(family)}
              />
              {(() => {
                const labelPoint = polar(cx, cy, (outer + inner) / 2, index * slice + slice / 2);
                return (
                  <text
                    x={labelPoint.x}
                    y={labelPoint.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="pointer-events-none select-none fill-white font-mono"
                    style={{ fontSize: size > 320 ? 13 : 10, fontWeight: 700 }}
                  >
                    {index + 1}
                  </text>
                );
              })()}
            </g>
          );
        })}
        <circle cx={cx} cy={cy} r={inner - 12} className="fill-none stroke-bark-200" strokeWidth={1} />
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-10 text-center">
        <p className="font-display text-[15px] leading-tight font-extrabold text-bark-900 sm:text-base">
          {focus ? focus.name : centerTitle}
        </p>
        <p className="mt-1 text-[11.5px] leading-snug font-medium text-bark-600 sm:text-xs">
          {focus ? focus.label : (centerSubtitle ?? "Urutan famili yang diulang tiap musim")}
        </p>
        {focus?.role ? (
          <span
            className="mt-2 rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide uppercase"
            style={{ backgroundColor: `${focus.color}1a`, color: focus.color }}
          >
            {focus.description ? focus.description.split(".")[0] : focus.role}
          </span>
        ) : null}
      </div>
    </div>
  );
}
