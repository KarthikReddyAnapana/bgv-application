import React, { useEffect, useState } from 'react';
import PmForm from './components/PmForm';
import PmDashboard from './components/PmDashboard';
import History from './components/History';
import AdminForm from './components/AdminForm';
import SuperAdmin from './components/SuperAdmin';
import { bgvService } from './services/bgvService';

export default function App() {
  const [route, setRoute] = useState(window.location.hash || '');
  const [theme, setTheme] = useState('light');
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

  const handleLogin = async () => {
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
    setLoginError('');
    try {
      await bgvService.ensureAuthToken(role);
    } catch (error) {
      setLoginError('Could not reach the server. Start the backend (port 8080) and try again.');
      return;
    }
    window.localStorage.setItem('bgvUserRole', role);
    window.localStorage.setItem('bgvUserPs', ps);
    setSessionRole(role);
    setSessionPsNumber(ps);
    window.location.hash = roleToRoute(role);
  };

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
    return <PmForm />;
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

  window.location.hash = roleToRoute(sessionRole);
  return null;
}
