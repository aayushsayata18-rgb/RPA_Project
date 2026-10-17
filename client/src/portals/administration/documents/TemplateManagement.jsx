import React, { useState, useEffect } from 'react';
import {
  FileCode2,
  Plus,
  Eye,
  CheckCircle,
  XCircle,
  Play,
  RotateCw,
  AlertCircle,
  Sliders,
  X
} from 'lucide-react';
import documentClientService from '../../../services/documentClientService';

export const TemplateManagement = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Preview state
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [previewHtml, setPreviewHtml] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Create Template Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    documentType: 'DISCHARGE_ADMIN_DOCUMENT',
    category: 'CLINICAL',
    language: 'en-IN',
    headerText: 'CITY GENERAL HOSPITAL - CLINICAL DIVISION',
    footerText: 'Official Hospital Document',
    description: '',
    approvalRequired: false,
    variablesStr: 'patientName:String:true, patientId:String:true, dischargeDate:String:true'
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await documentClientService.getTemplates();
      setTemplates(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async (tmpl) => {
    setSelectedTemplate(tmpl);
    setIsPreviewOpen(true);
    setPreviewLoading(true);
    try {
      const res = await documentClientService.previewTemplate(tmpl.templateId || tmpl._id, tmpl.sampleData || {});
      setPreviewHtml(res.htmlContent || '<p>No preview generated</p>');
    } catch (err) {
      setPreviewHtml(`<div class="text-rose-600">Preview Error: ${err.message}</div>`);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleApprove = async (tmpl) => {
    try {
      await documentClientService.approveTemplate(tmpl.templateId || tmpl._id);
      alert(`Template ${tmpl.name} approved!`);
      loadTemplates();
    } catch (err) {
      alert(`Approval Error: ${err.message}`);
    }
  };

  const handleToggleActive = async (tmpl) => {
    try {
      if (tmpl.isActive) {
        await documentClientService.deactivateTemplate(tmpl.templateId || tmpl._id);
      } else {
        await documentClientService.activateTemplate(tmpl.templateId || tmpl._id);
      }
      loadTemplates();
    } catch (err) {
      alert(`Error updating state: ${err.message}`);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      // Parse variables
      const vars = newTemplate.variablesStr.split(',').map(s => {
        const [name, type, req] = s.split(':').map(x => x.trim());
        return {
          name,
          type: type || 'String',
          required: req === 'true'
        };
      });

      await documentClientService.createTemplate({
        ...newTemplate,
        variables: vars,
        templateHtml: `<div><h2>${newTemplate.name}</h2><p>Patient: {{patientName}} ({{patientId}})</p></div>`
      });

      alert('Template created successfully!');
      setIsCreateOpen(false);
      loadTemplates();
    } catch (err) {
      alert(`Create Error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <FileCode2 className="w-7 h-7 text-primary-600" />
            <span>Document Template Management</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure standardized document types, required variables, versioning, and approval rules
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create New Template
        </button>
      </div>

      {/* Templates List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-500 text-sm">
            <RotateCw className="w-8 h-8 animate-spin text-primary-600 mb-2" />
            Loading configurable templates...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-600 bg-rose-50/50">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-rose-500" />
            {error}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase">
                  <th className="py-3 px-4">Template Code & Name</th>
                  <th className="py-3 px-4">Document Type</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Version</th>
                  <th className="py-3 px-4">Variables Schema</th>
                  <th className="py-3 px-4">Approval</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {templates.map(tmpl => (
                  <tr key={tmpl.templateCode} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{tmpl.name}</div>
                      <div className="text-xs font-mono text-slate-500">{tmpl.templateCode}</div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-xs font-medium text-slate-700">
                      {tmpl.documentType}
                    </td>

                    <td className="py-3.5 px-4 text-xs font-semibold text-slate-600 uppercase">
                      {tmpl.category}
                    </td>

                    <td className="py-3.5 px-4 font-bold text-xs text-primary-700">
                      v{tmpl.version || 1}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {tmpl.variables?.slice(0, 3).map(v => (
                          <span
                            key={v.name}
                            className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                              v.required ? 'bg-amber-100 text-amber-800 font-bold' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {v.name}{v.required ? '*' : ''}
                          </span>
                        ))}
                        {tmpl.variables?.length > 3 && (
                          <span className="text-[10px] text-slate-400 font-medium">
                            +{tmpl.variables.length - 3} more
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-xs">
                      {tmpl.approvalRequired ? (
                        <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-medium border border-amber-200">
                          Required
                        </span>
                      ) : (
                        <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-medium border border-emerald-200">
                          Auto-Release
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                          tmpl.isActive
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {tmpl.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => handlePreview(tmpl)}
                        className="inline-flex items-center text-xs font-medium px-2.5 py-1 text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-md transition-colors"
                        title="Preview with sample data"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" />
                        Preview
                      </button>

                      {tmpl.approvalRequired && !tmpl.approvedAt && (
                        <button
                          onClick={() => handleApprove(tmpl)}
                          className="inline-flex items-center text-xs font-medium px-2.5 py-1 text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-md transition-colors"
                        >
                          <CheckCircle className="w-3.5 h-3.5 mr-1" />
                          Approve
                        </button>
                      )}

                      <button
                        onClick={() => handleToggleActive(tmpl)}
                        className={`inline-flex items-center text-xs font-medium px-2 py-1 rounded-md transition-colors ${
                          tmpl.isActive
                            ? 'text-rose-600 hover:bg-rose-50'
                            : 'text-emerald-600 hover:bg-emerald-50'
                        }`}
                      >
                        {tmpl.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {isPreviewOpen && selectedTemplate && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Template Preview: {selectedTemplate.name}
                </h3>
                <div className="text-xs text-slate-500 font-mono">
                  {selectedTemplate.templateCode} | Format: {selectedTemplate.format}
                </div>
              </div>
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto space-y-4">
              <div className="text-xs font-semibold text-slate-500 uppercase">
                Sample Test Data Payload:
              </div>
              <pre className="p-3 bg-slate-100 rounded text-xs font-mono text-slate-800 overflow-x-auto">
                {JSON.stringify(selectedTemplate.sampleData || {}, null, 2)}
              </pre>

              <div className="text-xs font-semibold text-slate-500 uppercase mt-4">
                Rendered Preview Output:
              </div>
              <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm min-h-40">
                {previewLoading ? (
                  <div className="flex items-center justify-center py-10 text-slate-500 text-sm">
                    <RotateCw className="w-5 h-5 animate-spin mr-2" />
                    Rendering template...
                  </div>
                ) : (
                  <div
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: previewHtml }}
                  />
                )}
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-sm font-medium rounded-lg"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Template Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="text-lg font-bold text-slate-900">Create Document Template</h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Template Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Inpatient Admission Advice"
                  value={newTemplate.name}
                  onChange={e => setNewTemplate({ ...newTemplate, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Document Type
                  </label>
                  <input
                    type="text"
                    required
                    value={newTemplate.documentType}
                    onChange={e => setNewTemplate({ ...newTemplate, documentType: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Category
                  </label>
                  <select
                    value={newTemplate.category}
                    onChange={e => setNewTemplate({ ...newTemplate, category: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="CLINICAL">CLINICAL</option>
                    <option value="PATIENT">PATIENT</option>
                    <option value="FINANCIAL">FINANCIAL</option>
                    <option value="LABORATORY">LABORATORY</option>
                    <option value="RADIOLOGY">RADIOLOGY</option>
                    <option value="OPERATIONS">OPERATIONS</option>
                    <option value="HR">HR</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Variables Specification (name:type:required, ...)
                </label>
                <input
                  type="text"
                  value={newTemplate.variablesStr}
                  onChange={e => setNewTemplate({ ...newTemplate, variablesStr: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <span className="text-[11px] text-slate-400">Comma-separated field rules for required data gates</span>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="approvalReq"
                  checked={newTemplate.approvalRequired}
                  onChange={e => setNewTemplate({ ...newTemplate, approvalRequired: e.target.checked })}
                  className="w-4 h-4 text-primary-600 rounded"
                />
                <label htmlFor="approvalReq" className="text-xs font-medium text-slate-700">
                  Requires authorized manager/doctor approval before release
                </label>
              </div>

              <div className="pt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium shadow-sm"
                >
                  Save Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateManagement;
