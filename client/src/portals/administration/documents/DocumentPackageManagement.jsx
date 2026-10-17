import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Download,
  FileText,
  CheckCircle,
  AlertCircle,
  RotateCw,
  FolderArchive,
  Layers,
  X
} from 'lucide-react';
import documentClientService from '../../../services/documentClientService';

export const DocumentPackageManagement = () => {
  const [packages, setPackages] = useState([]);
  const [availableDocs, setAvailableDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // New Package Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    packageType: 'INSURANCE_CLAIM_PACKAGE',
    description: '',
    patientId: 'P10001',
    selectedDocIds: []
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [pkgRes, docsRes] = await Promise.all([
        documentClientService.getPackages(),
        documentClientService.getDocuments({ status: 'RELEASED' })
      ]);
      setPackages(pkgRes.data || []);
      setAvailableDocs(docsRes.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load packages');
    } finally {
      setLoading(false);
    }
  };

  const handleDocToggle = (docId) => {
    setFormData(prev => {
      const exists = prev.selectedDocIds.includes(docId);
      return {
        ...prev,
        selectedDocIds: exists
          ? prev.selectedDocIds.filter(id => id !== docId)
          : [...prev.selectedDocIds, docId]
      };
    });
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (formData.selectedDocIds.length === 0) {
      alert('Please select at least one document to include in this package.');
      return;
    }

    setCreating(true);
    try {
      await documentClientService.createPackage({
        title: formData.title || `${formData.packageType.replace(/_/g, ' ')}`,
        packageType: formData.packageType,
        description: formData.description,
        documentIds: formData.selectedDocIds,
        patientId: formData.patientId,
        entityReference: {
          entityType: 'InsuranceClaim',
          entityId: formData.patientId,
          module: 'INSURANCE'
        }
      });

      alert('Document Package compiled successfully!');
      setIsModalOpen(false);
      setFormData({
        title: '',
        packageType: 'INSURANCE_CLAIM_PACKAGE',
        description: '',
        patientId: 'P10001',
        selectedDocIds: []
      });
      loadData();
    } catch (err) {
      alert(`Package Compilation Error: ${err.message}`);
    } finally {
      setCreating(false);
    }
  };

  const handleDownload = async (pkg) => {
    try {
      await documentClientService.downloadPackageFile(pkg.packageId, `${pkg.packageId}.pdf`);
    } catch (err) {
      alert(`Download Error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <Package className="w-7 h-7 text-primary-600" />
            <span>Document Packages & Dossiers</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Bundle validated hospital records into certified multi-document packages for insurance claims, discharges, and legal submissions
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Compile New Package
        </button>
      </div>

      {/* Packages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-2 py-20 flex flex-col items-center justify-center text-slate-500 text-sm">
            <RotateCw className="w-8 h-8 animate-spin text-primary-600 mb-2" />
            Loading certified document packages...
          </div>
        ) : error ? (
          <div className="col-span-2 p-8 text-center text-rose-600 bg-rose-50/50 rounded-xl border border-rose-200">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-rose-500" />
            {error}
          </div>
        ) : packages.length === 0 ? (
          <div className="col-span-2 py-16 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
            <FolderArchive className="w-10 h-10 mx-auto mb-2 text-slate-400" />
            <div className="font-semibold text-slate-700">No Document Packages Compiled</div>
            <p className="text-xs text-slate-400 mt-1">Click "Compile New Package" to create an insurance or discharge bundle.</p>
          </div>
        ) : (
          packages.map(pkg => (
            <div
              key={pkg.packageId}
              className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4 hover:border-primary-300 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-bold text-primary-700 bg-primary-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    {pkg.packageType}
                  </span>
                  <h3 className="font-bold text-slate-900 text-base mt-2">
                    {pkg.title}
                  </h3>
                  <div className="text-xs font-mono text-slate-500 mt-0.5">
                    {pkg.packageId} | Patient: {pkg.patientName || pkg.patientId || 'General'}
                  </div>
                </div>

                <button
                  onClick={() => handleDownload(pkg)}
                  className="inline-flex items-center px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-medium shadow-sm transition-colors"
                >
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                  Download Dossier
                </button>
              </div>

              {/* Manifest List */}
              <div className="border border-slate-100 bg-slate-50 rounded-lg p-3 space-y-2">
                <div className="text-xs font-semibold text-slate-700 uppercase flex items-center justify-between">
                  <span>Bundled Items ({pkg.documents?.length || 0})</span>
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-1.5 py-0.5 rounded">
                    {pkg.status}
                  </span>
                </div>

                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {pkg.documents?.map(item => (
                    <div
                      key={item.documentId}
                      className="flex items-center justify-between text-xs bg-white p-2 rounded border border-slate-200"
                    >
                      <div className="flex items-center space-x-2">
                        <FileText className="w-3.5 h-3.5 text-primary-600" />
                        <span className="font-medium text-slate-800">{item.title || item.documentId}</span>
                        <span className="text-[10px] text-slate-500 font-mono">({item.documentType})</span>
                      </div>
                      <span className="text-[10px] text-emerald-600 font-bold uppercase">
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-100">
                <span>Created: {new Date(pkg.createdAt).toLocaleDateString()}</span>
                <span className="font-mono text-[11px]">Size: {Math.round((pkg.storage?.size || 0) / 1024)} KB</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* New Package Builder Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center space-x-2">
                <Layers className="w-5 h-5 text-primary-600" />
                <h3 className="text-lg font-bold text-slate-900">Compile Document Dossier</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Package Dossier Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Star Health Insurance Claim Package"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Package Type
                  </label>
                  <select
                    value={formData.packageType}
                    onChange={e => setFormData({ ...formData, packageType: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="INSURANCE_CLAIM_PACKAGE">INSURANCE_CLAIM_PACKAGE</option>
                    <option value="DISCHARGE_PACKAGE">DISCHARGE_PACKAGE</option>
                    <option value="LEGAL_AUDIT_DOSSIER">LEGAL_AUDIT_DOSSIER</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Target Patient ID
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.patientId}
                    onChange={e => setFormData({ ...formData, patientId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              {/* Select Documents */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Select Released Documents to Include ({formData.selectedDocIds.length} Selected)
                </label>
                <div className="border border-slate-300 rounded-lg max-h-52 overflow-y-auto divide-y divide-slate-100 p-1">
                  {availableDocs.map(doc => {
                    const isSelected = formData.selectedDocIds.includes(doc.documentId);
                    return (
                      <label
                        key={doc.documentId}
                        className={`flex items-center justify-between p-2.5 rounded cursor-pointer transition-colors ${
                          isSelected ? 'bg-primary-50 text-primary-900 font-medium' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleDocToggle(doc.documentId)}
                            className="rounded text-primary-600 focus:ring-primary-500"
                          />
                          <div>
                            <div className="text-xs font-semibold">{doc.title}</div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              {doc.documentId} | {doc.documentType}
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {doc.patientName ? doc.patientName : 'Admin'}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium shadow-sm disabled:opacity-50"
                >
                  {creating ? 'Compiling Package...' : 'Compile Package PDF'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentPackageManagement;
