import React, { useEffect, useState } from 'react';
import { bgvService } from '../services/bgvService';
import ThemeToggleButton from './ThemeToggleButton';

export default function History() {
  const [searchTerm, setSearchTerm] = useState('');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastSearched, setLastSearched] = useState('');
  const [searchType, setSearchType] = useState('universal'); // universal, ps, resourcePs, candidate

  useEffect(() => {
    // parse search term from hash query: #/history?search=123&type=ps
    const hash = window.location.hash || '';
    const query = hash.split('?')[1] || '';
    const params = new URLSearchParams(query);
    const term = params.get('search') || params.get('ps') || '';
    const type = params.get('type') || 'universal';
    setSearchTerm(term);
    setSearchType(type);
    if (term) fetchRecords(term, type);
  }, []);

  useEffect(() => {
    const term = (searchTerm || '').trim();
    if (!term) {
      setRecords([]);
      setError('');
      setLastSearched('');
      return;
    }
    const t = setTimeout(() => {
      if (term !== lastSearched) {
        fetchRecords(term, searchType);
      }
    }, 450);
    return () => clearTimeout(t);
  }, [searchTerm, searchType, lastSearched]);

  const onSearchClick = () => {
    const term = (searchTerm || '').trim();
    if (!term) {
      setError('Enter PS Number, Resource PS, Candidate ID, or Name to search');
      return;
    }
    fetchRecords(term, searchType);
  };

  const handleLogout = () => {
    window.localStorage.removeItem('bgvUserRole');
    window.localStorage.removeItem('bgvUserPs');
    window.location.hash = '#/login';
  };

  const parseTimestamp = (value) => {
    if (!value) return null;
    // Handle both milliseconds and seconds timestamps
    let timestamp = typeof value === 'string' ? parseInt(value) : value;
    // If timestamp is in seconds (less than year 2000 in milliseconds), convert to milliseconds
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

  const formatDate = (value) => {
    const d = parseTimestamp(value);
    return d ? d.toLocaleDateString() : '—';
  };

  const fetchRecords = async (term, type) => {
    setLoading(true);
    setError('');
    try {
      setLastSearched(term);
      window.location.hash = `#/history?search=${encodeURIComponent(term)}&type=${type}`;
      
      let res;
      switch (type) {
        case 'ps':
          res = await bgvService.getHistoryByPsNumber(term);
          break;
        case 'resourcePs':
          res = await bgvService.getHistoryByResourcePsNo(term);
          break;
        case 'candidate':
          res = await bgvService.getHistoryByCandidateId(term);
          break;
        case 'universal':
        default:
          res = await bgvService.searchHistory(term);
          break;
      }
      
      const data = res?.data?.data || [];
      // Sort by latest update/snapshot time (newest first)
      const sorted = data.sort((a, b) => {
        const timeA = parseTimestamp(a.snapshotAt || a.updatedAt || a.createdAt)?.getTime() || 0;
        const timeB = parseTimestamp(b.snapshotAt || b.updatedAt || b.createdAt)?.getTime() || 0;
        return timeB - timeA;
      });
      setRecords(sorted);
      if (data.length === 0) {
        setError('No history found for this search');
      }
    } catch (err) {
      setError('Error fetching history: ' + (err.response?.data?.message || err.message));
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const actionLabel = (action) => {
    const map = {
      CREATE: 'Created',
      UPDATE: 'Updated',
      DELETE: 'Deleted',
      STATUS_CHANGE: 'Status Changed'
    };
    return map[action] || action || 'Updated';
  };

  const statusLabelForUi = (status) => {
    if (!status) return '';
    const map = {
      // Backend enum values
      PENDING: 'BGV to be Initiated',
      APPROVED: 'BGV Initiated',
      ON_HOLD: 'BGV Stopped',
      REJECTED: 'BGV Cannot Be Initiated',

      // Dummy / legacy values
      Pending: 'BGV to be Initiated',
      Approved: 'BGV Initiated',
      'On Hold': 'BGV Stopped',
      Rejected: 'BGV Cannot Be Initiated'
    };
    return map[status] || status;
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--page-bg)', padding: '40px 20px' }}>
      <ThemeToggleButton />
      <div style={{ 
        background: 'var(--card-bg)',
        borderRadius: '12px',
        boxShadow: '0 4px 16px var(--card-elevation)',
        padding: '40px',
        margin: '0 auto',
        maxWidth: '100%',
        width: '100%',
        borderTop: '4px solid var(--accent, #ffc107)'
      }}>
        <div style={{ marginBottom: '16px', display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button 
            className="btn-secondary" 
            onClick={() => { window.location.hash = ''; }}
            style={{
              padding: '10px 20px',
              minWidth: '120px',
              borderRadius: '8px',
              fontWeight: 600
            }}>
            Home
          </button>
          <button
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
        <h2 className="form-title">BGV Request History</h2>
        
        <div className="history-controls" style={{ marginBottom: '20px' }}>
          <div className="history-left">
            <button className="btn-secondary" onClick={() => { window.location.hash = ''; }} style={{ padding: '10px 20px', minWidth: '120px', borderRadius: '8px', fontWeight: 600 }}>Back</button>
            <button className="btn-secondary" onClick={() => { window.location.hash = '#/admin'; }} style={{ marginLeft: 8, padding: '10px 20px', minWidth: '120px', borderRadius: '8px', fontWeight: 600 }}>Admin</button>
          </div>
          <div className="history-search" style={{ marginLeft: 12, display: 'flex', gap: '8px', alignItems: 'center' }}>
            <select 
              value={searchType} 
              onChange={(e) => setSearchType(e.target.value)}
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            >
              <option value="universal">Smart Search (All)</option>
              <option value="ps">Requester PS Number</option>
              <option value="resourcePs">Resource PS Number</option>
              <option value="candidate">Candidate ID / RH ID</option>
            </select>
            <input
              type="text"
              placeholder="Enter PS Number, Candidate ID, or Name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onSearchClick();
              }}
              style={{ minWidth: '300px', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
            <button className="btn-primary" onClick={onSearchClick} style={{ padding: '10px 20px', minWidth: '120px', borderRadius: '8px', fontWeight: 600 }}>Search</button>
          </div>
        </div>

        {loading && <div style={{ padding: '20px', textAlign: 'center' }}>Loading history...</div>}
        {error && <div className="error" style={{ padding: '12px', background: '#fee', color: '#c33', borderRadius: '4px', marginBottom: '12px' }}>{error}</div>}

        {!loading && !error && records.length === 0 && searchTerm && (
          <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
            No history records found for "{searchTerm}"
          </div>
        )}

        {!loading && !error && records.length === 0 && !searchTerm && (
          <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
            Enter a search term to view BGV request history
          </div>
        )}

        {!loading && !error && records.length > 0 && (
          <div>
            <div style={{ marginBottom: '12px', color: '#666', fontSize: '14px' }}>
              Found {records.length} history record{records.length !== 1 ? 's' : ''} for "{searchTerm}"
            </div>
            <div className="scroll-hint">Scroll horizontally to view more columns →</div>
            <div style={{ 
              maxHeight: 'calc(100vh - 350px)', 
              overflowY: 'auto', 
              overflowX: 'auto',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }} className="table-scroll">
              <table className="admin-table">
                <thead style={{ position: 'sticky', top: 0, background: '#fff', zIndex: 10 }}>
                  <tr>
                    <th>Action</th>
                    <th>Timestamp</th>
                    <th>Req. PS No</th>
                    <th>Requested By</th>
                    <th>Resource Name</th>
                    <th>Resource PS No</th>
                    <th>Candidate ID / RH ID</th>
                    <th>RR Number</th>
                    <th>Employee Type</th>
                    <th>Status</th>
                    <th>BGV Initiated By</th>
                    <th>Comments</th>
                    <th>Submitted On</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r, index) => (
                    <tr key={r.historyId || r.id || `${r.psNumber || 'row'}-${r.snapshotAt || r.updatedAt || r.createdAt || index}`}>
                      <td style={{ minWidth: 120, fontWeight: 600 }}>
                        {actionLabel(r.action)}
                      </td>
                      <td style={{ minWidth: 180 }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-color)' }}>{formatDateTime(r.snapshotAt || r.updatedAt || r.createdAt)}</div>
                        {r.createdAt && (r.snapshotAt || r.updatedAt || r.createdAt) !== r.createdAt && (
                          <div style={{ marginTop: 4, color: '#888', fontSize: 11 }}>
                            Raised: {formatDate(r.createdAt)}
                          </div>
                        )}
                      </td>
                      <td>{r.psNumber || '—'}</td>
                      <td>{r.requestedByName || '—'}</td>
                      <td>{r.resourceName || '—'}</td>
                      <td style={{ fontWeight: 600 }}>{r.resourcePsNo || '—'}</td>
                      <td>{r.candidateId || '—'}</td>
                      <td>{r.rrNumber || '—'}</td>
                      <td>{r.employeeType === 'LTIM_ASSOCIATES' ? 'LTM Associate' : r.employeeType === 'YET_TO_JOIN' ? 'Yet to Join' : r.employeeType || '—'}</td>
                      <td>{statusLabelForUi(r.status)}</td>
                      <td>{r.bgvInitiatedBy || '—'}</td>
                      <td style={{ maxWidth: 320, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{r.commentsFromPmo || '—'}</td>
                      <td>{r.requestSubmittedOn ? formatDate(r.requestSubmittedOn) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
