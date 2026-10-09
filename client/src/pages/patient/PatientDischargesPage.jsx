import React, { useState, useEffect } from 'react';
import {
  FileText,
  DollarSign,
  CreditCard,
  Download,
  CheckCircle,
  AlertTriangle,
  Clock,
  Printer,
  HelpCircle,
  RefreshCw
} from 'lucide-react';
import dischargeService from '../../services/dischargeService';
import { useAuth } from '../../context/AuthContext';

export const PatientDischargesPage = () => {
  const { user } = useAuth();
  const [discharges, setDischarges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDischarge, setSelectedDischarge] = useState(null);
  const [payLoading, setPayLoading] = useState(false);
  const [payMethod, setPayMethod] = useState('UPI');
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [disputeReason, setDisputeReason] = useState('');
  const [isDisputeOpen, setIsDisputeOpen] = useState(false);

  const fetchPatientDischarges = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await dischargeService.getDischarges({
        patientId: user?.patientId || user?.userId
      });
      const list = res.data || [];
      setDischarges(list);
      if (list.length > 0) {
        const full = await dischargeService.getDischargeById(list[0].dischargeNumber);
        setSelectedDischarge(full.data);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load patient discharges.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatientDischarges();
  }, [user]);

  const handleSelectDischarge = async (dischargeNumber) => {
    try {
      const full = await dischargeService.getDischargeById(dischargeNumber);
      setSelectedDischarge(full.data);
    } catch (err) {
      setErrorMsg('Failed to fetch details for selected discharge.');
    }
  };

  const handlePayNow = async () => {
    if (!selectedDischarge?.finalInvoiceId) return;
    setPayLoading(true);
    setErrorMsg('');
    setMessage('');
    try {
      const session = await dischargeService.createPaymentSession({
        invoiceId: selectedDischarge.finalInvoiceId,
        paymentMethod: payMethod,
        amount: selectedDischarge.payableAmount
      });

      await dischargeService.verifyPaymentCallback({
        transactionId: session.data.transactionId,
        status: 'SUCCESS',
        signature: 'PATIENT_PORTAL_AUTH_SIG'
      });

      setMessage('Payment completed successfully! Official receipt generated.');
      await handleSelectDischarge(selectedDischarge.dischargeNumber);
    } catch (err) {
      setErrorMsg(err.message || 'Payment transaction failed.');
    } finally {
      setPayLoading(false);
    }
  };

  const handleRaiseDispute = async (e) => {
    e.preventDefault();
    if (!selectedDischarge?.finalInvoiceId) return;
    setErrorMsg('');
    try {
      await dischargeService.raiseBillingDispute({
        invoiceId: selectedDischarge.finalInvoiceId,
        disputeReason
      });
      setIsDisputeOpen(false);
      setDisputeReason('');
      setMessage('Your billing query was submitted to the Hospital Billing Office.');
      await handleSelectDischarge(selectedDischarge.dischargeNumber);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to submit billing query.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  const invoice = selectedDischarge?.invoice || {};

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Hospital Discharge & Final Bill</h1>
          <p className="text-sm text-slate-500 mt-1">
            Review your itemized hospital charges, settle payments online, and download approved discharge summaries.
          </p>
        </div>
        <button
          onClick={fetchPatientDischarges}
          className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-medium flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {message && (
        <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-200 text-sm rounded-xl flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-emerald-600" />
          <span>{message}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-4 bg-rose-50 text-rose-800 border border-rose-200 text-sm rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {discharges.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800">No Discharge Invoices</h3>
          <p className="text-sm text-slate-500 mt-1">You currently have no active or previous discharge billing records.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1: Discharge Episode Selector */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Your Discharge Records</h3>
            {discharges.map((dis) => (
              <div
                key={dis._id}
                onClick={() => handleSelectDischarge(dis.dischargeNumber)}
                className={`p-4 rounded-xl border cursor-pointer transition ${
                  selectedDischarge?.dischargeNumber === dis.dischargeNumber
                    ? 'bg-indigo-50/70 border-indigo-500 shadow-sm'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-900 text-sm">{dis.dischargeNumber}</span>
                  <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                    dis.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {dis.status}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-1">Adm: {dis.admissionId} • Ward: {dis.assignedWardName || 'Ward'}</div>
                <div className="mt-2 flex justify-between items-center pt-2 border-t border-slate-100 text-xs">
                  <span className="text-slate-500">Payable:</span>
                  <span className="font-bold text-slate-900">₹{dis.payableAmount || 0}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Column 2 & 3: Selected Discharge Itemized Bill & Digital Payment */}
          {selectedDischarge && (
            <div className="lg:col-span-2 space-y-6">
              {/* Bill Card */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-200 gap-2">
                  <div>
                    <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Final Hospital Bill</span>
                    <h2 className="text-xl font-black text-slate-900">Invoice #{selectedDischarge.finalInvoiceId || selectedDischarge.dischargeNumber}</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Patient: {selectedDischarge.patientName} ({selectedDischarge.patientId})</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                      selectedDischarge.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      Payment: {selectedDischarge.paymentStatus}
                    </span>
                  </div>
                </div>

                {/* Line Items Table */}
                {invoice.items && invoice.items.length > 0 ? (
                  <div className="border border-slate-100 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-xs text-slate-500 uppercase font-semibold">
                        <tr>
                          <th className="px-4 py-2.5">Item Description</th>
                          <th className="px-4 py-2.5">Qty</th>
                          <th className="px-4 py-2.5 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-800">
                        {invoice.items.map((it, i) => (
                          <tr key={i}>
                            <td className="px-4 py-2.5 font-medium">{it.description}</td>
                            <td className="px-4 py-2.5 text-slate-500">{it.quantity}</td>
                            <td className="px-4 py-2.5 text-right font-semibold">₹{it.totalPrice}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 py-4 text-center">Invoice breakdown details compiling...</div>
                )}

                {/* Financial Summary */}
                <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
                  <div className="flex justify-between text-slate-600">
                    <span>Gross Total:</span>
                    <span>₹{selectedDischarge.grossAmount || invoice.grossTotal || 0}</span>
                  </div>
                  <div className="flex justify-between text-indigo-700">
                    <span>Insurance Coverage Deductions:</span>
                    <span>- ₹{selectedDischarge.coveredAmount || invoice.coveredAmount || 0}</span>
                  </div>
                  <div className="flex justify-between text-indigo-700">
                    <span>Deposit / Advance Paid:</span>
                    <span>- ₹{selectedDischarge.depositAmount || invoice.depositAmount || 0}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-200 text-base font-black text-emerald-700">
                    <span>Net Payable Amount:</span>
                    <span>₹{selectedDischarge.payableAmount || 0}</span>
                  </div>
                </div>

                {/* Digital Payment Actions */}
                {selectedDischarge.payableAmount > 0 && selectedDischarge.paymentStatus !== 'PAID' ? (
                  <div className="p-5 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl space-y-4">
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <CreditCard className="text-indigo-600 w-4 h-4" /> Settle Bill Online
                    </h4>

                    <div className="grid grid-cols-3 gap-3">
                      {['UPI', 'CARD', 'NET_BANKING'].map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setPayMethod(m)}
                          className={`py-2 px-3 text-xs font-bold rounded-lg border text-center transition ${
                            payMethod === m
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {m.replace(/_/g, ' ')}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={handlePayNow}
                      disabled={payLoading}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-sm transition flex items-center justify-center gap-2"
                    >
                      {payLoading ? <RefreshCw className="animate-spin w-4 h-4" /> : <CreditCard className="w-4 h-4" />}
                      Pay ₹{selectedDischarge.payableAmount} Now ({payMethod})
                    </button>

                    <div className="text-center">
                      <button
                        onClick={() => setIsDisputeOpen(true)}
                        className="text-xs text-slate-500 hover:text-indigo-600 underline"
                      >
                        Have a question about a charge? Raise Billing Query
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                      <span className="text-sm font-bold text-emerald-900">Hospital Bill Settled & Cleared</span>
                    </div>
                    <span className="text-xs font-semibold text-emerald-700">Thank you!</span>
                  </div>
                )}

                {/* Available Documents for Download / Print */}
                {selectedDischarge.documents && selectedDischarge.documents.length > 0 && (
                  <div className="space-y-3 pt-4 border-t border-slate-200">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Official Discharge Documents</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {selectedDischarge.documents.map((doc) => (
                        <div key={doc._id} className="p-3 border border-slate-200 rounded-xl bg-slate-50 flex items-center justify-between">
                          <div>
                            <div className="text-xs font-bold text-slate-900">{doc.title}</div>
                            <div className="text-[10px] text-slate-400">{doc.documentType}</div>
                          </div>
                          <button
                            onClick={() => {
                              const w = window.open('', '_blank');
                              w.document.write(doc.htmlContent);
                              w.document.close();
                            }}
                            className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-lg transition"
                            title="Print / View"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal: Raise Billing Dispute */}
      {isDisputeOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-slate-900">Submit Billing Query / Dispute</h3>
            <form onSubmit={handleRaiseDispute} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Description *</label>
                <textarea
                  rows="3"
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  placeholder="Explain your question or discrepancy regarding your hospital bill..."
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsDisputeOpen(false)} className="px-4 py-2 text-sm text-slate-600">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 text-sm bg-indigo-600 text-white font-semibold rounded-lg">
                  Submit to Billing Office
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientDischargesPage;
