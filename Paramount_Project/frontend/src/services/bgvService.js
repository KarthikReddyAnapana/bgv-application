import axios from 'axios';

export const API_ORIGIN = import.meta.env.VITE_API_BASE || 'https://uyzsjec2hb.execute-api.us-east-2.amazonaws.com/bgv-service';
export const API_BASE_URL = `${API_ORIGIN}/api/bgv-requests`;

export const bgvService = {
  createRequest: (data) => {
    if (typeof FormData !== 'undefined' && data instanceof FormData) {
      return axios.post(API_BASE_URL, data, { headers: { 'Content-Type': 'multipart/form-data' } });
    }
    return axios.post(API_BASE_URL, data);
  },

  updateRequest: (id, data) => {
    if (typeof FormData !== 'undefined' && data instanceof FormData) {
      return axios.put(`${API_BASE_URL}/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
    }
    return axios.put(`${API_BASE_URL}/${id}`, data);
  },

  getRequest: (id) => {
    return axios.get(`${API_BASE_URL}/${id}`);
  },

  getAllRequests: () => {
    return axios.get(API_BASE_URL);
  },

  getRequestsByRole: (role) => {
    return axios.get(`${API_BASE_URL}/role/${role}`);
  },

  getRequestsByStatus: (status) => {
    return axios.get(`${API_BASE_URL}/status/${status}`);
  },

  deleteRequest: (id) => {
    return axios.delete(`${API_BASE_URL}/${id}`);
  },

  updatePriority: (id, priority) => {
    return axios.patch(`${API_BASE_URL}/${id}/priority`, { priority });
  }
,
  getRequestsByPsNumber: (psNumber) => {
    return axios.get(`${API_BASE_URL}/ps/${psNumber}`);
  },
  
  getRequestsByEmployeeType: (employeeType) => {
    return axios.get(`${API_BASE_URL}/employee-type/${employeeType}`);
  },
  
  getHistoryByPsNumber: (psNumber) => {
    return axios.get(`${API_BASE_URL}/history/ps/${psNumber}`);
  },

  getHistoryByResourcePsNo: (resourcePsNo) => {
    return axios.get(`${API_BASE_URL}/history/resource-ps/${resourcePsNo}`);
  },

  getHistoryByCandidateId: (candidateId) => {
    return axios.get(`${API_BASE_URL}/history/candidate/${candidateId}`);
  },

  getHistoryByRequestId: (requestId) => {
    return axios.get(`${API_BASE_URL}/history/request/${requestId}`);
  },

  searchHistory: (searchTerm) => {
    return axios.get(`${API_BASE_URL}/history/search/${searchTerm}`);
  },
  
  uploadExcel: (file) => {
    const form = new FormData();
    form.append('file', file);
    return axios.post(`${API_BASE_URL}/excel-upload`, form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  getExcelUploadRecords: (year, month) => {
    return axios.get(`${API_BASE_URL}/excel-upload`, { params: { year, month } });
  },

  getExcelUploadTable: (year, month) => {
    return axios.get(`${API_BASE_URL}/excel-upload/table`, { params: { year, month } });
  },

  getLatestExcelUploadTable: () => {
    return axios.get(`${API_BASE_URL}/excel-upload/table/latest`);
  },

  getCountryGeoRegionMapping: () => {
    return axios.get(`${API_BASE_URL}/config/country-georegion-mapping`);
  }
};
