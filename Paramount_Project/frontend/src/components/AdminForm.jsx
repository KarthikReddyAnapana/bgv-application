import React, { useState, useEffect } from 'react';
import '../styles/form.css';
import '../styles/admin-table.css';
import { bgvService } from '../services/bgvService';
import HistoryModal from './HistoryModal';
import ThemeToggleButton from './ThemeToggleButton';

export default function AdminForm() {
  const [allRequests, setAllRequests] = useState([]); // Store all requests
  const [requests, setRequests] = useState([]); // Displayed requests
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingData, setEditingData] = useState({});
  const [activeTab, setActiveTab] = useState('LTIM_ASSOCIATES'); // Tab state
  const [selectedCheckboxes, setSelectedCheckboxes] = useState(new Set()); // Track checkbox state
  const [bulkStatus, setBulkStatus] = useState(''); // Bulk status change
  const [searchTerm, setSearchTerm] = useState(''); // Search filter
  const [filterStatus, setFilterStatus] = useState(''); // Status filter
  const apiBase = import.meta.env.VITE_API_BASE || 'https://uyzsjec2hb.execute-api.us-east-2.amazonaws.com/bgv-service/api/bgv-requests';
  const [modalOpen, setModalOpen] = useState(false);
  const [modalRequest, setModalRequest] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailRequest, setDetailRequest] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editRequest, setEditRequest] = useState(null);
  const [editForm, setEditForm] = useState({
    status: '',
    priority: '',
    commentsFromPmo: '',
    bgvStoppedReason: '',
    interimStatus: '',
    interimDate: '',
    finalBgvStatus: '',
    finalBgvDate: ''
  });
  const [editErrors, setEditErrors] = useState({});
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusModalStatus, setStatusModalStatus] = useState('');
  const [statusModalComments, setStatusModalComments] = useState('');
  const [statusModalStoppedReason, setStatusModalStoppedReason] = useState('');
  const [rowValidationErrors, setRowValidationErrors] = useState({});
  const [statusModalErrors, setStatusModalErrors] = useState({});
  const [singleModalErrors, setSingleModalErrors] = useState({});
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyPsNumber, setHistoryPsNumber] = useState('');
  const [historySearchType, setHistorySearchType] = useState('resourcePsNo');
  const [sortBy, setSortBy] = useState('timestamp-desc'); // timestamp-desc, timestamp-asc, priority-high, priority-low
  const [showSortFilter, setShowSortFilter] = useState(false);

  const [modalForm, setModalForm] = useState({
    applicantId: '',
    bgvInitiatedBy: '',
    requestSubmittedOn: new Date().toISOString().split('T')[0],
    status: 'BGV to be Initiated',
    commentsFromPmo: '',
    bgvStoppedReason: ''
  });

  const STOPPED_REASONS = [
    'STOP BGV - Released from Account due to Project or Assignment completion or on hold',
    'STOP BGV - Released from Account due to BGV Compliance issues',
    'STOP BGV - Voluntary Resignation case',
    'STOP BGV - In-Voluntary Resignation case due to BGV clearance related issues',
    'STOP BGV - YTJ candidate not joining LTM at last minute',
    'STOP BGV - Internal Candidate got rejected by Customer in CI'
  ];

  const openModalForRequest = (req) => {
    setModalRequest(req);
    setSingleModalErrors({});
    setModalForm({
      applicantId: req.candidateId || req.applicantId || '',
      bgvInitiatedBy: (req.psNumber ? `${req.psNumber} - ${req.requestedByName || ''}` : ''),
      requestSubmittedOn: req.requestSubmittedOn ? req.requestSubmittedOn.split('T')[0] : new Date().toISOString().split('T')[0],
      status: req.status === 'ON_HOLD' ? 'ON_HOLD' : 'APPROVED',
      commentsFromPmo: '',
      bgvStoppedReason: req.bgvStoppedReason || ''
    });
    setModalOpen(true);
  };

  const openEditModal = (request) => {
    const statusLabel = statusLabelForUi(request.status || '');
    setEditRequest(request);
    setEditErrors({});
    setEditForm({
      status: ['BGV Initiated', 'BGV Stopped'].includes(statusLabel) ? statusLabel : '',
      priority: request.priority || 'NORMAL',
      commentsFromPmo: '',
      bgvStoppedReason: request.bgvStoppedReason || '',
      interimStatus: request.interimStatus || '',
      interimDate: request.interimDate || '',
      finalBgvStatus: request.finalBgvStatus || '',
      finalBgvDate: request.finalBgvDate || ''
    });
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditRequest(null);
    setEditErrors({});
    setEditForm({
      status: '',
      priority: '',
      commentsFromPmo: '',
      bgvStoppedReason: '',
      interimStatus: '',
      interimDate: '',
      finalBgvStatus: '',
      finalBgvDate: ''
    });
  };

  const handleEditChange = (name, value) => {
    setEditErrors(prev => ({ ...prev, [name]: '' }));
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const submitEditModal = async () => {
    if (!editRequest) return;
    try {
      const res = await bgvService.getRequest(editRequest.id);
      const full = res.data.data || res.data || editRequest;
      const statusValue = editForm.status || statusLabelForUi(full.status || '');
      const statusForApi = normalizeStatusForApi(statusValue);
      const priorityValue = editForm.priority || full.priority || 'NORMAL';
      const newComment = (editForm.commentsFromPmo || '').trim();
      const stoppedReason = (editForm.bgvStoppedReason || '').trim();

      const statusChanged = statusForApi && statusForApi !== full.status;
      const priorityChanged = priorityValue !== (full.priority || 'NORMAL');

      const nextErrors = {};
      if ((statusChanged || priorityChanged) && !newComment) {
        nextErrors.commentsFromPmo = 'Comments are mandatory when changing status or priority.';
      }
      if (statusForApi === 'ON_HOLD' && !stoppedReason) {
        nextErrors.bgvStoppedReason = 'Stopped reason is mandatory for BGV Stopped.';
      }
      if (Object.keys(nextErrors).length > 0) {
        setEditErrors(nextErrors);
        return;
      }

      const updatedComments = newComment ? appendComment(full.commentsFromPmo, newComment) : full.commentsFromPmo;
      const payload = {
        ...full,
        status: statusForApi || full.status,
        priority: priorityValue,
        commentsFromPmo: updatedComments,
        bgvStoppedReason: statusForApi === 'ON_HOLD' ? stoppedReason : '',
        interimStatus: editForm.interimStatus || null,
        interimDate: editForm.interimDate || null,
        finalBgvStatus: editForm.finalBgvStatus || null,
        finalBgvDate: editForm.finalBgvDate || null
      };

      await bgvService.updateRequest(editRequest.id, payload);
      setMessage({ type: 'success', text: 'Request updated successfully!' });
      closeEditModal();
      fetchRequests();
    } catch (error) {
      setMessage({ type: 'error', text: 'Error saving changes' });
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalRequest(null);
    setSingleModalErrors({});
    setSelectedCheckboxes(new Set()); // Clear all checkbox selections
  };

  const handleCheckboxChange = async (request, isChecked) => {
    if (isChecked) {
      setSelectedCheckboxes(prev => new Set([...prev, request.id]));
    } else {
      setSelectedCheckboxes(prev => {
        const newSet = new Set(prev);
        newSet.delete(request.id);
        return newSet;
      });
    }
  };

  const handleStartClick = () => {
    if (selectedCheckboxes.size === 0) {
      setMessage({ type: 'error', text: 'Please select at least one request' });
      return;
    }
    
    if (selectedCheckboxes.size === 1) {
      // Show detail modal for single selection
      const selectedId = Array.from(selectedCheckboxes)[0];
      const request = allRequests.find(r => r.id === selectedId);
      if (request) {
        setDetailRequest(request);
        setShowDetailModal(true);
      }
    } else {
      // Show status change modal for multiple selections
      setStatusModalStatus('');
      setStatusModalComments('');
      setStatusModalStoppedReason('');
      setStatusModalErrors({});
      setShowStatusModal(true);
    }
  };

  const handleBulkStatusChange = async () => {
    const modalComment = (statusModalComments || '').trim();
    const modalReason = (statusModalStoppedReason || '').trim();
    const nextErrors = {};

    if (!statusModalStatus) {
      nextErrors.status = 'Please select a status.';
    }
    if (!modalComment) {
      nextErrors.comments = 'Comments are mandatory for any change.';
    }
    if (statusModalStatus === 'ON_HOLD' && !modalReason) {
      nextErrors.stoppedReason = 'Stopped reason is mandatory for BGV Stopped.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setStatusModalErrors(nextErrors);
      return;
    }

    setStatusModalErrors({});
    
    try {
      const promises = Array.from(selectedCheckboxes).map(async (id) => {
        const req = allRequests.find(r => r.id === id);
        if (!req) return;
        
        const payload = {
          ...req,
          status: statusModalStatus,
          commentsFromPmo: appendComment(req.commentsFromPmo, modalComment),
          bgvStoppedReason: statusModalStatus === 'ON_HOLD' ? modalReason : ''
        };
        return await bgvService.updateRequest(id, payload);
      });
      
      await Promise.all(promises);
      setMessage({ type: 'success', text: `Updated ${selectedCheckboxes.size} request(s) successfully` });
      setSelectedCheckboxes(new Set());
      setStatusModalStatus('');
      setStatusModalComments('');
      setStatusModalStoppedReason('');
      setStatusModalErrors({});
      setShowStatusModal(false);
      fetchRequests();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update requests' });
      setShowStatusModal(false);
    }
  };

  const handleModalChange = (name, value) => {
    if (name === 'commentsFromPmo') {
      setSingleModalErrors(prev => ({ ...prev, comments: '' }));
    }
    if (name === 'bgvStoppedReason') {
      setSingleModalErrors(prev => ({ ...prev, stoppedReason: '' }));
    }
    setModalForm(prev => ({ ...prev, [name]: value }));
  };

  const submitModal = async () => {
    if (!modalRequest) return;
    try {
      // fetch latest full request to merge
      const res = await bgvService.getRequest(modalRequest.id);
      const full = res.data.data || res.data || modalRequest;
      const statusForApi = normalizeStatusForApi(modalForm.status || full.status);
      const newComment = (modalForm.commentsFromPmo || '').trim();
      const stoppedReason = (modalForm.bgvStoppedReason || '').trim();

      const nextErrors = {};
      if (!newComment) {
        nextErrors.comments = 'Comments are mandatory for any change.';
      }
      if (statusForApi === 'ON_HOLD' && !stoppedReason) {
        nextErrors.stoppedReason = 'Stopped reason is mandatory for BGV Stopped.';
      }
      if (Object.keys(nextErrors).length > 0) {
        setSingleModalErrors(nextErrors);
        return;
      }
      setSingleModalErrors({});

      const updatedComments = appendComment(full.commentsFromPmo, newComment);

      const payload = {
        psNumber: full.psNumber,
        requestedByName: full.requestedByName,
        rrNumber: full.rrNumber,
        employeeType: full.employeeType,
        candidateId: modalForm.applicantId || full.candidateId,
        resourceName: full.resourceName,
        resourcePsNo: full.resourcePsNo,
        resourceType: full.resourceType || full.resourceType,
        geoRegion: full.geoRegion || full.geoRegion,
        country: full.country || full.country,
        status: statusForApi,
        bgvInitiatedBy: modalForm.bgvInitiatedBy || full.bgvInitiatedBy,
        commentsFromPmo: updatedComments,
        bgvStoppedReason: statusForApi === 'ON_HOLD' ? stoppedReason : '',
        onboardingType: full.onboardingType || 'REGULAR_REQUEST',
        requestSubmittedOn: modalForm.requestSubmittedOn || full.requestSubmittedOn,
        userRole: full.userRole || 'PM'
      };

      await bgvService.updateRequest(modalRequest.id, payload);
      setMessage({ type: 'success', text: 'Admin data saved successfully' });
      closeModal();
      fetchRequests();
    } catch (err) {
      setMessage({ type: 'error', text: 'Error saving admin data' });
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []); // Fetch once on mount

  useEffect(() => {
    // Filter requests when tab changes
    let filtered = allRequests.filter(r => r.employeeType === activeTab);
    
    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(r => 
        (r.psNumber && r.psNumber.toLowerCase().includes(searchLower)) ||
        (r.requestedByName && r.requestedByName.toLowerCase().includes(searchLower)) ||
        (r.resourceName && r.resourceName.toLowerCase().includes(searchLower)) ||
        (r.candidateId && r.candidateId.toLowerCase().includes(searchLower)) ||
        (r.resourcePsNo && r.resourcePsNo.toLowerCase().includes(searchLower))
      );
    }
    
    // Apply status filter
    if (filterStatus) {
      filtered = filtered.filter(r => r.status === filterStatus);
    }
    
    setRequests(filtered);
  }, [activeTab, allRequests, searchTerm, filterStatus]);

  const normalizeStatusForApi = (status) => {
    if (!status) return status;
    const map = {
      // Admin dashboard labels (inline edit)
      'BGV to be Initiated': 'PENDING',
      'BGV Initiated': 'APPROVED',
      'BGV Stopped': 'ON_HOLD',
      'BGV Cannot Be Initiated': 'REJECTED',

      // Dummy data / legacy display values
      Pending: 'PENDING',
      Approved: 'APPROVED',
      Rejected: 'REJECTED',
      'On Hold': 'ON_HOLD'
    };
    return map[status] || status;
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

  const sortRequests = (requestsToSort) => {
    const sorted = [...requestsToSort];
    
    if (sortBy === 'timestamp-desc') {
      sorted.sort((a, b) => {
        const dateA = parseUpdatedAt(a) || parseRequestDate(a) || new Date(0);
        const dateB = parseUpdatedAt(b) || parseRequestDate(b) || new Date(0);
        return dateB.getTime() - dateA.getTime();
      });
    } else if (sortBy === 'timestamp-asc') {
      sorted.sort((a, b) => {
        const dateA = parseUpdatedAt(a) || parseRequestDate(a) || new Date(0);
        const dateB = parseUpdatedAt(b) || parseRequestDate(b) || new Date(0);
        return dateA.getTime() - dateB.getTime();
      });
    } else if (sortBy === 'priority-high') {
      sorted.sort((a, b) => {
        const priorityA = a.priority === 'HIGH' ? 0 : 1;
        const priorityB = b.priority === 'HIGH' ? 0 : 1;
        if (priorityA !== priorityB) return priorityA - priorityB;
        // Secondary sort by timestamp desc
        const dateA = parseUpdatedAt(a) || parseRequestDate(a) || new Date(0);
        const dateB = parseUpdatedAt(b) || parseRequestDate(b) || new Date(0);
        return dateB.getTime() - dateA.getTime();
      });
    } else if (sortBy === 'priority-low') {
      sorted.sort((a, b) => {
        const priorityA = a.priority === 'HIGH' ? 1 : 0;
        const priorityB = b.priority === 'HIGH' ? 1 : 0;
        if (priorityA !== priorityB) return priorityA - priorityB;
        // Secondary sort by timestamp desc
        const dateA = parseUpdatedAt(a) || parseRequestDate(a) || new Date(0);
        const dateB = parseUpdatedAt(b) || parseRequestDate(b) || new Date(0);
        return dateB.getTime() - dateA.getTime();
      });
    }
    
    return sorted;
  };

  const appendComment = (existing, next) => {
    const trimmedNext = (next || '').trim();
    if (!trimmedNext) return existing || '';
    const normalizedExisting = (existing || '').trimEnd();
    const lastLine = normalizedExisting
      ? normalizedExisting.split('\n').filter(Boolean).slice(-1)[0] || ''
      : '';
    const lastLineMessage = lastLine.replace(/^\[[^\]]+\]\s*/, '').trim();
    if (lastLineMessage === trimmedNext) return normalizedExisting;
    const prefix = new Date().toLocaleString();
    const entry = `[${prefix}] ${trimmedNext}`;
    if (!normalizedExisting) return entry;
    return `${normalizedExisting}\n${entry}`;

  };

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const response = await bgvService.getAllRequests();
      const raw = response?.data?.data ?? response?.data ?? [];
      const data = Array.isArray(raw) ? raw : [];

      setAllRequests(data); // Store all requests
      // Filter for current tab
      const filtered = data.filter(r => r.employeeType === activeTab);
      setRequests(filtered);
      // Clear any previous messages
      setMessage({ type: '', text: '' });
    } catch (error) {
      setAllRequests([]);
      setRequests([]);
      setMessage({
        type: 'error',
        text: 'Unable to load requests from server'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = (id, newStatus) => {
    setEditingData(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        status: newStatus,
        bgvStoppedReason: newStatus === 'BGV Stopped' ? (prev[id]?.bgvStoppedReason || '') : ''
      }
    }));
  };

  const handleCommentsChange = (id, newComments) => {
    setRowValidationErrors(prev => {
      if (!prev[id]?.comments) return prev;
      const next = { ...prev };
      next[id] = { ...next[id], comments: '' };
      return next;
    });
    setEditingData(prev => ({
      ...prev,
      [id]: { ...prev[id], commentsFromPmo: newComments }
    }));
  };

  const handlePriorityChange = (id, newPriority) => {
    setEditingData(prev => ({
      ...prev,
      [id]: { ...prev[id], priority: newPriority }
    }));
  };

  const handleStoppedReasonChange = (id, reason) => {
    setRowValidationErrors(prev => {
      if (!prev[id]?.stoppedReason) return prev;
      const next = { ...prev };
      next[id] = { ...next[id], stoppedReason: '' };
      return next;
    });
    setEditingData(prev => ({
      ...prev,
      [id]: { ...prev[id], bgvStoppedReason: reason }
    }));
  };

  const handleSaveChanges = async (id, originalRequest) => {
    const changes = editingData[id] || {};
    const displayStatus = changes.status ? changes.status : statusLabelForUi(originalRequest.status);
    const statusForApi = normalizeStatusForApi(displayStatus);
    const newComment = (changes.commentsFromPmo || '').trim();
    const stoppedReason = (changes.bgvStoppedReason || '').trim();

    const nextErrors = {};
    if (!newComment) {
      nextErrors.comments = 'Comments are mandatory for any change.';
    }
    if (statusForApi === 'ON_HOLD' && !stoppedReason) {
      nextErrors.stoppedReason = 'Stopped reason is mandatory for BGV Stopped.';
    }
    if (Object.keys(nextErrors).length > 0) {
      setRowValidationErrors(prev => ({ ...prev, [id]: nextErrors }));
      return;
    }

    setRowValidationErrors(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });

    const updatedComments = appendComment(originalRequest.commentsFromPmo, newComment);
    const updatedRequest = {
      ...originalRequest,
      ...changes,
      status: statusForApi,
      commentsFromPmo: updatedComments,
      bgvStoppedReason: statusForApi === 'ON_HOLD' ? stoppedReason : ''
    };

    try {
      await bgvService.updateRequest(id, updatedRequest);
      setMessage({
        type: 'success',
        text: 'Request updated successfully!'
      });
      setEditingId(null);
      setEditingData(prev => {
        const newData = { ...prev };
        delete newData[id];
        return newData;
      });
      setRowValidationErrors(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      // Refresh the list
      fetchRequests();
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Error updating request. Please try again.'
      });
    }
  };

  const headerNavButtonStyle = {
    padding: '10px 20px',
    minWidth: '120px',
    borderRadius: '8px',
    fontWeight: 600,
    fontSize: '14px'
  };

  const handleLogout = () => {
    window.localStorage.removeItem('bgvUserRole');
    window.localStorage.removeItem('bgvUserPs');
    window.location.hash = '#/login';
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--page-bg)', padding: '40px 20px' }}>
      <ThemeToggleButton />
      <div className="admin-wrapper admin-compact-view">
        <div style={{ marginBottom: '16px', display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={handleLogout}
            style={headerNavButtonStyle}
          >
            Logout
          </button>
        </div>
        <h2 className="form-title">BGV Request Management - Admin Dashboard</h2>

      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="admin-controls" style={{ gap: '12px', flexDirection: 'column', alignItems: 'stretch' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }} />

          <button
            onClick={() => { window.location.hash = '#/yearly-dashboard'; }}
            className="btn-secondary yearly-dashboard-btn"
            type="button"
            style={headerNavButtonStyle}
            title="Open Yearly Dashboard"
          >
            Yearly Dashboard
          </button>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Search by PS No, Name..."
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
            <option value="">All Status</option>
            <option value="PENDING">BGV to be Initiated</option>
            <option value="APPROVED">BGV Initiated</option>
            <option value="ON_HOLD">BGV Stopped</option>
          </select>

          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowSortFilter(!showSortFilter)}
              className="btn-secondary"
              style={{
                padding: '8px 16px',
                borderRadius: '4px',
                whiteSpace: 'nowrap',
                fontWeight: 600
              }}
              title="Sort and Filter Options"
            >
              ⚙️ Sort & Filter
            </button>
            
            {showSortFilter && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                background: 'var(--card-bg)',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                padding: '12px',
                marginTop: '4px',
                zIndex: 100,
                minWidth: '220px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
              }}>
                <div style={{ marginBottom: '12px' }}>
                  <strong style={{ display: 'block', marginBottom: '8px', fontSize: '13px' }}>Sort By:</strong>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '6px',
                      borderRadius: '4px',
                      border: '1px solid var(--input-border)',
                      background: 'var(--input-bg)',
                      color: 'var(--input-text)',
                      fontSize: '13px'
                    }}
                  >
                    <option value="timestamp-desc">Newest First</option>
                    <option value="timestamp-asc">Oldest First</option>
                    <option value="priority-high">High Priority First</option>
                    <option value="priority-low">Low Priority First</option>
                  </select>
                </div>
                <button
                  onClick={() => setShowSortFilter(false)}
                  style={{
                    width: '100%',
                    padding: '6px',
                    borderRadius: '4px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--section-bg)',
                    color: 'var(--text-color)',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '600'
                  }}
                >
                  Apply
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedCheckboxes.size > 0 && (
        <div style={{ 
          background: '#f0f9ff', 
          padding: '16px', 
          borderRadius: '8px', 
          marginTop: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          border: '2px solid #3b82f6'
        }}>
          <span style={{ fontWeight: '600', color: '#1e40af' }}>
            {selectedCheckboxes.size} request(s) selected
          </span>
          <button
            onClick={handleStartClick}
            className="btn-primary"
            style={{ 
              padding: '10px 20px',
              minWidth: '120px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '14px',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
              cursor: 'pointer'
            }}
          >
            {selectedCheckboxes.size === 1 ? 'View Details' : 'Change Status'}
          </button>
          <button
            onClick={() => setSelectedCheckboxes(new Set())}
            className="btn-secondary"
            style={{ padding: '8px 16px' }}
          >
            Clear Selection
          </button>
        </div>
      )}

      {/* Tab Navigation */}
      <div style={{ 
        display: 'flex', 
        gap: '10px', 
        marginTop: '20px', 
        marginBottom: '20px',
        borderBottom: '2px solid var(--border-color)'
      }}>
        <button
          onClick={() => setActiveTab('LTIM_ASSOCIATES')}
          style={{
            padding: '12px 24px',
            border: 'none',
            background: activeTab === 'LTIM_ASSOCIATES' ? 'var(--section-bg)' : 'transparent',
            color: activeTab === 'LTIM_ASSOCIATES' ? 'var(--text-color)' : 'var(--muted)',
            fontWeight: activeTab === 'LTIM_ASSOCIATES' ? 'bold' : 'normal',
            cursor: 'pointer',
            borderRadius: '4px 4px 0 0',
            fontSize: '16px',
            transition: 'all 0.3s'
          }}
        >
          LTM Associate ({allRequests.filter(r => r.employeeType === 'LTIM_ASSOCIATES').length})
        </button>
        <button
          onClick={() => setActiveTab('YET_TO_JOIN')}
          style={{
            padding: '12px 24px',
            border: 'none',
            background: activeTab === 'YET_TO_JOIN' ? 'var(--section-bg)' : 'transparent',
            color: activeTab === 'YET_TO_JOIN' ? 'var(--text-color)' : 'var(--muted)',
            fontWeight: activeTab === 'YET_TO_JOIN' ? 'bold' : 'normal',
            cursor: 'pointer',
            borderRadius: '4px 4px 0 0',
            fontSize: '16px',
            transition: 'all 0.3s'
          }}
        >
          Yet to Join ({allRequests.filter(r => r.employeeType === 'YET_TO_JOIN').length})
        </button>
      </div>

      {requests.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
          <p>No BGV requests found. Create one using the PM Form.</p>
        </div>
      ) : (
        <>
          {/* Table 1: Resource PS No Details (Existing LTM Associate Employees) */}
          {(() => {
            const resourcePsNoRequests = requests.filter(r => r.resourcePsNo && r.resourcePsNo.trim() !== '');
            const sortedRequests = sortRequests(resourcePsNoRequests);
            return sortedRequests.length > 0 ? (
              <div style={{ marginBottom: '30px' }}>
                <h3 style={{ marginBottom: '15px', color: '#041e42', fontSize: '18px', fontWeight: 'bold' }}>
                  Resource PS No. Details (LTM Associate) - {sortedRequests.length} Records
                </h3>
                <div className="scroll-hint">Scroll horizontally to view more columns ΓåÆ</div>
                <div className="table-responsive table-scroll requests-section">
                  <table className="admin-table compact-admin-table">
                    <thead>
                      <tr>
                        <th>Select</th>
                        <th>Priority</th>
                        <th>Requester PS No</th>
                        <th>Requester Name</th>
                        <th>Resource PS No</th>
                        <th>Resource Name</th>
                        <th>Employee Type</th>
                        <th>Submitted Date</th>
                        <th>Last Updated</th>
                        <th>Current Status</th>
                        <th>Status Action</th>
                        <th>Comments</th>
                        <th>Stopped Reason</th>
                        <th>Actions</th>
                        <th>Evidence</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedRequests.map(request => {
                        const isEditing = editingId === request.id;
                        const currentData = editingData[request.id] || {};
                        const rowErrors = rowValidationErrors[request.id] || {};
                        const rawStatus = currentData.status ?? request.status;
                        const displayStatus = statusLabelForUi(rawStatus);
                        const statusClass = `status-${toStatusClassKey(displayStatus)}`;
                        const displayPriority = currentData.priority || request.priority || 'NORMAL';
                        const displayComments = Object.prototype.hasOwnProperty.call(currentData, 'commentsFromPmo')
                          ? currentData.commentsFromPmo
                          : '';
                        const displayStoppedReason = Object.prototype.hasOwnProperty.call(currentData, 'bgvStoppedReason')
                          ? currentData.bgvStoppedReason
                          : (request.bgvStoppedReason || '');

                        return (
                          <tr key={request.id} className={isEditing ? 'editing-row' : ''}>
                            <td style={{ textAlign: 'center' }}>
                              <input
                                type="checkbox"
                                checked={selectedCheckboxes.has(request.id)}
                                onChange={(e) => handleCheckboxChange(request, e.target.checked)}
                              />
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              {isEditing ? (
                                <select
                                  value={displayPriority}
                                  onChange={(e) => handlePriorityChange(request.id, e.target.value)}
                                  className="inline-select"
                                >
                                  <option value="HIGH">High</option>
                                  <option value="NORMAL">Normal</option>
                                </select>
                              ) : request.priority === 'HIGH' ? (
                                <span style={{ 
                                  background: '#ef4444', 
                                  color: '#fff', 
                                  padding: '6px 12px', 
                                  borderRadius: '6px', 
                                  fontWeight: '700',
                                  fontSize: '12px',
                                  display: 'inline-block',
                                  boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)'
                                }}>
                                  HIGH PRIORITY
                                </span>
                              ) : (
                                <span style={{ color: '#999', fontSize: '12px' }}>—</span>
                              )}
                            </td>
                            <td className="ps-no">{request.psNumber}</td>
                            <td className="resource-name">{request.requestedByName || '—'}</td>
                            <td><strong>{request.resourcePsNo}</strong></td>
                            <td className="resource-name">{request.resourceName || '—'}</td>
                            <td>{request.employeeType === 'LTIM_ASSOCIATES' ? 'LTM Associate' : request.employeeType === 'YET_TO_JOIN' ? 'Yet to Join' : request.employeeType || '—'}</td>
                            <td className="date">{parseRequestDate(request)?.toLocaleDateString() || '—'}</td>
                            <td className="date">{parseUpdatedAt(request)?.toLocaleString() || '—'}</td>
                            <td className="status">
                              <span className={`status-badge ${statusClass}`}>
                                {displayStatus}
                              </span>
                            </td>
                            <td className="status-dropdown">
                              {isEditing ? (
                                <select
                                  value={['BGV Initiated', 'BGV Stopped'].includes(displayStatus) ? displayStatus : ''}
                                  onChange={(e) => handleStatusChange(request.id, e.target.value)}
                                  className="inline-select"
                                >
                                  <option value="">-- Select Status --</option>
                                  <option value="BGV Initiated">BGV Initiated</option>
                                  <option value="BGV Stopped">BGV Stopped</option>
                                </select>
                              ) : (
                                <span className="status-value">{displayStatus}</span>
                              )}
                            </td>
                            <td className="comments">
                              {isEditing ? (
                                <>
                                  <textarea
                                    value={displayComments}
                                    onChange={(e) => handleCommentsChange(request.id, e.target.value)}
                                    className={`inline-textarea ${rowErrors.comments ? 'inline-field-error' : ''}`}
                                    placeholder="Add comments..."
                                  />
                                  {rowErrors.comments && <div className="inline-error-text">{rowErrors.comments}</div>}
                                </>
                              ) : (
                                <span className="comment-text">{displayComments || 'N/A'}</span>
                              )}
                            </td>
                            <td className="comments">
                              {isEditing ? (
                                <>
                                  <select
                                    value={displayStoppedReason}
                                    onChange={(e) => handleStoppedReasonChange(request.id, e.target.value)}
                                    className={`inline-select ${rowErrors.stoppedReason ? 'inline-field-error' : ''}`}
                                    disabled={displayStatus !== 'BGV Stopped'}
                                  >
                                    <option value="">-- Select Reason --</option>
                                    {STOPPED_REASONS.map((reason) => (
                                      <option key={reason} value={reason}>{reason}</option>
                                    ))}
                                  </select>
                                  {rowErrors.stoppedReason && <div className="inline-error-text">{rowErrors.stoppedReason}</div>}
                                </>
                              ) : (
                                <span className="comment-text">{displayStoppedReason || '—'}</span>
                              )}
                            </td>
                            <td className="actions">
                              {isEditing ? (
                                <>
                                  <button
                                    onClick={() => handleSaveChanges(request.id, request)}
                                    className="btn-save"
                                    title="Save changes"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingId(null);
                                      setRowValidationErrors(prev => {
                                        const next = { ...prev };
                                        delete next[request.id];
                                        return next;
                                      });
                                    }}
                                    className="btn-cancel"
                                    title="Cancel editing"
                                  >
                                    Cancel
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => {
                                      openEditModal(request);
                                    }}
                                    className="btn-action"
                                    title="Edit this request"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => {
                                      const ps = String(request.resourcePsNo || '').trim();
                                      if (ps) {
                                        setHistorySearchType('resourcePsNo');
                                        setHistoryPsNumber(ps);
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
                                </>
                              )}
                            </td>
                            <td className="evidence-cell">
                              {request.evidencePath ? (
                                <a
                                  href={`${apiBase}/api/bgv-requests/${request.id}/evidence`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="btn-secondary"
                                >
                                  View Evidence
                                </a>
                              ) : (
                                <span style={{ color: '#999' }}>—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null;
          })()}

          {/* Table 2: Candidate ID Details (New Candidates/Yet to Join) */}
          {(() => {
            const candidateIdRequests = requests.filter(r => r.candidateId && r.candidateId.trim() !== '');
            const sortedRequests = sortRequests(candidateIdRequests);
            return sortedRequests.length > 0 ? (
              <div style={{ marginBottom: '30px' }}>
                <h3 style={{ marginBottom: '15px', color: '#041e42', fontSize: '18px', fontWeight: 'bold' }}>
                  Candidate ID / Employee Details - {sortedRequests.length} Records
                </h3>
                <div className="scroll-hint">Scroll horizontally to view more columns ΓåÆ</div>
                <div className="table-responsive table-scroll requests-section">
                  <table className="admin-table compact-admin-table">
                    <thead>
                      <tr>
                        <th>Select</th>
                        <th>Priority</th>
                        <th>Requester PS No</th>
                        <th>Requester Name</th>
                        <th>Candidate ID / RH ID</th>
                        <th>Resource Name</th>
                        <th>Employee Type</th>
                        <th>Submitted Date</th>
                        <th>Last Updated</th>
                        <th>Current Status</th>
                        <th>Status Action</th>
                        <th>Comments</th>
                        <th>Stopped Reason</th>
                        <th>Actions</th>
                        <th>Evidence</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedRequests.map(request => {
                        const isEditing = editingId === request.id;
                        const currentData = editingData[request.id] || {};
                        const rowErrors = rowValidationErrors[request.id] || {};
                        const rawStatus = currentData.status ?? request.status;
                        const displayStatus = statusLabelForUi(rawStatus);
                        const statusClass = `status-${toStatusClassKey(displayStatus)}`;
                        const displayComments = Object.prototype.hasOwnProperty.call(currentData, 'commentsFromPmo')
                          ? currentData.commentsFromPmo
                          : '';
                        const displayStoppedReason = Object.prototype.hasOwnProperty.call(currentData, 'bgvStoppedReason')
                          ? currentData.bgvStoppedReason
                          : (request.bgvStoppedReason || '');

                        return (
                          <tr key={request.id} className={isEditing ? 'editing-row' : ''}>
                            <td style={{ textAlign: 'center' }}>
                              <input
                                type="checkbox"
                                checked={selectedCheckboxes.has(request.id)}
                                onChange={(e) => handleCheckboxChange(request, e.target.checked)}
                              />
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              {isEditing ? (
                                <select
                                  value={displayPriority}
                                  onChange={(e) => handlePriorityChange(request.id, e.target.value)}
                                  className="inline-select"
                                >
                                  <option value="HIGH">High</option>
                                  <option value="NORMAL">Normal</option>
                                </select>
                              ) : request.priority === 'HIGH' ? (
                                <span style={{ 
                                  background: '#ef4444', 
                                  color: '#fff', 
                                  padding: '6px 12px', 
                                  borderRadius: '6px', 
                                  fontWeight: '700',
                                  fontSize: '12px',
                                  display: 'inline-block',
                                  boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)'
                                }}>
                                  HIGH PRIORITY
                                </span>
                              ) : (
                                <span style={{ color: '#999', fontSize: '12px' }}>—</span>
                              )}
                            </td>
                            <td className="ps-no">{request.psNumber}</td>
                            <td className="resource-name">{request.requestedByName || '—'}</td>
                            <td className="candidate-id"><strong>{request.candidateId}</strong></td>
                            <td className="resource-name">{request.resourceName || '—'}</td>
                            <td>{request.employeeType === 'LTIM_ASSOCIATES' ? 'LTM Associate' : request.employeeType === 'YET_TO_JOIN' ? 'Yet to Join' : request.employeeType || '—'}</td>
                            <td className="date">{parseRequestDate(request)?.toLocaleDateString() || '—'}</td>
                            <td className="date">{parseUpdatedAt(request)?.toLocaleString() || '—'}</td>
                            <td className="status">
                              <span className={`status-badge ${statusClass}`}>
                                {displayStatus}
                              </span>
                            </td>
                            <td className="status-dropdown">
                              {isEditing ? (
                                <select
                                  value={['BGV Initiated', 'BGV Stopped'].includes(displayStatus) ? displayStatus : ''}
                                  onChange={(e) => handleStatusChange(request.id, e.target.value)}
                                  className="inline-select"
                                >
                                  <option value="">-- Select Status --</option>
                                  <option value="BGV Initiated">BGV Initiated</option>
                                  <option value="BGV Stopped">BGV Stopped</option>
                                </select>
                              ) : (
                                <span className="status-value">{displayStatus}</span>
                              )}
                            </td>
                            <td className="comments">
                              {isEditing ? (
                                <>
                                  <textarea
                                    value={displayComments}
                                    onChange={(e) => handleCommentsChange(request.id, e.target.value)}
                                    className={`inline-textarea ${rowErrors.comments ? 'inline-field-error' : ''}`}
                                    placeholder="Add comments..."
                                  />
                                  {rowErrors.comments && <div className="inline-error-text">{rowErrors.comments}</div>}
                                </>
                              ) : (
                                <span className="comment-text">{displayComments || 'N/A'}</span>
                              )}
                            </td>
                            <td className="comments">
                              {isEditing ? (
                                <>
                                  <select
                                    value={displayStoppedReason}
                                    onChange={(e) => handleStoppedReasonChange(request.id, e.target.value)}
                                    className={`inline-select ${rowErrors.stoppedReason ? 'inline-field-error' : ''}`}
                                    disabled={displayStatus !== 'BGV Stopped'}
                                  >
                                    <option value="">-- Select Reason --</option>
                                    {STOPPED_REASONS.map((reason) => (
                                      <option key={reason} value={reason}>{reason}</option>
                                    ))}
                                  </select>
                                  {rowErrors.stoppedReason && <div className="inline-error-text">{rowErrors.stoppedReason}</div>}
                                </>
                              ) : (
                                <span className="comment-text">{displayStoppedReason || '—'}</span>
                              )}
                            </td>
                            <td className="actions">
                              {isEditing ? (
                                <>
                                  <button
                                    onClick={() => handleSaveChanges(request.id, request)}
                                    className="btn-save"
                                    title="Save changes"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingId(null);
                                      setRowValidationErrors(prev => {
                                        const next = { ...prev };
                                        delete next[request.id];
                                        return next;
                                      });
                                    }}
                                    className="btn-cancel"
                                    title="Cancel editing"
                                  >
                                    Cancel
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => {
                                      openEditModal(request);
                                    }}
                                    className="btn-action"
                                    title="Edit this request"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => {
                                      const candidateId = String(request.candidateId || '').trim();
                                      if (candidateId) {
                                        setHistorySearchType('candidateId');
                                        setHistoryPsNumber(candidateId);
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
                                </>
                              )}
                            </td>
                            <td className="evidence-cell">
                              {request.evidencePath ? (
                                <a
                                  href={`${apiBase}/api/bgv-requests/${request.id}/evidence`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="btn-secondary"
                                >
                                  View Evidence
                                </a>
                              ) : (
                                <span style={{ color: '#999' }}>—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null;
          })()}
        </>
      )}

      {modalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e)=>e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="modal-header">
              <h3>Admin Action - Complete Onboarding</h3>
              <button className="close-btn" onClick={closeModal} aria-label="Close modal">&times;</button>
            </div>
            <div style={{ display: 'grid', gap: '10px', marginTop: 10 }}>
              <label>
                BGV request Id / Applicant ID
                <input type="text" value={modalForm.applicantId} onChange={(e)=>handleModalChange('applicantId', e.target.value)} />
              </label>
              <label>
                BGV Initiated By (PS no, Name)
                <input type="text" value={modalForm.bgvInitiatedBy} onChange={(e)=>handleModalChange('bgvInitiatedBy', e.target.value)} />
              </label>
              <label>
                Request Submitted Date
                <input type="date" value={modalForm.requestSubmittedOn} onChange={(e)=>handleModalChange('requestSubmittedOn', e.target.value)} />
              </label>
              <label>
                Status
                <select
                  value={modalForm.status}
                  onChange={(e) => {
                    const value = e.target.value;
                    handleModalChange('status', value);
                    if (value !== 'ON_HOLD') {
                      handleModalChange('bgvStoppedReason', '');
                    }
                  }}
                >
                  <option value="APPROVED">BGV Initiated</option>
                  <option value="ON_HOLD">BGV Stopped</option>
                </select>
              </label>
              {modalForm.status === 'ON_HOLD' && (
                <label>
                  Stopped Reason <span className="required">*</span>
                  <select value={modalForm.bgvStoppedReason} onChange={(e)=>handleModalChange('bgvStoppedReason', e.target.value)}>
                    <option value="">-- Select Reason --</option>
                    {STOPPED_REASONS.map((reason) => (
                      <option key={reason} value={reason}>{reason}</option>
                    ))}
                  </select>
                </label>
              )}
              <label>
                Comments from PMO Team <span className="required">*</span>
                <textarea value={modalForm.commentsFromPmo} onChange={(e)=>handleModalChange('commentsFromPmo', e.target.value)} />
                {singleModalErrors.comments && <div className="inline-error-text">{singleModalErrors.comments}</div>}
              </label>
              {modalForm.status === 'ON_HOLD' && singleModalErrors.stoppedReason && (
                <div className="inline-error-text">{singleModalErrors.stoppedReason}</div>
              )}
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button className="btn-secondary" onClick={closeModal}>Cancel</button>
                <button className="btn-primary" onClick={submitModal}>Submit</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal for Single Selection */}
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
                  padding: '4px 8px',
                  transition: 'color 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.color = '#ef4444'}
                onMouseLeave={(e) => e.target.style.color = 'var(--muted)'}
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
                <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '4px', fontWeight: 600 }}>Resource Type</div>
                <div style={{ fontSize: '16px', color: 'var(--text-color)', fontWeight: 600 }}>{detailRequest.resourceType || '—'}</div>
              </div>
              
              <div style={{ 
                padding: '16px',
                background: 'var(--input-bg)',
                borderRadius: '8px',
                border: '1px solid var(--border-color)'
              }}>
                <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '4px', fontWeight: 600 }}>Geo / Region</div>
                <div style={{ fontSize: '16px', color: 'var(--text-color)', fontWeight: 600 }}>{detailRequest.geoRegion || '—'}</div>
              </div>
              
              <div style={{ 
                padding: '16px',
                background: 'var(--input-bg)',
                borderRadius: '8px',
                border: '1px solid var(--border-color)'
              }}>
                <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '4px', fontWeight: 600 }}>Country</div>
                <div style={{ fontSize: '16px', color: 'var(--text-color)', fontWeight: 600 }}>{detailRequest.country || '—'}</div>
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
                <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '4px', fontWeight: 600 }}>Priority</div>
                <div style={{ fontSize: '14px', fontWeight: 600, marginTop: '4px' }}>
                  {detailRequest.priority === 'HIGH' ? (
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
                  ) : (
                    <span style={{ color: '#999' }}>—</span>
                  )}
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

      {/* Status Change Modal for Multiple Selections */}
      {showStatusModal && (
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
          zIndex: 1000
        }} onClick={() => {
          setShowStatusModal(false);
          setStatusModalErrors({});
        }}>
          <div style={{
            background: 'var(--card-bg)',
            padding: '32px',
            borderRadius: '12px',
            maxWidth: '450px',
            width: '100%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '24px'
            }}>
              <h2 style={{ 
                margin: 0, 
                fontSize: '22px', 
                fontWeight: 700, 
                color: 'var(--text-color)' 
              }}>
                Change Status
              </h2>
              <button 
                onClick={() => {
                  setShowStatusModal(false);
                  setStatusModalErrors({});
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: 'var(--muted)',
                  padding: '4px 8px'
                }}
              >
                &times;
              </button>
            </div>
            
            <div style={{ marginBottom: '24px' }}>
              <p style={{ 
                margin: '0 0 16px 0', 
                fontSize: '14px', 
                color: 'var(--muted)' 
              }}>
                You have selected <strong>{selectedCheckboxes.size}</strong> request(s). Select the status to apply to all selected requests.
              </p>
              
              <label style={{ 
                display: 'block',
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--text-color)',
                marginBottom: '8px'
              }}>
                Select Status
              </label>
              <select
                value={statusModalStatus}
                onChange={(e) => {
                  const value = e.target.value;
                  setStatusModalStatus(value);
                  setStatusModalErrors(prev => ({ ...prev, status: '' }));
                  if (value !== 'ON_HOLD') {
                    setStatusModalStoppedReason('');
                    setStatusModalErrors(prev => ({ ...prev, stoppedReason: '' }));
                  }
                }}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  border: '1px solid var(--input-border)',
                  background: 'var(--input-bg)',
                  color: 'var(--input-text)',
                  fontSize: '14px',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value="">-- Select Status --</option>
                <option value="APPROVED">BGV Initiated</option>
                <option value="ON_HOLD">BGV Stopped</option>
              </select>
              {statusModalErrors.status && <div className="inline-error-text">{statusModalErrors.status}</div>}
              {statusModalStatus === 'ON_HOLD' && (
                <div style={{ marginTop: '14px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: 'var(--text-color)',
                    marginBottom: '8px'
                  }}>
                    Stopped Reason <span className="required">*</span>
                  </label>
                  <select
                    value={statusModalStoppedReason}
                    onChange={(e) => {
                      setStatusModalStoppedReason(e.target.value);
                      setStatusModalErrors(prev => ({ ...prev, stoppedReason: '' }));
                    }}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '8px',
                      border: '1px solid var(--input-border)',
                      background: 'var(--input-bg)',
                      color: 'var(--input-text)',
                      fontSize: '14px'
                    }}
                  >
                    <option value="">-- Select Reason --</option>
                    {STOPPED_REASONS.map((reason) => (
                      <option key={reason} value={reason}>{reason}</option>
                    ))}
                  </select>
                  {statusModalErrors.stoppedReason && <div className="inline-error-text">{statusModalErrors.stoppedReason}</div>}
                </div>
              )}
              <div style={{ marginTop: '14px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--text-color)',
                  marginBottom: '8px'
                }}>
                  Comments <span className="required">*</span>
                </label>
                <textarea
                  value={statusModalComments}
                  onChange={(e) => {
                    setStatusModalComments(e.target.value);
                    setStatusModalErrors(prev => ({ ...prev, comments: '' }));
                  }}
                  style={{
                    width: '100%',
                    minHeight: '90px',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid var(--input-border)',
                    background: 'var(--input-bg)',
                    color: 'var(--input-text)',
                    fontSize: '14px'
                  }}
                  placeholder="Add comments for this status change..."
                />
                {statusModalErrors.comments && <div className="inline-error-text">{statusModalErrors.comments}</div>}
              </div>
            </div>
            
            <div style={{ 
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px'
            }}>
              <button 
                onClick={() => {
                  setShowStatusModal(false);
                  setStatusModalStatus('');
                  setStatusModalComments('');
                  setStatusModalStoppedReason('');
                  setStatusModalErrors({});
                }}
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
                Cancel
              </button>
              <button 
                onClick={handleBulkStatusChange}
                disabled={!statusModalStatus}
                className="btn-primary"
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              >
                Apply to {selectedCheckboxes.size} Request(s)
              </button>
            </div>
          </div>
        </div>
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

      {showEditModal && editRequest && (
        <div className="modal-overlay" onClick={closeEditModal}>
          <div className="modal square-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="modal-header">
              <h3>Edit Request</h3>
              <button className="close-btn" onClick={closeEditModal} aria-label="Close modal">×</button>
            </div>
            <div style={{ display: 'grid', gap: '12px' }}>
              <label>
                Status
                <select
                  value={editForm.status}
                  onChange={(e) => handleEditChange('status', e.target.value)}
                >
                  <option value="">-- Select Status --</option>
                  <option value="BGV Initiated">BGV Initiated</option>
                  <option value="BGV Stopped">BGV Stopped</option>
                </select>
              </label>

              <label>
                Priority
                <select
                  value={editForm.priority}
                  onChange={(e) => handleEditChange('priority', e.target.value)}
                >
                  <option value="HIGH">High</option>
                  <option value="NORMAL">Normal</option>
                </select>
              </label>

              {editForm.status === 'BGV Stopped' && (
                <label>
                  Stopped Reason <span className="required">*</span>
                  <select
                    value={editForm.bgvStoppedReason}
                    onChange={(e) => handleEditChange('bgvStoppedReason', e.target.value)}
                  >
                    <option value="">-- Select Reason --</option>
                    {STOPPED_REASONS.map((reason) => (
                      <option key={reason} value={reason}>{reason}</option>
                    ))}
                  </select>
                  {editErrors.bgvStoppedReason && <div className="inline-error-text">{editErrors.bgvStoppedReason}</div>}
                </label>
              )}

              <label>
                Interim Status
                <select
                  value={editForm.interimStatus}
                  onChange={(e) => handleEditChange('interimStatus', e.target.value)}
                >
                  <option value="">-- Select Interim Status --</option>
                  <option value="Clear">Clear</option>
                  <option value="Stop BGV">Stop BGV</option>
                  <option value="Resigned">Resigned</option>
                  <option value="Inprogress">Inprogress</option>
                  <option value="Yet to fill link">Yet to fill link</option>
                </select>
              </label>

              <label>
                Interim Date
                <input
                  type="date"
                  value={editForm.interimDate}
                  onChange={(e) => handleEditChange('interimDate', e.target.value)}
                />
              </label>

              <label>
                Final BGV Status
                <select
                  value={editForm.finalBgvStatus}
                  onChange={(e) => handleEditChange('finalBgvStatus', e.target.value)}
                >
                  <option value="">-- Select Final BGV Status --</option>
                  <option value="Clear">Clear</option>
                  <option value="Resigned">Resigned</option>
                  <option value="Stop BGV">Stop BGV</option>
                  <option value="Major Discrepancy- BU HR suggestion pending">Major Discrepancy- BU HR suggestion pending</option>
                  <option value="Insufficiency">Insufficiency</option>
                  <option value="In progress">In progress</option>
                  <option value="Yet to fill link">Yet to fill link</option>
                </select>
              </label>

              <label>
                Final BGV Date
                <input
                  type="date"
                  value={editForm.finalBgvDate}
                  onChange={(e) => handleEditChange('finalBgvDate', e.target.value)}
                />
              </label>

              <label>
                Comments from PMO Team <span className="required">*</span>
                <textarea
                  value={editForm.commentsFromPmo}
                  onChange={(e) => handleEditChange('commentsFromPmo', e.target.value)}
                />
                {editErrors.commentsFromPmo && <div className="inline-error-text">{editErrors.commentsFromPmo}</div>}
              </label>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button className="btn-secondary" onClick={closeEditModal}>Cancel</button>
                <button className="btn-primary" onClick={submitEditModal}>Save</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}
