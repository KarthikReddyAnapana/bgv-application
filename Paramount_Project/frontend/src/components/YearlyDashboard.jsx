import React, { useEffect, useMemo, useState } from 'react';
import '../styles/admin-table.css';
import '../styles/form.css';
import { bgvService } from '../services/bgvService';
import * as XLSX from 'xlsx';
import ThemeToggleButton from './ThemeToggleButton';

export default function YearlyDashboard() {
  const [requests, setRequests] = useState([]);
  const [excelTable, setExcelTable] = useState({ headers: [], rows: [] });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ type: '', text: '' });

  const now = new Date();
  const initialYm = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [selectedYm, setSelectedYm] = useState(initialYm);

  useEffect(() => {
    // Support deep links like: #/yearly-dashboard?ym=2026-09
    const hash = window.location.hash || '';
    const query = hash.split('?')[1] || '';
    const params = new URLSearchParams(query);
    const ym = params.get('ym');
    if (ym && /^\d{4}-\d{2}$/.test(ym)) setSelectedYm(ym);
  }, []);

  useEffect(() => {
    const ym = (selectedYm || '').trim();
    if (ym) window.location.hash = `#/yearly-dashboard?ym=${encodeURIComponent(ym)}`;
  }, [selectedYm]);

  const parseRequestDate = (request) => {
    const raw = request?.requestSubmittedOn || request?.submittedDate;
    if (!raw) return null;
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? null : d;
  };

  const parseUpdatedAt = (request) => {
    const raw = request?.updatedAt;
    if (raw == null || raw === '') return null;

    if (typeof raw === 'number') {
      if (raw <= 0) return null;
      const epochMillis = raw < 1000000000000 ? raw * 1000 : raw;
      const d = new Date(epochMillis);
      return Number.isNaN(d.getTime()) ? null : d;
    }

    if (typeof raw === 'string') {
      const trimmed = raw.trim();
      if (!trimmed) return null;

      if (/^\d+$/.test(trimmed)) {
        const numericValue = Number(trimmed);
        if (!Number.isFinite(numericValue) || numericValue <= 0) return null;
        const epochMillis = numericValue < 1000000000000 ? numericValue * 1000 : numericValue;
        const d = new Date(epochMillis);
        return Number.isNaN(d.getTime()) ? null : d;
      }

      const d = new Date(trimmed);
      return Number.isNaN(d.getTime()) ? null : d;
    }

    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? null : d;
  };

  const statusLabelForUi = (status) => {
    if (!status) return '';
    const map = {
      PENDING: 'BGV to be Initiated',
      APPROVED: 'BGV Initiated',
      ON_HOLD: 'BGV Stopped',
      REJECTED: 'BGV Cannot Be Initiated',

      Pending: 'BGV to be Initiated',
      Approved: 'BGV Initiated',
      'On Hold': 'BGV Stopped',
      Rejected: 'BGV Cannot Be Initiated'
    };
    return map[status] || status;
  };

  const handleLogout = () => {
    window.localStorage.removeItem('bgvUserRole');
    window.localStorage.removeItem('bgvUserPs');
    window.location.hash = '#/login';
  };

  const handleBack = () => {
    const role = (window.localStorage.getItem('bgvUserRole') || '').trim();
    if (role === 'SUPER_ADMIN') {
      window.location.hash = '#/super-admin';
      return;
    }
    window.location.hash = '#/admin';
  };

  const toStatusClassKey = (label) => {
    if (!label) return 'unknown';
    return String(label)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const currentYear = new Date().getFullYear();
  const yearOptions = useMemo(() => {
    const years = [];
    for (let y = currentYear + 1; y >= 2000; y -= 1) years.push(y);
    return years;
  }, [currentYear]);

  const monthOptions = useMemo(
    () => [
      { value: '01', label: 'Jan' },
      { value: '02', label: 'Feb' },
      { value: '03', label: 'Mar' },
      { value: '04', label: 'Apr' },
      { value: '05', label: 'May' },
      { value: '06', label: 'Jun' },
      { value: '07', label: 'Jul' },
      { value: '08', label: 'Aug' },
      { value: '09', label: 'Sep' },
      { value: '10', label: 'Oct' },
      { value: '11', label: 'Nov' },
      { value: '12', label: 'Dec' }
    ],
    []
  );

  const selectedYearUi = selectedYm ? selectedYm.split('-')[0] : '';
  const selectedMonthUi = selectedYm ? selectedYm.split('-')[1] : '';

  const fetchAll = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await bgvService.getAllRequests();
      const data = res?.data?.data || [];
      setRequests(data);
    } catch (e) {
      setError('Error loading requests for dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchExcelForMonth = async (ym) => {
    try {
      const [yy, mm] = (ym || '').split('-').map((v) => Number(v));
      if (!yy || !mm) {
        setExcelTable({ headers: [], rows: [] });
        return;
      }
      const res = await bgvService.getExcelUploadTable(yy, mm);
      const headers = res?.data?.headers || [];
      const rows = res?.data?.rows || [];
      setExcelTable({
        headers: Array.isArray(headers) ? headers : [],
        rows: Array.isArray(rows) ? rows : []
      });
    } catch (e) {
      setExcelTable({ headers: [], rows: [] });
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  useEffect(() => {
    fetchExcelForMonth(selectedYm);
  }, [selectedYm]);

  const filteredRequests = useMemo(() => {
    if (!selectedYm) return [];
    const [yy, mm] = selectedYm.split('-').map((v) => Number(v));
    if (!yy || !mm) return [];
    return requests
      .map((r) => ({ r, d: parseRequestDate(r) }))
      .filter(({ d }) => d && d.getFullYear() === yy && d.getMonth() + 1 === mm)
      .sort((a, b) => (b.d?.getTime?.() || 0) - (a.d?.getTime?.() || 0))
      .map(({ r }) => r);
  }, [requests, selectedYm]);

  const selectedMonthLabel = monthOptions.find((m) => m.value === selectedMonthUi)?.label;

  const onUploadExcel = async (file) => {
    if (!file) return;
    setUploading(true);
    setToast({ type: '', text: '' });
    setError('');
    try {
      const res = await bgvService.uploadExcel(file);
      const imported = res?.data?.imported ?? 0;
      const skipped = res?.data?.skipped ?? 0;
      setToast({ type: 'success', text: `Excel uploaded: ${imported} rows imported, ${skipped} skipped` });
      await fetchExcelForMonth(selectedYm);
    } catch (e) {
      const msg = e?.response?.data?.message || 'Excel upload failed';
      setToast({ type: 'error', text: msg });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="yearly-dashboard-page" style={{ minHeight: '100vh', background: 'var(--page-bg)', padding: '40px 20px' }}>
      <ThemeToggleButton />
      <div className="admin-wrapper">
        <div style={{ marginBottom: '16px', display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={handleLogout}
            style={{
              padding: '10px 20px',
              minWidth: '120px',
              borderRadius: '8px',
              fontWeight: 600
            }}
          >
            Logout
          </button>
        </div>
      <div className="yearly-page-header">
        <div>
          <h2 className="form-title" style={{ marginBottom: 6 }}>Yearly Dashboard</h2>
          <div className="muted" style={{ marginTop: 2 }}>
            View all requests for a selected month and year
          </div>
        </div>

        <div className="yearly-page-actions">
          <button 
            className="btn-secondary" 
            onClick={handleBack}
            style={{ padding: '10px 20px', minWidth: '120px', borderRadius: '8px', fontWeight: 600 }}
          >
            Back
          </button>
          <button 
            className="btn-secondary" 
            onClick={() => {
              if (filteredRequests.length === 0) {
                setToast({ type: 'error', text: 'No data to export' });
                return;
              }
              const headers = ['PS Number', 'Requested By', 'RR Number', 'Employee Type', 'Candidate ID / RH ID', 'Resource Name', 'Resource PS No', 'Resource Type', 'Geo Region', 'Country', 'Status', 'BGV Initiated By', 'Comments', 'Onboarding Type', 'Submitted Date', 'User Role'];
              const rows = filteredRequests.map(r => [
                r.psNumber || '',
                r.requestedByName || '',
                r.rrNumber || '',
                r.employeeType || '',
                r.candidateId || '',
                r.resourceName || '',
                r.resourcePsNo || '',
                r.resourceType || '',
                r.geoRegion || '',
                r.country || '',
                statusLabelForUi(r.status) || '',
                r.bgvInitiatedBy || '',
                r.commentsFromPmo || '',
                r.onboardingType || '',
                r.requestSubmittedOn || '',
                r.userRole || ''
              ]);
              const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
              ws['!cols'] = [{ wch: 15 }, { wch: 25 }, { wch: 12 }, { wch: 18 }, { wch: 20 }, { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 25 }, { wch: 25 }, { wch: 40 }, { wch: 18 }, { wch: 20 }, { wch: 12 }];
              const wb = XLSX.utils.book_new();
              XLSX.utils.book_append_sheet(wb, ws, 'BGV Requests');
              XLSX.writeFile(wb, `bgv_requests_${selectedYm}.xlsx`);
            }}
            style={{ padding: '10px 20px', minWidth: '120px', marginLeft: '10px', borderRadius: '8px', fontWeight: 600 }}
          >
            Export to Excel
          </button>
        </div>
      </div>

      <div className="yearly-dashboard-panel" style={{ marginTop: 14 }}>
        <div className="yearly-dashboard-row">
          <label className="yearly-dashboard-label">
            Month
            <select
              className="yearly-dashboard-month yearly-dashboard-select"
              value={selectedMonthUi}
              onChange={(e) => {
                const mm = e.target.value;
                if (!mm || !selectedYearUi) return;
                setSelectedYm(`${selectedYearUi}-${mm}`);
              }}
            >
              {monthOptions.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </label>

          <label className="yearly-dashboard-label">
            Year
            <select
              className="yearly-dashboard-month yearly-dashboard-select"
              value={selectedYearUi}
              onChange={(e) => {
                const yy = e.target.value;
                if (!yy || !selectedMonthUi) return;
                setSelectedYm(`${yy}-${selectedMonthUi}`);
              }}
            >
              {yearOptions.map((y) => (
                <option key={y} value={String(y)}>
                  {y}
                </option>
              ))}
            </select>
          </label>

          <button className="btn-secondary yearly-action-btn" type="button" onClick={fetchAll} disabled={loading}>
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>

          <label
            className="btn-primary yearly-upload-btn yearly-action-btn"
            style={{ cursor: uploading ? 'not-allowed' : 'pointer', opacity: uploading ? 0.7 : 1 }}
          >
            {uploading ? 'Uploading…' : 'Upload Excel'}
            <input
              type="file"
              accept=".xlsx,.xls"
              style={{ display: 'none' }}
              disabled={uploading}
              onChange={(e) => {
                const f = e.target.files?.[0];
                // allow re-uploading the same file
                e.target.value = '';
                onUploadExcel(f);
              }}
            />
          </label>

          <div className="yearly-dashboard-summary">
            {selectedMonthLabel} {selectedYearUi} • {filteredRequests.length} records
          </div>
        </div>
      </div>

      {toast.text && <div className={`message ${toast.type}`}>{toast.text}</div>}

      {error && <div className="message error">{error}</div>}
      {loading && <div style={{ padding: 12 }}>Loading…</div>}

      {!loading && !error && (
        <>
          <div className="table-responsive" style={{ marginTop: 14 }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th colSpan={9} style={{ textTransform: 'none', fontSize: 14 }}>
                    Requests ({filteredRequests.length})
                  </th>
                </tr>
                <tr>
                  <th>PS No</th>
                  <th>Resource Name</th>
                  <th>Employee Type</th>
                  <th>Candidate ID / RH ID</th>
                  <th>Resource PS No</th>
                  <th>Submitted Date</th>
                  <th>Last Updated</th>
                  <th>Current Status</th>
                  <th>Comments</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ padding: 18, color: '#6b7280' }}>
                      No request records found for {selectedMonthLabel} {selectedYearUi}.
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((request) => {
                    const displayStatus = statusLabelForUi(request.status);
                    const statusClass = `status-${toStatusClassKey(displayStatus)}`;
                    const submitted = parseRequestDate(request);
                    const updated = parseUpdatedAt(request);
                    return (
                      <tr key={request.id}>
                        <td className="ps-no">{request.psNumber}</td>
                        <td className="resource-name">{request.resourceName}</td>
                        <td>{request.employeeType === 'LTIM_ASSOCIATES' ? 'LTM Associate' : request.employeeType === 'YET_TO_JOIN' ? 'Yet to Join' : request.employeeType || '—'}</td>
                        <td className="candidate-id">{request.candidateId || '—'}</td>
                        <td>{request.resourcePsNo || '—'}</td>
                        <td className="date">{submitted ? submitted.toLocaleDateString() : '—'}</td>
                        <td className="date">{updated ? updated.toLocaleString() : '—'}</td>
                        <td className="status">
                          <span className={`status-badge ${statusClass}`}>{displayStatus || '—'}</span>
                        </td>
                        <td className="comments">
                          <span className="comment-text">{request.commentsFromPmo || '—'}</span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="table-responsive" style={{ marginTop: 16 }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th colSpan={Math.max(1, excelTable.headers.length)} style={{ textTransform: 'none', fontSize: 14 }}>
                    Excel Upload Records ({excelTable.rows.length})
                  </th>
                </tr>
                <tr>
                  {excelTable.headers.length === 0 ? (
                    <th>—</th>
                  ) : (
                    excelTable.headers.map((h, idx) => (
                      <th key={`${idx}-${h}`} style={{ maxWidth: 220, whiteSpace: 'nowrap' }} title={h}>
                        {h}
                      </th>
                    ))
                  )}
                </tr>
              </thead>
              <tbody>
                {excelTable.rows.length === 0 ? (
                  <tr>
                    <td colSpan={Math.max(1, excelTable.headers.length)} style={{ padding: 18, color: '#6b7280' }}>
                      No uploaded Excel records found for {selectedMonthLabel} {selectedYearUi}.
                    </td>
                  </tr>
                ) : (
                  excelTable.rows.map((row, rIdx) => (
                    <tr key={rIdx}>
                      {(row || []).slice(0, excelTable.headers.length).map((cell, cIdx) => (
                        <td
                          key={`${rIdx}-${cIdx}`}
                          style={{ maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                          title={cell || ''}
                        >
                          {cell || ''}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
    </div>
  );
}
