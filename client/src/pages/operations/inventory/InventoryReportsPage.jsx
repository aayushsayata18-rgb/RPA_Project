import React, { useState, useEffect } from 'react';
import {
  FileText,
  DollarSign,
  TrendingUp,
  Clock,
  AlertTriangle,
  Download,
  RefreshCw,
  Search,
  Filter,
  Layers,
  ArrowRight
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import inventoryService from '../../../services/inventoryService';

export const InventoryReportsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'valuation');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Report data states
  const [valuationData, setValuationData] = useState({ totalValuation: 0, itemsCount: 0, categoryValuation: [], items: [] });
  const [ledgerData, setLedgerData] = useState([]);
  const [nearExpiryData, setNearExpiryData] = useState([]);
  const [lowStockData, setLowStockData] = useState([]);

  const [expiryDays, setExpiryDays] = useState(30);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (activeTab === 'valuation') {
        const res = await inventoryService.getValuationReport();
        if (res?.data) {
          setValuationData(res.data.valuation || {});
        }
      } else if (activeTab === 'ledger') {
        const res = await inventoryService.getLedgerReport({ limit: 50 });
        if (res?.data) {
          setLedgerData(res.data.movements || []);
        }
      } else if (activeTab === 'expiry') {
        const res = await inventoryService.getNearExpiryReport(expiryDays);
        if (res?.data) {
          setNearExpiryData(res.data.nearExpiryBatches || []);
        }
      } else if (activeTab === 'lowstock') {
        const res = await inventoryService.getLowStockReport();
        if (res?.data) {
          setLowStockData(res.data.lowStockItems || []);
        }
      }
    } catch (err) {
      console.error('Error fetching inventory report:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load report data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [activeTab, expiryDays]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.5rem'
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: '700', color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <FileText style={{ color: '#0284c7' }} />
            Medical Inventory Analytics & Audit Reports
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0 0', fontSize: '0.95rem' }}>
            Authoritative valuation reports, immutable stock movement audit ledger, and expiry horizons.
          </p>
        </div>

        <button
          onClick={fetchReportData}
          style={{
            padding: '0.5rem 0.75rem',
            backgroundColor: '#fff',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          borderBottom: '1px solid var(--border-color)',
          marginBottom: '1.5rem',
          flexWrap: 'wrap'
        }}
      >
        <button
          onClick={() => handleTabChange('valuation')}
          style={{
            padding: '0.65rem 1rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'valuation' ? '2px solid #0284c7' : '2px solid transparent',
            color: activeTab === 'valuation' ? '#0284c7' : 'var(--text-muted)',
            fontWeight: activeTab === 'valuation' ? '600' : 'normal',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontSize: '0.9rem'
          }}
        >
          <DollarSign size={16} /> Total Valuation
        </button>

        <button
          onClick={() => handleTabChange('ledger')}
          style={{
            padding: '0.65rem 1rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'ledger' ? '2px solid #0284c7' : '2px solid transparent',
            color: activeTab === 'ledger' ? '#0284c7' : 'var(--text-muted)',
            fontWeight: activeTab === 'ledger' ? '600' : 'normal',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontSize: '0.9rem'
          }}
        >
          <TrendingUp size={16} /> Movement Audit Ledger
        </button>

        <button
          onClick={() => handleTabChange('expiry')}
          style={{
            padding: '0.65rem 1rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'expiry' ? '2px solid #0284c7' : '2px solid transparent',
            color: activeTab === 'expiry' ? '#0284c7' : 'var(--text-muted)',
            fontWeight: activeTab === 'expiry' ? '600' : 'normal',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontSize: '0.9rem'
          }}
        >
          <Clock size={16} /> Near-Expiry Schedule
        </button>

        <button
          onClick={() => handleTabChange('lowstock')}
          style={{
            padding: '0.65rem 1rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'lowstock' ? '2px solid #0284c7' : '2px solid transparent',
            color: activeTab === 'lowstock' ? '#0284c7' : 'var(--text-muted)',
            fontWeight: activeTab === 'lowstock' ? '600' : 'normal',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontSize: '0.9rem'
          }}
        >
          <AlertTriangle size={16} /> Low-Stock Replenishment
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center' }}>
          <RefreshCw size={32} className="animate-spin" style={{ color: 'var(--primary-color)' }} />
        </div>
      ) : activeTab === 'valuation' ? (
        /* TAB 1: VALUATION REPORT */
        <div>
          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ background: '#fff', padding: '1.25rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Stock Valuation</div>
              <div style={{ fontSize: '1.875rem', fontWeight: '700', color: '#0284c7', margin: '0.25rem 0' }}>
                ₹{(valuationData.totalValuation || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Across {valuationData.itemsCount || 0} active catalog items</div>
            </div>

            {(valuationData.categoryValuation || []).map((cat, idx) => (
              <div key={idx} style={{ background: '#fff', padding: '1.25rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{cat.category || cat._id}</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-main)', margin: '0.25rem 0' }}>
                  ₹{(cat.totalValuation || cat.valuation || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{cat.itemsCount || 0} items</div>
              </div>
            ))}
          </div>

          {/* Items Valuation Table */}
          <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
            <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', fontWeight: '600' }}>
              Item Valuation Ledger
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.6rem 1rem' }}>Item Code</th>
                    <th style={{ padding: '0.6rem 1rem' }}>Name</th>
                    <th style={{ padding: '0.6rem 1rem' }}>Category</th>
                    <th style={{ padding: '0.6rem 1rem', textAlign: 'right' }}>Quantity</th>
                    <th style={{ padding: '0.6rem 1rem', textAlign: 'right' }}>Avg Unit Cost</th>
                    <th style={{ padding: '0.6rem 1rem', textAlign: 'right' }}>Total Value</th>
                  </tr>
                </thead>
                <tbody>
                  {(valuationData.items || []).map((it, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.6rem 1rem', fontWeight: '600' }}>{it.inventoryItemId}</td>
                      <td style={{ padding: '0.6rem 1rem' }}>{it.name}</td>
                      <td style={{ padding: '0.6rem 1rem' }}>{it.category}</td>
                      <td style={{ padding: '0.6rem 1rem', textAlign: 'right', fontWeight: '600' }}>{it.currentStock}</td>
                      <td style={{ padding: '0.6rem 1rem', textAlign: 'right' }}>₹{it.unitCost || 0}</td>
                      <td style={{ padding: '0.6rem 1rem', textAlign: 'right', fontWeight: '700', color: '#0284c7' }}>
                        ₹{(it.totalValue || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : activeTab === 'ledger' ? (
        /* TAB 2: AUDIT LEDGER */
        <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
          <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', fontWeight: '600' }}>
            Immutable Stock Movement Trail (Last 50 Ledger Postings)
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.6rem 1rem' }}>Timestamp</th>
                  <th style={{ padding: '0.6rem 1rem' }}>Movement ID</th>
                  <th style={{ padding: '0.6rem 1rem' }}>Item & Batch</th>
                  <th style={{ padding: '0.6rem 1rem' }}>Type</th>
                  <th style={{ padding: '0.6rem 1rem', textAlign: 'right' }}>Qty Change</th>
                  <th style={{ padding: '0.6rem 1rem', textAlign: 'right' }}>Balance</th>
                  <th style={{ padding: '0.6rem 1rem' }}>Reference</th>
                  <th style={{ padding: '0.6rem 1rem' }}>Actor</th>
                </tr>
              </thead>
              <tbody>
                {ledgerData.map((m) => (
                  <tr key={m._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.6rem 1rem', color: 'var(--text-muted)' }}>
                      {new Date(m.timestamp || m.createdAt).toLocaleString()}
                    </td>
                    <td style={{ padding: '0.6rem 1rem', fontWeight: '600' }}>{m.movementId}</td>
                    <td style={{ padding: '0.6rem 1rem' }}>
                      <div style={{ fontWeight: '500' }}>{m.itemName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{m.batchNumber || m.batchId}</div>
                    </td>
                    <td style={{ padding: '0.6rem 1rem' }}>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '10px',
                          fontSize: '0.7rem',
                          fontWeight: '600',
                          backgroundColor:
                            m.movementType === 'RECEIPT' || m.movementType === 'TRANSFER_IN' || m.movementType === 'ADJUSTMENT_IN'
                              ? '#dcfce7'
                              : '#fee2e2',
                          color:
                            m.movementType === 'RECEIPT' || m.movementType === 'TRANSFER_IN' || m.movementType === 'ADJUSTMENT_IN'
                              ? '#166534'
                              : '#991b1b'
                        }}
                      >
                        {m.movementType}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: '0.6rem 1rem',
                        textAlign: 'right',
                        fontWeight: '700',
                        color: m.quantityChange > 0 ? '#16a34a' : '#dc2626'
                      }}
                    >
                      {m.quantityChange > 0 ? `+${m.quantityChange}` : m.quantityChange}
                    </td>
                    <td style={{ padding: '0.6rem 1rem', textAlign: 'right', fontWeight: '600' }}>{m.balanceAfter ?? '-'}</td>
                    <td style={{ padding: '0.6rem 1rem', color: 'var(--text-muted)' }}>
                      {m.referenceType}: {m.referenceId}
                    </td>
                    <td style={{ padding: '0.6rem 1rem', color: 'var(--text-muted)' }}>
                      {m.actorName || m.actorId || 'System'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'expiry' ? (
        /* TAB 3: NEAR EXPIRY */
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Expiry Horizon:</span>
            <select
              value={expiryDays}
              onChange={(e) => setExpiryDays(Number(e.target.value))}
              style={{ padding: '0.4rem 0.6rem', border: '1px solid var(--border-color)', borderRadius: '6px' }}
            >
              <option value="30">Within 30 Days</option>
              <option value="60">Within 60 Days</option>
              <option value="90">Within 90 Days</option>
              <option value="180">Within 180 Days</option>
            </select>
          </div>

          <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.6rem 1rem' }}>Batch Number</th>
                    <th style={{ padding: '0.6rem 1rem' }}>Item</th>
                    <th style={{ padding: '0.6rem 1rem' }}>Storage Location</th>
                    <th style={{ padding: '0.6rem 1rem' }}>Expiry Date</th>
                    <th style={{ padding: '0.6rem 1rem', textAlign: 'right' }}>Available Qty</th>
                    <th style={{ padding: '0.6rem 1rem' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {nearExpiryData.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No batches expiring within {expiryDays} days.
                      </td>
                    </tr>
                  ) : (
                    nearExpiryData.map((b) => (
                      <tr key={b.batchId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.6rem 1rem', fontWeight: '600' }}>{b.batchNumber || b.batchId}</td>
                        <td style={{ padding: '0.6rem 1rem' }}>{b.itemName || b.medicineName}</td>
                        <td style={{ padding: '0.6rem 1rem' }}>{b.storageLocation || b.locationId}</td>
                        <td style={{ padding: '0.6rem 1rem', fontWeight: '700', color: '#dc2626' }}>
                          {new Date(b.expiryDate).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '0.6rem 1rem', textAlign: 'right', fontWeight: '700' }}>
                          {b.availableQuantity}
                        </td>
                        <td style={{ padding: '0.6rem 1rem' }}>
                          <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '0.7rem', background: '#fee2e2', color: '#991b1b', fontWeight: '600' }}>
                            {b.status}
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
      ) : (
        /* TAB 4: LOW STOCK REPLENISHMENT */
        <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
          <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', fontWeight: '600' }}>
            Replenishment Action List (Stock at or below reorder level)
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.6rem 1rem' }}>Item Code</th>
                  <th style={{ padding: '0.6rem 1rem' }}>Item Name</th>
                  <th style={{ padding: '0.6rem 1rem' }}>Category</th>
                  <th style={{ padding: '0.6rem 1rem', textAlign: 'right' }}>Available</th>
                  <th style={{ padding: '0.6rem 1rem', textAlign: 'right' }}>Reorder Level</th>
                  <th style={{ padding: '0.6rem 1rem', textAlign: 'right' }}>Suggested Order Qty</th>
                </tr>
              </thead>
              <tbody>
                {lowStockData.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      All items are sufficiently stocked above reorder thresholds.
                    </td>
                  </tr>
                ) : (
                  lowStockData.map((it) => (
                    <tr key={it._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.6rem 1rem', fontWeight: '600' }}>{it.inventoryItemId}</td>
                      <td style={{ padding: '0.6rem 1rem', fontWeight: '500' }}>{it.name}</td>
                      <td style={{ padding: '0.6rem 1rem' }}>{it.category}</td>
                      <td style={{ padding: '0.6rem 1rem', textAlign: 'right', fontWeight: '700', color: '#dc2626' }}>
                        {it.availableStock || 0}
                      </td>
                      <td style={{ padding: '0.6rem 1rem', textAlign: 'right', fontWeight: '600' }}>{it.reorderLevel}</td>
                      <td style={{ padding: '0.6rem 1rem', textAlign: 'right', fontWeight: '700', color: '#0284c7' }}>
                        {it.reorderQuantity || 100}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
