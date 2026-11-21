import React, { useCallback, useRef, useState } from 'react';
import { Icon } from './icons';
import { Goal } from './types';

export const GOAL_COLORS = ['#2E9D6A', '#3B82C4', '#7C5CE0', '#E39B2D', '#D6458C', '#139C9C', '#D9484D', '#64748B'];

/** CSS colour for a goal: habits always use the theme's "bad" red. */
export const goalColor = (g: Goal) => (g.kind === 'bad' ? 'var(--bad)' : g.color);

/** Lets a component set the --c custom property inline. */
export const cVar = (color: string) => ({ ['--c' as string]: color }) as React.CSSProperties;

export function ProgressBar({ ratio }: { ratio: number }) {
  const pct = Math.round(Math.max(0, Math.min(1, ratio)) * 100);
  return (
    <div className="progress" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <span style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Segmented<T extends string>({
  value, options, onChange, label,
}: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div className="segmented" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" aria-pressed={o.value === value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function NumStepper({
  value, min, max, onChange, label,
}: { value: number; min: number; max: number; onChange: (n: number) => void; label: string }) {
  return (
    <div className="num-stepper">
      <button type="button" className="icon-btn" aria-label={`Fewer ${label}`} disabled={value <= min} onClick={() => onChange(value - 1)}>
        <Icon name="minus" />
      </button>
      <span aria-live="polite">{value}</span>
      <button type="button" className="icon-btn" aria-label={`More ${label}`} disabled={value >= max} onClick={() => onChange(value + 1)}>
        <Icon name="plus" />
      </button>
    </div>
  );
}

export function useWidth<T extends HTMLElement>() {
  const [w, setW] = useState(0);
  const ro = useRef<ResizeObserver | null>(null);
  // Callback ref, so it keeps measuring even if the element is swapped for another one.
  const ref = useCallback((el: T | null) => {
    ro.current?.disconnect();
    if (!el) return;
    setW(el.getBoundingClientRect().width);
    ro.current = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.current.observe(el);
  }, []);
  return [ref, w] as const;
}

/** Bar chart with a zero baseline, so negative days hang below it. */
export function BarChart({ data, height = 150 }: { data: { label: string; value: number; highlight?: boolean }[]; height?: number }) {
  const [ref, w] = useWidth<HTMLDivElement>();
  const top = 16, bottom = 22;
  const plot = height - top - bottom;
  const pos = Math.max(0, ...data.map((d) => d.value));
  const neg = Math.max(0, ...data.map((d) => -d.value));
  const span = pos + neg || 1;
  const zero = top + (plot * pos) / span;
  const slot = data.length ? w / data.length : 0;
  const bw = Math.min(36, slot * 0.62);
  return (
    <div ref={ref}>
      {w > 0 && (
        <svg className="chart" width={w} height={height} role="img"
          aria-label={data.map((d) => `${d.label}: ${d.value}`).join(', ')}>
          <line x1={0} x2={w} y1={zero} y2={zero} stroke="var(--border)" />
          {data.map((d, i) => {
            const h = (plot * Math.abs(d.value)) / span;
            const x = i * slot + (slot - bw) / 2;
            const y = d.value >= 0 ? zero - h : zero;
            const fill = d.value < 0 ? 'var(--bad)' : d.highlight ? 'var(--accent)' : 'var(--good)';
            return (
              <g key={i}>
                {d.value !== 0 && <rect x={x} y={y} width={bw} height={Math.max(h, 2)} rx={5} fill={fill} />}
                {d.value !== 0 && (
                  <text x={x + bw / 2} y={d.value > 0 ? y - 4 : y + h + 12} textAnchor="middle">{d.value}</text>
                )}
                <text x={i * slot + slot / 2} y={height - 4} textAnchor="middle" className={d.highlight ? 'hl' : undefined}>
                  {d.label}
                </text>
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
}
