import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export const KPIWidget = ({
  title,
  value,
  subtext,
  icon: Icon,
  trend = null,
  color = 'indigo',
  onClick = null
}) => {
  const colorMap = {
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100'
  };

  return (
    <div
      onClick={onClick}
      className={`p-5 bg-white rounded-xl border border-gray-200 shadow-sm transition hover:shadow-md ${
        onClick ? 'cursor-pointer hover:border-indigo-300' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          {title}
        </span>
        {Icon && (
          <div className={`p-2.5 rounded-lg border ${colorMap[color] || colorMap.indigo}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-bold text-gray-900">{value}</span>
        {trend && (
          <span
            className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${
              trend.direction === 'UP'
                ? 'bg-emerald-100 text-emerald-700'
                : trend.direction === 'DOWN'
                ? 'bg-rose-100 text-rose-700'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            {trend.direction === 'UP' && <TrendingUp className="w-3 h-3 mr-1" />}
            {trend.direction === 'DOWN' && <TrendingDown className="w-3 h-3 mr-1" />}
            {trend.direction === 'FLAT' && <Minus className="w-3 h-3 mr-1" />}
            {trend.changePercent !== undefined ? `${trend.changePercent}%` : trend.label}
          </span>
        )}
      </div>

      {subtext && <p className="mt-1 text-xs text-gray-500">{subtext}</p>}
    </div>
  );
};

export default KPIWidget;
