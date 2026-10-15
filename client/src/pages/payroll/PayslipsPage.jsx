import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  FileText,
  DollarSign,
  Download,
  Printer,
  Calendar,
  Eye,
  CheckCircle,
  Building,
  ShieldCheck
} from 'lucide-react';
import payrollService from '../../services/payrollService';

export const PayslipsPage = () => {
  const [searchParams] = useSearchParams();
  const highlightedId = searchParams.get('id');

  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlip, setSelectedSlip] = useState(null);

  useEffect(() => {
    fetchPayslips();
  }, []);

  const fetchPayslips = async () => {
    try {
      setLoading(true);
      const res = await payrollService.getMyPayslips();
      const list = res?.payslips || [];
      setPayslips(list);

      if (highlightedId) {
        const found = list.find((p) => p._id === highlightedId);
        if (found) setSelectedSlip(found);
      }
    } catch (err) {
      console.error('Failed to load payslips:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-600" />
            My Hospital Payslips
          </h1>
          <p className="text-sm text-slate-500">
            Secure, confidential access to your monthly salary statements and statutory breakdown.
          </p>
        </div>
      </div>

      {/* Payslips Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-100">
              <tr>
                <th className="px-5 py-3">Payslip Number</th>
                <th className="px-5 py-3">Period</th>
                <th className="px-5 py-3 text-right">Gross Earnings</th>
                <th className="px-5 py-3 text-right">Deductions</th>
                <th className="px-5 py-3 text-right">Net Take-Home</th>
                <th className="px-5 py-3">Disbursed Date</th>
                <th className="px-5 py-3 text-right">View Statement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {payslips.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-slate-400">
                    {loading ? 'Retrieving payslips...' : 'No payslips available on record.'}
                  </td>
                </tr>
              ) : (
                payslips.map((slip) => (
                  <tr key={slip._id} className="hover:bg-slate-50/75 transition">
                    <td className="px-5 py-3 font-mono font-medium text-slate-900">{slip.payslipNumber}</td>
                    <td className="px-5 py-3 font-semibold text-indigo-700">{slip.periodCode}</td>
                    <td className="px-5 py-3 text-right font-medium text-slate-900">${slip.grossAmount?.toFixed(2)}</td>
                    <td className="px-5 py-3 text-right font-medium text-rose-600">${slip.deductionAmount?.toFixed(2)}</td>
                    <td className="px-5 py-3 text-right font-bold text-emerald-600">${slip.netAmount?.toFixed(2)}</td>
                    <td className="px-5 py-3 text-slate-500">{new Date(slip.generatedAt).toLocaleDateString()}</td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => setSelectedSlip(slip)}
                        className="px-3 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded text-xs font-semibold transition"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed Printable Payslip Modal */}
      {selectedSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden print:shadow-none print:border-none">
            {/* Modal Actions Header */}
            <div className="px-6 py-3.5 bg-slate-900 text-white flex items-center justify-between print:hidden">
              <span className="text-xs font-semibold text-slate-300">Confidential Salary Statement</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded text-xs transition"
                >
                  <Printer className="w-3.5 h-3.5" /> Print
                </button>
                <button
                  onClick={() => setSelectedSlip(null)}
                  className="text-slate-400 hover:text-white font-bold ml-2 text-lg"
                >
                  &times;
                </button>
              </div>
            </div>

            {/* Printable Payslip Body */}
            <div className="p-8 space-y-6 text-xs text-slate-800">
              {/* Hospital Header */}
              <div className="flex items-center justify-between border-b pb-4 border-slate-200">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 tracking-tight">HOSPITAL ADMINISTRATIVE PLATFORM</h2>
                  <p className="text-slate-500 text-[11px]">Official Compensation & Payroll Statement</p>
                </div>
                <div className="text-right">
                  <span className="font-mono text-sm font-bold text-indigo-700 block">{selectedSlip.payslipNumber}</span>
                  <span className="text-[11px] text-slate-500">Period: {selectedSlip.periodCode}</span>
                </div>
              </div>

              {/* Employee Summary Metadata */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] font-semibold uppercase block">Employee Name</span>
                  <span className="font-bold text-slate-900">{selectedSlip.employeeName}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] font-semibold uppercase block">Employee Code</span>
                  <span className="font-mono font-medium text-slate-800">{selectedSlip.employeeIdCode}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] font-semibold uppercase block">Department</span>
                  <span className="font-medium text-slate-800">{selectedSlip.departmentName}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] font-semibold uppercase block">Bank Account</span>
                  <span className="font-mono text-slate-800">{selectedSlip.bankDetailsMasked?.accountNumberMasked || 'Direct Deposit'}</span>
                </div>
              </div>

              {/* Attendance and Work Summary */}
              <div className="p-3 bg-indigo-50/50 rounded-lg border border-indigo-100 flex items-center justify-around text-center text-xs">
                <div>
                  <span className="text-slate-500 text-[10px] block">Worked Days</span>
                  <span className="font-bold text-slate-900">{selectedSlip.attendanceSummary?.workedDays} days</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Approved Paid Leave</span>
                  <span className="font-bold text-blue-700">{selectedSlip.attendanceSummary?.paidLeaveDays || 0} days</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Approved Overtime</span>
                  <span className="font-bold text-indigo-700">
                    {((selectedSlip.attendanceSummary?.overtimeMinutes || 0) / 60).toFixed(1)} hrs
                  </span>
                </div>
              </div>

              {/* Earnings & Deductions Tables */}
              <div className="grid grid-cols-2 gap-6">
                {/* Earnings */}
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-900 border-b pb-1 text-xs uppercase tracking-wider text-emerald-800">
                    Earnings
                  </h4>
                  <div className="space-y-1.5">
                    {selectedSlip.earningsBreakdown?.map((e, idx) => (
                      <div key={idx} className="flex justify-between py-1 border-b border-dotted border-slate-200">
                        <span>{e.name}</span>
                        <span className="font-semibold text-slate-900">${e.amount?.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between pt-2 font-bold text-slate-900 text-xs border-t">
                    <span>Total Gross:</span>
                    <span>${selectedSlip.grossAmount?.toFixed(2)}</span>
                  </div>
                </div>

                {/* Deductions */}
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-900 border-b pb-1 text-xs uppercase tracking-wider text-rose-800">
                    Deductions
                  </h4>
                  <div className="space-y-1.5">
                    {selectedSlip.deductionsBreakdown?.map((d, idx) => (
                      <div key={idx} className="flex justify-between py-1 border-b border-dotted border-slate-200">
                        <span>{d.name}</span>
                        <span className="font-semibold text-rose-600">${d.amount?.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between pt-2 font-bold text-slate-900 text-xs border-t">
                    <span>Total Deductions:</span>
                    <span>${selectedSlip.deductionAmount?.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Net Pay Callout */}
              <div className="p-4 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl text-white flex items-center justify-between shadow-md">
                <div>
                  <span className="text-xs uppercase font-bold tracking-wider text-emerald-100 block">NET TAKE-HOME SALARY</span>
                  <span className="text-[11px] text-emerald-50">Transferred electronically to primary account</span>
                </div>
                <div className="text-2xl font-black tracking-tight">
                  ${selectedSlip.netAmount?.toFixed(2)} {selectedSlip.currency}
                </div>
              </div>

              {/* Footer Note */}
              <div className="text-[10px] text-slate-400 text-center pt-3 border-t border-slate-200">
                This is an authorized system-generated compensation statement. Document ID: {selectedSlip.documentId}.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayslipsPage;
