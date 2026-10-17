import React, { useState } from 'react';
import { Filter, Calendar, RotateCcw, Check } from 'lucide-react';

export const ReportFilterPanel = ({
  filters = {},
  availableFilters = [],
  onApply = () => {},
  onReset = () => {}
}) => {
  const [localFilters, setLocalFilters] = useState(filters);

  const PERIOD_OPTIONS = [
    { value: 'TODAY', label: 'Today' },
    { value: 'YESTERDAY', label: 'Yesterday' },
    { value: 'THIS_WEEK', label: 'This Week' },
    { value: 'LAST_WEEK', label: 'Last Week' },
    { value: 'THIS_MONTH', label: 'This Month' },
    { value: 'LAST_MONTH', label: 'Last Month' },
    { value: 'THIS_YEAR', label: 'This Year' },
    { value: 'CUSTOM', label: 'Custom Range' }
  ];

  const handleChange = (field, val) => {
    setLocalFilters((prev) => ({
      ...prev,
      [field]: val
    }));
  };

  const handleApply = (e) => {
    e.preventDefault();
    onApply(localFilters);
  };

  const handleReset = () => {
    const defaultState = { period: 'THIS_MONTH' };
    setLocalFilters(defaultState);
    onReset(defaultState);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
          <Filter className="w-4 h-4 text-indigo-600" />
          Filter Report Parameters
        </h3>
        <button
          type="button"
          onClick={handleReset}
          className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Filters
        </button>
      </div>

      <form onSubmit={handleApply} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
        {/* Preset Period */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Reporting Period</label>
          <div className="relative">
            <select
              value={localFilters.period || 'THIS_MONTH'}
              onChange={(e) => handleChange('period', e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {PERIOD_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Date From (if custom) */}
        {localFilters.period === 'CUSTOM' && (
          <>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Date From</label>
              <input
                type="date"
                value={localFilters.dateFrom || ''}
                onChange={(e) => handleChange('dateFrom', e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Date To</label>
              <input
                type="date"
                value={localFilters.dateTo || ''}
                onChange={(e) => handleChange('dateTo', e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </>
        )}

        {/* Dynamic filters from report definition if provided */}
        {availableFilters.map((f) => (
          <div key={f.field}>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {f.label || f.field}
            </label>
            {f.allowedValues && f.allowedValues.length > 0 ? (
              <select
                value={localFilters[f.field] || ''}
                onChange={(e) => handleChange(f.field, e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All {f.label || f.field}</option>
                {f.allowedValues.map((val) => (
                  <option key={val} value={val}>
                    {val}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                placeholder={`Filter by ${f.field}...`}
                value={localFilters[f.field] || ''}
                onChange={(e) => handleChange(f.field, e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            )}
          </div>
        ))}

        {/* Apply Action Button */}
        <div className="sm:col-span-2 lg:col-span-4 flex justify-end gap-2 pt-2">
          <button
            type="submit"
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition shadow-sm"
          >
            <Check className="w-4 h-4" />
            Apply Filters
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReportFilterPanel;
