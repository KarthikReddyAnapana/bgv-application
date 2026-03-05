import React, { useEffect, useState } from 'react';
import PmForm from './components/PmForm';
import PmDashboard from './components/PmDashboard';
import History from './components/History';
import AdminForm from './components/AdminForm';
import SuperAdmin from './components/SuperAdmin';
import YearlyDashboard from './components/YearlyDashboard';
import HistoryModal from './components/HistoryModal';
import { bgvService } from './services/bgvService';
import './styles/form.css';
import './styles/admin-table.css';

export default function App() {
  const [route, setRoute] = useState(window.location.hash || '');
  const [theme, setTheme] = useState('light');
  const [requests, setRequests] = useState([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailRequest, setDetailRequest] = useState(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyPsNumber, setHistoryPsNumber] = useState('');
  const [sessionRole, setSessionRole] = useState('');
  const [sessionPsNumber, setSessionPsNumber] = useState('');
  const [loginPsNumber, setLoginPsNumber] = useState('');
  const [loginRole, setLoginRole] = useState('PM');
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    const onHash = () => {
      setRoute(window.location.hash || '');
      const storedRole = window.localStorage.getItem('bgvUserRole') || '';
      const storedPs = window.localStorage.getItem('bgvUserPs') || '';
      setSessionRole(storedRole);
      setSessionPsNumber(storedPs);
    };
    window.addEventListener('hashchange', onHash);
    onHash();
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    const saved = window.localStorage.getItem('app-theme');
    if (saved === 'dark' || saved === 'light') setTheme(saved);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme === 'dark' ? 'dark' : 'light');
    window.localStorage.setItem('app-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => (t === 'dark' ? 'light' : 'dark'));

  const roleToRoute = (role) => {
    if (role === 'PM') return '#/pm-dashboard';
    if (role === 'PMO_ADMIN') return '#/admin';
    if (role === 'SUPER_ADMIN') return '#/super-admin';
    return '';
  };

  const handleLogin = () => {
    const ps = (loginPsNumber || '').trim();
    if (!ps) {
      setLoginError('PS Number is required');
      return;
    }
    if (!/^[0-9]+$/.test(ps)) {
      setLoginError('PS Number must be numeric');
      return;
    }
    const role = loginRole || 'PM';
    window.localStorage.setItem('bgvUserRole', role);
    window.localStorage.setItem('bgvUserPs', ps);
    setSessionRole(role);
    setSessionPsNumber(ps);
    setLoginError('');
    window.location.hash = roleToRoute(role);
  };

  // Fetch PM requests for homepage
  useEffect(() => {
    if (route.startsWith('#/home')) {
      fetchMyRequests();
    }
  }, [route]);

  const fetchMyRequests = async () => {
    setIsLoadingRequests(true);
    try {
      const response = await bgvService.getAllRequests();
      const raw = response?.data?.data ?? response?.data ?? [];
      const data = Array.isArray(raw) ? raw : [];
      const pmRequests = data.filter(r => r.userRole === 'PM');
      const scoped = sessionPsNumber
        ? pmRequests.filter(r => r.psNumber === sessionPsNumber && r.status === 'PENDING')
        : pmRequests.filter(r => r.status === 'PENDING');
      setRequests(scoped);
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setIsLoadingRequests(false);
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

  const toStatusClassKey = (label) => {
    if (!label) return 'unknown';
    return String(label)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const goToTrackHistory = (psNumber) => {
    if (psNumber) {
      setHistoryPsNumber(psNumber);
      setShowHistoryModal(true);
    }
  };

  // Filter requests
  const filteredRequests = requests.filter(req => {
    const matchesSearch = searchTerm === '' || 
      (req.psNumber && req.psNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (req.resourceName && req.resourceName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (req.candidateId && req.candidateId.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (req.requestedByName && req.requestedByName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = filterStatus === '' || req.status === filterStatus;
    const matchesPriority = filterPriority === '' || 
      (filterPriority === 'HIGH' && req.priority === 'HIGH') ||
      (filterPriority === 'NORMAL' && (!req.priority || req.priority === 'NORMAL'));
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const renderLogin = () => (
    <div className="app-shell">
      <div className="container">
        <div className="page-header">
          <div className="brand">
            <div className="page-title">BGV Request Management System</div>
            <div className="muted" style={{ fontSize: '15px' }}>
              Enter your PS Number to continue
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === 'dark' ? 'Light mode' : 'Dark mode'}
            </button>
          </div>
        </div>

        <div style={{
          background: 'var(--card-bg)',
          borderRadius: '16px',
          padding: '32px',
          marginTop: 24,
          border: '1px solid var(--border-color)',
          maxWidth: '520px',
          marginLeft: 'auto',
          marginRight: 'auto'
        }}>
          <h2 style={{ marginTop: 0, marginBottom: 16, color: 'var(--text-color)' }}>
            Login
          </h2>
          <div style={{ display: 'grid', gap: 16 }}>
            <label style={{ display: 'grid', gap: 6, fontWeight: 600, color: 'var(--text-color)' }}>
              <span>PS Number <span style={{ color: '#ef4444' }}>*</span></span>
              <input
                type="text"
                value={loginPsNumber}
                onChange={(e) => setLoginPsNumber(e.target.value)}
                placeholder="Enter PS Number"
                style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--input-border)',
                  background: 'var(--input-bg)',
                  color: 'var(--input-text)'
                }}
              />
            </label>

            <label style={{ display: 'grid', gap: 6, fontWeight: 600, color: 'var(--text-color)' }}>
              Role
              <select
                value={loginRole}
                onChange={(e) => setLoginRole(e.target.value)}
                style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--input-border)',
                  background: 'var(--input-bg)',
                  color: 'var(--input-text)'
                }}
              >
                <option value="PM">Project Manager</option>
                <option value="PMO_ADMIN">PMO/Admin</option>
                <option value="SUPER_ADMIN">Super Admin</option>
              </select>
            </label>

            {loginError && (
              <div style={{ color: '#c33', background: '#fee', padding: '10px 12px', borderRadius: '8px' }}>
                {loginError}
              </div>
            )}

            <button
              className="btn-primary"
              onClick={handleLogin}
              style={{ padding: '12px 20px', borderRadius: '8px', fontWeight: 700 }}
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // routing
  const isLoginRoute = route === '' || route === '#/login';
  if (isLoginRoute || !sessionRole || !sessionPsNumber) {
    return renderLogin();
  }

  if (route.startsWith('#/pm-dashboard')) {
    if (sessionRole !== 'PM') return renderLogin();
    return <PmDashboard />;
  }
  if (route.startsWith('#/pm')) {
    if (sessionRole !== 'PM') return renderLogin();
    return <PmForm onRequestSubmitted={fetchMyRequests} />;
  }
  if (route.startsWith('#/history')) return <History />;
  if (route.startsWith('#/admin')) {
    if (sessionRole !== 'PMO_ADMIN' && sessionRole !== 'SUPER_ADMIN') return renderLogin();
    return <AdminForm />;
  }
  if (route.startsWith('#/super-admin')) {
    if (sessionRole !== 'SUPER_ADMIN') return renderLogin();
    return <SuperAdmin />;
  }
  if (route.startsWith('#/yearly-dashboard')) return <YearlyDashboard />;
  if (route.startsWith('#/home')) {
    return (
      <div className="app-shell">
        <div className="container">
          <div className="page-header">
            <div className="brand">
              <div className="page-title">BGV Request Management System</div>
              <div className="muted" style={{ fontSize: '15px' }}>
                PM login required to submit requests
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
                {theme === 'dark' ? 'Light mode' : 'Dark mode'}
              </button>
            </div>
          </div>

          {/* Hero Section */}
          <div style={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '16px',
            padding: '60px 40px',
            marginTop: 36,
            color: '#fff',
            textAlign: 'center',
            boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
          }}>
            <h1 style={{ 
              fontSize: '36px', 
              fontWeight: 800, 
              margin: '0 0 16px 0',
              letterSpacing: '-0.5px'
            }}>
              Background Verification Made Simple
            </h1>
            <p style={{ 
              fontSize: '18px', 
              margin: '0 0 32px 0',
              opacity: 0.95,
              maxWidth: '600px',
              marginLeft: 'auto',
              marginRight: 'auto',
              lineHeight: 1.6
            }}>
              Streamline your employee background verification process with our comprehensive management system
            </p>
            <button 
              className="btn-primary" 
              style={{
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                color: '#fff',
                padding: '16px 40px',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '16px',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(245, 87, 108, 0.4)',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 25px rgba(245, 87, 108, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 20px rgba(245, 87, 108, 0.4)';
              }}
              onClick={() => { window.location.hash = '#/pm'; }}>
              Initiate New BGV Request
            </button>
          </div>

          {/* Quick Stats */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 20,
            marginTop: 32
          }}>
            <div style={{
              background: 'var(--card-bg)',
              padding: '24px',
              borderRadius: '12px',
              border: '1px solid var(--border-color)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--text-color)', marginBottom: 8 }}>
                {requests.length}
              </div>
              <div style={{ fontSize: '14px', color: 'var(--muted)', fontWeight: 600 }}>
                Total Requests
              </div>
            </div>
            
            <div style={{
              background: 'var(--card-bg)',
              padding: '24px',
              borderRadius: '12px',
              border: '1px solid var(--border-color)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '32px', fontWeight: 700, color: '#fbbf24', marginBottom: 8 }}>
                {requests.filter(r => r.status === 'PENDING').length}
              </div>
              <div style={{ fontSize: '14px', color: 'var(--muted)', fontWeight: 600 }}>
                Pending
              </div>
            </div>
            
            <div style={{
              background: 'var(--card-bg)',
              padding: '24px',
              borderRadius: '12px',
              border: '1px solid var(--border-color)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '32px', fontWeight: 700, color: '#10b981', marginBottom: 8 }}>
                {requests.filter(r => r.status === 'APPROVED').length}
              </div>
              <div style={{ fontSize: '14px', color: 'var(--muted)', fontWeight: 600 }}>
                Initiated
              </div>
            </div>
            
            <div style={{
              background: 'var(--card-bg)',
              padding: '24px',
              borderRadius: '12px',
              border: '1px solid var(--border-color)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '32px', fontWeight: 700, color: '#ef4444', marginBottom: 8 }}>
                {requests.filter(r => r.priority === 'HIGH').length}
              </div>
              <div style={{ fontSize: '14px', color: 'var(--muted)', fontWeight: 600 }}>
                High Priority
              </div>
            </div>
          </div>

          {/* My BGV Requests Section */}
          <div style={{ marginTop: 48 }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: 24, 
              flexWrap: 'wrap', 
              gap: 16 
            }}>
              <div>
                <h2 style={{ 
                  margin: 0, 
                  fontSize: '28px', 
                  fontWeight: 800, 
                  color: 'var(--text-color)',
                  letterSpacing: '-0.5px'
                }}>
                  My BGV Requests
                </h2>
                <p style={{ 
                  margin: '4px 0 0 0', 
                  fontSize: '14px', 
                  color: 'var(--muted)' 
                }}>
                  Track and manage all your background verification requests
                </p>
              </div>
              <button 
                onClick={fetchMyRequests} 
                className="btn-primary" 
                disabled={isLoadingRequests}
                style={{ 
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}>
                {isLoadingRequests ? 'Loading...' : 'Refresh'}
              </button>
            </div>

            {/* Filters */}
            <div style={{ 
              padding: '24px',
              background: 'var(--card-bg)',
              borderRadius: '12px',
              border: '1px solid var(--border-color)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              marginBottom: 24
            }}>
              <div style={{ 
                fontSize: '16px', 
                fontWeight: 600, 
                color: 'var(--text-color)', 
                marginBottom: 16 
              }}>
                Filter & Search
              </div>
              
              <div style={{ 
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 16,
                alignItems: 'end'
              }}>
                <div style={{ flex: '1 1 300px' }}>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '13px', 
                    fontWeight: 500, 
                    color: 'var(--muted)', 
                    marginBottom: 6 
                  }}>
                    Search
                  </label>
                  <input
                    type="text"
                    placeholder="PS Number, Name, Candidate ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid var(--input-border)',
                      background: 'var(--input-bg)',
                      color: 'var(--input-text)',
                      fontSize: '14px',
                      transition: 'border-color 0.2s',
                      outline: 'none'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '13px', 
                    fontWeight: 500, 
                    color: 'var(--muted)', 
                    marginBottom: 6 
                  }}>
                    Status
                  </label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid var(--input-border)',
                      background: 'var(--input-bg)',
                      color: 'var(--input-text)',
                      fontSize: '14px',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="">All Status</option>
                    <option value="PENDING">BGV to be Initiated</option>
                    <option value="APPROVED">BGV Initiated</option>
                    <option value="ON_HOLD">BGV Stopped</option>
                    <option value="REJECTED">BGV Cannot Be Initiated</option>
                  </select>
                </div>
                
                <div>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '13px', 
                    fontWeight: 500, 
                    color: 'var(--muted)', 
                    marginBottom: 6 
                  }}>
                    Priority
                  </label>
                  <select
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid var(--input-border)',
                      background: 'var(--input-bg)',
                      color: 'var(--input-text)',
                      fontSize: '14px',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="">All Priorities</option>
                    <option value="HIGH">High Priority</option>
                    <option value="NORMAL">Normal Priority</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Requests Table */}
            <div style={{ 
              background: 'var(--card-bg)',
              borderRadius: '12px',
              border: '1px solid var(--border-color)',
              overflow: 'hidden'
            }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--table-header)', color: 'var(--text-color)' }}>
                      <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600 }}>PS Number</th>
                      <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600 }}>Requested By</th>
                      <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600 }}>Resource Name</th>
                      <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600 }}>Status</th>
                      <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600 }}>Submitted</th>
                      <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600 }}>Updated</th>
                      <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRequests.map((req, idx) => (
                      <tr key={req.id || idx} style={{ borderTop: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '16px' }}>{req.psNumber}</td>
                        <td style={{ padding: '16px' }}>{req.requestedByName}</td>
                        <td style={{ padding: '16px' }}>{req.resourceName}</td>
                        <td style={{ padding: '16px' }}>
                          <span className={`status-pill status-${toStatusClassKey(statusLabelForUi(req.status))}`}>
                            {statusLabelForUi(req.status)}
                          </span>
                        </td>
                        <td style={{ padding: '16px' }}>{req.requestSubmittedOn}</td>
                        <td style={{ padding: '16px' }}>{req.updatedAt ? new Date(req.updatedAt).toLocaleDateString() : '-'}</td>
                        <td style={{ padding: '16px' }}>
                          <button
                            className="btn-secondary"
                            onClick={() => setDetailRequest(req)}
                            style={{ marginRight: 8 }}
                          >
                            View Details
                          </button>
                          <button
                            className="btn-secondary"
                            onClick={() => goToTrackHistory(req.psNumber)}
                          >
                            Track History
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {showDetailModal && detailRequest && (
            <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
              <div className="modal" onClick={(e) => e.stopPropagation()}>
                <h3>Request Details</h3>
                <div className="modal-content">
                  <p><strong>PS Number:</strong> {detailRequest.psNumber}</p>
                  <p><strong>Requested By:</strong> {detailRequest.requestedByName}</p>
                  <p><strong>RR Number:</strong> {detailRequest.rrNumber}</p>
                  <p><strong>Resource Name:</strong> {detailRequest.resourceName}</p>
                  <p><strong>Status:</strong> {statusLabelForUi(detailRequest.status)}</p>
                  <p><strong>Comments:</strong> {detailRequest.commentsFromPmo}</p>
                </div>
                <button className="btn-primary" onClick={() => setShowDetailModal(false)}>Close</button>
              </div>
            </div>
          )}

          {showHistoryModal && historyPsNumber && (
            <HistoryModal
              psNumber={historyPsNumber}
              onClose={() => {
                setShowHistoryModal(false);
                setHistoryPsNumber('');
              }}
            />
          )}
        </div>
      </div>
    );
  }

  return renderLogin();
  return (
    <div className="app-shell">
      <div className="container">
        <div className="page-header">
          <div className="brand">
            <div className="page-title">BGV Request Management System</div>
            <div className="muted" style={{ fontSize: '15px' }}>
              PM login required to submit requests
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === 'dark' ? 'Light mode' : 'Dark mode'}
            </button>
          </div>
        </div>

        {/* Hero Section */}
        <div style={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '16px',
          padding: '60px 40px',
          marginTop: 36,
          color: '#fff',
          textAlign: 'center',
          boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
        }}>
          <h1 style={{ 
            fontSize: '36px', 
            fontWeight: 800, 
            margin: '0 0 16px 0',
            letterSpacing: '-0.5px'
          }}>
            Background Verification Made Simple
          </h1>
          <p style={{ 
            fontSize: '18px', 
            margin: '0 0 32px 0',
            opacity: 0.95,
            maxWidth: '600px',
            marginLeft: 'auto',
            marginRight: 'auto',
            lineHeight: 1.6
          }}>
            Streamline your employee background verification process with our comprehensive management system
          </p>
          <button 
            className="btn-primary" 
            style={{
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: '#fff',
              padding: '16px 40px',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '16px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(245, 87, 108, 0.4)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 25px rgba(245, 87, 108, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 20px rgba(245, 87, 108, 0.4)';
            }}
            onClick={() => { window.location.hash = '#/pm'; }}>
            Initiate New BGV Request
          </button>
        </div>

        {/* Quick Stats */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 20,
          marginTop: 32
        }}>
          <div style={{
            background: 'var(--card-bg)',
            padding: '24px',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--text-color)', marginBottom: 8 }}>
              {requests.length}
            </div>
            <div style={{ fontSize: '14px', color: 'var(--muted)', fontWeight: 600 }}>
              Total Requests
            </div>
          </div>
          
          <div style={{
            background: 'var(--card-bg)',
            padding: '24px',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '32px', fontWeight: 700, color: '#fbbf24', marginBottom: 8 }}>
              {requests.filter(r => r.status === 'PENDING').length}
            </div>
            <div style={{ fontSize: '14px', color: 'var(--muted)', fontWeight: 600 }}>
              Pending
            </div>
          </div>
          
          <div style={{
            background: 'var(--card-bg)',
            padding: '24px',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '32px', fontWeight: 700, color: '#10b981', marginBottom: 8 }}>
              {requests.filter(r => r.status === 'APPROVED').length}
            </div>
            <div style={{ fontSize: '14px', color: 'var(--muted)', fontWeight: 600 }}>
              Initiated
            </div>
          </div>
          
          <div style={{
            background: 'var(--card-bg)',
            padding: '24px',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '32px', fontWeight: 700, color: '#ef4444', marginBottom: 8 }}>
              {requests.filter(r => r.priority === 'HIGH').length}
            </div>
            <div style={{ fontSize: '14px', color: 'var(--muted)', fontWeight: 600 }}>
              High Priority
            </div>
          </div>
        </div>

        {/* My BGV Requests Section */}
        <div style={{ marginTop: 48 }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: 24, 
            flexWrap: 'wrap', 
            gap: 16 
          }}>
            <div>
              <h2 style={{ 
                margin: 0, 
                fontSize: '28px', 
                fontWeight: 800, 
                color: 'var(--text-color)',
                letterSpacing: '-0.5px'
              }}>
                My BGV Requests
              </h2>
              <p style={{ 
                margin: '4px 0 0 0', 
                fontSize: '14px', 
                color: 'var(--muted)' 
              }}>
                Track and manage all your background verification requests
              </p>
            </div>
            <button 
              onClick={fetchMyRequests} 
              className="btn-primary" 
              disabled={isLoadingRequests}
              style={{ 
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: '14px'
              }}>
              {isLoadingRequests ? 'Loading...' : 'Refresh'}
            </button>
          </div>

          {/* Filters */}
          <div style={{ 
            padding: '24px',
            background: 'var(--card-bg)',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            marginBottom: 24
          }}>
            <div style={{ 
              fontSize: '16px', 
              fontWeight: 600, 
              color: 'var(--text-color)', 
              marginBottom: 16 
            }}>
              Filter & Search
            </div>
            
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 16,
              alignItems: 'end'
            }}>
              <div style={{ flex: '1 1 300px' }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: '13px', 
                  fontWeight: 500, 
                  color: 'var(--muted)', 
                  marginBottom: 6 
                }}>
                  Search
                </label>
                <input
                  type="text"
                  placeholder="PS Number, Name, Candidate ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--input-border)',
                    background: 'var(--input-bg)',
                    color: 'var(--input-text)',
                    fontSize: '14px',
                    transition: 'border-color 0.2s',
                    outline: 'none'
                  }}
                />
              </div>
              
              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '13px', 
                  fontWeight: 500, 
                  color: 'var(--muted)', 
                  marginBottom: 6 
                }}>
                  Status
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--input-border)',
                    background: 'var(--input-bg)',
                    color: 'var(--input-text)',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  <option value="">All Status</option>
                  <option value="PENDING">BGV to be Initiated</option>
                  <option value="APPROVED">BGV Initiated</option>
                  <option value="ON_HOLD">BGV Stopped</option>
                  <option value="REJECTED">BGV Cannot Be Initiated</option>
                </select>
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '13px', 
                  fontWeight: 500, 
                  color: 'var(--muted)', 
                  marginBottom: 6 
                }}>
                  Priority
                </label>
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--input-border)',
                    background: 'var(--input-bg)',
                    color: 'var(--input-text)',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  <option value="">All Priority</option>
                  <option value="HIGH">High Priority</option>
                  <option value="NORMAL">Normal</option>
                </select>
              </div>

              {(searchTerm || filterStatus || filterPriority) && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilterStatus('');
                    setFilterPriority('');
                  }}
                  className="btn-primary"
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Results Summary */}
          <div style={{ 
            marginBottom: 20, 
            padding: '12px 16px',
            background: 'var(--input-bg)',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 8
          }}>
            <div style={{ fontSize: '14px', color: 'var(--text-color)', fontWeight: 500 }}>
              Showing <span style={{ color: '#667eea', fontWeight: 700 }}>{filteredRequests.length}</span> of <span style={{ fontWeight: 700 }}>{requests.length}</span> requests
            </div>
            {(searchTerm || filterStatus || filterPriority) && (
              <div style={{ fontSize: '13px', color: 'var(--muted)' }}>
                {searchTerm && <span>Search: "{searchTerm}" </span>}
                {filterStatus && <span>• Status: {filterStatus} </span>}
                {filterPriority && <span>• Priority: {filterPriority}</span>}
              </div>
            )}
          </div>

          {/* Requests Display */}
          {isLoadingRequests ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--muted)' }}>
              <div style={{ fontSize: '16px' }}>Loading your requests...</div>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--muted)' }}>
              <div style={{ fontSize: '16px', marginBottom: 8 }}>
                {requests.length === 0 ? 'No BGV requests found.' : 'No requests match your filters.'}
              </div>
              <div style={{ fontSize: '14px' }}>
                {requests.length === 0 ? 'Create your first request using the button above.' : 'Try adjusting your search or filter criteria.'}
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 20 }}>
              {filteredRequests.map((req) => {
                const statusLabel = statusLabelForUi(req.status);
                const statusClass = toStatusClassKey(statusLabel);
                const isHighPriority = req.priority === 'HIGH';
                
                return (
                  <div 
                    key={req.id}
                    style={{
                      padding: '20px',
                      background: isHighPriority ? 'linear-gradient(135deg, #fff5f5 0%, #ffe5e5 100%)' : 'var(--card-bg)',
                      border: isHighPriority ? '2px solid #ef4444' : '1px solid var(--border-color)',
                      borderRadius: '10px',
                      boxShadow: isHighPriority ? '0 4px 12px rgba(239, 68, 68, 0.15)' : '0 2px 8px rgba(0,0,0,0.05)',
                      transition: 'all 0.2s ease',
                      cursor: 'pointer',
                      position: 'relative'
                    }}
                    onClick={() => {
                      setDetailRequest(req);
                      setShowDetailModal(true);
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = isHighPriority ? '0 6px 16px rgba(239, 68, 68, 0.25)' : '0 4px 12px rgba(0,0,0,0.1)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = isHighPriority ? '0 4px 12px rgba(239, 68, 68, 0.15)' : '0 2px 8px rgba(0,0,0,0.05)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    {isHighPriority && (
                      <div style={{
                        position: 'absolute',
                        top: 12,
                        right: 12,
                        background: '#ef4444',
                        color: '#fff',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '11px',
                        fontWeight: 700,
                        letterSpacing: '0.5px'
                      }}>
                        HIGH PRIORITY
                      </div>
                    )}
                    
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-color)', marginBottom: 4 }}>
                        {req.resourceName || 'N/A'}
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--muted)' }}>
                        PS: {req.psNumber || '—'} | Requested by: {req.requestedByName || '—'}
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '13px', color: 'var(--muted)' }}>Employee Type:</span>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-color)' }}>
                          {req.employeeType === 'LTIM_ASSOCIATES' ? 'LTM Associate' : req.employeeType === 'YET_TO_JOIN' ? 'Yet to Join' : req.employeeType || '—'}
                        </span>
                      </div>
                      
                      {req.candidateId && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '13px', color: 'var(--muted)' }}>Candidate ID:</span>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-color)' }}>{req.candidateId}</span>
                        </div>
                      )}
                      
                      {req.resourcePsNo && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '13px', color: 'var(--muted)' }}>Resource PS No:</span>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-color)' }}>{req.resourcePsNo}</span>
                        </div>
                      )}
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '13px', color: 'var(--muted)' }}>Status:</span>
                        <span className={`status-badge status-${statusClass}`} style={{ fontSize: '12px' }}>
                          {statusLabel}
                        </span>
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '13px', color: 'var(--muted)' }}>Submitted:</span>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-color)' }}>
                          {req.requestSubmittedOn ? new Date(req.requestSubmittedOn).toLocaleDateString('en-GB') : '—'}
                        </span>
                      </div>
                    </div>

                    <button
                      className="btn-primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        goToTrackHistory(req.psNumber);
                      }}
                      style={{
                        width: '100%',
                        padding: '10px',
                        fontSize: '13px',
                        borderRadius: '6px'
                      }}
                      disabled={!req.psNumber}
                    >
                      Track History
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Detail Modal for Request */}
        {showDetailModal && detailRequest && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }} onClick={() => setShowDetailModal(false)}>
            <div style={{
              background: 'var(--card-bg)',
              padding: '32px',
              borderRadius: '12px',
              maxWidth: '800px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
            }} onClick={(e) => e.stopPropagation()}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '24px',
                paddingBottom: '16px',
                borderBottom: '2px solid var(--border-color)'
              }}>
                <h2 style={{ 
                  margin: 0, 
                  fontSize: '24px', 
                  fontWeight: 700, 
                  color: 'var(--text-color)' 
                }}>
                  BGV Request Details
                </h2>
                <button 
                  onClick={() => setShowDetailModal(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '24px',
                    cursor: 'pointer',
                    color: 'var(--muted)',
                    padding: '4px 8px',
                    transition: 'color 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.color = '#ef4444'}
                  onMouseLeave={(e) => e.target.style.color = 'var(--muted)'}
                >
                  ×
                </button>
              </div>
              
              {/* Priority Badge */}
              {detailRequest.priority === 'HIGH' && (
                <div style={{
                  marginBottom: '24px',
                  padding: '12px 16px',
                  background: 'linear-gradient(135deg, #fff5f5 0%, #ffe5e5 100%)',
                  border: '2px solid #ef4444',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <span style={{
                    background: '#ef4444',
                    color: '#fff',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 700,
                    boxShadow: '0 2px 8px rgba(239,68,68,0.3)'
                  }}>
                    HIGH PRIORITY
                  </span>
                  <span style={{ fontSize: '14px', color: '#ef4444', fontWeight: 600 }}>
                    This request requires immediate attention
                  </span>
                </div>
              )}
              
              {/* Request Information */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ 
                  fontSize: '16px', 
                  fontWeight: 700, 
                  color: 'var(--text-color)',
                  marginBottom: '16px',
                  paddingBottom: '8px',
                  borderBottom: '1px solid var(--border-color)'
                }}>
                  Request Information
                </h3>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '16px'
                }}>
                  <div style={{ 
                    padding: '14px',
                    background: 'var(--input-bg)',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)'
                  }}>
                    <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '4px', fontWeight: 600 }}>PS Number</div>
                    <div style={{ fontSize: '15px', color: 'var(--text-color)', fontWeight: 600 }}>{detailRequest.psNumber || '—'}</div>
                  </div>
                  
                  <div style={{ 
                    padding: '14px',
                    background: 'var(--input-bg)',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)'
                  }}>
                    <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '4px', fontWeight: 600 }}>Requested By</div>
                    <div style={{ fontSize: '15px', color: 'var(--text-color)', fontWeight: 600 }}>{detailRequest.requestedByName || '—'}</div>
                  </div>
                  
                  <div style={{ 
                    padding: '14px',
                    background: 'var(--input-bg)',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)'
                  }}>
                    <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '4px', fontWeight: 600 }}>RR Number</div>
                    <div style={{ fontSize: '15px', color: 'var(--text-color)', fontWeight: 600 }}>{detailRequest.rrNumber || '—'}</div>
                  </div>
                  
                  <div style={{ 
                    padding: '14px',
                    background: 'var(--input-bg)',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)'
                  }}>
                    <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '4px', fontWeight: 600 }}>Employee Type</div>
                    <div style={{ fontSize: '15px', color: 'var(--text-color)', fontWeight: 600 }}>
                      {detailRequest.employeeType === 'LTIM_ASSOCIATES' ? 'LTM Associate' : 
                       detailRequest.employeeType === 'YET_TO_JOIN' ? 'Yet to Join' : 
                       detailRequest.employeeType || '—'}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Resource/Candidate Details */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ 
                  fontSize: '16px', 
                  fontWeight: 700, 
                  color: 'var(--text-color)',
                  marginBottom: '16px',
                  paddingBottom: '8px',
                  borderBottom: '1px solid var(--border-color)'
                }}>
                  {detailRequest.employeeType === 'LTIM_ASSOCIATES' ? 'Resource Details' : 'Candidate Details'}
                </h3>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '16px'
                }}>
                  {detailRequest.resourceName && (
                    <div style={{ 
                      padding: '14px',
                      background: 'var(--input-bg)',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)'
                    }}>
                      <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '4px', fontWeight: 600 }}>Resource Name</div>
                      <div style={{ fontSize: '15px', color: 'var(--text-color)', fontWeight: 600 }}>{detailRequest.resourceName}</div>
                    </div>
                  )}
                  
                  {detailRequest.resourcePsNo && (
                    <div style={{ 
                      padding: '14px',
                      background: 'var(--input-bg)',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)'
                    }}>
                      <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '4px', fontWeight: 600 }}>Resource PS No</div>
                      <div style={{ fontSize: '15px', color: 'var(--text-color)', fontWeight: 600 }}>{detailRequest.resourcePsNo}</div>
                    </div>
                  )}
                  
                  {detailRequest.candidateId && (
                    <div style={{ 
                      padding: '14px',
                      background: 'var(--input-bg)',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)'
                    }}>
                      <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '4px', fontWeight: 600 }}>Candidate ID</div>
                      <div style={{ fontSize: '15px', color: 'var(--text-color)', fontWeight: 600 }}>{detailRequest.candidateId}</div>
                    </div>
                  )}
                  
                  {detailRequest.resourceType && (
                    <div style={{ 
                      padding: '14px',
                      background: 'var(--input-bg)',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)'
                    }}>
                      <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '4px', fontWeight: 600 }}>Resource Type</div>
                      <div style={{ fontSize: '15px', color: 'var(--text-color)', fontWeight: 600 }}>{detailRequest.resourceType}</div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Location Details */}
              {(detailRequest.geoRegion || detailRequest.country) && (
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ 
                    fontSize: '16px', 
                    fontWeight: 700, 
                    color: 'var(--text-color)',
                    marginBottom: '16px',
                    paddingBottom: '8px',
                    borderBottom: '1px solid var(--border-color)'
                  }}>
                    Location Details
                  </h3>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: '16px'
                  }}>
                    {detailRequest.geoRegion && (
                      <div style={{ 
                        padding: '14px',
                        background: 'var(--input-bg)',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)'
                      }}>
                        <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '4px', fontWeight: 600 }}>Geo / Region</div>
                        <div style={{ fontSize: '15px', color: 'var(--text-color)', fontWeight: 600 }}>{detailRequest.geoRegion}</div>
                      </div>
                    )}
                    
                    {detailRequest.country && (
                      <div style={{ 
                        padding: '14px',
                        background: 'var(--input-bg)',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)'
                      }}>
                        <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '4px', fontWeight: 600 }}>Country</div>
                        <div style={{ fontSize: '15px', color: 'var(--text-color)', fontWeight: 600 }}>{detailRequest.country}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Status and Timeline */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ 
                  fontSize: '16px', 
                  fontWeight: 700, 
                  color: 'var(--text-color)',
                  marginBottom: '16px',
                  paddingBottom: '8px',
                  borderBottom: '1px solid var(--border-color)'
                }}>
                  Status & Timeline
                </h3>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '16px'
                }}>
                  <div style={{ 
                    padding: '14px',
                    background: 'var(--input-bg)',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)'
                  }}>
                    <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '4px', fontWeight: 600 }}>Current Status</div>
                    <div style={{ fontSize: '14px', fontWeight: 600, marginTop: '4px' }}>
                      <span className={`status-badge ${detailRequest.status ? detailRequest.status.toLowerCase() : 'pending'}`}>
                        {detailRequest.status === 'PENDING' ? 'BGV to be Initiated' :
                         detailRequest.status === 'APPROVED' ? 'BGV Initiated' :
                         detailRequest.status === 'ON_HOLD' ? 'BGV Stopped' :
                         detailRequest.status === 'REJECTED' ? 'BGV Cannot Be Initiated' : 
                         detailRequest.status || 'Pending'}
                      </span>
                    </div>
                  </div>
                  
                  <div style={{ 
                    padding: '14px',
                    background: 'var(--input-bg)',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)'
                  }}>
                    <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '4px', fontWeight: 600 }}>Submitted On</div>
                    <div style={{ fontSize: '15px', color: 'var(--text-color)', fontWeight: 600 }}>
                      {detailRequest.requestSubmittedOn ? new Date(detailRequest.requestSubmittedOn).toLocaleDateString('en-GB', { 
                        day: '2-digit', 
                        month: 'short', 
                        year: 'numeric' 
                      }) : '—'}
                    </div>
                  </div>
                  
                  {detailRequest.bgvInitiatedBy && (
                    <div style={{ 
                      padding: '14px',
                      background: 'var(--input-bg)',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)'
                    }}>
                      <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '4px', fontWeight: 600 }}>BGV Initiated By</div>
                      <div style={{ fontSize: '15px', color: 'var(--text-color)', fontWeight: 600 }}>{detailRequest.bgvInitiatedBy}</div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Comments */}
              {detailRequest.commentsFromPmo && (
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ 
                    fontSize: '16px', 
                    fontWeight: 700, 
                    color: 'var(--text-color)',
                    marginBottom: '16px',
                    paddingBottom: '8px',
                    borderBottom: '1px solid var(--border-color)'
                  }}>
                    Comments from PMO Team
                  </h3>
                  <div style={{ 
                    padding: '14px',
                    background: 'var(--input-bg)',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    fontSize: '14px',
                    color: 'var(--text-color)',
                    lineHeight: '1.6'
                  }}>
                    {detailRequest.commentsFromPmo}
                  </div>
                </div>
              )}

              {detailRequest.bgvStoppedReason && (
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ 
                    fontSize: '16px', 
                    fontWeight: 700, 
                    color: 'var(--text-color)',
                    marginBottom: '16px',
                    paddingBottom: '8px',
                    borderBottom: '1px solid var(--border-color)'
                  }}>
                    Stopped Reason
                  </h3>
                  <div style={{ 
                    padding: '14px',
                    background: 'var(--input-bg)',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    fontSize: '14px',
                    color: 'var(--text-color)',
                    lineHeight: '1.6'
                  }}>
                    {detailRequest.bgvStoppedReason}
                  </div>
                </div>
              )}
              
              {/* Action Buttons */}
              <div style={{ 
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '12px',
                paddingTop: '16px',
                borderTop: '1px solid var(--border-color)'
              }}>
                <button 
                  onClick={() => {
                    setShowDetailModal(false);
                    goToTrackHistory(detailRequest.resourcePsNo);
                  }}
                  disabled={!detailRequest.resourcePsNo}
                  className="btn-primary"
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                >
                  Track History
                </button>
                <button 
                  onClick={() => setShowDetailModal(false)}
                  className="btn-primary"
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {showHistoryModal && historyPsNumber && (
          <HistoryModal
            psNumber={historyPsNumber}
            onClose={() => {
              setShowHistoryModal(false);
              setHistoryPsNumber('');
            }}
          />
        )}
      </div>
    </div>
  );
}
