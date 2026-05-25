import { ReactNode } from 'react';

interface CardProps {
  title?: ReactNode;
  subtitle?: ReactNode;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Card({ title, subtitle, right, children, className = '' }: CardProps) {
  return (
    <div
      className={`rounded-xl border border-border bg-panel shadow-[0_1px_0_rgba(255,255,255,0.04)_inset] ${className}`}
    >
      {(title || right) && (
        <div className="flex items-start justify-between border-b border-border px-4 py-3">
          <div>
            {title && <div className="text-sm font-semibold text-text">{title}</div>}
            {subtitle && <div className="mt-0.5 text-xs text-muted">{subtitle}</div>}
          </div>
          {right}
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}
