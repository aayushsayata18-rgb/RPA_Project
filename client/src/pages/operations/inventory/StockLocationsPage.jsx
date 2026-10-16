import React, { useState, useEffect } from 'react';
import {
  Warehouse,
  Plus,
  RefreshCw,
  Search,
  CheckCircle,
  Thermometer,
  Layers,
  MapPin,
  X,
  User,
  Sliders
} from 'lucide-react';
import inventoryService from '../../../services/inventoryService';

export const StockLocationsPage = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  // Create location modal
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    locationId: '',
    name: '',
    department: 'PHARMACY',
    locationType: 'PHARMACY',
    building: 'Main Block',
    floor: 'Ground Floor',
    room: 'Room 102',
    temperatureControlled: false,
    minTemperature: 15,
    maxTemperature: 25,
    managerName: '',
    contactNumber: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await inventoryService.getLocations();
      if (res?.data) {
        setLocations(res.data.locations || []);
      }
    } catch (err) {
      console.error('Error fetching locations:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load locations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      await inventoryService.createLocation(form);
      setShowModal(false);
      setForm({
        locationId: '',
        name: '',
        department: 'PHARMACY',
        locationType: 'PHARMACY',
        building: 'Main Block',
        floor: 'Ground Floor',
        room: 'Room 102',
        temperatureControlled: false,
        minTemperature: 15,
        maxTemperature: 25,
        managerName: '',
        contactNumber: ''
      });
      fetchLocations();
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || 'Failed to create location.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredLocations = locations.filter((loc) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      loc.name?.toLowerCase().includes(q) ||
      loc.locationId?.toLowerCase().includes(q) ||
      loc.department?.toLowerCase().includes(q) ||
      loc.locationType?.toLowerCase().includes(q)
    );
  });

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
            <Warehouse style={{ color: '#0284c7' }} />
            Stock Storage Locations & Warehouses
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0 0', fontSize: '0.95rem' }}>
            Hospital storage points, pharmacy stores, cold chain freezers, OT supplies, and quarantine zones.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setShowModal(true)}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#0284c7',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.85rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
          >
            <Plus size={16} /> Add Storage Location
          </button>
          <button
            onClick={fetchLocations}
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
      </div>

      {/* Search Bar */}
      <div
        style={{
          background: 'var(--bg-card, #fff)',
          padding: '1rem',
          borderRadius: '8px',
          border: '1px solid var(--border-color)',
          marginBottom: '1.5rem',
          maxWidth: '450px'
        }}
      >
        <div style={{ position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search by name, ID, or department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem 0.5rem 0.5rem 2.2rem',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              fontSize: '0.9rem'
            }}
          />
        </div>
      </div>

      {/* Locations Cards Grid */}
      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center' }}>
          <RefreshCw size={32} className="animate-spin" style={{ color: 'var(--primary-color)' }} />
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '1.25rem'
          }}
        >
          {filteredLocations.map((loc) => {
            const isCold = loc.temperatureControlled || (loc.maxTemperature && loc.maxTemperature <= 8);
            return (
              <div
                key={loc._id}
                style={{
                  background: '#fff',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  padding: '1.25rem',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--text-main)', fontWeight: '600' }}>
                        {loc.name}
                      </h3>
                      <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#0284c7', marginTop: '0.2rem' }}>
                        {loc.locationId}
                      </div>
                    </div>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '10px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        backgroundColor: loc.status === 'ACTIVE' ? '#dcfce7' : '#fee2e2',
                        color: loc.status === 'ACTIVE' ? '#166534' : '#991b1b'
                      }}
                    >
                      {loc.status}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Layers size={15} />
                      <span>{loc.department} • {loc.locationType}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <MapPin size={15} />
                      <span>{loc.building || 'Main Block'}, {loc.floor || 'Floor 1'}, {loc.room || 'Room 101'}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Thermometer size={15} style={{ color: isCold ? '#0284c7' : 'inherit' }} />
                      <span style={{ color: isCold ? '#0284c7' : 'inherit', fontWeight: isCold ? '600' : 'normal' }}>
                        {loc.temperatureControlled
                          ? `Temp Controlled: ${loc.minTemperature ?? 2}°C to ${loc.maxTemperature ?? 8}°C`
                          : 'Ambient (15°C - 25°C)'}
                      </span>
                    </div>

                    {loc.managerName && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <User size={15} />
                        <span>Manager: {loc.managerName}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div
                  style={{
                    borderTop: '1px solid #f1f5f9',
                    paddingTop: '0.75rem',
                    marginTop: '1rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.8rem'
                  }}
                >
                  <span style={{ color: 'var(--text-muted)' }}>Storage Zone</span>
                  <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{loc.storageZone || 'Standard'}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Location Modal */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: '10px',
              padding: '1.5rem',
              maxWidth: '550px',
              width: '90%',
              maxHeight: '85vh',
              overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Plus size={20} style={{ color: '#0284c7' }} />
                Add Stock Storage Location
              </h3>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div style={{ padding: '0.75rem', background: '#fee2e2', color: '#b91c1c', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.85rem' }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.25rem' }}>Location Code *</label>
                  <input
                    type="text"
                    value={form.locationId}
                    onChange={(e) => setForm({ ...form, locationId: e.target.value })}
                    placeholder="e.g. LOC-NICU-001"
                    style={{ width: '100%', padding: '0.45rem', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.25rem' }}>Location Name *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Neonatal ICU Sub-Store"
                    style={{ width: '100%', padding: '0.45rem', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.25rem' }}>Department *</label>
                  <select
                    value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                    style={{ width: '100%', padding: '0.45rem', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                  >
                    <option value="CENTRAL_STORE">Central Store</option>
                    <option value="PHARMACY">Pharmacy</option>
                    <option value="EMERGENCY">Emergency</option>
                    <option value="OPERATION_THEATRE">Operation Theatre</option>
                    <option value="ICU">ICU</option>
                    <option value="INPATIENT_WARD">Inpatient Ward</option>
                    <option value="LABORATORY">Laboratory</option>
                    <option value="RADIOLOGY">Radiology</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.25rem' }}>Location Type *</label>
                  <select
                    value={form.locationType}
                    onChange={(e) => setForm({ ...form, locationType: e.target.value })}
                    style={{ width: '100%', padding: '0.45rem', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                  >
                    <option value="MAIN_STORE">Main Store</option>
                    <option value="PHARMACY">Pharmacy</option>
                    <option value="DEPARTMENT_STORE">Department Store</option>
                    <option value="WARD_STOCK">Ward Stock</option>
                    <option value="COLD_ROOM">Cold Room</option>
                    <option value="QUARANTINE">Quarantine</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.25rem' }}>Building & Floor</label>
                  <input
                    type="text"
                    value={form.building}
                    onChange={(e) => setForm({ ...form, building: e.target.value })}
                    placeholder="e.g. Tower B, 3rd Floor"
                    style={{ width: '100%', padding: '0.45rem', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.25rem' }}>Manager Name</label>
                  <input
                    type="text"
                    value={form.managerName}
                    onChange={(e) => setForm({ ...form, managerName: e.target.value })}
                    placeholder="e.g. Sister Mary"
                    style={{ width: '100%', padding: '0.45rem', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                  />
                </div>
              </div>

              <div style={{ marginTop: '0.75rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: '600' }}>
                  <input
                    type="checkbox"
                    checked={form.temperatureControlled}
                    onChange={(e) => setForm({ ...form, temperatureControlled: e.target.checked })}
                  />
                  Temperature Controlled Storage (Cold Chain)
                </label>
              </div>

              {form.temperatureControlled && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', marginTop: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Min Temp (°C)</label>
                    <input
                      type="number"
                      value={form.minTemperature}
                      onChange={(e) => setForm({ ...form, minTemperature: Number(e.target.value) })}
                      style={{ width: '100%', padding: '0.45rem', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Max Temp (°C)</label>
                    <input
                      type="number"
                      value={form.maxTemperature}
                      onChange={(e) => setForm({ ...form, maxTemperature: Number(e.target.value) })}
                      style={{ width: '100%', padding: '0.45rem', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                    />
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.25rem' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{ padding: '0.5rem 1rem', border: '1px solid var(--border-color)', background: '#fff', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: '0.5rem 1.25rem',
                    background: '#0284c7',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  {submitting ? 'Saving...' : 'Create Location'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
