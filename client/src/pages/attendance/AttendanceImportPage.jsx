import React, { useState, useEffect } from 'react';
import { attendanceService } from '../../services/attendanceService';
import { AttendanceStatusBadge } from '../../components/attendance/AttendanceStatusBadge';
import {
  Upload,
  FileText,
  AlertCircle,
  CheckCircle2,
  Download,
  History,
  RefreshCw,
  FileSpreadsheet
} from 'lucide-react';

export const AttendanceImportPage = () => {
  const [source, setSource] = useState('CSV');
  const [rawText, setRawText] = useState('');
  const [previewRecords, setPreviewRecords] = useState([]);
  const [fileName, setFileName] = useState('attendance_import.csv');
  const [parsingError, setParsingError] = useState(null);

  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  const [batches, setBatches] = useState([]);
  const [batchesLoading, setBatchesLoading] = useState(true);

  const fetchBatches = async () => {
    setBatchesLoading(true);
    try {
      const res = await attendanceService.getImportBatches({ limit: 15 });
      setBatches(res.data?.batches || []);
    } catch (err) {
      console.error('Failed to load import batches:', err);
    } finally {
      setBatchesLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  // Parse CSV text into record objects
  const handleParseCsv = (content) => {
    setParsingError(null);
    setImportResult(null);

    try {
      const lines = content.trim().split('\n');
      if (lines.length < 2) {
        setParsingError('CSV must contain at least a header row and one data row.');
        setPreviewRecords([]);
        return;
      }

      const headers = lines[0].split(',').map((h) => h.trim().replace(/^["']|["']$/g, ''));
      const parsed = [];

      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const cols = lines[i].split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''));
        const row = {};
        headers.forEach((h, idx) => {
          row[h] = cols[idx] || '';
        });
        parsed.push(row);
      }

      setPreviewRecords(parsed);
    } catch (err) {
      setParsingError(`Failed to parse CSV: ${err.message}`);
      setPreviewRecords([]);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      setRawText(text);
      handleParseCsv(text);
    };
    reader.readAsText(file);
  };

  const handleExecuteImport = async () => {
    if (previewRecords.length === 0) {
      setParsingError('No records to import. Please upload or paste a CSV first.');
      return;
    }

    setImporting(true);
    setParsingError(null);

    try {
      const res = await attendanceService.importBatch({
        records: previewRecords,
        source,
        fileName,
        rawContent: rawText
      });
      setImportResult(res.data);
      fetchBatches();
    } catch (err) {
      setParsingError(err.response?.data?.message || err.message || 'Batch import failed.');
    } finally {
      setImporting(false);
    }
  };

  const downloadSampleTemplate = () => {
    const sample = `employeeId,date,checkIn,checkOut,deviceId,sourceEventId\nEMP10001,2026-10-15,2026-10-15T08:58:00Z,2026-10-15T18:04:00Z,BIO-GATE-1,BIO-901\nEMP10002,2026-10-15,2026-10-15T09:22:00Z,2026-10-15T18:00:00Z,BIO-GATE-1,BIO-902\nEMP10003,2026-10-15,2026-10-15T09:05:00Z,,BIO-GATE-1,BIO-903`;
    const blob = new Blob([sample], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'sample_attendance_import.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="portal-page" style={{ padding: '2rem' }}>
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#f8fafc', margin: 0 }}>
            Biometric & Attendance Data Import
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Idempotent batch upload for biometric devices, external systems, and legacy HR CSV imports.
          </p>
        </div>

        <button
          onClick={downloadSampleTemplate}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.55rem 1rem',
            borderRadius: '8px',
            background: 'var(--bg-card, #1e293b)',
            border: '1px solid var(--border-color, #334155)',
            color: '#38bdf8',
            fontSize: '0.875rem',
            cursor: 'pointer'
          }}
        >
          <Download style={{ width: '16px', height: '16px' }} />
          Download Sample CSV
        </button>
      </div>

      {/* Upload & Config Area */}
      <div
        className="card"
        style={{
          padding: '1.5rem',
          borderRadius: '12px',
          background: 'var(--bg-card, #1e293b)',
          border: '1px solid var(--border-color, #334155)',
          marginBottom: '2rem'
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
              Import Source Channel
            </label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                borderRadius: '8px',
                background: 'var(--bg-input, #0f172a)',
                border: '1px solid var(--border-color, #334155)',
                color: '#f8fafc',
                fontSize: '0.875rem'
              }}
            >
              <option value="CSV">CSV File Upload</option>
              <option value="BIOMETRIC">Biometric Device Ingestion</option>
              <option value="EXTERNAL_API">External HRMS Export</option>
              <option value="RPA">RPA Automated Batch</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
              Select CSV File
            </label>
            <input
              type="file"
              accept=".csv,.txt"
              onChange={handleFileUpload}
              style={{
                width: '100%',
                padding: '0.5rem',
                borderRadius: '8px',
                background: 'var(--bg-input, #0f172a)',
                border: '1px solid var(--border-color, #334155)',
                color: '#f8fafc',
                fontSize: '0.85rem'
              }}
            />
          </div>
        </div>

        {/* Or Paste Raw Text */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
            Or Paste CSV / Tab-Delimited Records Directly
          </label>
          <textarea
            rows="4"
            value={rawText}
            onChange={(e) => {
              setRawText(e.target.value);
              handleParseCsv(e.target.value);
            }}
            placeholder="employeeId,date,checkIn,checkOut,deviceId&#10;EMP10001,2026-10-15,2026-10-15T08:58:00Z,2026-10-15T18:04:00Z,BIO-1"
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '8px',
              background: 'var(--bg-input, #0f172a)',
              border: '1px solid var(--border-color, #334155)',
              color: '#f8fafc',
              fontSize: '0.85rem',
              fontFamily: 'monospace'
            }}
          />
        </div>

        {parsingError && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              color: '#ef4444',
              borderRadius: '8px',
              marginBottom: '1rem',
              fontSize: '0.85rem'
            }}
          >
            <AlertCircle style={{ width: '18px', height: '18px', flexShrink: 0 }} />
            <span>{parsingError}</span>
          </div>
        )}

        {/* Action Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <button
            onClick={handleExecuteImport}
            disabled={importing || previewRecords.length === 0}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.65rem 1.5rem',
              borderRadius: '8px',
              background: previewRecords.length > 0 ? '#10b981' : '#334155',
              color: '#ffffff',
              border: 'none',
              fontWeight: '600',
              cursor: previewRecords.length > 0 ? 'pointer' : 'not-allowed'
            }}
          >
            <Upload style={{ width: '16px', height: '16px' }} />
            {importing ? 'Processing Batch...' : `Import ${previewRecords.length} Records`}
          </button>
        </div>
      </div>

      {/* Import Result Banner */}
      {importResult && (
        <div
          className="card"
          style={{
            padding: '1.25rem 1.5rem',
            borderRadius: '10px',
            background: importResult.batch?.errorCount > 0 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)',
            border: `1px solid ${importResult.batch?.errorCount > 0 ? 'rgba(245, 158, 11, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
            marginBottom: '2rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <CheckCircle2 style={{ width: '22px', height: '22px', color: '#10b981' }} />
            <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#f8fafc' }}>
              Batch Import Completed: {importResult.batch?.batchId}
            </h4>
          </div>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#cbd5e1' }}>
            Total Read: <strong>{importResult.batch?.recordCount}</strong> | Success:{' '}
            <strong style={{ color: '#10b981' }}>{importResult.batch?.successCount}</strong> | Duplicates (Ignored):{' '}
            <strong style={{ color: '#f59e0b' }}>{importResult.batch?.duplicateCount}</strong> | Errors:{' '}
            <strong style={{ color: '#ef4444' }}>{importResult.batch?.errorCount}</strong>
          </p>

          {importResult.batch?.errorReport?.length > 0 && (
            <div style={{ marginTop: '1rem', maxHeight: '150px', overflowY: 'auto' }}>
              <table style={{ width: '100%', fontSize: '0.8rem', color: '#fca5a5' }}>
                <thead>
                  <tr style={{ textAlign: 'left' }}>
                    <th>Row</th>
                    <th>Staff Code</th>
                    <th>Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {importResult.batch.errorReport.map((err, idx) => (
                    <tr key={idx}>
                      <td>{err.rowNumber}</td>
                      <td>{err.employeeIdCode}</td>
                      <td>{err.errorReason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Parsed Preview Table */}
      {previewRecords.length > 0 && (
        <div
          className="card"
          style={{
            background: 'var(--bg-card, #1e293b)',
            border: '1px solid var(--border-color, #334155)',
            borderRadius: '12px',
            marginBottom: '2rem',
            overflow: 'hidden'
          }}
        >
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color, #334155)' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', color: '#f8fafc' }}>
              Parsed Preview ({previewRecords.length} Rows)
            </h3>
          </div>
          <div style={{ overflowX: 'auto', maxHeight: '240px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: 'rgba(15, 23, 42, 0.6)' }}>
                  {Object.keys(previewRecords[0]).map((h, i) => (
                    <th key={i} style={{ padding: '0.65rem 1rem', color: '#94a3b8' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewRecords.slice(0, 10).map((row, rIdx) => (
                  <tr key={rIdx} style={{ borderBottom: '1px solid var(--border-color, #334155)' }}>
                    {Object.values(row).map((val, cIdx) => (
                      <td key={cIdx} style={{ padding: '0.65rem 1rem', color: '#f8fafc' }}>
                        {val || '—'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Historical Batch Runs */}
      <div
        className="card"
        style={{
          background: 'var(--bg-card, #1e293b)',
          border: '1px solid var(--border-color, #334155)',
          borderRadius: '12px',
          overflow: 'hidden'
        }}
      >
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color, #334155)' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#f8fafc' }}>Past Ingestion Batches</h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: 'rgba(15, 23, 42, 0.6)', borderBottom: '1px solid var(--border-color, #334155)' }}>
                <th style={{ padding: '0.75rem 1.25rem', color: '#94a3b8' }}>Batch ID</th>
                <th style={{ padding: '0.75rem 1.25rem', color: '#94a3b8' }}>Source</th>
                <th style={{ padding: '0.75rem 1.25rem', color: '#94a3b8' }}>File Name</th>
                <th style={{ padding: '0.75rem 1.25rem', color: '#94a3b8' }}>Uploaded At</th>
                <th style={{ padding: '0.75rem 1.25rem', color: '#94a3b8' }}>Status</th>
                <th style={{ padding: '0.75rem 1.25rem', color: '#94a3b8' }}>Success / Total</th>
                <th style={{ padding: '0.75rem 1.25rem', color: '#94a3b8' }}>Errors</th>
              </tr>
            </thead>
            <tbody>
              {batchesLoading ? (
                <tr>
                  <td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                    Loading past import batches...
                  </td>
                </tr>
              ) : batches.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                    No import batches found.
                  </td>
                </tr>
              ) : (
                batches.map((b) => (
                  <tr key={b._id || b.batchId} style={{ borderBottom: '1px solid var(--border-color, #334155)' }}>
                    <td style={{ padding: '0.75rem 1.25rem', color: '#38bdf8', fontWeight: '600' }}>
                      {b.batchId}
                    </td>
                    <td style={{ padding: '0.75rem 1.25rem', color: '#94a3b8' }}>{b.source}</td>
                    <td style={{ padding: '0.75rem 1.25rem', color: '#f8fafc' }}>{b.fileName || 'N/A'}</td>
                    <td style={{ padding: '0.75rem 1.25rem', color: '#94a3b8' }}>
                      {new Date(b.uploadedAt).toLocaleString()}
                    </td>
                    <td style={{ padding: '0.75rem 1.25rem' }}>
                      <AttendanceStatusBadge status={b.status} />
                    </td>
                    <td style={{ padding: '0.75rem 1.25rem', color: '#10b981', fontWeight: '600' }}>
                      {b.successCount} / {b.recordCount}
                    </td>
                    <td style={{ padding: '0.75rem 1.25rem', color: b.errorCount > 0 ? '#ef4444' : '#94a3b8' }}>
                      {b.errorCount}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AttendanceImportPage;
