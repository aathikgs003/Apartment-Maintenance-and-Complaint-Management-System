import api from './api';

export const complaintService = {
  // --- Resident Actions ---

  // Create a new complaint (Multipart/Form-Data for images)
  createComplaint: (formData) => {
    // Ensure multipart/form-data header so files are transmitted correctly
    return api.post('/complaints', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // Get complaints for the logged-in resident
  getMyComplaints: (params) => {
    return api.get('/complaints', { params });
  },

  // Get specific stats for resident dashboard
  getMyStats: () => {
    return api.get('/complaints/my-stats');
  },

  // Submit a rating for a completed complaint
  rateComplaint: (id, ratingData) => {
    return api.post(`/complaints/${id}/rate`, ratingData);
  },

  // --- Staff Actions ---

  // Get complaints assigned to the logged-in staff member
  getMyAssignedComplaints: (params) => {
    return api.get('/complaints', { params });
  },

  // Update complaint status (Handles proof images)
  updateStatus: (id, formData) => {
    return api.put(`/complaints/${id}/status`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // --- Admin Actions ---

  // Get all complaints in the system
  getAllComplaints: (params) => {
    return api.get('/complaints', { params });
  },

  // Get recent complaints (convenience wrapper for admin dashboard)
  getRecentComplaints: (params) => {
    return api.get('/complaints', { params });
  },

  // Assign a complaint to a specific staff member
  assignComplaint: (id, assignData) => {
    return api.put(`/complaints/${id}/assign`, assignData);
  },

  // Auto-assign complaint based on system logic
  autoAssignComplaint: (id) => {
    return api.put(`/complaints/${id}/auto-assign`);
  },

  // Close a complaint after verification
  closeComplaint: (id, closeData) => {
    return api.put(`/complaints/${id}/close`, closeData);
  },

  // Delete a complaint from system
  deleteComplaint: (id) => {
    return api.delete(`/complaints/${id}`);
  },

  // Get only complaints that have crossed their deadline
  getDelayedComplaints: () => {
    return api.get('/complaints/delayed');
  },

  // --- Shared Actions ---

  // Get full details of a specific complaint
  getComplaintById: (id) => {
    return api.get(`/complaints/${id}`);
  }
};

// Payment Service
export const paymentService = {
  // Create Razorpay order for online payment
  createOrder: (complaintId, amount) => {
    return api.post(`/payments/create-order/${complaintId}`, { amount });
  },

  // Verify Razorpay payment after checkout
  verifyPayment: (complaintId, paymentData) => {
    return api.post(`/payments/verify/${complaintId}`, paymentData);
  },

  // Staff: request offline payment (moves complaint to Payment Pending)
  requestOfflinePayment: (complaintId) => {
    return api.put(`/payments/request-offline/${complaintId}`);
  },

  // Staff: confirm offline payment received
  confirmOfflinePayment: (complaintId, data) => {
    return api.put(`/payments/offline-received/${complaintId}`, data);
  },
};

export default complaintService;