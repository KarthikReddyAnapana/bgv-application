import React, { useState, useEffect } from 'react';
import '../styles/form.css';
import { bgvService } from '../services/bgvService';
import ThemeToggleButton from './ThemeToggleButton';

export default function PmForm({ onRequestSubmitted }) {
  const [formData, setFormData] = useState({
    psNumber: '',
    requestedByName: '',
    rrNumber: '',
    employeeType: '',
    candidateId: '',
    resourceName: '',
    resourcePsNo: '',
    resourceType: '',
    geoRegion: '',
    country: '',
    status: 'PENDING',
    bgvInitiatedBy: '',
    commentsFromPmo: '',
    onboardingType: '',
    requestSubmittedOn: new Date().toISOString().split('T')[0],
    userRole: 'PM'
  });

  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPostSubmitModal, setShowPostSubmitModal] = useState(false);
  const [showSubmitErrorModal, setShowSubmitErrorModal] = useState(false);
  const [submitErrorText, setSubmitErrorText] = useState('');
  const [countryToGeoRegion, setCountryToGeoRegion] = useState({
    // Default mapping - used if API fails to load
    USA: 'USA_AND_CANADA',
    CANADA: 'USA_AND_CANADA',
    MEXICO: 'USA_AND_CANADA',
    INDIA: 'APAC',
    POLAND: 'EUROPE',
    NETHERLANDS: 'EUROPE',
    UNITED_KINGDOM: 'EUROPE',
    COSTA_RICA: 'LATAM',
    BRAZIL: 'LATAM',
    COLOMBIA: 'LATAM',
    BOLIVIA: 'LATAM',
    ARGENTINA: 'LATAM',
    ECUADOR: 'LATAM',
    UAE: 'APAC',
    MALAYSIA: 'APAC',
    JAPAN: 'APAC',
    SINGAPORE: 'APAC',
    AUSTRALIA: 'APAC'
  });

  // Fetch country to geo region mapping on component mount
  useEffect(() => {
    const fetchMapping = async () => {
      try {
        const response = await bgvService.getCountryGeoRegionMapping();
        if (response.data && response.data.success && response.data.data) {
          setCountryToGeoRegion(response.data.data);
          console.log('Country to GeoRegion mapping loaded:', response.data.data);
        }
      } catch (error) {
        console.warn('Error fetching country-georegion mapping, using defaults:', error);
        // Keep the default mapping on error
      }
    };
    fetchMapping();
  }, []);

  useEffect(() => {
    const storedPs = window.localStorage.getItem('bgvUserPs') || '';
    if (storedPs) {
      setFormData(prev => ({
        ...prev,
        psNumber: storedPs
      }));
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Clear global error message when user starts editing
    if (message.type === 'error') {
      setMessage({ type: '', text: '' });
    }
    
    // If country is changed, auto-populate geoRegion
    if (name === 'country') {
      const geoRegion = countryToGeoRegion[value] || '';
      setFormData(prev => ({
        ...prev,
        [name]: value,
        geoRegion: geoRegion
      }));
      
      const fieldError = validateField(name, value);
      const geoError = validateField('geoRegion', geoRegion);
      setErrors(prev => ({
        ...prev,
        [name]: fieldError,
        geoRegion: geoError
      }));
    } else if (name === 'employeeType') {
      // When employeeType changes, clear conditional field values and errors
      setFormData(prev => ({
        ...prev,
        [name]: value,
        // Clear the field that's not required for the selected type
        candidateId: value === 'YET_TO_JOIN' ? prev.candidateId : '',
        resourcePsNo: value === 'LTIM_ASSOCIATES' ? prev.resourcePsNo : ''
      }));

      const fieldError = validateField(name, value);
      setErrors(prev => ({
        ...prev,
        [name]: fieldError,
        candidateId: '',
        resourcePsNo: ''
      }));
    } else if (name === 'onboardingType') {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));

      const fieldError = validateField(name, value);
      // Clear onboardingType error if changing from EXPRESS to REGULAR
      const clearError = value === 'REGULAR_REQUEST' ? '' : fieldError;
      setErrors(prev => ({
        ...prev,
        [name]: clearError
      }));
    } else {
      // allow the user to type anything; show validation errors immediately
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));

      const fieldError = validateField(name, value);
      setErrors(prev => ({
        ...prev,
        [name]: fieldError
      }));
    }
  };

  // validate a single field and return an error message or empty string
  const validateField = (name, value) => {
    const v = (value || '').toString().trim();
    switch (name) {
      case 'psNumber':
        if (!v) return 'PS Number is required';
        if (v.startsWith('-')) return 'PS Number should not be negative';
        if (!/^\d+$/.test(v)) return 'PS Number must contain only digits';
        return '';
      case 'requestedByName':
        if (!v) return 'Requested by Name is required';
        if (/\d/.test(v)) return 'Requested by Name must not contain digits';
        return '';
      case 'rrNumber':
        if (!v) return 'RR Number is required';
        if (/[a-zA-Z]/.test(v)) return 'RR Number must not contain letters';
        if (isNaN(Number(v))) return 'RR Number must be numeric';
        if (Number(v) <= 0) return 'RR Number must be a positive number';
        return '';
      case 'employeeType':
        if (!v) return 'Employee Type is required';
        return '';
      case 'candidateId':
        if (!v) return 'Candidate ID / RH ID is required';
        if (v.startsWith('-')) return 'Candidate ID / RH ID should not be negative';
        if (!/^\d+$/.test(v)) return 'Candidate ID / RH ID must contain only digits';
        return '';
      case 'resourceName':
        if (!v) return 'Resource Name is required';
        if (/\d/.test(v)) return 'Resource Name must not contain digits';
        return '';
      case 'resourcePsNo':
        if (!v) return 'Resource PS.No is required';
        if (v.startsWith('-')) return 'Resource PS.No should not be negative';
        if (!/^\d+$/.test(v)) return 'Resource PS.No must contain only digits';
        return '';
      case 'resourceType':
        if (!v) return 'Resource Type is required';
        return '';
      case 'geoRegion':
        if (!v) return 'Geo Region is required';
        return '';
      case 'country':
        if (!v) return 'Country is required';
        return '';
      case 'onboardingType':
        if (!v) return 'Resource Onboarding Type is required';
        return '';
      default:
        return '';
    }
  };

  const validateForm = () => {
    const fieldsToCheck = [
      'psNumber',
      'requestedByName',
      'rrNumber',
      'employeeType',
      'resourceName',
      'resourceType',
      'geoRegion',
      'country',
      'onboardingType'
    ];

    // Add conditional field based on employeeType
    if (formData.employeeType === 'YET_TO_JOIN') {
      fieldsToCheck.push('candidateId');
    } else if (formData.employeeType === 'LTIM_ASSOCIATES') {
      fieldsToCheck.push('resourcePsNo');
    }

    const newErrors = {};
    fieldsToCheck.forEach(f => {
      const err = validateField(f, formData[f]);
      if (err) newErrors[f] = err;
    });

    setErrors(newErrors);
    return { isValid: Object.keys(newErrors).length === 0, errors: newErrors };
  };

  const handleLogout = () => {
    window.localStorage.removeItem('bgvUserRole');
    window.localStorage.removeItem('bgvUserPs');
    window.location.hash = '#/login';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log('Form submission started');
    console.log('onboardingType:', formData.onboardingType);

    const validation = validateForm();
    console.log('Validation result:', validation);
    
    if (!validation.isValid) {
      // Get all error messages and display them
      const errorMessages = Object.values(validation.errors).filter(msg => msg);
      
      console.log('Validation failed:', errorMessages);
      setSubmitErrorText(errorMessages.length > 0 ? errorMessages.join('. ') : 'Please fill all required fields');
      setShowSubmitErrorModal(true);
      return;
    }
    submitRequest();
  };

  const submitRequest = async () => {
    setIsSubmitting(true);
    try {
      // Defensive check: employeeType must be set
      if (!formData.employeeType || formData.employeeType.trim() === '') {
        setSubmitErrorText('Employee Type is required. Please select a valid option.');
        setShowSubmitErrorModal(true);
        setErrors(prev => ({ ...prev, employeeType: 'Employee Type is required' }));
        setIsSubmitting(false);
        return;
      }

      // Prepare payload to match backend DTO types and required fields
      const payload = {
        ...formData,
        priority: 'NORMAL',
        rrNumber: Number(formData.rrNumber),
        // Set candidateId only for YET_TO_JOIN, otherwise null
        candidateId: formData.employeeType === 'YET_TO_JOIN' ? (formData.candidateId?.trim() || null) : null,
        // Set resourcePsNo only for LTIM_ASSOCIATES, otherwise null
        resourcePsNo: formData.employeeType === 'LTIM_ASSOCIATES' ? (formData.resourcePsNo?.trim() || null) : null,
        psNumber: String(formData.psNumber),
        bgvInitiatedBy: formData.bgvInitiatedBy || formData.requestedByName || 'N/A',
        onboardingType: formData.onboardingType || 'REGULAR_REQUEST',
        requestSubmittedOn: formData.requestSubmittedOn
      };

      console.log('Submitting payload:', payload);

      await bgvService.createRequest(payload);
      setMessage({ type: 'success', text: 'BGV Request submitted successfully!' });

      setShowPostSubmitModal(true);

      // Reset form
      const storedPs = window.localStorage.getItem('bgvUserPs') || '';
      setFormData({
        psNumber: storedPs,
        requestedByName: '',
        rrNumber: '',
        employeeType: '',
        candidateId: '',
        resourceName: '',
        resourcePsNo: '',
        resourceType: '',
        geoRegion: '',
        country: '',
        status: 'PENDING',
        bgvInitiatedBy: '',
        commentsFromPmo: '',
        onboardingType: '',
        requestSubmittedOn: new Date().toISOString().split('T')[0],
        userRole: 'PM'
      });

      setErrors({});
      
      // Notify parent to refresh requests list
      if (onRequestSubmitted) {
        onRequestSubmitted();
      }
    } catch (error) {
      setSubmitErrorText(error.response?.data?.message || 'Error submitting form. Please try again.');
      setShowSubmitErrorModal(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    const storedPs = window.localStorage.getItem('bgvUserPs') || '';
    setFormData({
      psNumber: storedPs,
      requestedByName: '',
      rrNumber: '',
      employeeType: '',
      candidateId: '',
      resourceName: '',
      resourcePsNo: '',
      resourceType: '',
      geoRegion: '',
      country: '',
      status: 'PENDING',
      bgvInitiatedBy: '',
      commentsFromPmo: '',
      onboardingType: '',
      requestSubmittedOn: new Date().toISOString().split('T')[0],
      userRole: 'PM'
    });
    setErrors({});
    setMessage({ type: '', text: '' });
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--page-bg)', padding: '40px 20px' }}>
      <ThemeToggleButton />
      <div className="form-wrapper">
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
        <h2 className="form-title">BGV Request Form - PM Role</h2>

      <form onSubmit={handleSubmit}>
        {/* BGV requested by */}
        <div className="form-section">
          <h3 className="section-title">BGV Requested by</h3>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="psNumber">
                PS No <span className="required">*</span>
              </label>
              <input
                type="text"
                id="psNumber"
                name="psNumber"
                inputMode="numeric"
                pattern="\d*"
                maxLength={10}
                value={formData.psNumber}
                disabled
                placeholder="Auto-populated from login"
              />
              {errors.psNumber && <div className="error">{errors.psNumber}</div>}
            </div>

            <div className="form-group">
              <label htmlFor="requestedByName">
                Name <span className="required">*</span>
              </label>
              <input
                type="text"
                id="requestedByName"
                name="requestedByName"
                value={formData.requestedByName}
                onChange={handleInputChange}
                placeholder="Enter your name (Login details)"
              />
              {errors.requestedByName && <div className="error">{errors.requestedByName}</div>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="rrNumber">
                RR Number <span className="required">*</span>
              </label>
              <input
                type="text"
                id="rrNumber"
                name="rrNumber"
                inputMode="decimal"
                pattern="[0-9.]*"
                value={formData.rrNumber}
                onChange={handleInputChange}
                placeholder="Enter RR Number"
              />
              {errors.rrNumber && <div className="error">{errors.rrNumber}</div>}
            </div>

            <div className="form-group">
              <label htmlFor="employeeType">
                Employee Type <span className="required">*</span>
              </label>
              <select
                id="employeeType"
                name="employeeType"
                value={formData.employeeType}
                onChange={handleInputChange}
              >
                <option value="">Select Employee Type</option>
                <option value="LTIM_ASSOCIATES">LTM Associate</option>
                <option value="YET_TO_JOIN">Yet to Join (YTJ)</option>
              </select>
              {errors.employeeType && <div className="error">{errors.employeeType}</div>}
            </div>
          </div>
        </div>

        {/* Resource Details */}
        <div className="form-section">
          <h3 className="section-title">Resource Details</h3>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="resourceName">
                Resource Name <span className="required">*</span>
              </label>
              <input
                type="text"
                id="resourceName"
                name="resourceName"
                value={formData.resourceName}
                onChange={handleInputChange}
                placeholder="Enter Resource Name"
              />
              {errors.resourceName && <div className="error">{errors.resourceName}</div>}
            </div>

            <div className="form-group">
              {formData.employeeType === 'YET_TO_JOIN' ? (
                <>
                  <label htmlFor="candidateId">
                    Candidate ID / RH ID <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="candidateId"
                    name="candidateId"
                    inputMode="numeric"
                    pattern="\d*"
                    maxLength={10}
                    value={formData.candidateId}
                    onChange={handleInputChange}
                    placeholder="Enter Candidate ID"
                  />
                  {errors.candidateId && <div className="error">{errors.candidateId}</div>}
                </>
              ) : (
                <>
                  <label htmlFor="resourcePsNo">
                    Resource PS.No <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="resourcePsNo"
                    name="resourcePsNo"
                    inputMode="numeric"
                    pattern="\d*"
                    maxLength={10}
                    value={formData.resourcePsNo}
                    onChange={handleInputChange}
                    placeholder="Enter Resource PS.No"
                  />
                  {errors.resourcePsNo && <div className="error">{errors.resourcePsNo}</div>}
                </>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="resourceType">
                Resource Type <span className="required">*</span>
              </label>
              <select
                id="resourceType"
                name="resourceType"
                value={formData.resourceType}
                onChange={handleInputChange}
              >
                <option value="">Select Resource Type</option>
                <option value="EXTERNAL">External</option>
                <option value="INTERNAL">Internal</option>
              </select>
              {errors.resourceType && <div className="error">{errors.resourceType}</div>}
            </div>

            <div className="form-group">
              <label htmlFor="country">
                Country <span className="required">*</span>
              </label>
              <select
                id="country"
                name="country"
                value={formData.country}
                onChange={handleInputChange}
              >
                <option value="">Select Country</option>
                <option value="USA">USA</option>
                <option value="INDIA">India</option>
                <option value="POLAND">Poland</option>
                <option value="MEXICO">Mexico</option>
                <option value="CANADA">Canada</option>
                <option value="NETHERLANDS">Netherlands</option>
                <option value="UNITED_KINGDOM">United Kingdom</option>
                <option value="COSTA_RICA">Costa Rica</option>
                <option value="BRAZIL">Brazil</option>
                <option value="COLOMBIA">Colombia</option>
                <option value="BOLIVIA">Bolivia</option>
                <option value="UAE">Utd.Arab Emir.</option>
                <option value="ARGENTINA">Argentina</option>
                <option value="MALAYSIA">Malaysia</option>
                <option value="ECUADOR">Ecuador</option>
                <option value="JAPAN">Japan</option>
                <option value="SINGAPORE">Singapore</option>
                <option value="AUSTRALIA">Australia</option>
              </select>
              {errors.country && <div className="error">{errors.country}</div>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="geoRegion">
                Geo Region <span className="required">*</span>
              </label>
              <select
                id="geoRegion"
                name="geoRegion"
                value={formData.geoRegion}
                onChange={handleInputChange}
              >
                <option value="">Select Geo Region</option>
                <option value="USA_AND_CANADA">USA and Canada</option>
                <option value="LATAM">LATAM</option>
                <option value="EUROPE">Europe</option>
                <option value="APAC">APAC</option>
              </select>
              {errors.geoRegion && <div className="error">{errors.geoRegion}</div>}
            </div>

            <div className="form-group">
              <label htmlFor="onboardingType">
                Resource Onboarding Type <span className="required">*</span>
              </label>
              <select
                id="onboardingType"
                name="onboardingType"
                value={formData.onboardingType}
                onChange={handleInputChange}
              >
                <option value="">Select Onboarding Type</option>
                <option value="REGULAR_REQUEST">Regular Request</option>
                <option value="EXPRESS_REQUEST">Express Request</option>
              </select>
              {errors.onboardingType && <div className="error">{errors.onboardingType}</div>}
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={isSubmitting} style={{ padding: '10px 20px', minWidth: '120px', borderRadius: '8px', fontWeight: 600 }}>
            {isSubmitting ? 'Submitting...' : 'Submit Request'}
          </button>
          <button type="button" className="btn-secondary" onClick={handleReset} style={{ padding: '10px 20px', minWidth: '120px', borderRadius: '8px', fontWeight: 600 }}>
            Reset
          </button>
        </div>

      </form>

      {showPostSubmitModal && (
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
        }}>
          <div style={{
            background: 'var(--card-bg)',
            padding: '28px',
            borderRadius: '12px',
            maxWidth: '460px',
            width: '90%',
            boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
            border: '2px solid var(--border-color)'
          }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '20px', fontWeight: 700, color: 'var(--text-color)' }}>
              Request submitted
            </h3>
            <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: 'var(--muted)' }}>
              Do you want to raise another request or go back to Home?
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowPostSubmitModal(false)}
                className="btn-secondary"
                style={{ padding: '10px 18px', borderRadius: '8px', fontWeight: 600 }}
              >
                Raise Another
              </button>
              <button
                onClick={() => {
                  setShowPostSubmitModal(false);
                  window.location.hash = '#/pm-dashboard';
                }}
                className="btn-primary"
                style={{ padding: '10px 18px', borderRadius: '8px', fontWeight: 600 }}
              >
                Go to Home
              </button>
            </div>
          </div>
        </div>
      )}

      {showSubmitErrorModal && (
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
          zIndex: 1001
        }} onClick={() => setShowSubmitErrorModal(false)}>
          <div style={{
            background: 'var(--card-bg)',
            padding: '24px',
            borderRadius: '12px',
            maxWidth: '520px',
            width: '90%',
            boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
            border: '2px solid var(--border-color)'
          }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '20px', fontWeight: 700, color: 'var(--text-color)' }}>
              Submission failed
            </h3>
            <p style={{ margin: '0 0 18px 0', fontSize: '14px', color: 'var(--muted)', whiteSpace: 'pre-wrap' }}>
              {submitErrorText || 'Unable to submit request. Please try again.'}
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowSubmitErrorModal(false)}
                className="btn-primary"
                style={{ padding: '10px 18px', borderRadius: '8px', fontWeight: 600 }}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
    </div>
  );
}
