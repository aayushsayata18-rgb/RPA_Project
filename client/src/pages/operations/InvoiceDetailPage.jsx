import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FileText,
  CreditCard,
  Printer,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Clock,
  Layers,
  Percent,
  ShieldCheck,
  User,
  Calendar,
  Building,
  Check,
  X
} from 'lucide-react';
import { billingService } from '../../services/billingService';

export const InvoiceDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [invoice, setInvoice] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);

  // Quick Action Modal states
  const [showPayModal, setShowPayModal] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('COUNTER_CASH');

  useEffect(() => {
    loadInvoiceData();
  }, [id]);

  const loadInvoiceData = async () => {
    setLoading(true);
    setError(null);
    try {
      const invRes = await billingService.getInvoiceById(id);
      setInvoice(invRes.data);
      setPayAmount(invRes.data.outstandingBalance || invRes.data.payableAmount || '');

      // Load associated payments
      const invNum = invRes.data.invoiceId || invRes.data.invoiceNumber;
      const payRes = await billingService.getInvoicePayments(invNum).catch(() => ({ data: [] }));
      setPayments(payRes.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load invoice details.');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleFinalize = async () => {
    if (!window.confirm('Are you sure you want to finalize this invoice? Once finalized, financial modifications require authorized adjustments.')) {
      return;
    }
    try {
      const res = await billingService.finalizeInvoice(invoice.invoiceId);
      showToast(res.message || 'Invoice finalized successfully.');
      loadInvoiceData();
    } catch (err) {
      alert(err.message || 'Finalization failed.');
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    try {
      const res = await billingService.recordCounterPayment({
        invoiceId: invoice.invoiceId,
        amount: Number(payAmount),
        paymentMethod: payMethod,
        notes: 'POS settlement from invoice detail view'
      });
      showToast('Payment settled and receipt generated!');
      setShowPayModal(false);
      loadInvoiceData();
    } catch (err) {
      alert(err.message || 'Payment settlement failed.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="p-8 text-center max-w-lg mx-auto">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-white mb-2">Invoice Not Found</h2>
        <p className="text-slate-400 text-sm mb-6">{error || 'The requested hospital invoice does not exist.'}</p>
        <button
          onClick={() => navigate('/billing')}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium"
        >
          Return to Billing Desk
        </button>
      </div>
    );
  }

  const isDraft = invoice.status === 'DRAFT' || invoice.status === 'PENDING_REVIEW';
  const isPaid = invoice.status === 'PAID';

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16 animate-fade-in print:p-0">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-3 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-xl shadow-emerald-900/30 border border-emerald-500/50 backdrop-blur-md">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span className="font-medium text-sm">{toastMsg}</span>
        </div>
      )}

      {/* Navigation Bar */}
      <div className="flex items-center justify-between print:hidden">
        <button
          onClick={() => navigate('/billing')}
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Billing Desk
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Invoice
          </button>

          {isDraft && (
            <button
              onClick={handleFinalize}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm"
            >
              <Check className="w-3.5 h-3.5" />
              Finalize Invoice
            </button>
          )}

          {!isPaid && !isDraft && (
            <button
              onClick={() => setShowPayModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-sm"
            >
              <CreditCard className="w-3.5 h-3.5" />
              Collect Payment
            </button>
          )}
        </div>
      </div>

      {/* Printable Invoice Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-10 shadow-xl print:bg-white print:text-black print:border-none print:shadow-none">
        {/* Invoice Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-6 border-b border-slate-800 print:border-slate-300 gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded bg-indigo-600 text-white text-xs font-black tracking-wider uppercase">
                {invoice.invoiceType || 'TAX INVOICE'}
              </span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  invoice.status === 'PAID'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    : invoice.status === 'PARTIALLY_PAID'
                    ? 'bg-blue-950 text-blue-300 border border-blue-800'
                    : invoice.status === 'FINALIZED'
                    ? 'bg-purple-950 text-purple-300 border border-purple-800'
                    : 'bg-amber-950 text-amber-300 border border-amber-800'
                }`}
              >
                {invoice.status}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white print:text-black mt-2 font-mono">
              {invoice.invoiceId}
            </h1>
            <p className="text-slate-400 print:text-slate-600 text-xs mt-1">
              Issue Date: {new Date(invoice.invoiceDate || invoice.createdAt).toLocaleString()}
            </p>
          </div>

          <div className="text-left md:text-right">
            <h2 className="text-lg font-bold text-white print:text-black">Metro General Hospital</h2>
            <p className="text-xs text-slate-400 print:text-slate-600">Administrative &amp; Financial Desk</p>
            <p className="text-xs text-slate-400 print:text-slate-600">GSTIN: 27AABCM8921K1ZZ &bull; Reg: HOSP-MH-2026</p>
          </div>
        </div>

        {/* Patient & Billing Metadata */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-6 border-b border-slate-800 print:border-slate-300 text-xs">
          <div className="space-y-1">
            <span className="text-slate-500 uppercase tracking-wider font-semibold block text-[10px]">Patient Details</span>
            <div className="font-bold text-sm text-white print:text-black">{invoice.patientName || 'Patient Record'}</div>
            <div className="text-slate-300 print:text-slate-700">Permanent ID: {invoice.patientId}</div>
          </div>

          <div className="space-y-1">
            <span className="text-slate-500 uppercase tracking-wider font-semibold block text-[10px]">Care Episode</span>
            <div className="text-slate-300 print:text-slate-700">
              Admission ID: <span className="font-mono text-white print:text-black font-semibold">{invoice.admissionId || 'Outpatient Visit'}</span>
            </div>
            {invoice.visitId && <div className="text-slate-300 print:text-slate-700">Visit ID: {invoice.visitId}</div>}
          </div>

          <div className="space-y-1 md:text-right">
            <span className="text-slate-500 uppercase tracking-wider font-semibold block text-[10px]">Payment Summary</span>
            <div className="text-slate-300 print:text-slate-700">
              Due Date: <span className="font-medium text-white print:text-black">{new Date(invoice.dueDate || Date.now()).toLocaleDateString()}</span>
            </div>
            <div className="text-slate-300 print:text-slate-700">
              Currency: <span className="font-bold">{invoice.currency || 'INR (₹)'}</span>
            </div>
          </div>
        </div>

        {/* Itemized Line Items Table */}
        <div className="py-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 print:text-slate-600 mb-3">
            Itemized Services Breakdown
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs md:text-sm">
              <thead className="bg-slate-950/80 print:bg-slate-100 text-slate-400 print:text-slate-700 uppercase text-[10px] tracking-wider border-b border-slate-800 print:border-slate-300">
                <tr>
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3 text-center">Qty</th>
                  <th className="py-2.5 px-3 text-right">Unit Price</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 print:divide-slate-200 text-slate-200 print:text-black">
                {(!invoice.items || invoice.items.length === 0) ? (
                  <tr>
                    <td colSpan="6" className="text-center py-6 text-slate-500">
                      No line items recorded on this invoice.
                    </td>
                  </tr>
                ) : (
                  invoice.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/30 print:hover:bg-transparent">
                      <td className="py-3 px-3 text-slate-500">{idx + 1}</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 print:bg-slate-200 text-slate-300 print:text-slate-800">
                          {item.category || item.sourceModule}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-medium">{item.description}</div>
                        {item.serviceCode && <div className="text-[10px] text-slate-500 font-mono">Code: {item.serviceCode}</div>}
                      </td>
                      <td className="py-3 px-3 text-center">{item.quantity}</td>
                      <td className="py-3 px-3 text-right">₹{(item.unitPrice || 0).toLocaleString()}</td>
                      <td className="py-3 px-3 text-right font-semibold">₹{(item.totalPrice || item.grossAmount || 0).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Calculation Ledger Summary */}
        <div className="pt-4 border-t border-slate-800 print:border-slate-300 flex flex-col md:flex-row justify-between items-start gap-6">
          <div className="max-w-md text-xs text-slate-400 print:text-slate-600 space-y-1">
            <p className="font-semibold text-slate-300 print:text-black">Hospital Billing Notice:</p>
            <p>1. Prices applied strictly according to published hospital rate versioning at the time of clinical service.</p>
            <p>2. Finalized financial records are tamper-resistant. Unauthorized modifications require manager review.</p>
          </div>

          <div className="w-full md:w-80 space-y-2 text-xs md:text-sm">
            <div className="flex justify-between text-slate-400 print:text-slate-700">
              <span>Gross Charges Subtotal:</span>
              <span className="font-medium text-white print:text-black">₹{(invoice.grossTotal || 0).toLocaleString()}</span>
            </div>

            {invoice.taxAmount > 0 && (
              <div className="flex justify-between text-slate-400 print:text-slate-700">
                <span>Applicable Taxes:</span>
                <span className="font-medium text-white print:text-black">+₹{invoice.taxAmount.toLocaleString()}</span>
              </div>
            )}

            {invoice.coveredAmount > 0 && (
              <div className="flex justify-between text-emerald-400">
                <span>Insurance Coverage Deduction:</span>
                <span className="font-semibold">-₹{invoice.coveredAmount.toLocaleString()}</span>
              </div>
            )}

            {invoice.depositAmount > 0 && (
              <div className="flex justify-between text-purple-400">
                <span>Advance Deposit Applied:</span>
                <span className="font-semibold">-₹{invoice.depositAmount.toLocaleString()}</span>
              </div>
            )}

            {invoice.discountAmount > 0 && (
              <div className="flex justify-between text-amber-400">
                <span>Authorized Discounts / Waivers:</span>
                <span className="font-semibold">-₹{invoice.discountAmount.toLocaleString()}</span>
              </div>
            )}

            <div className="flex justify-between text-sm md:text-base font-bold text-white print:text-black pt-2 border-t border-slate-800 print:border-slate-300">
              <span>Net Payable Amount:</span>
              <span className="text-indigo-400 print:text-black">₹{(invoice.payableAmount || 0).toLocaleString()}</span>
            </div>

            <div className="flex justify-between text-slate-400 print:text-slate-700">
              <span>Verified Paid Amount:</span>
              <span className="font-medium text-emerald-400">₹{(invoice.paidAmount || 0).toLocaleString()}</span>
            </div>

            <div className="flex justify-between text-sm md:text-base font-extrabold pt-2 border-t border-slate-800 print:border-slate-300">
              <span className="text-slate-300 print:text-black">Outstanding Balance:</span>
              <span className={invoice.outstandingBalance > 0 ? 'text-amber-400' : 'text-emerald-400'}>
                {invoice.outstandingBalance > 0 ? `₹${invoice.outstandingBalance.toLocaleString()}` : 'Settled (₹0)'}
              </span>
            </div>
          </div>
        </div>

        {/* Payment History Log */}
        {payments.length > 0 && (
          <div className="mt-8 pt-6 border-t border-slate-800 print:border-slate-300">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 print:text-slate-700 mb-3">
              Payment Receipts Log
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {payments.map(p => (
                <div key={p.transactionId} className="bg-slate-950 print:bg-slate-100 p-3 rounded-xl border border-slate-800/80 print:border-slate-300 text-xs">
                  <div className="flex justify-between items-center font-mono text-emerald-400 font-semibold mb-1">
                    <span>{p.transactionId}</span>
                    <span className="text-white print:text-black font-sans font-bold">₹{(p.amount || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400 print:text-slate-600">
                    <span>Method: {p.paymentMethod}</span>
                    <span>{new Date(p.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* POS Payment Modal */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in print:hidden">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">Record Invoice Payment</h3>
              <button onClick={() => setShowPayModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Invoice</label>
                <input
                  type="text"
                  disabled
                  value={invoice.invoiceId}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-400 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Payment Amount (₹) *</label>
                <input
                  type="number"
                  required
                  min="0.01"
                  step="0.01"
                  max={invoice.outstandingBalance}
                  value={payAmount}
                  onChange={e => setPayAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 font-bold text-emerald-400"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Remaining Outstanding: ₹{(invoice.outstandingBalance || 0).toLocaleString()}
                </span>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Payment Method</label>
                <select
                  value={payMethod}
                  onChange={e => setPayMethod(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100"
                >
                  <option value="COUNTER_CASH">Counter Cash</option>
                  <option value="COUNTER_CARD">POS Card Swipe</option>
                  <option value="COUNTER_UPI">Counter UPI QR</option>
                  <option value="BANK_TRANSFER">Bank Wire Transfer</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowPayModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-sm"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-semibold">
                  Collect &amp; Issue Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceDetailPage;
