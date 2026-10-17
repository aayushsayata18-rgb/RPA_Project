import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Search, FileText } from 'lucide-react';

export const ReportTable = ({
  columns = [],
  data = [],
  title = '',
  loading = false,
  pageSize = 10,
  emptyMessage = 'No records found matching current criteria.'
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState(null);
  const [sortAsc, setSortAsc] = useState(true);

  // Filtered and sorted dataset
  const processedData = useMemo(() => {
    let result = [...data];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter((row) =>
        Object.values(row).some(
          (val) => val !== null && val !== undefined && String(val).toLowerCase().includes(term)
        )
      );
    }

    if (sortField) {
      result.sort((a, b) => {
        const valA = a[sortField] !== undefined && a[sortField] !== null ? a[sortField] : '';
        const valB = b[sortField] !== undefined && b[sortField] !== null ? b[sortField] : '';
        if (valA < valB) return sortAsc ? -1 : 1;
        if (valA > valB) return sortAsc ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [data, searchTerm, sortField, sortAsc]);

  const totalPages = Math.ceil(processedData.length / pageSize) || 1;
  const currentRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedData.slice(start, start + pageSize);
  }, [processedData, currentPage, pageSize]);

  const handleSort = (key) => {
    if (sortField === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(key);
      setSortAsc(true);
    }
    setCurrentPage(1);
  };

  const activeColumns = columns.length > 0
    ? columns
    : data.length > 0
    ? Object.keys(data[0]).map((k) => ({ key: k, label: k }))
    : [];

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Table Header Controls */}
      <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50/50">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-600" />
          <h3 className="font-semibold text-gray-900">{title || 'Report Records'}</h3>
          <span className="text-xs font-medium px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">
            {processedData.length} records
          </span>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search within report..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Table View */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-50 text-xs uppercase text-gray-700 font-semibold border-b border-gray-200">
            <tr>
              {activeColumns.map((col) => {
                const key = typeof col === 'string' ? col : col.key;
                const label = typeof col === 'string' ? col : col.label || col.key;
                const isSorted = sortField === key;

                return (
                  <th
                    key={key}
                    onClick={() => handleSort(key)}
                    className="px-4 py-3 cursor-pointer hover:bg-gray-100 select-none transition"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{label}</span>
                      {isSorted ? (
                        sortAsc ? (
                          <ChevronUp className="w-4 h-4 text-indigo-600" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-indigo-600" />
                        )
                      ) : (
                        <span className="w-4 h-4 opacity-0 hover:opacity-50">↕</span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={activeColumns.length} className="px-4 py-8 text-center text-gray-400">
                  <div className="flex justify-center items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
                    <span>Loading report records...</span>
                  </div>
                </td>
              </tr>
            ) : currentRows.length === 0 ? (
              <tr>
                <td colSpan={activeColumns.length} className="px-4 py-8 text-center text-gray-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              currentRows.map((row, idx) => (
                <tr key={idx} className="hover:bg-indigo-50/30 transition">
                  {activeColumns.map((col) => {
                    const key = typeof col === 'string' ? col : col.key;
                    const val = row[key];
                    return (
                      <td key={key} className="px-4 py-3 whitespace-nowrap text-gray-800">
                        {val !== null && val !== undefined ? String(val) : '—'}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {!loading && processedData.length > pageSize && (
        <div className="p-3 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500 bg-gray-50/50">
          <span>
            Showing {(currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, processedData.length)} of {processedData.length} records
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 py-1 font-medium text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1.5 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportTable;
