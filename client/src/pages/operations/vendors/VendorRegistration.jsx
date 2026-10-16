import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Building2,
  AlertTriangle,
  CheckCircle2,
  ArrowLeft,
  Save,
  ShieldCheck,
  Users,
  MapPin,
  CreditCard,
  FileText,
  Search,
  Check,
  AlertCircle
} from 'lucide-react';
import vendorService from '../../../services/vendorService';

export const VendorRegistration = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [duplicateCheckLoading, setDuplicateCheckLoading] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [duplicateOk, setDuplicateOk] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    legalName: '',
    tradeName: '',
    taxId: '',
    registrationNumber: '',
    categories: ['PHARMACEUTICALS'],
    paymentTerms: 'NET_30',
    currency: 'INR',
    website: '',
    riskTier: 'MEDIUM',
    notes: '',
    // Initial Contact
    contactName: '',
    contactDesignation: '',
    contactEmail: '',
    contactPhone: '',
    // Initial Address
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India'
  });

  const CATEGORY_OPTIONS = [
    { value: 'PHARMACEUTICALS', label: 'Pharmaceuticals & Medicines' },
    { value: 'MEDICAL_EQUIPMENT', label: 'Medical Equipment & Devices' },
    { value: 'SURGICAL_CONSUMABLES', label: 'Surgical Consumables & PPE' },
    { value: 'LAB_REAGENTS', label: 'Lab Reagents & Diagnostics' },
    { value: 'FACILITY_SERVICES', label: 'Facility & Biomedical Services' },
    { value: 'IT_SERVICES', label: 'IT & Software Infrastructure' },
    { value: 'OFFICE_SUPPLIES', label: 'General Office Supplies' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setDuplicateOk(false);
  };

  const handleCategoryToggle = (catValue) => {
    setFormData((prev) => {
      const exists = prev.categories.includes(catValue);
      const updated = exists
        ? prev.categories.filter((c) => c !== catValue)
        : [...prev.categories, catValue];
      return { ...prev, categories: updated.length ? updated : [catValue] };
    });
  };

  const checkDuplicates = async () => {
    if (!formData.legalName && !formData.taxId) return;

    try {
      setDuplicateCheckLoading(true);
      setDuplicateWarning(null);
      const res = await vendorService.checkDuplicate({
        legalName: formData.legalName,
        taxId: formData.taxId,
        registrationNumber: formData.registrationNumber
      });
      const data = res.data?.data || res.data;
      if (data.isDuplicate) {
        setDuplicateWarning(data.message || 'Potential duplicate supplier detected in system master.');
        setDuplicateOk(false);
      } else {
        setDuplicateOk(true);
        setDuplicateWarning(null);
      }
    } catch (err) {
      console.error('Duplicate preflight check failed:', err);
    } finally {
      setDuplicateCheckLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.legalName) {
      alert('Legal Name is required');
      return;
    }
    if (!formData.taxId) {
      alert('Tax ID (GSTIN / PAN) is required');
      return;
    }

    try {
      setLoading(true);

      // 1. Create Vendor master record
      const payload = {
        legalName: formData.legalName,
        tradeName: formData.tradeName || formData.legalName,
        taxId: formData.taxId,
        registrationNumber: formData.registrationNumber,
        categories: formData.categories,
        paymentTerms: formData.paymentTerms,
        currency: formData.currency,
        website: formData.website,
        riskTier: formData.riskTier,
        notes: formData.notes
      };

      const res = await vendorService.createVendor(payload);
      const newVendor = res.data?.data || res.data;
      const vendorId = newVendor._id;

      // 2. Add Contact if provided
      if (formData.contactName && formData.contactEmail) {
        try {
          await vendorService.createContact(vendorId, {
            name: formData.contactName,
            designation: formData.contactDesignation,
            email: formData.contactEmail,
            phone: formData.contactPhone,
            isPrimary: true
          });
        } catch (contactErr) {
          console.warn('Could not auto-create contact:', contactErr);
        }
      }

      // 3. Add Address if provided
      if (formData.street && formData.city) {
        try {
          await vendorService.createAddress(vendorId, {
            addressType: 'REGISTERED',
            street: formData.street,
            city: formData.city,
            state: formData.state,
            postalCode: formData.postalCode,
            country: formData.country,
            isPrimary: true
          });
        } catch (addrErr) {
          console.warn('Could not auto-create address:', addrErr);
        }
      }

      navigate(`/operations/vendors/${vendorId}`);
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Vendor registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto', color: '#1e293b' }}>
      {/* Back button & Title */}
      <div style={{ marginBottom: '1.5rem' }}>
        <Link
          to="/operations/vendors/list"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: '#64748b',
            textDecoration: 'none',
            fontSize: '0.875rem',
            marginBottom: '0.75rem',
            fontWeight: 500
          }}
        >
          <ArrowLeft size={16} /> Back to Vendor Master Directory
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ padding: '0.6rem', borderRadius: '10px', background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', color: '#fff' }}>
            <Building2 size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
              Vendor Registration & Onboarding
            </h1>
            <p style={{ margin: '0.2rem 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>
              Enroll new supplier with real-time deduplication and compliance checks
            </p>
          </div>
        </div>
      </div>

      {/* Duplicate Alert Banner */}
      {duplicateWarning && (
        <div
          style={{
            padding: '1rem 1.25rem',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '10px',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            color: '#991b1b'
          }}
        >
          <AlertTriangle size={20} style={{ flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 700 }}>Deduplication Warning</div>
            <div style={{ fontSize: '0.85rem' }}>{duplicateWarning}</div>
          </div>
        </div>
      )}

      {duplicateOk && (
        <div
          style={{
            padding: '0.75rem 1.25rem',
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '10px',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: '#166534',
            fontSize: '0.875rem'
          }}
        >
          <CheckCircle2 size={18} />
          <span>Vendor verification clean: No existing matches found for this Legal Name or Tax ID.</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Step 1: Legal Entity Details */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            padding: '1.75rem',
            marginBottom: '1.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
            <Building2 size={18} color="#2563eb" />
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>
              1. Legal Entity Identification
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                Legal Registered Name <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                name="legalName"
                value={formData.legalName}
                onChange={handleInputChange}
                onBlur={checkDuplicates}
                placeholder="e.g., Apex Pharmaceuticals India Ltd."
                required
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                Trade / Brand Name
              </label>
              <input
                type="text"
                name="tradeName"
                value={formData.tradeName}
                onChange={handleInputChange}
                placeholder="e.g., Apex Pharma"
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                Tax Identification (GSTIN / PAN) <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  name="taxId"
                  value={formData.taxId}
                  onChange={handleInputChange}
                  onBlur={checkDuplicates}
                  placeholder="e.g., 27AABCA1234F1Z5"
                  required
                  style={{
                    flex: 1,
                    padding: '0.65rem 0.85rem',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                />
                <button
                  type="button"
                  onClick={checkDuplicates}
                  disabled={duplicateCheckLoading}
                  style={{
                    padding: '0.65rem 1rem',
                    background: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    color: '#334155'
                  }}
                >
                  {duplicateCheckLoading ? 'Checking...' : 'Verify Tax ID'}
                </button>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                Company Registration No. (CIN / MSME)
              </label>
              <input
                type="text"
                name="registrationNumber"
                value={formData.registrationNumber}
                onChange={handleInputChange}
                placeholder="e.g., U24239MH2012PLC123456"
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* Categories */}
          <div style={{ marginTop: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '0.5rem' }}>
              Supply Categories (Select all that apply)
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {CATEGORY_OPTIONS.map((cat) => {
                const selected = formData.categories.includes(cat.value);
                return (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => handleCategoryToggle(cat.value)}
                    style={{
                      padding: '0.45rem 0.85rem',
                      borderRadius: '8px',
                      border: selected ? '2px solid #2563eb' : '1px solid #cbd5e1',
                      background: selected ? '#eff6ff' : '#f8fafc',
                      color: selected ? '#1d4ed8' : '#475569',
                      fontSize: '0.8rem',
                      fontWeight: selected ? 700 : 500,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem'
                    }}
                  >
                    {selected && <Check size={14} />}
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Step 2: Commercial & Risk Profile */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            padding: '1.75rem',
            marginBottom: '1.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
            <CreditCard size={18} color="#2563eb" />
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>
              2. Commercial & Operational Terms
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                Payment Terms
              </label>
              <select
                name="paymentTerms"
                value={formData.paymentTerms}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  background: '#ffffff'
                }}
              >
                <option value="IMMEDIATE">IMMEDIATE</option>
                <option value="NET_15">NET 15 Days</option>
                <option value="NET_30">NET 30 Days (Standard)</option>
                <option value="NET_45">NET 45 Days</option>
                <option value="NET_60">NET 60 Days</option>
                <option value="ADVANCE">100% Advance</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                Settlement Currency
              </label>
              <select
                name="currency"
                value={formData.currency}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  background: '#ffffff'
                }}
              >
                <option value="INR">INR (Indian Rupee)</option>
                <option value="USD">USD (US Dollar)</option>
                <option value="EUR">EUR (Euro)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                Assessed Risk Tier
              </label>
              <select
                name="riskTier"
                value={formData.riskTier}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  background: '#ffffff'
                }}
              >
                <option value="LOW">LOW Risk (Established Brand / FMCG)</option>
                <option value="MEDIUM">MEDIUM Risk (Standard Pharma Distributor)</option>
                <option value="HIGH">HIGH Risk (New / Critical Drug Supplier)</option>
                <option value="CRITICAL">CRITICAL Risk (Single Source / High Impact)</option>
              </select>
            </div>
          </div>

          <div style={{ marginTop: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
              Vendor Website or Portal URL
            </label>
            <input
              type="url"
              name="website"
              value={formData.website}
              onChange={handleInputChange}
              placeholder="https://www.apexpharma.in"
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                fontSize: '0.875rem',
                outline: 'none'
              }}
            />
          </div>
        </div>

        {/* Step 3: Primary Contact & Address */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            padding: '1.75rem',
            marginBottom: '1.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
            <Users size={18} color="#2563eb" />
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>
              3. Primary Contact Person & Operating Location
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                Contact Name
              </label>
              <input
                type="text"
                name="contactName"
                value={formData.contactName}
                onChange={handleInputChange}
                placeholder="Dr. Rajesh Sharma"
                style={{ width: '100%', padding: '0.65rem 0.85rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.875rem' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                Designation
              </label>
              <input
                type="text"
                name="contactDesignation"
                value={formData.contactDesignation}
                onChange={handleInputChange}
                placeholder="Institutional Head"
                style={{ width: '100%', padding: '0.65rem 0.85rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.875rem' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                Email Address
              </label>
              <input
                type="email"
                name="contactEmail"
                value={formData.contactEmail}
                onChange={handleInputChange}
                placeholder="rajesh@apexpharma.in"
                style={{ width: '100%', padding: '0.65rem 0.85rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.875rem' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                Phone Number
              </label>
              <input
                type="text"
                name="contactPhone"
                value={formData.contactPhone}
                onChange={handleInputChange}
                placeholder="+91 98200 12345"
                style={{ width: '100%', padding: '0.65rem 0.85rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.875rem' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                Registered Address Line
              </label>
              <input
                type="text"
                name="street"
                value={formData.street}
                onChange={handleInputChange}
                placeholder="Plot 42, MIDC Industrial Area, Andheri East"
                style={{ width: '100%', padding: '0.65rem 0.85rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.875rem' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                City
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                placeholder="Mumbai"
                style={{ width: '100%', padding: '0.65rem 0.85rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.875rem' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                State
              </label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleInputChange}
                placeholder="Maharashtra"
                style={{ width: '100%', padding: '0.65rem 0.85rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.875rem' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                Postal Code
              </label>
              <input
                type="text"
                name="postalCode"
                value={formData.postalCode}
                onChange={handleInputChange}
                placeholder="400093"
                style={{ width: '100%', padding: '0.65rem 0.85rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.875rem' }}
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
          <button
            type="button"
            onClick={() => navigate('/operations/vendors/list')}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#f1f5f9',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              color: '#334155'
            }}
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 2rem',
              background: '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 4px rgba(37, 99, 235, 0.25)',
              opacity: loading ? 0.7 : 1
            }}
          >
            <Save size={18} />
            {loading ? 'Creating Vendor Master...' : 'Register Vendor & Open Dossier'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default VendorRegistration;
