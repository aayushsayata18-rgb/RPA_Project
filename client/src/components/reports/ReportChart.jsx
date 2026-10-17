import React from 'react';
import { BarChart3, PieChart, Activity } from 'lucide-react';

export const ReportChart = ({
  type = 'BAR',
  data = [],
  title = '',
  height = 200,
  valueKey = 'value',
  labelKey = 'label',
  color = 'indigo'
}) => {
  const maxVal = Math.max(...data.map((d) => d[valueKey] || 0), 1);

  const colorVariants = {
    indigo: 'bg-indigo-600 hover:bg-indigo-700',
    blue: 'bg-blue-600 hover:bg-blue-700',
    emerald: 'bg-emerald-600 hover:bg-emerald-700',
    amber: 'bg-amber-600 hover:bg-amber-700',
    purple: 'bg-purple-600 hover:bg-purple-700'
  };

  const activeColor = colorVariants[color] || colorVariants.indigo;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
          {type === 'BAR' && <BarChart3 className="w-4 h-4 text-indigo-600" />}
          {type === 'DONUT' && <PieChart className="w-4 h-4 text-indigo-600" />}
          {type === 'TREND' && <Activity className="w-4 h-4 text-indigo-600" />}
          {title}
        </h3>
        <span className="text-xs text-gray-400 font-medium">{data.length} periods</span>
      </div>

      {data.length === 0 ? (
        <div className="h-40 flex items-center justify-center text-gray-400 text-xs">
          No chart data available for selected filter range
        </div>
      ) : type === 'BAR' ? (
        <div className="flex items-end gap-3 pt-6 pb-2 px-2" style={{ height: `${height}px` }}>
          {data.map((item, idx) => {
            const val = item[valueKey] || 0;
            const pct = Math.round((val / maxVal) * 100);

            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative h-full justify-end">
                {/* Tooltip on hover */}
                <div className="absolute -top-8 opacity-0 group-hover:opacity-100 bg-gray-900 text-white text-[10px] px-2 py-0.5 rounded shadow pointer-events-none transition z-10 whitespace-nowrap">
                  {item[labelKey]}: {typeof val === 'number' && val >= 1000 ? `₹${val.toLocaleString()}` : val}
                </div>

                {/* Bar */}
                <div
                  style={{ height: `${Math.max(pct, 6)}%` }}
                  className={`w-full rounded-t-md transition-all duration-300 ${activeColor}`}
                />

                {/* X-axis Label */}
                <span className="text-[10px] font-medium text-gray-500 truncate max-w-full block mt-1">
                  {item[labelKey]}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        /* Distribution / Metric list style */
        <div className="space-y-3">
          {data.map((item, idx) => {
            const val = item[valueKey] || 0;
            const pct = Math.round((val / maxVal) * 100);

            return (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs text-gray-700 font-medium">
                  <span>{item[labelKey]}</span>
                  <span className="text-gray-900 font-bold">{val}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${activeColor}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ReportChart;
