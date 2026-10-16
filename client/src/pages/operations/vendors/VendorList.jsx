import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Building2,
  Search,
  Filter,
  Plus,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  FileText,
  CheckCircle2,
  TrendingUp,
  Tag,
  Eye
} from 'lucide-react';
import vendorService from '../../../services/vendorService';
import { VendorStatusBadge } from '../../../components/vendor/VendorStatusBadge';
import { VendorRiskBadge } from '../../../components/vendor/VendorRiskBadge';
import { VendorVerificationBadge } from '../../../components/vendor/VendorVerificationBadge';

export const VendorList = () => {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });

  const fetchVendors = async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 10,
        search: searchTerm || undefined,
        status: statusFilter || undefined,
        category: categoryFilter || undefined,
        riskTier: riskFilter || undefined
      };
      const res = await vendorService.getVendors(params);
      const data = res.data?.data || res.data;
      setVendors(data.vendors || []);
      setPagination({
        page: data.pagination?.page || 1,
        limit: data.pagination?.limit || 10,
        total: data.pagination?.total || 0,
        pages: data.pagination?.pages || 1
      });
    } catch (err) {
      console.error('Failed to fetch vendors:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors(1);
  }, [statusFilter, categoryFilter, riskFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchVendors(1);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setCategoryFilter('');
    setRiskFilter('');
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto', color: '#1e293b' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ padding: '0.6rem', borderRadius: '10px', background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', color: '#fff' }}>
              <Building2 size={24} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                Vendor Master Directory
              </h1>
              <p style={{ margin: '0.2rem 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>
                Authoritative register of verified suppliers, pharmaceutical vendors & service providers
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={() => fetchVendors(pagination.page)}
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

          <Link
            to="/operations/vendors/new"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.65rem 1.25rem',
              background: '#2563eb',
              color: '#ffffff',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: 600,
              textDecoration: 'none',
              boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)'
            }}
          >
            <Plus size={18} />
            Register New Vendor
          </Link>
        </div>
      </div>

      {/* Filters Bar */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          padding: '1.25rem',
          marginBottom: '1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}
      >
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 280px' }}>
            <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search by Vendor Code, Legal Name, or Tax ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem 0.75rem 0.65rem 2.4rem',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                fontSize: '0.875rem',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ minWidth: '160px' }}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem 0.75rem',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                fontSize: '0.875rem',
                background: '#ffffff'
              }}
            >
              <option value="">All Statuses</option>
              <option value="DRAFT">DRAFT</option>
              <option value="UNDER_REVIEW">UNDER_REVIEW</option>
              <option value="APPROVED">APPROVED</option>
              <option value="ON_HOLD">ON_HOLD</option>
              <option value="SUSPENDED">SUSPENDED</option>
              <option value="DEACTIVATED">DEACTIVATED</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          </div>

          <div style={{ minWidth: '160px' }}>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem 0.75rem',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                fontSize: '0.875rem',
                background: '#ffffff'
              }}
            >
              <option value="">All Categories</option>
              <option value="PHARMACEUTICALS">PHARMACEUTICALS</option>
              <option value="MEDICAL_EQUIPMENT">MEDICAL_EQUIPMENT</option>
              <option value="SURGICAL_CONSUMABLES">SURGICAL_CONSUMABLES</option>
              <option value="LAB_REAGENTS">LAB_REAGENTS</option>
              <option value="FACILITY_SERVICES">FACILITY_SERVICES</option>
              <option value="IT_SERVICES">IT_SERVICES</option>
              <option value="OFFICE_SUPPLIES">OFFICE_SUPPLIES</option>
            </select>
          </div>

          <div style={{ minWidth: '150px' }}>
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem 0.75rem',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                fontSize: '0.875rem',
                background: '#ffffff'
              }}
            >
              <option value="">All Risk Tiers</option>
              <option value="LOW">LOW Risk</option>
              <option value="MEDIUM">MEDIUM Risk</option>
              <option value="HIGH">HIGH Risk</option>
              <option value="CRITICAL">CRITICAL Risk</option>
            </select>
          </div>

          <button
            type="submit"
            style={{
              padding: '0.65rem 1.25rem',
              background: '#0f172a',
              color: '#ffffff',
              borderRadius: '8px',
              border: 'none',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Filter
          </button>

          {(searchTerm || statusFilter || categoryFilter || riskFilter) && (
            <button
              type="button"
              onClick={handleClearFilters}
              style={{
                padding: '0.65rem 1rem',
                background: 'transparent',
                color: '#64748b',
                border: '1px dashed #cbd5e1',
                borderRadius: '8px',
                fontSize: '0.875rem',
                cursor: 'pointer'
              }}
            >
              Reset
            </button>
          )}
        </form>
      </div>

      {/* Vendor Table */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 600 }}>
                <th style={{ padding: '0.9rem 1.25rem' }}>Vendor Details</th>
                <th style={{ padding: '0.9rem 1.25rem' }}>Categories</th>
                <th style={{ padding: '0.9rem 1.25rem' }}>Status</th>
                <th style={{ padding: '0.9rem 1.25rem' }}>Verification</th>
                <th style={{ padding: '0.9rem 1.25rem' }}>Risk Tier</th>
                <th style={{ padding: '0.9rem 1.25rem' }}>Payment Terms</th>
                <th style={{ padding: '0.9rem 1.25rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                    <RefreshCw size={24} className="spin" style={{ margin: '0 auto 0.5rem auto', display: 'block' }} />
                    Loading vendor master records...
                  </td>
                </tr>
              ) : vendors.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                    <Building2 size={36} style={{ margin: '0 auto 0.5rem auto', display: 'block', opacity: 0.4 }} />
                    No vendors found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                vendors.map((vendor) => (
                  <tr
                    key={vendor._id}
                    style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.15s ease' }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    {/* Details */}
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <Link
                          to={`/operations/vendors/${vendor._id}`}
                          style={{
                            fontWeight: 700,
                            color: '#1d4ed8',
                            textDecoration: 'none',
                            fontSize: '0.95rem'
                          }}
                        >
                          {vendor.legalName}
                        </Link>
                        {vendor.tradeName && vendor.tradeName !== vendor.legalName && (
                          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                            Trade: {vendor.tradeName}
                          </span>
                        )}
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.35rem', fontSize: '0.75rem', color: '#64748b' }}>
                          <span style={{ background: '#f1f5f9', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 600 }}>
                            {vendor.vendorCode}
                          </span>
                          {vendor.taxId && (
                            <span>GSTIN: <strong>{vendor.taxId}</strong></span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Categories */}
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                        {(vendor.categories || []).map((cat) => (
                          <span
                            key={cat}
                            style={{
                              padding: '0.15rem 0.5rem',
                              borderRadius: '9999px',
                              background: '#eff6ff',
                              color: '#1e40af',
                              fontSize: '0.7rem',
                              fontWeight: 600
                            }}
                          >
                            {cat}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Status */}
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <VendorStatusBadge status={vendor.status} />
                    </td>

                    {/* Verification */}
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <VendorVerificationBadge status={vendor.verificationStatus} />
                    </td>

                    {/* Risk Tier */}
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <VendorRiskBadge riskTier={vendor.riskTier} score={vendor.performanceScore} />
                    </td>

                    {/* Payment Terms */}
                    <td style={{ padding: '1rem 1.25rem', color: '#475569' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.825rem' }}>{vendor.paymentTerms || 'NET_30'}</div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Currency: {vendor.currency || 'INR'}</div>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                      <button
                        onClick={() => navigate(`/operations/vendors/${vendor._id}`)}
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
                          cursor: 'pointer'
                        }}
                      >
                        <Eye size={14} />
                        View Dossier
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem 1.25rem',
            background: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
            fontSize: '0.875rem',
            color: '#64748b'
          }}
        >
          <div>
            Showing <strong>{vendors.length}</strong> of <strong>{pagination.total}</strong> vendors
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              disabled={pagination.page <= 1}
              onClick={() => fetchVendors(pagination.page - 1)}
              style={{
                padding: '0.4rem 0.8rem',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                background: '#ffffff',
                cursor: pagination.page <= 1 ? 'not-allowed' : 'pointer',
                opacity: pagination.page <= 1 ? 0.5 : 1
              }}
            >
              Previous
            </button>
            <span style={{ display: 'flex', alignItems: 'center', padding: '0 0.5rem', fontWeight: 600 }}>
              Page {pagination.page} of {pagination.pages}
            </span>
            <button
              disabled={pagination.page >= pagination.pages}
              onClick={() => fetchVendors(pagination.page + 1)}
              style={{
                padding: '0.4rem 0.8rem',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                background: '#ffffff',
                cursor: pagination.page >= pagination.pages ? 'not-allowed' : 'pointer',
                opacity: pagination.page >= pagination.pages ? 0.5 : 1
              }}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorList;
