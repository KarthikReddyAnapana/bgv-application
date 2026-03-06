import React, { useState, useEffect } from 'react';
import '../styles/form.css';
import '../styles/admin-table.css';
import { bgvService } from '../services/bgvService';
import * as XLSX from 'xlsx';
import HistoryModal from './HistoryModal';
import ThemeToggleButton from './ThemeToggleButton';

export default function SuperAdmin() {
  const [requests, setRequests] = useState([]);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showTracking, setShowTracking] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyPsNumber, setHistoryPsNumber] = useState('');
  const [historySearchType, setHistorySearchType] = useState('resourcePsNo');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailRequest, setDetailRequest] = useState(null);
  const apiBase = import.meta.env.VITE_API_BASE || 'https://uyzsjec2hb.execute-api.us-east-2.amazonaws.com/bgv-service';

  useEffect(() => {
    fetchRequests();
  }, []);

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

  const parseRequestDate = (request) => {
    const raw = request?.requestSubmittedOn || request?.submittedDate;
    if (!raw) return null;
    const parsed = new Date(raw);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const parseUpdatedAt = (request) => {
    const raw = request?.updatedAt;
    if (raw == null || raw === '') return null;

    if (typeof raw === 'number') {
      if (raw <= 0) return null;
      const epochMillis = raw < 1000000000000 ? raw * 1000 : raw;
      const parsed = new Date(epochMillis);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }

    if (typeof raw === 'string') {
      const trimmed = raw.trim();
      if (!trimmed) return null;

      if (/^\d+$/.test(trimmed)) {
        const numericValue = Number(trimmed);
        if (!Number.isFinite(numericValue) || numericValue <= 0) return null;
        const epochMillis = numericValue < 1000000000000 ? numericValue * 1000 : numericValue;
        const parsed = new Date(epochMillis);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
      }

      const parsed = new Date(trimmed);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }

    const parsed = new Date(raw);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const handleLogout = () => {
    window.localStorage.removeItem('bgvUserRole');
    window.localStorage.removeItem('bgvUserPs');
    window.location.hash = '#/login';
  };

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const response = await bgvService.getAllRequests();
      const raw = response?.data?.data ?? response?.data ?? [];
      const data = Array.isArray(raw) ? raw : [];
      setRequests(data);
      if (data.length === 0) {
        setMessage({ type: 'success', text: 'No BGV requests found.' });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Error loading BGV requests'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredRequests = requests.filter(req => {
    const matchesSearch = searchTerm === '' || 
      (req.psNumber && req.psNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (req.resourceName && req.resourceName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (req.candidateId && req.candidateId.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (req.requestedByName && req.requestedByName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = filterStatus === '' || req.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  // Calculate status counts
  const statusCounts = {
    total: requests.length,
    PENDING: requests.filter(r => r.status === 'PENDING').length,
    APPROVED: requests.filter(r => r.status === 'APPROVED').length,
    ON_HOLD: requests.filter(r => r.status === 'ON_HOLD').length,
    REJECTED: requests.filter(r => r.status === 'REJECTED').length
  };

  const exportToExcel = () => {
    if (filteredRequests.length === 0) {
      setMessage({ type: 'error', text: 'No data to export' });
      return;
    }

    const headers = [
      'ID', 'PS Number', 'Requested By Name', 'RR Number', 'Employee Type', 'Candidate ID / RH ID',
      'Resource Name', 'Resource PS No', 'Resource Type', 'Geo Region', 'Country',
      'Status', 'BGV Initiated By', 'Comments from PMO', 'Stopped Reason', 'Onboarding Type',
      'Request Submitted On', 'Last Updated', 'User Role'
    ];

    const rows = filteredRequests.map(r => [
      r.id || '',
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
      r.bgvStoppedReason || '',
      r.onboardingType || '',
      r.requestSubmittedOn || '',
      r.updatedAt || '',
      r.userRole || ''
    ]);

    // Create worksheet from data
    const wsData = [headers, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    
    // Set column widths
    ws['!cols'] = [
      { wch: 30 }, // ID
      { wch: 15 }, // PS Number
      { wch: 25 }, // Requested By Name
      { wch: 12 }, // RR Number
      { wch: 18 }, // Employee Type
      { wch: 20 }, // Candidate ID / RH ID
      { wch: 25 }, // Resource Name
      { wch: 15 }, // Resource PS No
      { wch: 15 }, // Resource Type
      { wch: 15 }, // Geo Region
      { wch: 15 }, // Country
      { wch: 25 }, // Status
      { wch: 25 }, // BGV Initiated By
      { wch: 40 }, // Comments from PMO
      { wch: 22 }, // Stopped Reason
      { wch: 18 }, // Onboarding Type
      { wch: 20 }, // Request Submitted On
      { wch: 20 }, // Last Updated
      { wch: 12 }  // User Role
    ];

    // Create workbook and add worksheet
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'BGV Requests');
    
    // Generate Excel file
    XLSX.writeFile(wb, `bgv_requests_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Calculate admin tracking metrics
  const calculateAdminMetrics = () => {
    // Group requests by admin who processed them (bgvInitiatedBy field)
    const adminCompletions = {};
    
    requests.forEach(req => {
      const admin = req.bgvInitiatedBy || 'Unassigned';
      if (!adminCompletions[admin]) {
        adminCompletions[admin] = {
          total: 0,
          APPROVED: 0,
          PENDING: 0,
          ON_HOLD: 0,
          REJECTED: 0
        };
      }
      adminCompletions[admin].total++;
      if (req.status) {
        adminCompletions[admin][req.status] = (adminCompletions[admin][req.status] || 0) + 1;
      }
    });

    // Convert to array for charts
    const adminData = Object.entries(adminCompletions).map(([admin, counts]) => ({
      name: admin,
      completed: counts.APPROVED || 0,
      pending: counts.PENDING || 0,
      onHold: counts.ON_HOLD || 0,
      rejected: counts.REJECTED || 0,
      total: counts.total
    }));

    return adminData;
  };

  // Calculate daily completion trends (last 7 days)
  const calculateDailyTrends = () => {
    const dailyData = {};
    const today = new Date();
    
    // Initialize last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      dailyData[dateKey] = { date: dateKey, completed: 0, total: 0 };
    }

    // Count requests updated in last 7 days
    requests.forEach(req => {
      const updatedDate = parseUpdatedAt(req);
      if (updatedDate) {
        const dateKey = updatedDate.toISOString().split('T')[0];
        if (dailyData[dateKey]) {
          dailyData[dateKey].total++;
          if (req.status === 'APPROVED') {
            dailyData[dateKey].completed++;
          }
        }
      }
    });

    return Object.values(dailyData).map(d => ({
      date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      completed: d.completed,
      total: d.total
    }));
  };

  const adminMetrics = calculateAdminMetrics();
  const dailyTrends = calculateDailyTrends();

  const COLORS = ['#10b981', '#fbbf24', '#f97316', '#ef4444', '#6366f1'];
  const statusDistribution = [
    { name: 'BGV Initiated', value: statusCounts.APPROVED, color: '#10b981' },
    { name: 'BGV to be Initiated', value: statusCounts.PENDING, color: '#fbbf24' },
    { name: 'BGV Stopped', value: statusCounts.ON_HOLD, color: '#f97316' },
    { name: 'BGV Cannot Be Initiated', value: statusCounts.REJECTED, color: '#ef4444' }
  ].filter(item => item.value > 0);

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
        <h2 className="form-title">Super Admin Dashboard</h2>

      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      {/* Toggle Tracking View Button */}
      <div style={{ marginTop: '20px', marginBottom: '20px', textAlign: 'center' }}>
        <button
          onClick={() => setShowTracking(!showTracking)}
          className="btn-primary"
          style={{
            padding: '12px 24px',
            minWidth: '200px',
            fontSize: '16px',
            fontWeight: '600',
            background: showTracking ? '#f97316' : '#041e42',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            transition: 'all 0.3s ease'
          }}
        >
          {showTracking ? 'Hide Admin Performance' : 'Show Admin Performance'}
        </button>
      </div>

      {/* Tracking Dashboard */}
      {showTracking && (
        <div style={{ 
          background: '#fff', 
          borderRadius: '12px', 
          padding: '24px', 
          marginBottom: '32px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ 
            fontSize: '24px', 
            fontWeight: '700', 
            marginBottom: '24px', 
            color: '#041e42',
            borderBottom: '3px solid #fbbf24',
            paddingBottom: '12px'
          }}>
            Admin Performance Dashboard
          </h3>

          {/* Summary Stats */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(4, 1fr)', 
            gap: '16px', 
            marginBottom: '32px' 
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              padding: '20px',
              borderRadius: '8px',
              color: '#fff',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '14px', opacity: 0.9 }}>Total Requests</div>
              <div style={{ fontSize: '32px', fontWeight: '700', marginTop: '8px' }}>{statusCounts.total}</div>
            </div>
            <div style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              padding: '20px',
              borderRadius: '8px',
              color: '#fff',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '14px', opacity: 0.9 }}>BGV Initiated</div>
              <div style={{ fontSize: '32px', fontWeight: '700', marginTop: '8px' }}>{statusCounts.APPROVED}</div>
            </div>
            <div style={{
              background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
              padding: '20px',
              borderRadius: '8px',
              color: '#fff',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '14px', opacity: 0.9 }}>Pending</div>
              <div style={{ fontSize: '32px', fontWeight: '700', marginTop: '8px' }}>{statusCounts.PENDING}</div>
            </div>
            <div style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              padding: '20px',
              borderRadius: '8px',
              color: '#fff',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '14px', opacity: 0.9 }}>Process Completed**</div>
              <div style={{ fontSize: '32px', fontWeight: '700', marginTop: '8px' }}>
                {statusCounts.APPROVED + statusCounts.ON_HOLD + statusCounts.REJECTED}
              </div>
              <div style={{ fontSize: '11px', marginTop: '4px', opacity: 0.8 }}>**Initiated + Stopped + Cannot Be Initiated</div>
            </div>
          </div>

          {/* Admin Performance Table */}
          <div style={{ marginBottom: '40px' }}>
            <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#041e42' }}>
              Admin Performance Summary
            </h4>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ 
                width: '100%', 
                borderCollapse: 'collapse',
                background: '#fff',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                borderRadius: '8px',
                overflow: 'hidden'
              }}>
                <thead>
                  <tr style={{ background: '#041e42', color: '#fff' }}>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Admin Name</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>Total Requests</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>BGV Initiated</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>BGV to be Initiated</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>BGV Stopped</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>BGV Cannot Be Initiated</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>Completion Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {adminMetrics.map((admin, idx) => {
                    const completionRate = admin.total > 0 
                      ? ((admin.completed / admin.total) * 100).toFixed(1) 
                      : '0.0';
                    
                    return (
                      <tr key={idx} style={{ 
                        borderBottom: '1px solid #e5e7eb',
                        background: idx % 2 === 0 ? '#f9fafb' : '#fff'
                      }}>
                        <td style={{ padding: '12px', fontWeight: '600', color: '#041e42' }}>{admin.name}</td>
                        <td style={{ padding: '12px', textAlign: 'center', fontWeight: '700', fontSize: '16px' }}>{admin.total}</td>
                        <td style={{ padding: '12px', textAlign: 'center', color: '#10b981', fontWeight: '600' }}>{admin.completed}</td>
                        <td style={{ padding: '12px', textAlign: 'center', color: '#fbbf24', fontWeight: '600' }}>{admin.pending}</td>
                        <td style={{ padding: '12px', textAlign: 'center', color: '#f97316', fontWeight: '600' }}>{admin.onHold}</td>
                        <td style={{ padding: '12px', textAlign: 'center', color: '#ef4444', fontWeight: '600' }}>{admin.rejected}</td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <div style={{
                            display: 'inline-block',
                            background: completionRate >= 70 ? '#d1fae5' : completionRate >= 40 ? '#fed7aa' : '#fecaca',
                            color: completionRate >= 70 ? '#065f46' : completionRate >= 40 ? '#7c2d12' : '#7f1d1d',
                            padding: '4px 12px',
                            borderRadius: '12px',
                            fontWeight: '600',
                            fontSize: '14px'
                          }}>
                            {completionRate}%
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginTop: '20px', marginBottom: '24px' }}>
        <div 
          onClick={() => setFilterStatus('')}
          style={{ 
            padding: '20px', 
            background: filterStatus === '' ? '#041e42' : '#f8f9fa', 
            color: filterStatus === '' ? '#fff' : '#041e42',
            borderRadius: '8px', 
            cursor: 'pointer', 
            border: '2px solid #041e42',
            transition: 'all 0.3s ease',
            boxShadow: filterStatus === '' ? '0 4px 6px rgba(4, 30, 66, 0.3)' : '0 2px 4px rgba(0,0,0,0.1)'
          }}
        >
          <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', opacity: 0.9 }}>Total Requests</div>
          <div style={{ fontSize: '32px', fontWeight: '700' }}>{statusCounts.total}</div>
        </div>

        <div 
          onClick={() => setFilterStatus('PENDING')}
          style={{ 
            padding: '20px', 
            background: filterStatus === 'PENDING' ? '#fbbf24' : '#fef3c7', 
            color: filterStatus === 'PENDING' ? '#fff' : '#92400e',
            borderRadius: '8px', 
            cursor: 'pointer', 
            border: '2px solid #fbbf24',
            transition: 'all 0.3s ease',
            boxShadow: filterStatus === 'PENDING' ? '0 4px 6px rgba(251, 191, 36, 0.3)' : '0 2px 4px rgba(0,0,0,0.1)'
          }}
        >
          <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', opacity: 0.9 }}>BGV to be Initiated</div>
          <div style={{ fontSize: '32px', fontWeight: '700' }}>{statusCounts.PENDING}</div>
        </div>

        <div 
          onClick={() => setFilterStatus('APPROVED')}
          style={{ 
            padding: '20px', 
            background: filterStatus === 'APPROVED' ? '#10b981' : '#d1fae5', 
            color: filterStatus === 'APPROVED' ? '#fff' : '#065f46',
            borderRadius: '8px', 
            cursor: 'pointer', 
            border: '2px solid #10b981',
            transition: 'all 0.3s ease',
            boxShadow: filterStatus === 'APPROVED' ? '0 4px 6px rgba(16, 185, 129, 0.3)' : '0 2px 4px rgba(0,0,0,0.1)'
          }}
        >
          <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', opacity: 0.9 }}>BGV Initiated</div>
          <div style={{ fontSize: '32px', fontWeight: '700' }}>{statusCounts.APPROVED}</div>
        </div>

        <div 
          onClick={() => setFilterStatus('ON_HOLD')}
          style={{ 
            padding: '20px', 
            background: filterStatus === 'ON_HOLD' ? '#f97316' : '#fed7aa', 
            color: filterStatus === 'ON_HOLD' ? '#fff' : '#7c2d12',
            borderRadius: '8px', 
            cursor: 'pointer', 
            border: '2px solid #f97316',
            transition: 'all 0.3s ease',
            boxShadow: filterStatus === 'ON_HOLD' ? '0 4px 6px rgba(249, 115, 22, 0.3)' : '0 2px 4px rgba(0,0,0,0.1)'
          }}
        >
          <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', opacity: 0.9 }}>BGV Stopped</div>
          <div style={{ fontSize: '32px', fontWeight: '700' }}>{statusCounts.ON_HOLD}</div>
        </div>

        <div 
          onClick={() => setFilterStatus('REJECTED')}
          style={{ 
            padding: '20px', 
            background: filterStatus === 'REJECTED' ? '#ef4444' : '#fecaca', 
            color: filterStatus === 'REJECTED' ? '#fff' : '#7f1d1d',
            borderRadius: '8px', 
            cursor: 'pointer', 
            border: '2px solid #ef4444',
            transition: 'all 0.3s ease',
            boxShadow: filterStatus === 'REJECTED' ? '0 4px 6px rgba(239, 68, 68, 0.3)' : '0 2px 4px rgba(0,0,0,0.1)'
          }}
        >
          <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', opacity: 0.9 }}>BGV Cannot Be Initiated</div>
          <div style={{ fontSize: '32px', fontWeight: '700' }}>{statusCounts.REJECTED}</div>
        </div>
      </div>

      <div className="admin-controls" style={{ flexWrap: 'wrap', gap: '10px' }}>
        <button 
          onClick={() => { window.location.hash = '#/yearly-dashboard'; }} 
          className="btn-secondary"
          style={{ padding: '10px 20px', minWidth: '120px', borderRadius: '8px', fontWeight: 600 }}
        >
          Yearly Dashboard
        </button>

        <button 
          onClick={exportToExcel} 
          className="btn-secondary"
          style={{ padding: '10px 20px', minWidth: '120px', borderRadius: '8px', fontWeight: 600 }}
        >
          Export to Excel
        </button>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginLeft: 'auto' }}>
          <input
            type="text"
            placeholder="Search by PS No, Name, Candidate ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: '8px',
              minWidth: '250px',
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
            <option value="">All Status</option>
            <option value="PENDING">BGV to be Initiated</option>
            <option value="APPROVED">BGV Initiated</option>
            <option value="ON_HOLD">BGV Stopped</option>
            <option value="REJECTED">BGV Cannot Be Initiated</option>
          </select>
        </div>
      </div>

      <div style={{ marginTop: '16px', color: 'var(--muted)', fontSize: '14px' }}>
        Showing {filteredRequests.length} of {requests.length} requests
      </div>

      {filteredRequests.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>
          <p>No BGV requests found matching your filters.</p>
        </div>
      ) : (
        <>
          <div className="table-responsive requests-section" style={{ marginTop: '16px' }}>
            <table className="admin-table" style={{ fontSize: '13px' }}>
            <thead>
              <tr>
                <th>PS Number</th>
                <th>Requested By</th>
                <th>Resource Name</th>
                <th>Resource / Candidate ID</th>
                <th>Employee Type</th>
                <th>Status</th>
                <th>Submitted Date</th>
                <th>Last Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map(request => {
                const displayStatus = statusLabelForUi(request.status);
                const statusClass = `status-${toStatusClassKey(displayStatus)}`;
                const idValue = request.resourcePsNo || request.candidateId || '—';

                return (
                  <tr key={request.id}>
                    <td className="ps-no">{request.psNumber || '—'}</td>
                    <td>{request.requestedByName || '—'}</td>
                    <td className="resource-name">{request.resourceName || '—'}</td>
                    <td>{idValue}</td>
                    <td>{request.employeeType === 'LTIM_ASSOCIATES' ? 'LTM Associate' : request.employeeType === 'YET_TO_JOIN' ? 'Yet to Join' : request.employeeType || '—'}</td>
                    <td className="status">
                      <span className={`status-badge ${statusClass}`}>
                        {displayStatus}
                      </span>
                    </td>
                    <td className="date">{parseRequestDate(request)?.toLocaleDateString() || '—'}</td>
                    <td className="date">{parseUpdatedAt(request)?.toLocaleString() || '—'}</td>
                    <td className="actions">
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
                        className="btn-action"
                        title="View history"
                      >
                        History
                      </button>
                      <button
                        onClick={() => {
                          setDetailRequest(request);
                          setShowDetailModal(true);
                        }}
                        className="btn-action"
                        title="View details"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            </table>
          </div>
        </>
      )}
    </div>

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
          maxWidth: '700px',
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
              Request Details
            </h2>
            <button
              onClick={() => setShowDetailModal(false)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: 'var(--muted)',
                padding: '4px 8px'
              }}
            >
              ×
            </button>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '20px'
          }}>
            <div style={{
              padding: '16px',
              background: 'var(--input-bg)',
              borderRadius: '8px',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '4px', fontWeight: 600 }}>PS Number</div>
              <div style={{ fontSize: '16px', color: 'var(--text-color)', fontWeight: 600 }}>{detailRequest.psNumber || '—'}</div>
            </div>

            <div style={{
              padding: '16px',
              background: 'var(--input-bg)',
              borderRadius: '8px',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '4px', fontWeight: 600 }}>Requested By</div>
              <div style={{ fontSize: '16px', color: 'var(--text-color)', fontWeight: 600 }}>{detailRequest.requestedByName || '—'}</div>
            </div>

            <div style={{
              padding: '16px',
              background: 'var(--input-bg)',
              borderRadius: '8px',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '4px', fontWeight: 600 }}>Employee Type</div>
              <div style={{ fontSize: '16px', color: 'var(--text-color)', fontWeight: 600 }}>{detailRequest.employeeType || '—'}</div>
            </div>

            <div style={{
              padding: '16px',
              background: 'var(--input-bg)',
              borderRadius: '8px',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '4px', fontWeight: 600 }}>RR Number</div>
              <div style={{ fontSize: '16px', color: 'var(--text-color)', fontWeight: 600 }}>{detailRequest.rrNumber || '—'}</div>
            </div>

            <div style={{
              padding: '16px',
              background: 'var(--input-bg)',
              borderRadius: '8px',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '4px', fontWeight: 600 }}>Resource Name</div>
              <div style={{ fontSize: '16px', color: 'var(--text-color)', fontWeight: 600 }}>{detailRequest.resourceName || '—'}</div>
            </div>

            <div style={{
              padding: '16px',
              background: 'var(--input-bg)',
              borderRadius: '8px',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '4px', fontWeight: 600 }}>
                {detailRequest.employeeType === 'LTIM_ASSOCIATES' ? 'Resource PS No' : 'Candidate ID'}
              </div>
              <div style={{ fontSize: '16px', color: 'var(--text-color)', fontWeight: 600 }}>
                {detailRequest.employeeType === 'LTIM_ASSOCIATES' ? (detailRequest.resourcePsNo || '—') : (detailRequest.candidateId || '—')}
              </div>
            </div>

            <div style={{
              padding: '16px',
              background: 'var(--input-bg)',
              borderRadius: '8px',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '4px', fontWeight: 600 }}>Status</div>
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
              padding: '16px',
              background: 'var(--input-bg)',
              borderRadius: '8px',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '4px', fontWeight: 600 }}>Submitted On</div>
              <div style={{ fontSize: '16px', color: 'var(--text-color)', fontWeight: 600 }}>
                {detailRequest.requestSubmittedOn ? new Date(detailRequest.requestSubmittedOn).toLocaleDateString() : '—'}
              </div>
            </div>
          </div>

          {detailRequest.commentsFromPmo && (
            <div style={{
              marginTop: '24px',
              padding: '16px',
              background: 'var(--input-bg)',
              borderRadius: '8px',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '8px', fontWeight: 600 }}>Comments from PMO</div>
              <div style={{ fontSize: '14px', color: 'var(--text-color)', lineHeight: '1.6' }}>
                {detailRequest.commentsFromPmo}
              </div>
            </div>
          )}

          {detailRequest.bgvStoppedReason && (
            <div style={{
              marginTop: '16px',
              padding: '16px',
              background: 'var(--input-bg)',
              borderRadius: '8px',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '8px', fontWeight: 600 }}>Stopped Reason</div>
              <div style={{ fontSize: '14px', color: 'var(--text-color)', lineHeight: '1.6' }}>
                {detailRequest.bgvStoppedReason}
              </div>
            </div>
          )}

          <div style={{
            marginTop: '24px',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px'
          }}>
            <button
              onClick={() => setShowDetailModal(false)}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'var(--card-bg)',
                color: 'var(--text-color)',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    )}
    </div>
  );
}
