import React, { useState, useEffect } from 'react';
import { FlaskConical, Search, Plus, Filter, CheckCircle2, XCircle, Edit, Tag } from 'lucide-react';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { Modal } from '../../../components/common/Modal';
import laboratoryService from '../../../services/laboratoryService';

export const LabTests = () => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    category: 'HEMATOLOGY',
    description: '',
    specimenType: 'WHOLE_BLOOD',
    containerType: 'EDTA_TUBE_LAVENDER',
    collectionInstructions: '',
    fastingRequired: false,
    turnaroundTimeMinutes: 60,
    priceReference: 0
  });

  useEffect(() => {
    fetchTests();
  }, [category, status]);

  const fetchTests = async () => {
    try {
      setLoading(true);
      const res = await laboratoryService.listTests({
        query: search,
        category,
        status,
        limit: 100
      });
      if (res.success) {
        setTests(res.data);
      }
    } catch (err) {
      console.error('Failed to load lab tests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchTests();
  };

  const handleToggleStatus = async (test) => {
    const nextStatus = test.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await laboratoryService.updateTestStatus(test.labTestId, nextStatus);
      fetchTests();
    } catch (err) {
      alert(`Error updating test status: ${err.message}`);
    }
  };

  const handleSaveTest = async (e) => {
    e.preventDefault();
    try {
      await laboratoryService.createTest(formData);
      setShowModal(false);
      setFormData({
        code: '',
        name: '',
        category: 'HEMATOLOGY',
        description: '',
        specimenType: 'WHOLE_BLOOD',
        containerType: 'EDTA_TUBE_LAVENDER',
        collectionInstructions: '',
        fastingRequired: false,
        turnaroundTimeMinutes: 60,
        priceReference: 0
      });
      fetchTests();
    } catch (err) {
      alert(`Error creating lab test: ${err.message}`);
    }
  };

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <FlaskConical className="text-primary" size={26} />
            Laboratory Test Master Catalog
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Configure test codes, specimen tubes, biological reference intervals & charge references
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={16} /> New Lab Test
        </button>
      </div>

      {/* Filter Ribbon */}
      <div className="card" style={{ padding: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem', flex: 1, minWidth: '240px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <input
              type="text"
              placeholder="Search by code (e.g. CBC, GLUCOSE) or name..."
              className="form-control"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', paddingLeft: '2.25rem' }}
            />
            <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          </div>
          <button type="submit" className="btn btn-secondary">Search</button>
        </form>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <select className="form-control" value={category} onChange={(e) => setCategory(e.target.value)} style={{ width: 'auto' }}>
            <option value="">All Categories</option>
            <option value="HEMATOLOGY">Hematology</option>
            <option value="BIOCHEMISTRY">Biochemistry</option>
            <option value="MICROBIOLOGY">Microbiology</option>
            <option value="IMMUNOLOGY">Immunology</option>
            <option value="SEROLOGY">Serology</option>
            <option value="URINALYSIS">Urinalysis</option>
          </select>

          <select className="form-control" value={status} onChange={(e) => setStatus(e.target.value)} style={{ width: 'auto' }}>
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="DRAFT">Draft</option>
          </select>
        </div>
      </div>

      {/* Tests Table */}
      <div className="card" style={{ padding: '1.25rem' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>Loading diagnostic catalog...</div>
        ) : tests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>No laboratory tests matched your criteria.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Test Code</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Test Name</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Category</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Specimen / Tube</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>TAT</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Charge (₹)</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Status</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tests.map((test) => (
                  <tr key={test._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '0.75rem 0.5rem', fontWeight: '700', color: '#38bdf8' }}>
                      {test.code}
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem' }}>
                      <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{test.name}</div>
                      {test.fastingRequired && (
                        <span style={{ fontSize: '0.7rem', color: '#f59e0b', background: 'rgba(245, 158, 11, 0.1)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                          Fasting Required
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem' }}>
                      <span className="badge badge-secondary">{test.category}</span>
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-secondary)' }}>
                      <div>{test.specimenType}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{test.containerType}</div>
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem' }}>
                      {test.turnaroundTimeMinutes} mins
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem', fontWeight: '700' }}>
                      ₹{test.priceReference}
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem' }}>
                      <StatusBadge status={test.status} />
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>
                      <button
                        className={`btn btn-sm ${test.status === 'ACTIVE' ? 'btn-secondary' : 'btn-primary'}`}
                        onClick={() => handleToggleStatus(test)}
                        title={test.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                      >
                        {test.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Test Modal */}
      {showModal && (
        <Modal title="Create New Diagnostic Test Master" onClose={() => setShowModal(false)}>
          <form onSubmit={handleSaveTest} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
              <div>
                <label className="form-label">Test Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CBC, LFT"
                  className="form-control"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                />
              </div>
              <div>
                <label className="form-label">Test Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Complete Blood Count Panel"
                  className="form-control"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label className="form-label">Category *</label>
                <select
                  className="form-control"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  <option value="HEMATOLOGY">Hematology</option>
                  <option value="BIOCHEMISTRY">Biochemistry</option>
                  <option value="MICROBIOLOGY">Microbiology</option>
                  <option value="IMMUNOLOGY">Immunology</option>
                  <option value="SEROLOGY">Serology</option>
                  <option value="URINALYSIS">Urinalysis</option>
                  <option value="CLINICAL_CHEMISTRY">Clinical Chemistry</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="form-label">Specimen Type *</label>
                <select
                  className="form-control"
                  value={formData.specimenType}
                  onChange={(e) => setFormData({ ...formData, specimenType: e.target.value })}
                >
                  <option value="WHOLE_BLOOD">Whole Blood</option>
                  <option value="SERUM">Serum</option>
                  <option value="PLASMA">Plasma</option>
                  <option value="URINE">Urine</option>
                  <option value="STOOL">Stool</option>
                  <option value="SPUTUM">Sputum</option>
                  <option value="CSF">CSF</option>
                  <option value="SWAB">Swab</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label className="form-label">Container / Tube *</label>
                <select
                  className="form-control"
                  value={formData.containerType}
                  onChange={(e) => setFormData({ ...formData, containerType: e.target.value })}
                >
                  <option value="EDTA_TUBE_LAVENDER">EDTA Tube (Lavender)</option>
                  <option value="SERUM_SEPARATOR_GOLD">Serum Separator Tube (Gold)</option>
                  <option value="SODIUM_CITRATE_BLUE">Sodium Citrate (Light Blue)</option>
                  <option value="STERILE_CONTAINER">Sterile Cup Container</option>
                  <option value="FLUORIDE_GREY">Sodium Fluoride (Grey)</option>
                  <option value="HEPARIN_GREEN">Heparin Tube (Green)</option>
                  <option value="OTHER">Other Container</option>
                </select>
              </div>

              <div>
                <label className="form-label">Price Reference (₹) *</label>
                <input
                  type="number"
                  min="0"
                  required
                  className="form-control"
                  value={formData.priceReference}
                  onChange={(e) => setFormData({ ...formData, priceReference: Number(e.target.value) })}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label className="form-label">Turnaround Time (Minutes)</label>
                <input
                  type="number"
                  min="5"
                  className="form-control"
                  value={formData.turnaroundTimeMinutes}
                  onChange={(e) => setFormData({ ...formData, turnaroundTimeMinutes: Number(e.target.value) })}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', marginTop: '1.5rem', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  id="fastingCheck"
                  checked={formData.fastingRequired}
                  onChange={(e) => setFormData({ ...formData, fastingRequired: e.target.checked })}
                />
                <label htmlFor="fastingCheck" style={{ fontSize: '0.85rem', cursor: 'pointer' }}>
                  Fasting Required (Overnight 8-12h)
                </label>
              </div>
            </div>

            <div>
              <label className="form-label">Collection Instructions</label>
              <textarea
                rows="2"
                placeholder="e.g. Invert gently 8-10 times. Avoid vigorous shaking."
                className="form-control"
                value={formData.collectionInstructions}
                onChange={(e) => setFormData({ ...formData, collectionInstructions: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Save Test Item
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default LabTests;
