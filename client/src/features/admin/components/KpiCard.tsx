import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  colorClass?: string;
  bgClass?: string;
  iconColorClass?: string;
  breakdown?: { label: string; value: string | number }[];
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  icon: Icon,
  colorClass = 'text-gray-900',
  bgClass = 'bg-white',
  iconColorClass = 'bg-brand-accent/10 text-brand-accent',
  breakdown,
}) => {
  return (
    <div className={`p-6 rounded-2xl border border-gray-100 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 ${bgClass}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-brand-text font-semibold uppercase tracking-wider">{title}</p>
          <h3 className={`text-2xl font-black mt-1 ${colorClass}`}>{value}</h3>
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconColorClass}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      
      {breakdown && breakdown.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-50 flex items-center gap-4 text-[10px] md:text-xs text-brand-text font-bold">
          {breakdown.map((item, idx) => (
            <div key={idx} className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-text/30" />
              <span>{item.label}:</span>
              <span className="text-gray-900">{item.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
export default KpiCard;
