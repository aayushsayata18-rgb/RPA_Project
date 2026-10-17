import React, { useState } from 'react';
import { Download, FileSpreadsheet, FileText, ChevronDown } from 'lucide-react';

export const ExportMenu = ({ onExport = () => {}, exporting = false, formats = ['CSV', 'PDF'] }) => {
  const [open, setOpen] = useState(false);

  const handleSelect = (format) => {
    setOpen(false);
    onExport(format);
  };

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        disabled={exporting}
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3.5 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition shadow-sm disabled:opacity-50"
      >
        <Download className="w-4 h-4 text-indigo-600" />
        <span>{exporting ? 'Generating Export...' : 'Export'}</span>
        <ChevronDown className="w-4 h-4 text-gray-400" />
      </button>

      {open && (
        <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-xl shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20 divide-y divide-gray-100">
          <div className="p-1">
            {formats.includes('CSV') && (
              <button
                type="button"
                onClick={() => handleSelect('CSV')}
                className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg flex items-center gap-2 transition"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                Export as CSV (.csv)
              </button>
            )}
            {formats.includes('XLSX') && (
              <button
                type="button"
                onClick={() => handleSelect('XLSX')}
                className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg flex items-center gap-2 transition"
              >
                <FileSpreadsheet className="w-4 h-4 text-green-600" />
                Export as Excel (.xlsx)
              </button>
            )}
            {formats.includes('PDF') && (
              <button
                type="button"
                onClick={() => handleSelect('PDF')}
                className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg flex items-center gap-2 transition"
              >
                <FileText className="w-4 h-4 text-rose-600" />
                Export as PDF (.pdf)
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExportMenu;
