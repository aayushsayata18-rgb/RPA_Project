import React, { useState, useEffect } from 'react';
import {
  PackageCheck,
  Search,
  Filter,
  Receipt,
  Printer,
  Calendar,
  X,
  RefreshCw,
  Eye,
  ArrowRight
} from 'lucide-react';
import pharmacyService from '../../../services/pharmacyService';
import { useAuth } from '../../../context/AuthContext';

export const DispensingHistoryPage = () => {
  const { user } = useAuth();

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecord, setSelectedRecord] = useState(null);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await pharmacyService.getDispensingRecords({ limit: 50 });
      if (res.data?.records) {
        setRecords(res.data.records);
      }
    } catch (err) {
      console.error('Failed to load dispensing records:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const filteredRecords = records.filter((r) => {
    if (!searchTerm.trim()) return true;
    const s = searchTerm.toLowerCase();
    return (
      r.dispensingRecordId.toLowerCase().includes(s) ||
      r.pharmacyOrderId?.toLowerCase().includes(s) ||
      r.patientName?.toLowerCase().includes(s) ||
      r.patientId?.toLowerCase().includes(s)
    );
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <PackageCheck className="w-6 h-6 text-indigo-600" />
            <h1 className="text-2xl font-bold text-slate-900">Dispensing Audit History</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Historical audit logs of all dispensed prescriptions, batches, billing charges, and pharmacist sign-offs.
          </p>
        </div>

        <button
          onClick={fetchRecords}
          className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh History
        </button>
      </div>

      {/* Search Bar */}
      <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search record ID, order ID, patient..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="text-xs text-slate-500 font-medium">
          Showing {filteredRecords.length} records
        </div>
      </div>

      {/* Records Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-100 text-xs text-slate-700 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Record ID</th>
                <th className="py-3 px-4">Order & Rx</th>
                <th className="py-3 px-4">Patient</th>
                <th className="py-3 px-4">Pharmacist</th>
                <th className="py-3 px-4">Dispensed Date</th>
                <th className="py-3 px-4">Total Billed</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                    Loading dispensing history...
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    No dispensing records found.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec) => (
                  <tr key={rec.dispensingRecordId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-slate-900">{rec.dispensingRecordId}</td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">{rec.pharmacyOrderId}</div>
                      <div className="text-[10px] text-slate-400 font-mono">Rx: {rec.prescriptionId}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{rec.patientName}</div>
                      <div className="text-xs text-slate-400">{rec.patientId}</div>
                    </td>
                    <td className="py-3 px-4 text-xs font-medium text-slate-700">
                      {rec.pharmacistName}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500">
                      {new Date(rec.dispensedAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-bold text-emerald-700">
                      ₹{Number(rec.totalAmount || 0).toFixed(2)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800">
                        {rec.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedRecord(rec)}
                        className="px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded flex items-center gap-1 ml-auto"
                      >
                        <Receipt className="w-3.5 h-3.5" /> View Receipt
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Receipt View Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-lg">Dispensing Audit Record</h3>
              </div>
              <button onClick={() => setSelectedRecord(null)} className="text-slate-400 font-bold">✕</button>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs font-mono">
              <div className="text-center pb-2 border-b border-slate-200">
                <div className="font-bold text-sm text-slate-900">HOSPITAL PHARMACY DISPENSARY</div>
                <div className="text-slate-500">Record #{selectedRecord.dispensingRecordId}</div>
                <div className="text-[10px] text-slate-400">{new Date(selectedRecord.dispensedAt).toLocaleString()}</div>
              </div>

              <div className="space-y-1">
                <div>Patient: <span className="font-bold">{selectedRecord.patientName}</span> ({selectedRecord.patientId})</div>
                <div>Order: {selectedRecord.pharmacyOrderId} | Rx: {selectedRecord.prescriptionId}</div>
                <div>Pharmacist: {selectedRecord.pharmacistName}</div>
                {selectedRecord.billingReferenceId && <div>Billing Charge ID: {selectedRecord.billingReferenceId}</div>}
              </div>

              <div className="pt-2 border-t border-slate-200">
                <div className="font-bold text-slate-800 pb-1">DISPENSED MEDICATIONS:</div>
                {selectedRecord.items?.map((it, idx) => (
                  <div key={idx} className="flex justify-between py-1 border-b border-slate-100">
                    <div>
                      <div>{it.medicineName} x {it.dispensedQuantity} {it.unit}</div>
                      <div className="text-[10px] text-slate-400">Batch: {it.inventoryBatchId}</div>
                    </div>
                    <div className="font-bold text-slate-900">₹{it.totalPrice?.toFixed(2)}</div>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-bold">
                <span>TOTAL BILLED:</span>
                <span className="text-emerald-700">₹{selectedRecord.totalAmount?.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
              >
                <Printer className="w-4 h-4" /> Print
              </button>
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DispensingHistoryPage;
