import React, { useState, useEffect } from 'react';
import '../styles/form.css';
import '../styles/admin-table.css';
import { bgvService } from '../services/bgvService';
import HistoryModal from './HistoryModal';
import ThemeToggleButton from './ThemeToggleButton';

export default function PmDashboard() {
  const [requests, setRequests] = useState([]);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('PENDING');
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyPsNumber, setHistoryPsNumber] = useState('');
  const [historySearchType, setHistorySearchType] = useState('resourcePsNo');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsRequest, setDetailsRequest] = useState(null);
  const sessionPsNumber = (window.localStorage.getItem('bgvUserPs') || '').trim();

  useEffect(() => {
    fetchMyRequests();
  }, []);

  const fetchMyRequests = async () => {
    if (!sessionPsNumber) {
      setRequests([]);
      setMessage({ type: 'error', text: 'Session PS Number not found. Please login again.' });
      return;
    }

    setIsLoading(true);
    try {
      const response = await bgvService.getRequestsByPsNumber(sessionPsNumber);
      const raw = response?.data?.data ?? response?.data ?? [];
      const data = Array.isArray(raw) ? raw : [];

      const pmRequests = data.filter((request) => {
        const requestPsNumber = String(request?.psNumber || '').trim();
        return requestPsNumber === sessionPsNumber;
      });

      setRequests(pmRequests);
      if (pmRequests.length === 0) {
        setMessage({ type: 'info', text: 'No BGV requests found.' });
      } else {
        setMessage({ type: '', text: '' });
      }
    } catch (error) {
      try {
        const fallbackResponse = await bgvService.getAllRequests();
        const fallbackRaw = fallbackResponse?.data?.data ?? fallbackResponse?.data ?? [];
        const fallbackData = Array.isArray(fallbackRaw) ? fallbackRaw : [];

        const pmRequests = fallbackData.filter((request) => {
          const requestPsNumber = String(request?.psNumber || '').trim();
          return requestPsNumber === sessionPsNumber;
        });

        setRequests(pmRequests);
        if (pmRequests.length === 0) {
          setMessage({ type: 'info', text: 'No BGV requests found.' });
        } else {
          setMessage({ type: '', text: '' });
        }
      } catch (fallbackError) {
        setMessage({
          type: 'error',
          text: 'Error loading your BGV requests'
        });
      }
    } finally {
      setIsLoading(false);
    }
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

  const normalizeStatus = (status) => {
    const normalized = String(status || '').trim().toUpperCase();
    if (normalized === 'ON HOLD') return 'ON_HOLD';
    return normalized;
  };

  const toStatusClassKey = (label) => {
    if (!label) return 'unknown';
    return String(label)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const parseDateValue = (raw) => {
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

  const parseRequestDate = (request) => {
    const raw = request?.requestSubmittedOn || request?.submittedDate;
    return parseDateValue(raw);
  };

  const parseUpdatedAt = (request) => parseDateValue(request?.updatedAt);

  const handleLogout = () => {
    window.localStorage.removeItem('bgvUserRole');
    window.localStorage.removeItem('bgvUserPs');
    window.location.hash = '#/login';
  };

  const filteredRequests = requests.filter(req => {
    const matchesSearch = searchTerm === '' || 
      (req.psNumber && req.psNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (req.resourceName && req.resourceName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (req.candidateId && req.candidateId.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (req.requestedByName && req.requestedByName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = normalizeStatus(req.status) === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Calculate status counts
  const statusCounts = {
    total: filteredRequests.length,
    PENDING: filteredRequests.filter(r => normalizeStatus(r.status) === 'PENDING').length,
    APPROVED: filteredRequests.filter(r => normalizeStatus(r.status) === 'APPROVED').length,
    ON_HOLD: filteredRequests.filter(r => normalizeStatus(r.status) === 'ON_HOLD').length,
    REJECTED: filteredRequests.filter(r => normalizeStatus(r.status) === 'REJECTED').length,
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--page-bg)', padding: '40px 20px' }}>
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
        <h2 className="form-title">PM Dashboard - My BGV Requests</h2>

      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '20px', marginBottom: '24px' }}>
        <div style={{ padding: '20px', background: '#f8f9fa', borderRadius: '8px', border: '2px solid #041e42' }}>
          <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#041e42' }}>Total Requests</div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#041e42' }}>{statusCounts.total}</div>
        </div>

        <div style={{ padding: '20px', background: '#fef3c7', borderRadius: '8px', border: '2px solid #fbbf24' }}>
          <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#92400e' }}>Pending</div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#92400e' }}>{statusCounts.PENDING}</div>
        </div>

        <div style={{ padding: '20px', background: '#d1fae5', borderRadius: '8px', border: '2px solid #10b981' }}>
          <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#065f46' }}>Initiated</div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#065f46' }}>{statusCounts.APPROVED}</div>
        </div>

      </div>

      <div className="admin-controls" style={{ flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
        <button onClick={fetchMyRequests} className="btn-primary" disabled={isLoading} style={{ padding: '10px 20px', minWidth: '120px', borderRadius: '8px', fontWeight: 600 }}>
          {isLoading ? 'Loading...' : 'Refresh'}
        </button>
        
        <button onClick={() => { window.location.hash = '#/pm'; }} className="btn-secondary" style={{ padding: '10px 20px', minWidth: '120px', borderRadius: '8px', fontWeight: 600 }}>
          New Request
        </button>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginLeft: 'auto', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: '8px',
              minWidth: '200px',
              borderRadius: '4px',
              border: '1px solid var(--input-border)',
              background: 'var(--input-bg)',
              color: 'var(--input-text)'
            }}
          />
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid var(--input-border)',
              background: 'var(--input-bg)',
              color: 'var(--input-text)'
            }}
          >
            <option value="PENDING">BGV to be Initiated</option>
            <option value="APPROVED">BGV Initiated</option>
            <option value="ON_HOLD">BGV Stopped</option>
          </select>
        </div>
      </div>

      {filteredRequests.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>
          <p>No BGV requests found. Create your first request using the "New Request" button above.</p>
        </div>
      ) : (
        <>
          <div className="scroll-hint">Scroll horizontally to view more columns →</div>
          <div className="table-responsive table-scroll requests-section" style={{ marginTop: '16px' }}>
            <table className="admin-table" style={{ fontSize: '13px' }}>
            <thead>
              <tr>
                <th>PS Number</th>
                <th>Requested By</th>
                <th>Resource Name</th>
                <th>Employee Type</th>
                <th>Submitted Date</th>
                <th>Last Updated</th>
                <th>Status</th>
                <th>BGV Details</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map(request => {
                const displayStatus = statusLabelForUi(request.status);
                const statusClass = `status-${toStatusClassKey(displayStatus)}`;

                const interimStatus = String(request?.interimStatus || '').trim();
                const interimDate = parseDateValue(request?.interimDate);
                const interimInfo = interimStatus || interimDate
                  ? `Interim status: ${interimStatus || 'Not available'}${interimDate ? ` (${interimDate.toLocaleDateString()})` : ''}`
                  : '';

                return (
                  <tr key={request.id}>
                    <td className="ps-no">{request.psNumber || '—'}</td>
                    <td>{request.requestedByName || '—'}</td>
                    <td className="resource-name">{request.resourceName || '—'}</td>
                    <td>{request.employeeType === 'LTIM_ASSOCIATES' ? 'LTM Associate' : request.employeeType === 'YET_TO_JOIN' ? 'Yet to Join' : request.employeeType || '—'}</td>
                    <td className="date">{parseRequestDate(request)?.toLocaleDateString() || '—'}</td>
                    <td className="date">{parseUpdatedAt(request)?.toLocaleString() || '—'}</td>
                    <td className="status">
                      <div className="status-cell">
                        <span className={`status-badge ${statusClass}`}>
                          {displayStatus}
                        </span>
                        {interimInfo && (
                          <span className="interim-info" title={interimInfo} aria-label={interimInfo}>
                            i
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        onClick={() => {
                          setDetailsRequest(request);
                          setShowDetailsModal(true);
                        }}
                        className="btn-secondary"
                        style={{ fontSize: '12px', padding: '4px 8px', whiteSpace: 'nowrap' }}
                        title="View BGV status details"
                      >
                        View
                      </button>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          onClick={() => {
                            const resourcePsNo = String(request.resourcePsNo || '').trim();
                            const candidateId = String(request.candidateId || '').trim();
                            const searchType = resourcePsNo ? 'resourcePsNo' : 'candidateId';
                            const searchValue = resourcePsNo || candidateId;

                            if (searchValue) {
                              setHistorySearchType(searchType);
                              setHistoryPsNumber(searchValue);
                              setShowHistoryModal(true);
                            }
                          }}
                          className="btn-secondary"
                          style={{ fontSize: '12px', padding: '4px 8px', whiteSpace: 'nowrap' }}
                          title="View request history"
                        >
                          History
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            </table>
          </div>
        </>
      )}

      {showHistoryModal && historyPsNumber && (
        <HistoryModal
          psNumber={historyPsNumber}
          searchType={historySearchType}
          onClose={() => {
            setShowHistoryModal(false);
            setHistoryPsNumber('');
            setHistorySearchType('resourcePsNo');
          }}
        />
      )}

      {showDetailsModal && detailsRequest && (
        <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="modal square-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="modal-header">
              <h3>BGV Status Details</h3>
              <button className="close-btn" onClick={() => setShowDetailsModal(false)} aria-label="Close modal">×</button>
            </div>
            <div style={{ display: 'grid', gap: '16px', padding: '8px 0' }}>
              <div>
                <strong style={{ display: 'block', marginBottom: '4px' }}>Resource Name:</strong>
                <span>{detailsRequest.resourceName || '—'}</span>
              </div>
              <div>
                <strong style={{ display: 'block', marginBottom: '4px' }}>Interim Status:</strong>
                <span>{detailsRequest.interimStatus || 'Not available'}</span>
              </div>
              <div>
                <strong style={{ display: 'block', marginBottom: '4px' }}>Interim Date:</strong>
                <span>{detailsRequest.interimDate ? parseDateValue(detailsRequest.interimDate)?.toLocaleDateString() || detailsRequest.interimDate : 'Not set'}</span>
              </div>
              <div>
                <strong style={{ display: 'block', marginBottom: '4px' }}>Final BGV Status:</strong>
                <span>{detailsRequest.finalBgvStatus || 'Not available'}</span>
              </div>
              <div>
                <strong style={{ display: 'block', marginBottom: '4px' }}>Final BGV Date:</strong>
                <span>{detailsRequest.finalBgvDate ? parseDateValue(detailsRequest.finalBgvDate)?.toLocaleDateString() || detailsRequest.finalBgvDate : 'Not set'}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button className="btn-secondary" onClick={() => setShowDetailsModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}
