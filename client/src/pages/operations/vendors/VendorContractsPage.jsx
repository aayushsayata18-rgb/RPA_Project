import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Award,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCw,
  Search,
  DollarSign,
  Calendar,
  Building2
} from 'lucide-react';
import vendorService from '../../../services/vendorService';

export const VendorContractsPage = () => {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [expiryAlerts, setExpiryAlerts] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchContracts = async () => {
    try {
      setLoading(true);
      const vRes = await vendorService.getVendors({ limit: 50 });
      const vendorsList = (vRes.data?.data || vRes.data).vendors || [];

      const contractPromises = vendorsList.map(async (v) => {
        try {
          const cRes = await vendorService.getContracts(v._id);
          const cList = cRes.data?.data || cRes.data || [];
          return cList.map((con) => ({
            ...con,
            vendorName: v.legalName,
            vendorCode: v.vendorCode,
            vendorId: v._id
          }));
        } catch {
          return [];
        }
      });

      const allContractsNested = await Promise.all(contractPromises);
      setContracts(allContractsNested.flat());
    } catch (err) {
      console.error('Failed to load contracts registry:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, []);

  const handleCheckExpiring = async () => {
    try {
      setChecking(true);
      const res = await vendorService.checkExpiringContracts();
      const data = res.data?.data || res.data;
      setExpiryAlerts(data);
      alert(`Contracts Expiry Scan Complete!\nFound ${data.expiringContractsCount || 0} contract(s) due for renewal within 60 days.`);
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setChecking(false);
    }
  };

  const filteredContracts = contracts.filter((c) => {
    const matchesSearch =
      c.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.contractNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.vendorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.vendorCode?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = typeFilter ? c.contractType === typeFilter : true;
    const matchesStatus = statusFilter ? c.status === statusFilter : true;
    return matchesSearch && matchesType && matchesStatus;
  });

  const totalValue = contracts.reduce((acc, c) => acc + (c.value || 0), 0);
  const activeContractsCount = contracts.filter((c) => c.status === 'ACTIVE').length;

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto', color: '#1e293b' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ padding: '0.6rem', borderRadius: '10px', background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', color: '#fff' }}>
              <Award size={24} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                Vendor Contracts & Renewals Registry
              </h1>
              <p style={{ margin: '0.2rem 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>
                Centrally managed master service agreements, rate cards, and automated renewal windows
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={fetchContracts}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.65rem 1.1rem',
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              color: '#334155'
            }}
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            Refresh
          </button>

          <button
            onClick={handleCheckExpiring}
            disabled={checking}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.65rem 1.25rem',
              background: '#059669',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: 700,
              cursor: checking ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 4px rgba(5, 150, 105, 0.25)',
              opacity: checking ? 0.7 : 1
            }}
          >
            <Clock size={16} />
            {checking ? 'Scanning Renewals...' : 'Scan 60-Day Renewal Notice'}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>
            <span>Total Agreements</span>
            <Award size={18} color="#2563eb" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a', marginTop: '0.5rem' }}>
            {contracts.length}
          </div>
        </div>

        <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>
            <span>Active Enforced Contracts</span>
            <CheckCircle2 size={18} color="#16a34a" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#16a34a', marginTop: '0.5rem' }}>
            {activeContractsCount}
          </div>
        </div>

        <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>
            <span>Total Committed Value</span>
            <DollarSign size={18} color="#059669" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#059669', marginTop: '0.5rem' }}>
            ₹{totalValue.toLocaleString('en-IN')}
          </div>
        </div>

        <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>
            <span>Renewal Window Alerts</span>
            <Clock size={18} color="#d97706" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#d97706', marginTop: '0.5rem' }}>
            {expiryAlerts?.expiringContractsCount || 0}
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 300px' }}>
          <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Search contracts by title, contract number, or supplier..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '0.65rem 0.75rem 0.65rem 2.4rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.875rem' }}
          />
        </div>

        <div style={{ minWidth: '180px' }}>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{ width: '100%', padding: '0.65rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.875rem', background: '#ffffff' }}
          >
            <option value="">All Contract Types</option>
            <option value="RATE_CONTRACT">Rate Contract (RC)</option>
            <option value="FIXED_PRICE">Fixed Price Contract</option>
            <option value="SERVICE_AGREEMENT">Service Agreement (SLA)</option>
            <option value="NDA">Non-Disclosure Agreement (NDA)</option>
          </select>
        </div>

        <div style={{ minWidth: '160px' }}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ width: '100%', padding: '0.65rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.875rem', background: '#ffffff' }}
          >
            <option value="">All Contract Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="DRAFT">DRAFT</option>
            <option value="PENDING_APPROVAL">PENDING_APPROVAL</option>
            <option value="EXPIRED">EXPIRED</option>
            <option value="TERMINATED">TERMINATED</option>
          </select>
        </div>
      </div>

      {/* Contracts Table */}
      <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 600 }}>
              <th style={{ padding: '0.9rem 1.25rem' }}>Contract & Number</th>
              <th style={{ padding: '0.9rem 1.25rem' }}>Supplier Entity</th>
              <th style={{ padding: '0.9rem 1.25rem' }}>Contract Type</th>
              <th style={{ padding: '0.9rem 1.25rem' }}>Validity Period</th>
              <th style={{ padding: '0.9rem 1.25rem' }}>Committed Value</th>
              <th style={{ padding: '0.9rem 1.25rem' }}>Status</th>
              <th style={{ padding: '0.9rem 1.25rem', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                  <RefreshCw size={24} className="spin" style={{ margin: '0 auto 0.5rem auto', display: 'block' }} />
                  Loading contract records...
                </td>
              </tr>
            ) : filteredContracts.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                  <Award size={36} style={{ margin: '0 auto 0.5rem auto', display: 'block', opacity: 0.4 }} />
                  No contracts found matching your filters.
                </td>
              </tr>
            ) : (
              filteredContracts.map((c) => (
                <tr key={c._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <div style={{ fontWeight: 700, color: '#1e293b' }}>{c.title}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{c.contractNumber}</div>
                  </td>

                  <td style={{ padding: '1rem 1.25rem' }}>
                    <Link to={`/operations/vendors/${c.vendorId}`} style={{ fontWeight: 600, color: '#1d4ed8', textDecoration: 'none' }}>
                      {c.vendorName}
                    </Link>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{c.vendorCode}</div>
                  </td>

                  <td style={{ padding: '1rem 1.25rem' }}>
                    <span style={{ padding: '0.15rem 0.5rem', borderRadius: '4px', background: '#f1f5f9', fontWeight: 600, fontSize: '0.75rem' }}>
                      {c.contractType}
                    </span>
                  </td>

                  <td style={{ padding: '1rem 1.25rem', fontSize: '0.8rem', color: '#475569' }}>
                    <div>From: {new Date(c.startDate).toLocaleDateString()}</div>
                    <div>To: <strong>{new Date(c.endDate).toLocaleDateString()}</strong></div>
                  </td>

                  <td style={{ padding: '1rem 1.25rem', fontWeight: 700, color: '#0f172a' }}>
                    {c.value ? `₹${c.value.toLocaleString('en-IN')}` : 'Variable Rate'}
                  </td>

                  <td style={{ padding: '1rem 1.25rem' }}>
                    <span
                      style={{
                        padding: '0.2rem 0.6rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        background: c.status === 'ACTIVE' ? '#dcfce7' : '#f1f5f9',
                        color: c.status === 'ACTIVE' ? '#15803d' : '#64748b'
                      }}
                    >
                      {c.status}
                    </span>
                  </td>

                  <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                    <Link
                      to={`/operations/vendors/${c.vendorId}`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        padding: '0.45rem 0.85rem',
                        background: '#f1f5f9',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        color: '#1e293b',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        textDecoration: 'none'
                      }}
                    >
                      View Dossier &rarr;
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default VendorContractsPage;
