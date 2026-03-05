import React, { useEffect, useState } from 'react';
import { bgvService } from '../services/bgvService';
import '../styles/admin-table.css';

export default function HistoryModal({ psNumber, searchType = 'resourcePsNo', onClose }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!psNumber) return;
    const fetchRecords = async () => {
      setLoading(true);
      setError('');
      try {
        const res = searchType === 'candidateId'
          ? await bgvService.getHistoryByCandidateId(psNumber)
          : await bgvService.getHistoryByResourcePsNo(psNumber);
        const data = res?.data?.data || [];
        const sorted = data.sort((a, b) => {
          const timeA = parseTimestamp(a.snapshotAt || a.updatedAt || a.createdAt)?.getTime() || 0;
          const timeB = parseTimestamp(b.snapshotAt || b.updatedAt || b.createdAt)?.getTime() || 0;
          return timeB - timeA;
        });
        setRecords(sorted);
        if (data.length === 0) {
          setError(
            searchType === 'candidateId'
              ? 'No history found for this Candidate ID'
              : 'No history found for this Resource PS Number'
          );
        }
      } catch (err) {
        setError('Error fetching history: ' + (err.response?.data?.message || err.message));
      } finally {
        setLoading(false);
      }
    };
    fetchRecords();
  }, [psNumber, searchType]);

  const headerLabel = searchType === 'candidateId' ? 'Candidate ID' : 'PS';

  const parseTimestamp = (value) => {
    if (!value) return null;
    let timestamp = typeof value === 'string' ? parseInt(value, 10) : value;
    if (timestamp < 946684800000) {
      timestamp = timestamp * 1000;
    }
    const d = new Date(timestamp);
    return Number.isNaN(d.getTime()) ? null : d;
  };

  const formatDateTime = (value) => {
    const d = parseTimestamp(value);
    return d ? d.toLocaleString() : '—';
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

  return (
    <div
      className="history-modal-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        zIndex: 2000,
        padding: '20px',
        overflowY: 'auto'
      }}
      onClick={onClose}
    >
      <div
        className="history-modal-content"
        style={{
          background: 'var(--card-bg)',
          padding: '28px',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '1200px',
          maxHeight: '90vh',
          overflowY: 'auto',
          overflowX: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px'
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: 'var(--text-color)' }}>
              BGV History - {headerLabel} {psNumber}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: 'var(--muted)',
              padding: '4px 8px'
            }}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {loading && <div style={{ padding: '20px', textAlign: 'center' }}>Loading history...</div>}
        {error && !loading && (
          <div className="error" style={{ padding: '12px', background: '#fee', color: '#c33', borderRadius: '4px', marginBottom: '12px' }}>
            {error}
          </div>
        )}

        {!loading && !error && records.length > 0 && (
          <>
            <div className="scroll-hint">Scroll horizontally to view more columns →</div>
            <div className="table-responsive table-scroll">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Action</th>
                    <th>Timestamp</th>
                    <th>Req. PS No</th>
                    <th>Requested By</th>
                    <th>Resource Name</th>
                    <th>Resource PS No</th>
                    <th>Candidate ID / RH ID</th>
                    <th>RR Number</th>
                    <th>Status</th>
                    <th>BGV Initiated By</th>
                    <th>Comments</th>
                    <th>Stopped Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r) => (
                    <tr key={r.historyId || r.id}>
                      <td>{r.action || 'UPDATE'}</td>
                      <td>{formatDateTime(r.snapshotAt || r.updatedAt || r.createdAt)}</td>
                      <td>{r.psNumber || '—'}</td>
                      <td>{r.requestedByName || '—'}</td>
                      <td>{r.resourceName || '—'}</td>
                      <td>{r.resourcePsNo || '—'}</td>
                      <td>{r.candidateId || '—'}</td>
                      <td>{r.rrNumber || '—'}</td>
                      <td>{statusLabelForUi(r.status) || '—'}</td>
                      <td>{r.bgvInitiatedBy || '—'}</td>
                      <td style={{ whiteSpace: 'pre-wrap' }}>{r.commentsFromPmo || '—'}</td>
                      <td>{r.bgvStoppedReason || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
