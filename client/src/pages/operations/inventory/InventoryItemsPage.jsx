import React, { useState, useEffect } from 'react';
import {
  Boxes,
  Search,
  Filter,
  Plus,
  ArrowRight,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Eye,
  Sliders,
  X,
  Package,
  Layers,
  FileText
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import inventoryService from '../../../services/inventoryService';

export const InventoryItemsPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [status, setStatus] = useState(searchParams.get('status') || 'ACTIVE');
  const [totalCount, setTotalCount] = useState(0);

  // Quick availability modal state
  const [availItem, setAvailItem] = useState(null);
  const [availData, setAvailData] = useState(null);
  const [availLoading, setAvailLoading] = useState(false);

  // New item modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    itemType: 'MEDICINE',
    name: '',
    genericName: '',
    brandName: '',
    category: 'MEDICINE',
    subcategory: '',
    unitOfMeasure: 'TABLET',
    packSize: 10,
    packUnit: 'STRIP',
    manufacturer: '',
    barcode: '',
    sku: '',
    reorderLevel: 50,
    reorderQuantity: 200,
    minimumStock: 20,
    maximumStock: 1000,
    prescriptionRequired: false,
    controlledItem: false,
    temperatureRequirement: 'Ambient',
    storageRequirements: ''
  });
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState(null);

  const fetchItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (search) params.search = search;
      if (category) params.category = category;
      if (status) params.status = status;

      const res = await inventoryService.getItems(params);
      if (res?.data) {
        setItems(res.data.items || []);
        setTotalCount(res.data.total || 0);
      }
    } catch (err) {
      console.error('Error fetching inventory items:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load inventory items.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [category, status]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchItems();
  };

  const handleOpenAvailability = async (item) => {
    setAvailItem(item);
    setAvailLoading(true);
    try {
      const res = await inventoryService.checkAvailability(item.inventoryItemId);
      setAvailData(res.data.availability || null);
    } catch (err) {
      console.error('Error fetching availability:', err);
      setAvailData(null);
    } finally {
      setAvailLoading(false);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setCreateSubmitting(true);
    setCreateError(null);
    try {
      await inventoryService.createItem(createForm);
      setShowCreateModal(false);
      setCreateForm({
        itemType: 'MEDICINE',
        name: '',
        genericName: '',
        brandName: '',
        category: 'MEDICINE',
        subcategory: '',
        unitOfMeasure: 'TABLET',
        packSize: 10,
        packUnit: 'STRIP',
        manufacturer: '',
        barcode: '',
        sku: '',
        reorderLevel: 50,
        reorderQuantity: 200,
        minimumStock: 20,
        maximumStock: 1000,
        prescriptionRequired: false,
        controlledItem: false,
        temperatureRequirement: 'Ambient',
        storageRequirements: ''
      });
      fetchItems();
    } catch (err) {
      setCreateError(err.response?.data?.message || err.message || 'Failed to create item.');
    } finally {
      setCreateSubmitting(false);
    }
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
            <Boxes style={{ color: '#0284c7' }} />
            Medical Item Master Catalog
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0 0', fontSize: '0.95rem' }}>
            Master list of clinical items, stock rules, batch availability, and min/max reorder levels.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setShowCreateModal(true)}
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
            <Plus size={16} /> Add Inventory Item
          </button>
          <button
            onClick={fetchItems}
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

      {/* Filter and Search Bar */}
      <div
        style={{
          background: 'var(--bg-card, #fff)',
          padding: '1rem',
          borderRadius: '8px',
          border: '1px solid var(--border-color)',
          marginBottom: '1.5rem',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem', flex: '1', minWidth: '280px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search
              size={18}
              style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
            />
            <input
              type="text"
              placeholder="Search by name, generic, SKU, or barcode..."
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
          <button
            type="submit"
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#f1f5f9',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              fontSize: '0.85rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Search
          </button>
        </form>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Category:</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{
                padding: '0.45rem 0.65rem',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                fontSize: '0.85rem',
                background: '#fff'
              }}
            >
              <option value="">All Categories</option>
              <option value="MEDICINE">Medicine</option>
              <option value="SURGICAL_SUPPLY">Surgical Supply</option>
              <option value="MEDICAL_CONSUMABLE">Consumable</option>
              <option value="LABORATORY">Laboratory</option>
              <option value="RADIOLOGY">Radiology</option>
              <option value="EQUIPMENT">Equipment</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Status:</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={{
                padding: '0.45rem 0.65rem',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                fontSize: '0.85rem',
                background: '#fff'
              }}
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="DISCONTINUED">Discontinued</option>
            </select>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div
        style={{
          background: 'var(--bg-card, #fff)',
          borderRadius: '10px',
          border: '1px solid var(--border-color)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          overflow: 'hidden'
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Item Code</th>
                <th style={{ padding: '0.75rem 1rem' }}>Name & Classification</th>
                <th style={{ padding: '0.75rem 1rem' }}>Category</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>On Hand</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Available</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Reserved</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Reorder Level</th>
                <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Loading items...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No inventory items match the specified filters.
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const isLow = (item.availableStock || 0) <= (item.reorderLevel || 0);
                  return (
                    <tr
                      key={item._id}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'background-color 0.1s ease',
                        backgroundColor: isLow ? '#fffbf7' : 'transparent'
                      }}
                    >
                      <td style={{ padding: '0.75rem 1rem', fontWeight: '600' }}>
                        <button
                          onClick={() => navigate(`/operations/inventory/items/${item.inventoryItemId}`)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#0284c7',
                            fontWeight: '600',
                            cursor: 'pointer',
                            textDecoration: 'underline'
                          }}
                        >
                          {item.inventoryItemId}
                        </button>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.sku || item.barcode}</div>
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>{item.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {item.genericName || item.brandName} • {item.unitOfMeasure}
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            backgroundColor:
                              item.category === 'MEDICINE'
                                ? '#e0f2fe'
                                : item.category === 'SURGICAL_SUPPLY'
                                ? '#f3e8ff'
                                : item.category === 'MEDICAL_CONSUMABLE'
                                ? '#f0fdf4'
                                : '#f8fafc',
                            color:
                              item.category === 'MEDICINE'
                                ? '#0284c7'
                                : item.category === 'SURGICAL_SUPPLY'
                                ? '#9333ea'
                                : item.category === 'MEDICAL_CONSUMABLE'
                                ? '#16a34a'
                                : '#475569'
                          }}
                        >
                          {item.category}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: '600' }}>
                        {item.currentStock ?? '-'}
                      </td>
                      <td
                        style={{
                          padding: '0.75rem 1rem',
                          textAlign: 'right',
                          fontWeight: '700',
                          color: isLow ? '#d97706' : '#16a34a'
                        }}
                      >
                        {item.availableStock ?? '-'}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: 'var(--text-muted)' }}>
                        {item.reservedStock ?? 0}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                        <span style={{ fontSize: '0.85rem', color: isLow ? '#d97706' : 'var(--text-muted)', fontWeight: isLow ? '700' : 'normal' }}>
                          {item.reorderLevel || 0}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            backgroundColor: item.status === 'ACTIVE' ? '#dcfce7' : '#fee2e2',
                            color: item.status === 'ACTIVE' ? '#166534' : '#991b1b'
                          }}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                          <button
                            onClick={() => handleOpenAvailability(item)}
                            title="Check Live Batches"
                            style={{
                              padding: '4px 8px',
                              border: '1px solid var(--border-color)',
                              background: '#fff',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '0.75rem',
                              fontWeight: '600',
                              color: '#0284c7'
                            }}
                          >
                            <Eye size={14} /> Batches
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Availability Modal */}
      {availItem && (
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
              maxWidth: '650px',
              width: '90%',
              maxHeight: '80vh',
              overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-main)' }}>{availItem.name}</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{availItem.inventoryItemId} • Live Stock Availability</span>
              </div>
              <button
                onClick={() => setAvailItem(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            {availLoading ? (
              <div style={{ padding: '2rem', textAlign: 'center' }}>
                <RefreshCw size={24} className="animate-spin" />
              </div>
            ) : !availData ? (
              <div style={{ padding: '1rem', color: 'var(--text-muted)' }}>No batch data found.</div>
            ) : (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: '6px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>On Hand</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: '700' }}>{availData.onHandQuantity}</div>
                  </div>
                  <div style={{ padding: '0.75rem', background: '#f0fdf4', borderRadius: '6px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: '#16a34a' }}>Available</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#16a34a' }}>{availData.availableQuantity}</div>
                  </div>
                  <div style={{ padding: '0.75rem', background: '#fffbeb', borderRadius: '6px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: '#d97706' }}>Reserved</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#d97706' }}>{availData.reservedQuantity}</div>
                  </div>
                </div>

                <h4 style={{ margin: '1rem 0 0.5rem 0', fontSize: '0.95rem' }}>Active Batches (FEFO Sorted)</h4>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #e2e8f0', color: 'var(--text-muted)', textAlign: 'left' }}>
                        <th style={{ padding: '0.4rem' }}>Batch #</th>
                        <th style={{ padding: '0.4rem' }}>Location</th>
                        <th style={{ padding: '0.4rem' }}>Expiry</th>
                        <th style={{ padding: '0.4rem', textAlign: 'right' }}>Available</th>
                        <th style={{ padding: '0.4rem' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(availData.batches || []).map((b) => (
                        <tr key={b.batchId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '0.4rem', fontWeight: '600' }}>{b.batchNumber || b.batchId}</td>
                          <td style={{ padding: '0.4rem' }}>{b.locationId}</td>
                          <td style={{ padding: '0.4rem' }}>{new Date(b.expiryDate).toLocaleDateString()}</td>
                          <td style={{ padding: '0.4rem', textAlign: 'right', fontWeight: '700' }}>{b.availableQuantity}</td>
                          <td style={{ padding: '0.4rem' }}>
                            <span style={{ padding: '1px 6px', borderRadius: '8px', fontSize: '0.7rem', background: '#e0f2fe', color: '#0284c7' }}>
                              {b.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ marginTop: '1.25rem', textAlign: 'right' }}>
                  <button
                    onClick={() => {
                      setAvailItem(null);
                      navigate(`/operations/inventory/items/${availItem.inventoryItemId}`);
                    }}
                    style={{
                      padding: '0.4rem 0.8rem',
                      background: '#0284c7',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    View Full Item Dossier →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create New Item Modal */}
      {showCreateModal && (
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
              maxWidth: '700px',
              width: '95%',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Plus size={20} style={{ color: '#0284c7' }} />
                Register New Inventory Item Master
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            {createError && (
              <div style={{ padding: '0.75rem', background: '#fee2e2', color: '#b91c1c', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.85rem' }}>
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.25rem' }}>Item Type *</label>
                  <select
                    value={createForm.itemType}
                    onChange={(e) => setCreateForm({ ...createForm, itemType: e.target.value, category: e.target.value })}
                    style={{ width: '100%', padding: '0.45rem', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                    required
                  >
                    <option value="MEDICINE">Medicine</option>
                    <option value="SURGICAL_SUPPLY">Surgical Supply</option>
                    <option value="MEDICAL_CONSUMABLE">Consumable</option>
                    <option value="LABORATORY">Laboratory</option>
                    <option value="RADIOLOGY">Radiology</option>
                    <option value="EQUIPMENT">Equipment</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.25rem' }}>Item Name *</label>
                  <input
                    type="text"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    placeholder="e.g. Paracetamol 500mg Tablet"
                    style={{ width: '100%', padding: '0.45rem', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.25rem' }}>Generic Name</label>
                  <input
                    type="text"
                    value={createForm.genericName}
                    onChange={(e) => setCreateForm({ ...createForm, genericName: e.target.value })}
                    placeholder="e.g. Acetaminophen"
                    style={{ width: '100%', padding: '0.45rem', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.25rem' }}>Brand Name</label>
                  <input
                    type="text"
                    value={createForm.brandName}
                    onChange={(e) => setCreateForm({ ...createForm, brandName: e.target.value })}
                    placeholder="e.g. Calpol 500"
                    style={{ width: '100%', padding: '0.45rem', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.25rem' }}>Unit of Measure *</label>
                  <select
                    value={createForm.unitOfMeasure}
                    onChange={(e) => setCreateForm({ ...createForm, unitOfMeasure: e.target.value })}
                    style={{ width: '100%', padding: '0.45rem', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                    required
                  >
                    <option value="TABLET">TABLET</option>
                    <option value="CAPSULE">CAPSULE</option>
                    <option value="VIAL">VIAL</option>
                    <option value="AMPOULE">AMPOULE</option>
                    <option value="BOTTLE">BOTTLE</option>
                    <option value="PIECE">PIECE</option>
                    <option value="PACK">PACK</option>
                    <option value="BOX">BOX</option>
                    <option value="ROLL">ROLL</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.25rem' }}>Manufacturer</label>
                  <input
                    type="text"
                    value={createForm.manufacturer}
                    onChange={(e) => setCreateForm({ ...createForm, manufacturer: e.target.value })}
                    placeholder="e.g. GSK / Cipla / 3M"
                    style={{ width: '100%', padding: '0.45rem', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.25rem' }}>Barcode</label>
                  <input
                    type="text"
                    value={createForm.barcode}
                    onChange={(e) => setCreateForm({ ...createForm, barcode: e.target.value })}
                    placeholder="e.g. BC-MED-9901"
                    style={{ width: '100%', padding: '0.45rem', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.25rem' }}>SKU Code</label>
                  <input
                    type="text"
                    value={createForm.sku}
                    onChange={(e) => setCreateForm({ ...createForm, sku: e.target.value })}
                    placeholder="e.g. SKU-PCM-500"
                    style={{ width: '100%', padding: '0.45rem', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.25rem' }}>Reorder Level</label>
                  <input
                    type="number"
                    value={createForm.reorderLevel}
                    onChange={(e) => setCreateForm({ ...createForm, reorderLevel: Number(e.target.value) })}
                    style={{ width: '100%', padding: '0.45rem', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                    min="0"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.25rem' }}>Reorder Quantity</label>
                  <input
                    type="number"
                    value={createForm.reorderQuantity}
                    onChange={(e) => setCreateForm({ ...createForm, reorderQuantity: Number(e.target.value) })}
                    style={{ width: '100%', padding: '0.45rem', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                    min="1"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.25rem' }}>Temperature Spec</label>
                  <select
                    value={createForm.temperatureRequirement}
                    onChange={(e) => setCreateForm({ ...createForm, temperatureRequirement: e.target.value })}
                    style={{ width: '100%', padding: '0.45rem', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                  >
                    <option value="Ambient">Ambient (&lt;25°C)</option>
                    <option value="Refrigerated (2-8°C)">Refrigerated (2-8°C)</option>
                    <option value="Frozen (-20°C)">Frozen (-20°C)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.25rem' }}>Storage Instructions</label>
                  <input
                    type="text"
                    value={createForm.storageRequirements}
                    onChange={(e) => setCreateForm({ ...createForm, storageRequirements: e.target.value })}
                    placeholder="e.g. Store in cool, dry place"
                    style={{ width: '100%', padding: '0.45rem', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
                  <input
                    type="checkbox"
                    checked={createForm.prescriptionRequired}
                    onChange={(e) => setCreateForm({ ...createForm, prescriptionRequired: e.target.checked })}
                  />
                  Prescription Required
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
                  <input
                    type="checkbox"
                    checked={createForm.controlledItem}
                    onChange={(e) => setCreateForm({ ...createForm, controlledItem: e.target.checked })}
                  />
                  Controlled Schedule Substance
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    padding: '0.5rem 1rem',
                    border: '1px solid var(--border-color)',
                    background: '#fff',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSubmitting}
                  style={{
                    padding: '0.5rem 1.25rem',
                    background: '#0284c7',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  {createSubmitting ? 'Registering...' : 'Save Item Master'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
