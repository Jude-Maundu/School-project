import React, { useEffect, useState } from "react";
import axios from "axios";
import AdminLayout from "./AdminLayout";
import { API_BASE_URL, API_ENDPOINTS } from "../../../api/apiConfig";

const API = API_BASE_URL;

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    phoneNumber: "",
    password: "",
    role: "user",
    active: true
  });

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const fetchUsers = async () => {
    try {
      const res = await axios.get(API_ENDPOINTS.AUTH.GET_USERS, { headers });
      setUsers(res.data);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter users
  const getFilteredUsers = () => {
    return users.filter(user => {
      const matchesSearch = 
        user.username?.toLowerCase().includes(search.toLowerCase()) ||
        user.email?.toLowerCase().includes(search.toLowerCase());
      
      if (roleFilter === "all") return matchesSearch;
      return matchesSearch && user.role === roleFilter;
    });
  };

  const filteredUsers = getFilteredUsers();

  // Update total pages when filtered users or items per page changes
  useEffect(() => {
    const total = Math.ceil(filteredUsers.length / itemsPerPage);
    setTotalPages(total > 0 ? total : 1);
    setCurrentPage(1);
  }, [filteredUsers.length, itemsPerPage, search, roleFilter]);

  // Get current page items
  const getCurrentPageItems = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredUsers.slice(startIndex, endIndex);
  };

  // Pagination handlers
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleItemsPerPageChange = (e) => {
    const newValue = Number(e.target.value);
    setItemsPerPage(newValue);
    setCurrentPage(1);
  };

  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    
    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    
    return pageNumbers;
  };

  const currentUsers = getCurrentPageItems();

  // Validation function
  const validateForm = (isEditing = false) => {
    const errors = {};
    
    if (!formData.username?.trim()) {
      errors.username = "Username is required";
    } else if (formData.username.length < 3) {
      errors.username = "Username must be at least 3 characters";
    }
    
    if (!formData.email?.trim()) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Email is invalid";
    }
    
    if (!formData.phoneNumber?.trim()) {
      errors.phoneNumber = "Phone number is required";
    } else if (!/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/im.test(formData.phoneNumber.replace(/\s/g, ''))) {
      errors.phoneNumber = "Phone number is invalid";
    }
    
    if (!isEditing && !formData.password?.trim()) {
      errors.password = "Password is required";
    } else if (!isEditing && formData.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }
    
    if (!formData.role) {
      errors.role = "Role is required";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await axios.put(API_ENDPOINTS.AUTH.UPDATE_USER(userId), { role: newRole }, { headers });
      fetchUsers();
    } catch (error) {
      alert("Failed to update role");
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      await axios.put(API_ENDPOINTS.AUTH.UPDATE_USER(userId), { 
        active: !currentStatus 
      }, { headers });
      fetchUsers();
    } catch (error) {
      alert("Failed to update status");
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    
    if (!validateForm(false)) {
      return;
    }
    
    setSubmitting(true);
    try {
      const registrationData = {
        username: formData.username,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        password: formData.password,
        role: formData.role
      };
      await axios.post(API_ENDPOINTS.AUTH.REGISTER, registrationData, { headers });
      fetchUsers();
      setShowAddModal(false);
      resetForm();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to add user");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    
    if (!validateForm(true)) {
      return;
    }
    
    setSubmitting(true);
    try {
      const updateData = {
        username: formData.username,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        role: formData.role,
        active: formData.active
      };
      
      if (formData.password?.trim()) {
        updateData.password = formData.password;
      }
      
      await axios.put(API_ENDPOINTS.AUTH.UPDATE_USER(editingUser._id), updateData, { headers });
      fetchUsers();
      setShowEditModal(false);
      setEditingUser(null);
      resetForm();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to update user");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      return;
    }
    
    try {
      await axios.delete(API_ENDPOINTS.AUTH.DELETE_USER(userId), { headers });
      fetchUsers();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to delete user");
    }
  };

  const resetForm = () => {
    setFormData({
      username: "",
      email: "",
      phoneNumber: "",
      password: "",
      role: "user",
      active: true
    });
    setFormErrors({});
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setFormData({
      username: user.username || "",
      email: user.email || "",
      phoneNumber: user.phoneNumber || user.phone || "",
      password: "",
      role: user.role || "user",
      active: user.active !== false
    });
    setFormErrors({});
    setShowEditModal(true);
  };

  const stats = {
    total: users.length,
    admins: users.filter(u => u.role === "admin").length,
    photographers: users.filter(u => u.role === "photographer").length,
    buyers: users.filter(u => u.role === "user").length,
    active: users.filter(u => u.active !== false).length,
  };

  const glassStyle = {
    background: "rgba(255, 255, 255, 0.05)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
  };

  return (
    <AdminLayout>
      <div
        className="position-fixed top-0 start-0 w-100 h-100"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=2070&q=80')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: "0.1",
          zIndex: 0,
        }}
      ></div>

      <div className="position-relative" style={{ zIndex: 1 }}>
        {/* Header */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
          <div>
            <h2 className="fw-bold mb-1">
              <i className="fas fa-users me-2 text-warning"></i>
              Users Management
            </h2>
            <p className="text-white-50 small mb-0">
              <i className="fas fa-user-friends me-2"></i>
              Total Users: {stats.total} · Active: {stats.active}
            </p>
          </div>
          <div className="d-flex gap-2 mt-3 mt-md-0">
            <button 
              className="btn btn-warning rounded-pill px-4" 
              onClick={() => {
                resetForm();
                setShowAddModal(true);
              }}
            >
              <i className="fas fa-user-plus me-2"></i>
              Add New User
            </button>
            <button 
              className="btn btn-outline-warning rounded-pill px-4" 
              onClick={fetchUsers}
            >
              <i className="fas fa-sync-alt me-2"></i>
              Refresh
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="row g-3 mb-4">
          {[
            { label: "Total Users", value: stats.total, icon: "fa-users", color: "warning" },
            { label: "Admins", value: stats.admins, icon: "fa-crown", color: "info" },
            { label: "Photographers", value: stats.photographers, icon: "fa-camera", color: "warning" },
            { label: "Buyers", value: stats.buyers, icon: "fa-user", color: "success" },
            { label: "Active", value: stats.active, icon: "fa-check-circle", color: "success" },
          ].map((stat, idx) => (
            <div key={idx} className="col-md-2 col-6">
              <div 
                className="card text-center p-3 h-100"
                style={{
                  ...glassStyle,
                  borderRadius: "16px",
                }}
              >
                <div className={`text-${stat.color} mb-2`}>
                  <i className={`fas ${stat.icon} fa-2x`}></i>
                </div>
                <h4 className={`fw-bold text-${stat.color} mb-1`}>{stat.value}</h4>
                <small className="text-white-50">{stat.label}</small>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="row g-3 mb-4 p-3 rounded-4" style={glassStyle}>
          <div className="col-md-6">
            <div className="position-relative">
              <i className="fas fa-search position-absolute top-50 start-0 translate-middle-y ms-3 text-white-50"></i>
              <input
                type="text"
                className="form-control bg-transparent text-white border-secondary rounded-pill"
                placeholder="Search by username or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  paddingLeft: "40px",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                }}
              />
            </div>
          </div>
          <div className="col-md-6">
            <select
              className="form-select bg-transparent text-white border-secondary"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
              }}
            >
              <option value="all" className="bg-dark">All Roles</option>
              <option value="admin" className="bg-dark">Admin</option>
              <option value="photographer" className="bg-dark">Photographer</option>
              <option value="user" className="bg-dark">User</option>
            </select>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-5 rounded-4" style={glassStyle}>
            <div className="spinner-border mb-3" style={{ color: "#ffc107", width: "3rem", height: "3rem" }}></div>
            <p className="text-white-50">Loading users...</p>
          </div>
        )}

        {/* Users Table */}
        {!loading && (
          <div className="rounded-4 overflow-hidden" style={glassStyle}>
            <div className="table-responsive">
              <table className="table table-dark table-hover align-middle mb-0">
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.1)" }}>
                    <th className="ps-4 py-3">User</th>
                    <th className="py-3">Email</th>
                    <th className="py-3">Role</th>
                    <th className="py-3">Status</th>
                    <th className="py-3">Joined</th>
                    <th className="py-3">Media</th>
                    <th className="py-3">Earnings</th>
                    <th className="pe-4 py-3">Actions</th>
                   </tr>
                </thead>
                <tbody>
                  {currentUsers.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="text-center text-muted py-5">
                        <i className="fas fa-users-slash fa-3x mb-3 opacity-50"></i>
                        <p>No users found</p>
                        <small className="text-white-50">Try adjusting your search or filter</small>
                      </td>
                    </tr>
                  ) : (
                    currentUsers.map((user, idx) => (
                      <tr
                        key={user._id}
                        style={{
                          borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                          background: idx % 2 === 0 ? "rgba(255, 255, 255, 0.02)" : "transparent",
                        }}
                      >
                        <td className="ps-4">
                          <div className="d-flex align-items-center gap-3">
                            <div
                              className="rounded-circle d-flex align-items-center justify-content-center"
                              style={{
                                width: "40px",
                                height: "40px",
                                background: user.role === "admin" 
                                  ? "rgba(255, 193, 7, 0.2)"
                                  : user.role === "photographer"
                                  ? "rgba(23, 162, 184, 0.2)"
                                  : "rgba(40, 167, 69, 0.2)",
                              }}
                            >
                              <i className={`fas ${
                                user.role === "admin" 
                                  ? "fa-crown text-warning"
                                  : user.role === "photographer"
                                  ? "fa-camera text-info"
                                  : "fa-user text-success"
                              }`}></i>
                            </div>
                            <div>
                              <div className="fw-bold">{user.username || "N/A"}</div>
                              <small className="text-white-50">
                                ID: {user._id?.substring(0, 8)}...
                              </small>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div>
                            <i className="fas fa-envelope me-2 text-white-50"></i>
                            {user.email}
                          </div>
                        </td>
                        <td>
                          <select
                            className="form-select form-select-sm bg-transparent text-white border-secondary"
                            style={{
                              width: "130px",
                              background: "rgba(255, 255, 255, 0.05)",
                            }}
                            value={user.role}
                            onChange={(e) => handleRoleChange(user._id, e.target.value)}
                          >
                            <option value="user" className="bg-dark">User</option>
                            <option value="photographer" className="bg-dark">Photographer</option>
                            <option value="admin" className="bg-dark">Admin</option>
                          </select>
                        </td>
                        <td>
                          <span 
                            className="badge rounded-pill px-3 py-2"
                            style={{
                              background: user.active !== false 
                                ? "rgba(40, 167, 69, 0.2)" 
                                : "rgba(220, 53, 69, 0.2)",
                              color: user.active !== false ? "#28a745" : "#dc3545",
                              border: `1px solid ${
                                user.active !== false 
                                  ? "rgba(40, 167, 69, 0.3)" 
                                  : "rgba(220, 53, 69, 0.3)"
                              }`,
                            }}
                          >
                            <i className={`fas ${
                              user.active !== false ? "fa-check-circle" : "fa-ban"
                            } me-2`}></i>
                            {user.active !== false ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          <small className="text-white-50">
                            <i className="fas fa-calendar me-2"></i>
                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                          </small>
                        </td>
                        <td>
                          <span className="badge bg-info bg-opacity-25 text-info px-3 py-2 rounded-pill">
                            <i className="fas fa-image me-2"></i>
                            {user.mediaCount || 0}
                          </span>
                        </td>
                        <td>
                          <span className="badge bg-warning bg-opacity-25 text-warning px-3 py-2 rounded-pill">
                            <i className="fas fa-coins me-2"></i>
                            KES {user.earnings?.toLocaleString() || 0}
                          </span>
                        </td>
                        <td className="pe-4">
                          <div className="d-flex gap-2">
                            <button
                              className="btn btn-sm rounded-3 px-3"
                              style={{
                                background: user.active !== false 
                                  ? "rgba(220, 53, 69, 0.1)" 
                                  : "rgba(40, 167, 69, 0.1)",
                                border: `1px solid ${
                                  user.active !== false 
                                    ? "rgba(220, 53, 69, 0.3)" 
                                    : "rgba(40, 167, 69, 0.3)"
                                }`,
                                color: user.active !== false ? "#dc3545" : "#28a745",
                              }}
                              onClick={() => handleToggleStatus(user._id, user.active)}
                              title={user.active !== false ? "Deactivate" : "Activate"}
                            >
                              <i className={`fas ${user.active !== false ? 'fa-ban' : 'fa-check'}`}></i>
                            </button>
                            <button
                              className="btn btn-sm rounded-3 px-3"
                              style={{
                                background: "rgba(255, 193, 7, 0.1)",
                                border: "1px solid rgba(255, 193, 7, 0.3)",
                                color: "#ffc107",
                              }}
                              onClick={() => openEditModal(user)}
                              title="Edit User"
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button
                              className="btn btn-sm rounded-3 px-3"
                              style={{
                                background: "rgba(23, 162, 184, 0.1)",
                                border: "1px solid rgba(23, 162, 184, 0.3)",
                                color: "#17a2b8",
                              }}
                              onClick={() => setSelectedUser(user)}
                              title="View Details"
                            >
                              <i className="fas fa-eye"></i>
                            </button>
                            <button
                              className="btn btn-sm rounded-3 px-3"
                              style={{
                                background: "rgba(220, 53, 69, 0.1)",
                                border: "1px solid rgba(220, 53, 69, 0.3)",
                                color: "#dc3545",
                              }}
                              onClick={() => handleDeleteUser(user._id)}
                              title="Delete User"
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            {filteredUsers.length > 0 && (
              <div className="d-flex flex-column flex-md-row justify-content-between align-items-center p-3 border-top border-secondary border-opacity-25 gap-3">
                <div className="d-flex align-items-center gap-2">
                  <small className="text-white-50">Show</small>
                  <select
                    className="form-select form-select-sm bg-dark text-white border-secondary"
                    style={{ width: "70px" }}
                    value={itemsPerPage}
                    onChange={handleItemsPerPageChange}
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                  <small className="text-white-50">entries</small>
                </div>

                <small className="text-white-50">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                  {Math.min(currentPage * itemsPerPage, filteredUsers.length)} of{" "}
                  {filteredUsers.length} users
                </small>

                <nav>
                  <ul className="pagination pagination-sm mb-0">
                    <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                      <button
                        className="page-link bg-transparent text-white border-secondary"
                        onClick={goToPreviousPage}
                        disabled={currentPage === 1}
                      >
                        <i className="fas fa-chevron-left"></i>
                      </button>
                    </li>
                    
                    {getPageNumbers()[0] > 1 && (
                      <>
                        <li className="page-item">
                          <button
                            className="page-link bg-transparent text-white border-secondary"
                            onClick={() => goToPage(1)}
                          >
                            1
                          </button>
                        </li>
                        {getPageNumbers()[0] > 2 && (
                          <li className="page-item disabled">
                            <span className="page-link bg-transparent text-white-50 border-secondary">...</span>
                          </li>
                        )}
                      </>
                    )}
                    
                    {getPageNumbers().map(pageNum => (
                      <li key={pageNum} className={`page-item ${currentPage === pageNum ? "active" : ""}`}>
                        <button
                          className={`page-link ${currentPage === pageNum ? "bg-warning text-dark border-warning" : "bg-transparent text-white border-secondary"}`}
                          onClick={() => goToPage(pageNum)}
                        >
                          {pageNum}
                        </button>
                      </li>
                    ))}
                    
                    {getPageNumbers()[getPageNumbers().length - 1] < totalPages && (
                      <>
                        {getPageNumbers()[getPageNumbers().length - 1] < totalPages - 1 && (
                          <li className="page-item disabled">
                            <span className="page-link bg-transparent text-white-50 border-secondary">...</span>
                          </li>
                        )}
                        <li className="page-item">
                          <button
                            className="page-link bg-transparent text-white border-secondary"
                            onClick={() => goToPage(totalPages)}
                          >
                            {totalPages}
                          </button>
                        </li>
                      </>
                    )}
                    
                    <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                      <button
                        className="page-link bg-transparent text-white border-secondary"
                        onClick={goToNextPage}
                        disabled={currentPage === totalPages}
                      >
                        <i className="fas fa-chevron-right"></i>
                      </button>
                    </li>
                  </ul>
                </nav>
              </div>
            )}
          </div>
        )}

        {/* Add User Modal */}
        {showAddModal && (
          <div
            className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
            style={{
              background: "rgba(0, 0, 0, 0.8)",
              backdropFilter: "blur(5px)",
              zIndex: 1050,
            }}
            onClick={() => setShowAddModal(false)}
          >
            <div
              className="card bg-dark"
              style={{
                maxWidth: "500px",
                width: "90%",
                ...glassStyle,
                borderRadius: "24px",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="card-header bg-transparent border-warning border-opacity-25 d-flex justify-content-between align-items-center p-4">
                <h4 className="mb-0">
                  <i className="fas fa-user-plus me-2 text-warning"></i>
                  Add New User
                </h4>
                <button
                  className="btn-close btn-close-white"
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                ></button>
              </div>
              <form onSubmit={handleAddUser}>
                <div className="card-body p-4">
                  {/* Username */}
                  <div className="mb-3">
                    <label className="form-label text-white-50">
                      <i className="fas fa-user me-2 text-warning"></i>
                      Username <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className={`form-control bg-transparent text-white ${
                        formErrors.username ? 'border-danger' : 'border-secondary'
                      }`}
                      value={formData.username}
                      onChange={(e) => {
                        setFormData({...formData, username: e.target.value});
                        if (formErrors.username) setFormErrors({...formErrors, username: null});
                      }}
                      required
                      style={{ background: "rgba(255, 255, 255, 0.05)" }}
                    />
                    {formErrors.username && (
                      <small className="text-danger mt-1 d-block">{formErrors.username}</small>
                    )}
                  </div>

                  {/* Email */}
                  <div className="mb-3">
                    <label className="form-label text-white-50">
                      <i className="fas fa-envelope me-2 text-warning"></i>
                      Email <span className="text-danger">*</span>
                    </label>
                    <input
                      type="email"
                      className={`form-control bg-transparent text-white ${
                        formErrors.email ? 'border-danger' : 'border-secondary'
                      }`}
                      value={formData.email}
                      onChange={(e) => {
                        setFormData({...formData, email: e.target.value});
                        if (formErrors.email) setFormErrors({...formErrors, email: null});
                      }}
                      required
                      style={{ background: "rgba(255, 255, 255, 0.05)" }}
                    />
                    {formErrors.email && (
                      <small className="text-danger mt-1 d-block">{formErrors.email}</small>
                    )}
                  </div>

                  {/* Phone */}
                  <div className="mb-3">
                    <label className="form-label text-white-50">
                      <i className="fas fa-phone me-2 text-warning"></i>
                      Phone <span className="text-danger">*</span>
                    </label>
                    <input
                      type="tel"
                      className={`form-control bg-transparent text-white ${
                        formErrors.phoneNumber ? 'border-danger' : 'border-secondary'
                      }`}
                      value={formData.phoneNumber}
                      onChange={(e) => {
                        setFormData({...formData, phoneNumber: e.target.value});
                        if (formErrors.phoneNumber) setFormErrors({...formErrors, phoneNumber: null});
                      }}
                      required
                      style={{ background: "rgba(255, 255, 255, 0.05)" }}
                    />
                    {formErrors.phoneNumber && (
                      <small className="text-danger mt-1 d-block">{formErrors.phoneNumber}</small>
                    )}
                  </div>

                  {/* Password */}
                  <div className="mb-3">
                    <label className="form-label text-white-50">
                      <i className="fas fa-lock me-2 text-warning"></i>
                      Password <span className="text-danger">*</span>
                    </label>
                    <input
                      type="password"
                      className={`form-control bg-transparent text-white ${
                        formErrors.password ? 'border-danger' : 'border-secondary'
                      }`}
                      value={formData.password}
                      onChange={(e) => {
                        setFormData({...formData, password: e.target.value});
                        if (formErrors.password) setFormErrors({...formErrors, password: null});
                      }}
                      required
                      style={{ background: "rgba(255, 255, 255, 0.05)" }}
                    />
                    {formErrors.password && (
                      <small className="text-danger mt-1 d-block">{formErrors.password}</small>
                    )}
                  </div>

                  {/* Role */}
                  <div className="mb-3">
                    <label className="form-label text-white-50">
                      <i className="fas fa-user-tag me-2 text-warning"></i>
                      Role <span className="text-danger">*</span>
                    </label>
                    <select
                      className={`form-select bg-transparent text-white ${
                        formErrors.role ? 'border-danger' : 'border-secondary'
                      }`}
                      value={formData.role}
                      onChange={(e) => {
                        setFormData({...formData, role: e.target.value});
                        if (formErrors.role) setFormErrors({...formErrors, role: null});
                      }}
                      style={{ background: "rgba(255, 255, 255, 0.05)" }}
                    >
                      <option value="user" className="bg-dark">User</option>
                      <option value="photographer" className="bg-dark">Photographer</option>
                      <option value="admin" className="bg-dark">Admin</option>
                    </select>
                    {formErrors.role && (
                      <small className="text-danger mt-1 d-block">{formErrors.role}</small>
                    )}
                  </div>

                  {/* Active Status */}
                  <div className="mb-3">
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        role="switch"
                        id="activeSwitch"
                        checked={formData.active}
                        onChange={(e) => setFormData({...formData, active: e.target.checked})}
                      />
                      <label className="form-check-label text-white-50" htmlFor="activeSwitch">
                        <i className="fas fa-check-circle me-2 text-success"></i>
                        Active Account
                      </label>
                    </div>
                  </div>
                </div>
                <div className="card-footer bg-transparent border-warning border-opacity-25 p-4">
                  <div className="d-flex gap-2 justify-content-end">
                    <button
                      type="button"
                      className="btn btn-outline-secondary rounded-pill px-4"
                      onClick={() => {
                        setShowAddModal(false);
                        resetForm();
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-warning rounded-pill px-4"
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Adding...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-save me-2"></i>
                          Add User
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit User Modal */}
        {showEditModal && editingUser && (
          <div
            className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
            style={{
              background: "rgba(0, 0, 0, 0.8)",
              backdropFilter: "blur(5px)",
              zIndex: 1050,
            }}
            onClick={() => {
              setShowEditModal(false);
              setEditingUser(null);
              resetForm();
            }}
          >
            <div
              className="card bg-dark"
              style={{
                maxWidth: "500px",
                width: "90%",
                ...glassStyle,
                borderRadius: "24px",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="card-header bg-transparent border-warning border-opacity-25 d-flex justify-content-between align-items-center p-4">
                <h4 className="mb-0">
                  <i className="fas fa-edit me-2 text-warning"></i>
                  Edit User
                </h4>
                <button
                  className="btn-close btn-close-white"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingUser(null);
                    resetForm();
                  }}
                ></button>
              </div>
              <form onSubmit={handleEditUser}>
                <div className="card-body p-4">
                  <div className="text-center mb-4">
                    <div
                      className="rounded-circle d-inline-flex align-items-center justify-content-center p-3"
                      style={{
                        background: formData.role === "admin" 
                          ? "rgba(255, 193, 7, 0.2)"
                          : formData.role === "photographer"
                          ? "rgba(23, 162, 184, 0.2)"
                          : "rgba(40, 167, 69, 0.2)",
                        width: "80px",
                        height: "80px",
                      }}
                    >
                      <i className={`fas ${
                        formData.role === "admin" 
                          ? "fa-crown text-warning fa-3x"
                          : formData.role === "photographer"
                          ? "fa-camera text-info fa-3x"
                          : "fa-user text-success fa-3x"
                      }`}></i>
                    </div>
                  </div>

                  {/* Username */}
                  <div className="mb-3">
                    <label className="form-label text-white-50">
                      <i className="fas fa-user me-2 text-warning"></i>
                      Username <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className={`form-control bg-transparent text-white ${
                        formErrors.username ? 'border-danger' : 'border-secondary'
                      }`}
                      value={formData.username}
                      onChange={(e) => {
                        setFormData({...formData, username: e.target.value});
                        if (formErrors.username) setFormErrors({...formErrors, username: null});
                      }}
                      required
                      style={{ background: "rgba(255, 255, 255, 0.05)" }}
                    />
                    {formErrors.username && (
                      <small className="text-danger mt-1 d-block">{formErrors.username}</small>
                    )}
                  </div>

                  {/* Email */}
                  <div className="mb-3">
                    <label className="form-label text-white-50">
                      <i className="fas fa-envelope me-2 text-warning"></i>
                      Email <span className="text-danger">*</span>
                    </label>
                    <input
                      type="email"
                      className={`form-control bg-transparent text-white ${
                        formErrors.email ? 'border-danger' : 'border-secondary'
                      }`}
                      value={formData.email}
                      onChange={(e) => {
                        setFormData({...formData, email: e.target.value});
                        if (formErrors.email) setFormErrors({...formErrors, email: null});
                      }}
                      required
                      style={{ background: "rgba(255, 255, 255, 0.05)" }}
                    />
                    {formErrors.email && (
                      <small className="text-danger mt-1 d-block">{formErrors.email}</small>
                    )}
                  </div>

                  {/* Phone */}
                  <div className="mb-3">
                    <label className="form-label text-white-50">
                      <i className="fas fa-phone me-2 text-warning"></i>
                      Phone <span className="text-danger">*</span>
                    </label>
                    <input
                      type="tel"
                      className={`form-control bg-transparent text-white ${
                        formErrors.phoneNumber ? 'border-danger' : 'border-secondary'
                      }`}
                      value={formData.phoneNumber}
                      onChange={(e) => {
                        setFormData({...formData, phoneNumber: e.target.value});
                        if (formErrors.phoneNumber) setFormErrors({...formErrors, phoneNumber: null});
                      }}
                      required
                      style={{ background: "rgba(255, 255, 255, 0.05)" }}
                    />
                    {formErrors.phoneNumber && (
                      <small className="text-danger mt-1 d-block">{formErrors.phoneNumber}</small>
                    )}
                  </div>

                  {/* Password (Optional for edit) */}
                  <div className="mb-3">
                    <label className="form-label text-white-50">
                      <i className="fas fa-lock me-2 text-warning"></i>
                      New Password <span className="text-white-50 small">(leave blank to keep current)</span>
                    </label>
                    <input
                      type="password"
                      className="form-control bg-transparent text-white border-secondary"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      style={{ background: "rgba(255, 255, 255, 0.05)" }}
                    />
                  </div>

                  {/* Role */}
                  <div className="mb-3">
                    <label className="form-label text-white-50">
                      <i className="fas fa-user-tag me-2 text-warning"></i>
                      Role <span className="text-danger">*</span>
                    </label>
                    <select
                      className={`form-select bg-transparent text-white ${
                        formErrors.role ? 'border-danger' : 'border-secondary'
                      }`}
                      value={formData.role}
                      onChange={(e) => {
                        setFormData({...formData, role: e.target.value});
                        if (formErrors.role) setFormErrors({...formErrors, role: null});
                      }}
                      style={{ background: "rgba(255, 255, 255, 0.05)" }}
                    >
                      <option value="user" className="bg-dark">User</option>
                      <option value="photographer" className="bg-dark">Photographer</option>
                      <option value="admin" className="bg-dark">Admin</option>
                    </select>
                    {formErrors.role && (
                      <small className="text-danger mt-1 d-block">{formErrors.role}</small>
                    )}
                  </div>

                  {/* Active Status */}
                  <div className="mb-3">
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        role="switch"
                        id="editActiveSwitch"
                        checked={formData.active}
                        onChange={(e) => setFormData({...formData, active: e.target.checked})}
                      />
                      <label className="form-check-label text-white-50" htmlFor="editActiveSwitch">
                        <i className="fas fa-check-circle me-2 text-success"></i>
                        Active Account
                      </label>
                    </div>
                  </div>
                </div>
                <div className="card-footer bg-transparent border-warning border-opacity-25 p-4">
                  <div className="d-flex gap-2 justify-content-end">
                    <button
                      type="button"
                      className="btn btn-outline-secondary rounded-pill px-4"
                      onClick={() => {
                        setShowEditModal(false);
                        setEditingUser(null);
                        resetForm();
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-warning rounded-pill px-4"
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Updating...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-save me-2"></i>
                          Update User
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* User Details Modal */}
        {selectedUser && (
          <div
            className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
            style={{
              background: "rgba(0, 0, 0, 0.8)",
              backdropFilter: "blur(5px)",
              zIndex: 1050,
            }}
            onClick={() => setSelectedUser(null)}
          >
            <div
              className="card bg-dark"
              style={{
                maxWidth: "500px",
                width: "90%",
                ...glassStyle,
                borderRadius: "24px",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="card-header bg-transparent border-warning border-opacity-25 d-flex justify-content-between align-items-center p-4">
                <h4 className="mb-0">
                  <i className="fas fa-user me-2 text-warning"></i>
                  User Details
                </h4>
                <button
                  className="btn-close btn-close-white"
                  onClick={() => setSelectedUser(null)}
                ></button>
              </div>
              <div className="card-body p-4">
                <div className="text-center mb-4">
                  <div
                    className="rounded-circle d-inline-flex align-items-center justify-content-center p-3"
                    style={{
                      background: selectedUser.role === "admin" 
                        ? "rgba(255, 193, 7, 0.2)"
                        : selectedUser.role === "photographer"
                        ? "rgba(23, 162, 184, 0.2)"
                        : "rgba(40, 167, 69, 0.2)",
                      width: "100px",
                      height: "100px",
                    }}
                  >
                    <i className={`fas ${
                      selectedUser.role === "admin" 
                        ? "fa-crown text-warning fa-3x"
                        : selectedUser.role === "photographer"
                        ? "fa-camera text-info fa-3x"
                        : "fa-user text-success fa-3x"
                    }`}></i>
                  </div>
                  <h4 className="mt-3 mb-1">{selectedUser.username}</h4>
                  <p className="text-white-50 mb-2">{selectedUser.email}</p>
                  <span 
                    className="badge rounded-pill px-3 py-2"
                    style={{
                      background: selectedUser.active !== false 
                        ? "rgba(40, 167, 69, 0.2)" 
                        : "rgba(220, 53, 69, 0.2)",
                      color: selectedUser.active !== false ? "#28a745" : "#dc3545",
                      border: `1px solid ${
                        selectedUser.active !== false 
                          ? "rgba(40, 167, 69, 0.3)" 
                          : "rgba(220, 53, 69, 0.3)"
                      }`,
                    }}
                  >
                    <i className={`fas ${
                      selectedUser.active !== false ? "fa-check-circle" : "fa-ban"
                    } me-2`}></i>
                    {selectedUser.active !== false ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="row g-3">
                  <div className="col-6">
                    <div className="card bg-dark border-secondary p-3 text-center">
                      <small className="text-white-50 mb-1">Role</small>
                      <h5 className="text-warning mb-0">
                        <i className={`fas ${
                          selectedUser.role === "admin" 
                            ? "fa-crown"
                            : selectedUser.role === "photographer"
                            ? "fa-camera"
                            : "fa-user"
                        } me-2`}></i>
                        {selectedUser.role?.charAt(0).toUpperCase() + selectedUser.role?.slice(1)}
                      </h5>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="card bg-dark border-secondary p-3 text-center">
                      <small className="text-white-50 mb-1">Media Count</small>
                      <h5 className="text-info mb-0">
                        <i className="fas fa-image me-2"></i>
                        {selectedUser.mediaCount || 0}
                      </h5>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="card bg-dark border-secondary p-3 text-center">
                      <small className="text-white-50 mb-1">Earnings</small>
                      <h5 className="text-success mb-0">
                        <i className="fas fa-coins me-2"></i>
                        KES {selectedUser.earnings?.toLocaleString() || 0}
                      </h5>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="card bg-dark border-secondary p-3 text-center">
                      <small className="text-white-50 mb-1">Joined</small>
                      <h6 className="text-white mb-0">
                        <i className="fas fa-calendar me-2"></i>
                        {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString() : 'N/A'}
                      </h6>
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-3 rounded-3" style={{ background: "rgba(0,0,0,0.3)" }}>
                  <small className="text-white-50 d-block mb-2">
                    <i className="fas fa-fingerprint me-2"></i>
                    User ID: {selectedUser._id}
                  </small>
                  <small className="text-white-50 d-block">
                    <i className="fas fa-clock me-2"></i>
                    Last Updated: {selectedUser.updatedAt ? new Date(selectedUser.updatedAt).toLocaleString() : 'N/A'}
                  </small>
                </div>
              </div>
              <div className="card-footer bg-transparent border-warning border-opacity-25 p-4">
                <div className="d-flex gap-2 justify-content-end">
                  <button
                    className="btn btn-outline-warning rounded-pill px-4"
                    onClick={() => {
                      setSelectedUser(null);
                      openEditModal(selectedUser);
                    }}
                  >
                    <i className="fas fa-edit me-2"></i>
                    Edit User
                  </button>
                  <button
                    className="btn btn-secondary rounded-pill px-4"
                    onClick={() => setSelectedUser(null)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;