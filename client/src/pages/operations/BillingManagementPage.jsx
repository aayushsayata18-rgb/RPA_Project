import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  DollarSign,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  Search,
  Filter,
  Plus,
  RefreshCw,
  Eye,
  Check,
  X,
  ArrowRight,
  TrendingUp,
  Receipt,
  Layers,
  HelpCircle,
  Tag,
  ShieldCheck,
  ChevronRight,
  Printer,
  Download,
  Percent,
  Calendar
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { billingService } from '../../services/billingService';
import { useAuth } from '../../context/AuthContext';

export const BillingManagementPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Active Tab
  const [activeTab, setActiveTab] = useState('invoices'); // invoices, charges, payments, deposits, adjustments, queries, rates, reconciliation
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Executive Dashboard Stats
  const [stats, setStats] = useState({
    todayRevenue: 0,
    mtdRevenue: 0,
    totalOutstanding: 0,
    collectionRate: 100,
    openQueriesCount: 0,
    remainingDeposits: 0
  });

  // Tab Data
  const [invoices, setInvoices] = useState([]);
  const [billableItems, setBillableItems] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const [adjustments, setAdjustments] = useState([]);
  const [queries, setQueries] = useState([]);
  const [rateCards, setRateCards] = useState([]);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals state
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [showChargeModal, setShowChargeModal] = useState(false);
  const [showCounterModal, setShowCounterModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [showRateModal, setShowRateModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [selectedInvoiceForAction, setSelectedInvoiceForAction] = useState(null);
  const [selectedQueryForAction, setSelectedQueryForAction] = useState(null);

  // Form states
  const [draftForm, setDraftForm] = useState({
    patientId: '',
    admissionId: '',
    invoiceType: 'GENERAL',
    depositAmount: 0,
    coveredAmount: 0,
    discountAmount: 0
  });

  const [chargeForm, setChargeForm] = useState({
    patientId: '',
    admissionId: '',
    sourceModule: 'CONSULTATION',
    serviceCode: 'CONS-GEN',
    description: '',
    quantity: 1,
    unitPrice: 800
  });

  const [counterForm, setCounterForm] = useState({
    invoiceId: '',
    amount: '',
    paymentMethod: 'COUNTER_CASH',
    notes: ''
  });

  const [depositForm, setDepositForm] = useState({
    patientId: '',
    admissionId: '',
    amount: '',
    paymentMethod: 'CASH',
    notes: ''
  });

  const [adjustmentForm, setAdjustmentForm] = useState({
    invoiceId: '',
    type: 'DISCOUNT',
    amount: '',
    reason: ''
  });

  const [rateForm, setRateForm] = useState({
    serviceCode: '',
    serviceName: '',
    category: 'CONSULTATION',
    unit: 'PER_VISIT',
    basePrice: '',
    taxRate: 0
  });

  const [resolveForm, setResolveForm] = useState({
    resolution: ''
  });

  // Load initial data
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, invRes, chgRes, txnRes, depRes, adjRes, qryRes, ratesRes] = await Promise.all([
        billingService.getDashboardSummary().catch(() => ({ data: {} })),
        billingService.getInvoices().catch(() => ({ data: [] })),
        billingService.getBillableItems().catch(() => ({ data: [] })),
        billingService.getTransactions().catch(() => ({ data: [] })),
        billingService.getDeposits().catch(() => ({ data: [] })),
        billingService.getAdjustments().catch(() => ({ data: [] })),
        billingService.getQueries().catch(() => ({ data: [] })),
        billingService.getRates().catch(() => ({ data: [] }))
      ]);

      setStats(statsRes.data || {});
      setInvoices(invRes.data || []);
      setBillableItems(chgRes.data || []);
      setTransactions(txnRes.data || []);
      setDeposits(depRes.data || []);
      setAdjustments(adjRes.data || []);
      setQueries(qryRes.data || []);
      setRateCards(ratesRes.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load billing data.');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  // --- Handlers ---
  const handleCreateDraftInvoice = async (e) => {
    e.preventDefault();
    try {
      const res = await billingService.createDraftInvoice(draftForm);
      showToast(`Draft invoice ${res.data.invoiceId} created successfully.`);
      setShowDraftModal(false);
      setDraftForm({ patientId: '', admissionId: '', invoiceType: 'GENERAL', depositAmount: 0, coveredAmount: 0, discountAmount: 0 });
      loadAllData();
    } catch (err) {
      alert(err.message || 'Error creating draft invoice.');
    }
  };

  const handleFinalizeInvoice = async (invoiceId) => {
    if (!window.confirm(`Are you sure you want to finalize invoice ${invoiceId}? Once finalized, it cannot be directly edited.`)) {
      return;
    }
    try {
      const res = await billingService.finalizeInvoice(invoiceId);
      showToast(res.message || 'Invoice finalized successfully.');
      loadAllData();
    } catch (err) {
      alert(err.message || 'Failed to finalize invoice.');
    }
  };

  const handleAddCharge = async (e) => {
    e.preventDefault();
    try {
      const res = await billingService.addBillableItem(chargeForm);
      showToast(`Charge recorded: ${res.data.chargeId}`);
      setShowChargeModal(false);
      setChargeForm({ patientId: '', admissionId: '', sourceModule: 'CONSULTATION', serviceCode: 'CONS-GEN', description: '', quantity: 1, unitPrice: 800 });
      loadAllData();
    } catch (err) {
      alert(err.message || 'Failed to add charge.');
    }
  };

  const handleRecordCounterPayment = async (e) => {
    e.preventDefault();
    try {
      const res = await billingService.recordCounterPayment(counterForm);
      showToast(`Counter payment received! Receipt #${res.data?.receiptNumber || res.data?.transactionId}`);
      setShowCounterModal(false);
      setCounterForm({ invoiceId: '', amount: '', paymentMethod: 'COUNTER_CASH', notes: '' });
      loadAllData();
    } catch (err) {
      alert(err.message || 'Payment recording failed.');
    }
  };

  const handleRecordDeposit = async (e) => {
    e.preventDefault();
    try {
      const res = await billingService.recordDeposit(depositForm);
      showToast(`Deposit recorded: ${res.data.depositNumber} (₹${res.data.amount})`);
      setShowDepositModal(false);
      setDepositForm({ patientId: '', admissionId: '', amount: '', paymentMethod: 'CASH', notes: '' });
      loadAllData();
    } catch (err) {
      alert(err.message || 'Failed to record deposit.');
    }
  };

  const handleRequestAdjustment = async (e) => {
    e.preventDefault();
    try {
      const res = await billingService.requestAdjustment(adjustmentForm);
      showToast(`Adjustment requested: ${res.data.adjustmentNumber}`);
      setShowAdjustmentModal(false);
      setAdjustmentForm({ invoiceId: '', type: 'DISCOUNT', amount: '', reason: '' });
      loadAllData();
    } catch (err) {
      alert(err.message || 'Failed to request adjustment.');
    }
  };

  const handleApproveAdjustment = async (adjNumber) => {
    try {
      const res = await billingService.approveAdjustment(adjNumber);
      showToast(res.message || 'Adjustment approved & applied.');
      loadAllData();
    } catch (err) {
      alert(err.message || 'Approval failed.');
    }
  };

  const handleRejectAdjustment = async (adjNumber) => {
    const reason = window.prompt('Enter reason for rejecting adjustment:');
    if (!reason) return;
    try {
      const res = await billingService.rejectAdjustment(adjNumber, reason);
      showToast(res.message || 'Adjustment rejected.');
      loadAllData();
    } catch (err) {
      alert(err.message || 'Failed to reject adjustment.');
    }
  };

  const handleResolveQuery = async (e) => {
    e.preventDefault();
    if (!selectedQueryForAction) return;
    try {
      const res = await billingService.resolveQuery(selectedQueryForAction.queryNumber, resolveForm.resolution);
      showToast(`Query ${selectedQueryForAction.queryNumber} resolved.`);
      setShowResolveModal(false);
      setResolveForm({ resolution: '' });
      setSelectedQueryForAction(null);
      loadAllData();
    } catch (err) {
      alert(err.message || 'Failed to resolve query.');
    }
  };

  const handleCreateRate = async (e) => {
    e.preventDefault();
    try {
      const res = await billingService.createRate(rateForm);
      showToast(`New rate card added: ${res.data.serviceCode}`);
      setShowRateModal(false);
      setRateForm({ serviceCode: '', serviceName: '', category: 'CONSULTATION', unit: 'PER_VISIT', basePrice: '', taxRate: 0 });
      loadAllData();
    } catch (err) {
      alert(err.message || 'Failed to add rate card.');
    }
  };

  const handleRunReconciliation = async () => {
    const mockSettlement = transactions.slice(0, 10).map(t => ({
      transactionId: t.transactionId,
      gatewayReferenceId: t.gatewayReferenceId,
      amount: t.amount,
      status: t.status
    }));

    try {
      const res = await billingService.reconcileGateway(mockSettlement);
      showToast(`Reconciliation complete! Matched: ${res.data.matched}, Mismatches: ${res.data.mismatched}`);
      loadAllData();
    } catch (err) {
      alert(err.message || 'Reconciliation failed.');
    }
  };

  // Filtered invoices
  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch =
      (inv.invoiceId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inv.patientId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inv.patientName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inv.admissionId || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Toast Alert */}
      {successMsg && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-3 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-xl shadow-emerald-900/30 border border-emerald-500/50 backdrop-blur-md">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span className="font-medium text-sm">{successMsg}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-800/40 p-6 md:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Module 08 &bull; Financial Authority &amp; Payment Engine
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Hospital Billing &amp; Payment Desk
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl">
              Authoritative financial repository for patient invoices, billable services, rate versioning, deposits, payments, and automated reconciliations.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowChargeModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-xl text-sm font-semibold border border-slate-700 shadow-sm transition-all"
            >
              <Plus className="w-4 h-4 text-indigo-400" />
              Add Charge
            </button>
            <button
              onClick={() => setShowDraftModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-600/30 transition-all"
            >
              <FileText className="w-4 h-4" />
              Create Draft Invoice
            </button>
            <button
              onClick={() => setShowCounterModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-emerald-600/30 transition-all"
            >
              <CreditCard className="w-4 h-4" />
              Cashier POS
            </button>
            <button
              onClick={loadAllData}
              title="Refresh Data"
              className="p-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Today's Revenue */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Today's Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-white mt-2">
            ₹{(stats.todayRevenue || 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-medium">
            <TrendingUp className="w-3 h-3" /> Settled Today
          </div>
        </div>

        {/* Month to Date Revenue */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>MTD Revenue</span>
            <TrendingUp className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-xl font-bold text-white mt-2">
            ₹{(stats.mtdRevenue || 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Current Calendar Month</div>
        </div>

        {/* Total Outstanding */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Outstanding</span>
            <AlertCircle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-amber-300 mt-2">
            ₹{(stats.totalOutstanding || 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-amber-400 mt-1">Unpaid / Partially Paid</div>
        </div>

        {/* Collection Rate */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Collection Rate</span>
            <Percent className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl font-bold text-cyan-300 mt-2">
            {stats.collectionRate || 100}%
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Paid / Total Billed</div>
        </div>

        {/* Open Queries */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Billing Queries</span>
            <HelpCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-xl font-bold text-white mt-2">
            {stats.openQueriesCount || 0}
          </div>
          <div className="text-[11px] text-rose-400 mt-1">Awaiting Resolution</div>
        </div>

        {/* Active Deposits */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Active Deposits</span>
            <ShieldCheck className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-xl font-bold text-purple-300 mt-2">
            ₹{(stats.remainingDeposits || 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Available Advances</div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="border-b border-slate-800">
        <nav className="flex space-x-1 md:space-x-4 overflow-x-auto pb-2 scrollbar-none">
          {[
            { id: 'invoices', label: 'Invoices', icon: FileText, count: invoices.length },
            { id: 'charges', label: 'Billable Charges', icon: Layers, count: billableItems.length },
            { id: 'payments', label: 'Payments & POS', icon: CreditCard, count: transactions.length },
            { id: 'deposits', label: 'Advances / Deposits', icon: ShieldCheck, count: deposits.length },
            { id: 'adjustments', label: 'Adjustments & Waivers', icon: Percent, count: adjustments.length },
            { id: 'queries', label: 'Queries & Disputes', icon: HelpCircle, count: queries.length },
            { id: 'rates', label: 'Rate Cards', icon: Tag, count: rateCards.length },
            { id: 'reconciliation', label: 'Reconciliation', icon: RefreshCw }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 font-medium text-xs md:text-sm rounded-lg whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-indigo-600/10 text-indigo-400 border-b-2 border-indigo-500 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {tab.count !== undefined && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${isActive ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* TAB CONTENT 1: INVOICES */}
      {activeTab === 'invoices' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-slate-900/60 border border-slate-800 p-3 rounded-xl">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search invoice #, patient ID, name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
              <Filter className="w-4 h-4 text-slate-400" />
              {['ALL', 'DRAFT', 'FINALIZED', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED'].map(st => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap ${
                    statusFilter === st
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-950 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Invoices Table */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs md:text-sm">
                <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase text-[11px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Patient / Adm</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Gross Total</th>
                    <th className="py-3 px-4">Deductions / Dep</th>
                    <th className="py-3 px-4">Payable</th>
                    <th className="py-3 px-4">Balance</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="text-center py-10 text-slate-500">
                        No hospital invoices match current filters.
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map(inv => {
                      const totalDeductions = (inv.coveredAmount || 0) + (inv.depositAmount || 0) + (inv.discountAmount || 0);
                      const isDraft = inv.status === 'DRAFT' || inv.status === 'PENDING_REVIEW';
                      const isPaid = inv.status === 'PAID';

                      return (
                        <tr key={inv.invoiceId} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-3 px-4 font-mono font-medium text-indigo-300">
                            {inv.invoiceId}
                            <div className="text-[10px] text-slate-500 font-sans">
                              {new Date(inv.invoiceDate || inv.createdAt).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-white">{inv.patientName || inv.patientId}</div>
                            <div className="text-[11px] text-slate-400">
                              ID: {inv.patientId} {inv.admissionId ? `&bull; ${inv.admissionId}` : ''}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-slate-300">
                              {inv.invoiceType || 'GENERAL'}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-medium">₹{(inv.grossTotal || 0).toLocaleString()}</td>
                          <td className="py-3 px-4 text-slate-400 text-xs">
                            {totalDeductions > 0 ? (
                              <span className="text-emerald-400">-₹{totalDeductions.toLocaleString()}</span>
                            ) : (
                              '₹0'
                            )}
                          </td>
                          <td className="py-3 px-4 font-semibold text-indigo-300">
                            ₹{(inv.payableAmount || 0).toLocaleString()}
                          </td>
                          <td className="py-3 px-4 font-semibold">
                            {inv.outstandingBalance > 0 ? (
                              <span className="text-amber-400">₹{inv.outstandingBalance.toLocaleString()}</span>
                            ) : (
                              <span className="text-emerald-400">Settled</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                inv.status === 'PAID'
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                                  : inv.status === 'PARTIALLY_PAID'
                                  ? 'bg-blue-950 text-blue-300 border border-blue-800/60'
                                  : inv.status === 'FINALIZED'
                                  ? 'bg-purple-950 text-purple-300 border border-purple-800/60'
                                  : inv.status === 'DRAFT'
                                  ? 'bg-amber-950 text-amber-300 border border-amber-800/60'
                                  : inv.status === 'OVERDUE'
                                  ? 'bg-rose-950 text-rose-300 border border-rose-800/60'
                                  : 'bg-slate-800 text-slate-300'
                              }`}
                            >
                              {inv.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                            <button
                              onClick={() => navigate(`/billing/invoices/${inv.invoiceId}`)}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg transition-colors inline-flex items-center gap-1"
                              title="View Invoice"
                            >
                              <Eye className="w-3.5 h-3.5 text-indigo-400" />
                              View
                            </button>

                            {isDraft && (
                              <button
                                onClick={() => handleFinalizeInvoice(inv.invoiceId)}
                                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded-lg transition-colors inline-flex items-center gap-1"
                                title="Finalize Invoice"
                              >
                                <Check className="w-3.5 h-3.5" />
                                Finalize
                              </button>
                            )}

                            {!isPaid && !isDraft && (
                              <button
                                onClick={() => {
                                  setCounterForm({ ...counterForm, invoiceId: inv.invoiceId, amount: inv.outstandingBalance });
                                  setShowCounterModal(true);
                                }}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs rounded-lg transition-colors inline-flex items-center gap-1"
                                title="Record Counter Payment"
                              >
                                <CreditCard className="w-3.5 h-3.5" />
                                Pay
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: BILLABLE CHARGES */}
      {activeTab === 'charges' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
            <div>
              <h3 className="text-white font-semibold text-sm">Itemized Service Charges Repository</h3>
              <p className="text-slate-400 text-xs">Originating charges from Rooms, Labs, Pharmacy, Radiology, Consultations.</p>
            </div>
            <button
              onClick={() => setShowChargeModal(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm"
            >
              <Plus className="w-4 h-4" /> Add Billable Item
            </button>
          </div>

          <div className="bg-slate-900/70 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs md:text-sm">
                <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Charge ID</th>
                    <th className="py-3 px-4">Patient</th>
                    <th className="py-3 px-4">Department / Module</th>
                    <th className="py-3 px-4">Service Description</th>
                    <th className="py-3 px-4">Qty</th>
                    <th className="py-3 px-4">Unit Price</th>
                    <th className="py-3 px-4">Net Total</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {billableItems.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="text-center py-10 text-slate-500">
                        No billable items recorded yet.
                      </td>
                    </tr>
                  ) : (
                    billableItems.map(item => (
                      <tr key={item.chargeId} className="hover:bg-slate-800/30">
                        <td className="py-3 px-4 font-mono font-medium text-indigo-300">{item.chargeId}</td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-white">{item.patientName || item.patientId}</span>
                          <span className="block text-[11px] text-slate-500">{item.patientId}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-indigo-300">
                            {item.sourceModule}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-200">
                          {item.description}
                          {item.serviceCode && <span className="text-[10px] text-slate-500 block">Code: {item.serviceCode}</span>}
                        </td>
                        <td className="py-3 px-4">{item.quantity}</td>
                        <td className="py-3 px-4">₹{(item.unitPrice || 0).toLocaleString()}</td>
                        <td className="py-3 px-4 font-bold text-emerald-400">
                          ₹{(item.netAmount || item.totalAmount || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              item.status === 'INVOICED'
                                ? 'bg-indigo-950 text-indigo-300'
                                : item.status === 'VALIDATED'
                                ? 'bg-emerald-950 text-emerald-300'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: PAYMENTS & POS */}
      {activeTab === 'payments' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
            <div>
              <h3 className="text-white font-semibold text-sm">Payment Ledger &amp; Cashier Transactions</h3>
              <p className="text-slate-400 text-xs">Verified digital gateway payments, POS card, UPI and counter cash receipts.</p>
            </div>
            <button
              onClick={() => setShowCounterModal(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-sm"
            >
              <CreditCard className="w-4 h-4" /> Record Counter Payment
            </button>
          </div>

          <div className="bg-slate-900/70 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs md:text-sm">
                <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Transaction / Receipt #</th>
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Patient</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Method</th>
                    <th className="py-3 px-4">Gateway Ref</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="text-center py-10 text-slate-500">
                        No transactions recorded yet.
                      </td>
                    </tr>
                  ) : (
                    transactions.map(t => (
                      <tr key={t.transactionId} className="hover:bg-slate-800/30">
                        <td className="py-3 px-4 font-mono font-medium text-emerald-400">{t.transactionId}</td>
                        <td className="py-3 px-4 font-mono text-indigo-300">{t.invoiceId}</td>
                        <td className="py-3 px-4 text-slate-300">{t.patientId}</td>
                        <td className="py-3 px-4 font-bold text-white">₹{(t.amount || 0).toLocaleString()}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-slate-300">
                            {t.paymentMethod}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs font-mono text-slate-400">{t.gatewayReferenceId || 'N/A'}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              t.status === 'SUCCESS' ? 'bg-emerald-950 text-emerald-300' : 'bg-rose-950 text-rose-300'
                            }`}
                          >
                            {t.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-400">
                          {new Date(t.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 4: DEPOSITS */}
      {activeTab === 'deposits' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
            <div>
              <h3 className="text-white font-semibold text-sm">Patient Advance Deposits</h3>
              <p className="text-slate-400 text-xs">Pre-admission advances and security deposits tracked for invoice allocation.</p>
            </div>
            <button
              onClick={() => setShowDepositModal(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg shadow-sm"
            >
              <Plus className="w-4 h-4" /> Record New Deposit
            </button>
          </div>

          <div className="bg-slate-900/70 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs md:text-sm">
                <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Deposit #</th>
                    <th className="py-3 px-4">Patient</th>
                    <th className="py-3 px-4">Admission</th>
                    <th className="py-3 px-4">Original Amount</th>
                    <th className="py-3 px-4">Used Amount</th>
                    <th className="py-3 px-4">Remaining Balance</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Received Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {deposits.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="text-center py-10 text-slate-500">
                        No patient deposits on record.
                      </td>
                    </tr>
                  ) : (
                    deposits.map(d => (
                      <tr key={d.depositNumber} className="hover:bg-slate-800/30">
                        <td className="py-3 px-4 font-mono font-medium text-purple-300">{d.depositNumber}</td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-white">{d.patientName || d.patientId}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-400">{d.admissionId || 'N/A'}</td>
                        <td className="py-3 px-4">₹{(d.amount || 0).toLocaleString()}</td>
                        <td className="py-3 px-4 text-slate-400">₹{(d.usedAmount || 0).toLocaleString()}</td>
                        <td className="py-3 px-4 font-bold text-emerald-400">₹{(d.remainingAmount || 0).toLocaleString()}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              d.status === 'ACTIVE'
                                ? 'bg-emerald-950 text-emerald-300'
                                : d.status === 'PARTIALLY_APPLIED'
                                ? 'bg-blue-950 text-blue-300'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {d.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-400">{new Date(d.receivedAt).toLocaleDateString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 5: FINANCIAL ADJUSTMENTS */}
      {activeTab === 'adjustments' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
            <div>
              <h3 className="text-white font-semibold text-sm">Financial Adjustments &amp; Authorized Waivers</h3>
              <p className="text-slate-400 text-xs">Strict human review workflow: RPA is strictly prevented from approving adjustments.</p>
            </div>
            <button
              onClick={() => setShowAdjustmentModal(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm"
            >
              <Plus className="w-4 h-4" /> Request Adjustment
            </button>
          </div>

          <div className="bg-slate-900/70 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs md:text-sm">
                <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Adjustment #</th>
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Reason</th>
                    <th className="py-3 px-4">Requested By</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Review Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {adjustments.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="text-center py-10 text-slate-500">
                        No financial adjustments recorded.
                      </td>
                    </tr>
                  ) : (
                    adjustments.map(adj => {
                      const isPending = adj.status === 'REQUESTED' || adj.status === 'UNDER_REVIEW';
                      return (
                        <tr key={adj.adjustmentNumber} className="hover:bg-slate-800/30">
                          <td className="py-3 px-4 font-mono font-medium text-indigo-300">{adj.adjustmentNumber}</td>
                          <td className="py-3 px-4 font-mono text-slate-300">{adj.invoiceId}</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-slate-300">
                              {adj.type}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-bold text-amber-400">₹{(adj.amount || 0).toLocaleString()}</td>
                          <td className="py-3 px-4 text-slate-300">{adj.reason}</td>
                          <td className="py-3 px-4 text-slate-400 text-xs">{adj.requestedBy}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                adj.status === 'APPROVED' || adj.status === 'APPLIED'
                                  ? 'bg-emerald-950 text-emerald-300'
                                  : adj.status === 'REJECTED'
                                  ? 'bg-rose-950 text-rose-300'
                                  : 'bg-amber-950 text-amber-300'
                              }`}
                            >
                              {adj.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                            {isPending ? (
                              <>
                                <button
                                  onClick={() => handleApproveAdjustment(adj.adjustmentNumber)}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs rounded-lg transition-colors inline-flex items-center gap-1"
                                >
                                  <Check className="w-3.5 h-3.5" /> Approve
                                </button>
                                <button
                                  onClick={() => handleRejectAdjustment(adj.adjustmentNumber)}
                                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white text-xs rounded-lg transition-colors inline-flex items-center gap-1"
                                >
                                  <X className="w-3.5 h-3.5" /> Reject
                                </button>
                              </>
                            ) : (
                              <span className="text-slate-500 text-xs">Reviewed</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 6: BILLING QUERIES & DISPUTES */}
      {activeTab === 'queries' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
            <div>
              <h3 className="text-white font-semibold text-sm">Patient Disputes &amp; Inquiries Desk</h3>
              <p className="text-slate-400 text-xs">Track and resolve questions regarding charges, insurance deductions, or payments.</p>
            </div>
          </div>

          <div className="bg-slate-900/70 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs md:text-sm">
                <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Query #</th>
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Patient</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {queries.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-10 text-slate-500">
                        No billing queries open.
                      </td>
                    </tr>
                  ) : (
                    queries.map(q => (
                      <tr key={q.queryNumber} className="hover:bg-slate-800/30">
                        <td className="py-3 px-4 font-mono font-medium text-indigo-300">{q.queryNumber}</td>
                        <td className="py-3 px-4 font-mono text-slate-300">{q.invoiceId}</td>
                        <td className="py-3 px-4 font-medium text-white">{q.patientName || q.patientId}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-slate-300">
                            {q.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-300 max-w-xs truncate">{q.description}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              q.status === 'RESOLVED' ? 'bg-emerald-950 text-emerald-300' : 'bg-rose-950 text-rose-300'
                            }`}
                          >
                            {q.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {q.status !== 'RESOLVED' ? (
                            <button
                              onClick={() => {
                                setSelectedQueryForAction(q);
                                setShowResolveModal(true);
                              }}
                              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded-lg transition-colors"
                            >
                              Resolve
                            </button>
                          ) : (
                            <span className="text-slate-500 text-xs">Resolved</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 7: RATE CARDS */}
      {activeTab === 'rates' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
            <div>
              <h3 className="text-white font-semibold text-sm">Master Rate Cards &amp; Pricing Catalog</h3>
              <p className="text-slate-400 text-xs">Authoritative pricing for rooms, tests, consultations and medicines with effective dates.</p>
            </div>
            <button
              onClick={() => setShowRateModal(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm"
            >
              <Plus className="w-4 h-4" /> Add Rate Card Item
            </button>
          </div>

          <div className="bg-slate-900/70 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs md:text-sm">
                <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Service Code</th>
                    <th className="py-3 px-4">Service Name</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Unit</th>
                    <th className="py-3 px-4">Base Price</th>
                    <th className="py-3 px-4">Tax Rate</th>
                    <th className="py-3 px-4">Effective Date</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {rateCards.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="text-center py-10 text-slate-500">
                        No rate cards loaded.
                      </td>
                    </tr>
                  ) : (
                    rateCards.map(rate => (
                      <tr key={rate.rateId} className="hover:bg-slate-800/30">
                        <td className="py-3 px-4 font-mono font-medium text-indigo-300">{rate.serviceCode}</td>
                        <td className="py-3 px-4 font-semibold text-white">{rate.serviceName}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-slate-300">
                            {rate.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-400 text-xs">{rate.unit}</td>
                        <td className="py-3 px-4 font-bold text-emerald-400">₹{(rate.basePrice || 0).toLocaleString()}</td>
                        <td className="py-3 px-4 text-slate-400">{((rate.taxRate || 0) * 100).toFixed(0)}%</td>
                        <td className="py-3 px-4 text-xs text-slate-400">{new Date(rate.effectiveFrom).toLocaleDateString()}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${rate.active ? 'bg-emerald-950 text-emerald-300' : 'bg-slate-800 text-slate-500'}`}>
                            {rate.active ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 8: RECONCILIATION */}
      {activeTab === 'reconciliation' && (
        <div className="space-y-6">
          <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl">
            <h3 className="text-white font-semibold text-base mb-1">Financial Reconciliation Engine</h3>
            <p className="text-slate-400 text-sm max-w-2xl mb-6">
              Compare payment gateway settlement reports against hospital administrative transaction ledgers. Any mismatched amounts, missing transactions, or inconsistent statuses are logged to Central Exception Management.
            </p>

            <div className="flex items-center gap-4">
              <button
                onClick={handleRunReconciliation}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                Run Gateway Reconciliation Batch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODALS ================= */}

      {/* DRAFT INVOICE MODAL */}
      {showDraftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">Create Draft Invoice</h3>
              <button onClick={() => setShowDraftModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateDraftInvoice} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Patient ID *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. P10001"
                  value={draftForm.patientId}
                  onChange={e => setDraftForm({ ...draftForm, patientId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Admission ID (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. ADM202610001"
                  value={draftForm.admissionId}
                  onChange={e => setDraftForm({ ...draftForm, admissionId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Invoice Type</label>
                <select
                  value={draftForm.invoiceType}
                  onChange={e => setDraftForm({ ...draftForm, invoiceType: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100"
                >
                  <option value="GENERAL">GENERAL</option>
                  <option value="OPD">OPD</option>
                  <option value="IPD">IPD</option>
                  <option value="EMERGENCY">EMERGENCY</option>
                  <option value="FINAL_DISCHARGE">FINAL_DISCHARGE</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Deposit Deduction (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={draftForm.depositAmount}
                    onChange={e => setDraftForm({ ...draftForm, depositAmount: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Insurance Coverage (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={draftForm.coveredAmount}
                    onChange={e => setDraftForm({ ...draftForm, coveredAmount: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowDraftModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-sm"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold">
                  Generate Draft
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD CHARGE MODAL */}
      {showChargeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">Record Billable Charge</h3>
              <button onClick={() => setShowChargeModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddCharge} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Patient ID *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. P10001"
                  value={chargeForm.patientId}
                  onChange={e => setChargeForm({ ...chargeForm, patientId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Admission ID (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. ADM202610001"
                  value={chargeForm.admissionId}
                  onChange={e => setChargeForm({ ...chargeForm, admissionId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Source Module</label>
                  <select
                    value={chargeForm.sourceModule}
                    onChange={e => setChargeForm({ ...chargeForm, sourceModule: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100"
                  >
                    <option value="CONSULTATION">CONSULTATION</option>
                    <option value="LABORATORY">LABORATORY</option>
                    <option value="PHARMACY">PHARMACY</option>
                    <option value="RADIOLOGY">RADIOLOGY</option>
                    <option value="ROOM_ACCOMMODATION">ROOM_ACCOMMODATION</option>
                    <option value="PROCEDURE">PROCEDURE</option>
                    <option value="OTHER">OTHER</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Service Code</label>
                  <input
                    type="text"
                    placeholder="e.g. LAB-CBC"
                    value={chargeForm.serviceCode}
                    onChange={e => setChargeForm({ ...chargeForm, serviceCode: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Service Description</label>
                <input
                  type="text"
                  placeholder="e.g. Complete Blood Count test"
                  value={chargeForm.description}
                  onChange={e => setChargeForm({ ...chargeForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={chargeForm.quantity}
                    onChange={e => setChargeForm({ ...chargeForm, quantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Unit Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={chargeForm.unitPrice}
                    onChange={e => setChargeForm({ ...chargeForm, unitPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowChargeModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-sm"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold">
                  Record Charge
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COUNTER PAYMENT POS MODAL */}
      {showCounterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">Cashier Counter Payment</h3>
              <button onClick={() => setShowCounterModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleRecordCounterPayment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Invoice ID *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. INV-20261009-00101"
                  value={counterForm.invoiceId}
                  onChange={e => setCounterForm({ ...counterForm, invoiceId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Amount to Pay (₹) *</label>
                <input
                  type="number"
                  required
                  min="0.01"
                  step="0.01"
                  placeholder="Enter amount"
                  value={counterForm.amount}
                  onChange={e => setCounterForm({ ...counterForm, amount: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 font-bold text-emerald-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Payment Method</label>
                <select
                  value={counterForm.paymentMethod}
                  onChange={e => setCounterForm({ ...counterForm, paymentMethod: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100"
                >
                  <option value="COUNTER_CASH">Counter Cash</option>
                  <option value="COUNTER_CARD">POS Card Swipe</option>
                  <option value="COUNTER_UPI">Counter UPI QR</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Notes / Cashier Reference</label>
                <input
                  type="text"
                  placeholder="e.g. Paid at Desk 2"
                  value={counterForm.notes}
                  onChange={e => setCounterForm({ ...counterForm, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100"
                />
              </div>
              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCounterModal(false)}
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

      {/* RECORD DEPOSIT MODAL */}
      {showDepositModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">Record Patient Deposit</h3>
              <button onClick={() => setShowDepositModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleRecordDeposit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Patient ID *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. P10001"
                  value={depositForm.patientId}
                  onChange={e => setDepositForm({ ...depositForm, patientId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Admission ID (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. ADM202610001"
                  value={depositForm.admissionId}
                  onChange={e => setDepositForm({ ...depositForm, admissionId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Deposit Amount (₹) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="Enter advance amount"
                  value={depositForm.amount}
                  onChange={e => setDepositForm({ ...depositForm, amount: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 font-bold text-purple-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Payment Method</label>
                <select
                  value={depositForm.paymentMethod}
                  onChange={e => setDepositForm({ ...depositForm, paymentMethod: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100"
                >
                  <option value="CASH">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="CARD">Card</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowDepositModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-sm"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-semibold">
                  Save Deposit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REQUEST ADJUSTMENT MODAL */}
      {showAdjustmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">Request Financial Adjustment</h3>
              <button onClick={() => setShowAdjustmentModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleRequestAdjustment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Invoice ID *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. INV-20261009-00101"
                  value={adjustmentForm.invoiceId}
                  onChange={e => setAdjustmentForm({ ...adjustmentForm, invoiceId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Adjustment Type</label>
                <select
                  value={adjustmentForm.type}
                  onChange={e => setAdjustmentForm({ ...adjustmentForm, type: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100"
                >
                  <option value="DISCOUNT">Discount</option>
                  <option value="WAIVER">Waiver</option>
                  <option value="CREDIT">Credit</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Adjustment Amount (₹) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="Enter amount"
                  value={adjustmentForm.amount}
                  onChange={e => setAdjustmentForm({ ...adjustmentForm, amount: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 font-bold text-amber-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Reason for Adjustment *</label>
                <textarea
                  required
                  rows="3"
                  placeholder="State justification for review by Finance Manager..."
                  value={adjustmentForm.reason}
                  onChange={e => setAdjustmentForm({ ...adjustmentForm, reason: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100"
                />
              </div>
              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAdjustmentModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-sm"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold">
                  Submit for Approval
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESOLVE QUERY MODAL */}
      {showResolveModal && selectedQueryForAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">Resolve Billing Dispute</h3>
              <button onClick={() => setShowResolveModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-slate-950 p-3 rounded-lg mb-4 text-xs text-slate-300">
              <div className="font-semibold text-indigo-300">Query: {selectedQueryForAction.queryNumber}</div>
              <div className="mt-1">{selectedQueryForAction.description}</div>
            </div>
            <form onSubmit={handleResolveQuery} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Resolution Response *</label>
                <textarea
                  required
                  rows="4"
                  placeholder="Enter explanatory notes on resolution..."
                  value={resolveForm.resolution}
                  onChange={e => setResolveForm({ ...resolveForm, resolution: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100"
                />
              </div>
              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowResolveModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-sm"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-semibold">
                  Mark Resolved
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD RATE CARD MODAL */}
      {showRateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">Add Rate Card Service</h3>
              <button onClick={() => setShowRateModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateRate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Service Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. LAB-LIPID"
                  value={rateForm.serviceCode}
                  onChange={e => setRateForm({ ...rateForm, serviceCode: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 font-mono uppercase"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Service Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lipid Profile Examination"
                  value={rateForm.serviceName}
                  onChange={e => setRateForm({ ...rateForm, serviceName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
                  <select
                    value={rateForm.category}
                    onChange={e => setRateForm({ ...rateForm, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100"
                  >
                    <option value="CONSULTATION">CONSULTATION</option>
                    <option value="ROOM_ACCOMMODATION">ROOM_ACCOMMODATION</option>
                    <option value="LABORATORY">LABORATORY</option>
                    <option value="PHARMACY">PHARMACY</option>
                    <option value="RADIOLOGY">RADIOLOGY</option>
                    <option value="NURSING">NURSING</option>
                    <option value="PROCEDURE">PROCEDURE</option>
                    <option value="OTHER">OTHER</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Unit</label>
                  <input
                    type="text"
                    placeholder="PER_TEST"
                    value={rateForm.unit}
                    onChange={e => setRateForm({ ...rateForm, unit: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Base Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="Price"
                    value={rateForm.basePrice}
                    onChange={e => setRateForm({ ...rateForm, basePrice: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 font-bold text-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Tax Rate (e.g. 0.05)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    placeholder="0"
                    value={rateForm.taxRate}
                    onChange={e => setRateForm({ ...rateForm, taxRate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowRateModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-sm"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold">
                  Add to Catalog
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillingManagementPage;
