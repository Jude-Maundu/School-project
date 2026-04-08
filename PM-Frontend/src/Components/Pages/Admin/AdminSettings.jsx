import React, { useState, useEffect, useMemo, useCallback } from "react";
import AdminLayout from "./AdminLayout";
import axios from "axios";
import { API_ENDPOINTS } from "../../../api/apiConfig";

const SETTINGS_API_AVAILABLE = true; // Backend implements /admin/settings routes (check backend docs or README)

const AdminSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  const [settings, setSettings] = useState({
    siteName: "PhotoMarket",
    siteUrl: "https://pm-frontend-1-u2y3.onrender.com",
    adminEmail: "",
    platformFee: 30,
    minPayout: 1000,
    maxUploadSize: 10,
    allowedFormats: ["jpg", "jpeg", "png", "gif", "mp4", "webm"],
    requireApproval: true,
    autoPublish: false,
    enableMpesa: true,
    enableWallet: true,
    maintenanceMode: false,
    registrationOpen: true,
    emailVerification: false,
    smtpHost: "",
    smtpPort: 587,
    smtpUser: "",
    smtpPass: "",
    razorpayKey: "",
    stripeKey: "",
  });

  const [activeTab, setActiveTab] = useState("general");
  
  const token = localStorage.getItem("token");
  const headers = useMemo(() => ({ Authorization: token ? `Bearer ${token}` : "" }), [token]);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(API_ENDPOINTS.ADMIN.SETTINGS, { headers });
      if (response?.data) {
        setSettings((prev) => ({ ...prev, ...response.data }));
      }
    } catch (err) {
      console.warn("Unable to load admin settings:", err);
      setError("Could not load settings. Please ensure the backend supports /admin/settings.");
    } finally {
      setLoading(false);
    }
  }, [headers]);

  // Save settings
  const handleSave = async () => {
    if (!SETTINGS_API_AVAILABLE) {
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      await axios.put(API_ENDPOINTS.ADMIN.UPDATE_SETTINGS, settings, { headers });
      
      setSuccess("Settings saved successfully!");
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Error saving settings:", err);
      setError(err.response?.data?.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  // Update platform fee
  const handleUpdatePlatformFee = async () => {
    if (!SETTINGS_API_AVAILABLE) {
      return;
    }

    try {
      setSaving(true);
      await axios.put(API_ENDPOINTS.ADMIN.PLATFORM_FEE, {
        fee: settings.platformFee
      }, { headers });
      
      setSuccess("Platform fee updated!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError("Failed to update platform fee");
    } finally {
      setSaving(false);
    }
  };

  // Update payout settings
  const handleUpdatePayoutSettings = async () => {
    if (!SETTINGS_API_AVAILABLE) {
      return;
    }

    try {
      setSaving(true);
      await axios.put(API_ENDPOINTS.ADMIN.PAYOUT, {
        minPayout: settings.minPayout
      }, { headers });
      
      setSuccess("Payout settings updated!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError("Failed to update payout settings");
    } finally {
      setSaving(false);
    }
  };

  // Test email configuration
  const handleTestEmail = async () => {
    if (!SETTINGS_API_AVAILABLE) {
      return;
    }

    try {
      setSaving(true);
      await axios.post(API_ENDPOINTS.ADMIN.TEST_EMAIL, {
        to: settings.adminEmail,
        smtpHost: settings.smtpHost,
        smtpPort: settings.smtpPort,
        smtpUser: settings.smtpUser,
        smtpPass: settings.smtpPass
      }, { headers });
      
      alert("Test email sent successfully!");
    } catch (err) {
      alert("Failed to send test email");
    } finally {
      setSaving(false);
    }
  };

  // Clear cache
  const handleClearCache = async () => {
    if (!SETTINGS_API_AVAILABLE) {
      return;
    }

    if (!window.confirm("Are you sure you want to clear the cache?")) return;
    
    try {
      await axios.post(API_ENDPOINTS.ADMIN.CLEAR_CACHE, {}, { headers });
      alert("Cache cleared successfully!");
    } catch (err) {
      alert("Failed to clear cache");
    }
  };

  // Toggle maintenance mode
  const handleToggleMaintenance = async () => {
    if (!SETTINGS_API_AVAILABLE) {
      return;
    }

    try {
      const newMode = !settings.maintenanceMode;
      await axios.post(API_ENDPOINTS.ADMIN.MAINTENANCE_MODE, {
        enabled: newMode
      }, { headers });
      
      setSettings({ ...settings, maintenanceMode: newMode });
      setSuccess(`Maintenance mode ${newMode ? 'enabled' : 'disabled'}`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError("Failed to toggle maintenance mode");
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  if (loading) {
    return (
      <AdminLayout>
        <div className="text-center py-5">
          <div className="spinner-border text-warning" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold">
          <i className="fas fa-cog me-2 text-warning"></i>
          System Settings
        </h4>
        <div className="d-flex gap-2">
          <button 
            className="btn btn-outline-warning"
            onClick={handleClearCache}
            disabled={!SETTINGS_API_AVAILABLE}
          >
            <i className="fas fa-broom me-2"></i>
            Clear Cache
          </button>
          <button 
            className="btn btn-warning"
            onClick={handleSave}
            disabled={saving || !SETTINGS_API_AVAILABLE}
          >
            {saving ? (
              <>
                <span className="spinner-border spinner-border-sm me-2"></span>
                Saving...
              </>
            ) : (
              <>
                <i className="fas fa-save me-2"></i>
                Save All
              </>
            )}
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <i className="fas fa-exclamation-circle me-2"></i>
          {error}
          <button type="button" className="btn-close" onClick={() => setError(null)}></button>
        </div>
      )}
      
      {success && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          <i className="fas fa-check-circle me-2"></i>
          {success}
          <button type="button" className="btn-close" onClick={() => setSuccess(null)}></button>
        </div>
      )}

      {!SETTINGS_API_AVAILABLE && (
        <div className="alert alert-info" role="alert">
          <i className="fas fa-info-circle me-2"></i>
          Settings management endpoints are not available on the backend, so changes can’t be saved.
        </div>
      )}

      {/* Tabs */}
      <ul className="nav nav-tabs border-secondary mb-4">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'general' ? 'active bg-dark text-warning' : 'text-white-50'}`}
            onClick={() => setActiveTab('general')}
            style={{ background: activeTab === 'general' ? '#1a1a1a' : 'transparent', borderColor: '#495057' }}
          >
            <i className="fas fa-globe me-2"></i>
            General
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'payment' ? 'active bg-dark text-warning' : 'text-white-50'}`}
            onClick={() => setActiveTab('payment')}
            style={{ background: activeTab === 'payment' ? '#1a1a1a' : 'transparent', borderColor: '#495057' }}
          >
            <i className="fas fa-credit-card me-2"></i>
            Payment
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'upload' ? 'active bg-dark text-warning' : 'text-white-50'}`}
            onClick={() => setActiveTab('upload')}
            style={{ background: activeTab === 'upload' ? '#1a1a1a' : 'transparent', borderColor: '#495057' }}
          >
            <i className="fas fa-upload me-2"></i>
            Upload
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'email' ? 'active bg-dark text-warning' : 'text-white-50'}`}
            onClick={() => setActiveTab('email')}
            style={{ background: activeTab === 'email' ? '#1a1a1a' : 'transparent', borderColor: '#495057' }}
          >
            <i className="fas fa-envelope me-2"></i>
            Email
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'security' ? 'active bg-dark text-warning' : 'text-white-50'}`}
            onClick={() => setActiveTab('security')}
            style={{ background: activeTab === 'security' ? '#1a1a1a' : 'transparent', borderColor: '#495057' }}
          >
            <i className="fas fa-shield-alt me-2"></i>
            Security
          </button>
        </li>
      </ul>

      {/* General Settings Tab */}
      {activeTab === 'general' && (
        <div className="row">
          <div className="col-md-6">
            <div className="card bg-dark border-secondary mb-4">
              <div className="card-header bg-transparent border-secondary">
                <h6 className="mb-0 text-warning">Site Information</h6>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <label className="form-label text-white-50">Site Name</label>
                  <input
                    type="text"
                    className="form-control bg-dark border-secondary text-white"
                    value={settings.siteName}
                    onChange={(e) => setSettings({...settings, siteName: e.target.value})}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label text-white-50">Site URL</label>
                  <input
                    type="text"
                    className="form-control bg-dark border-secondary text-white"
                    value={settings.siteUrl}
                    onChange={(e) => setSettings({...settings, siteUrl: e.target.value})}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label text-white-50">Admin Email</label>
                  <input
                    type="email"
                    className="form-control bg-dark border-secondary text-white"
                    value={settings.adminEmail}
                    onChange={(e) => setSettings({...settings, adminEmail: e.target.value})}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-6">
            <div className="card bg-dark border-secondary mb-4">
              <div className="card-header bg-transparent border-secondary">
                <h6 className="mb-0 text-warning">System Status</h6>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="maintenanceMode"
                      checked={settings.maintenanceMode}
                      onChange={handleToggleMaintenance}
                    />
                    <label className="form-check-label text-white-50" htmlFor="maintenanceMode">
                      Maintenance Mode
                    </label>
                    <small className="d-block text-white-50 mt-1">
                      When enabled, only admins can access the site
                    </small>
                  </div>
                </div>
                <div className="mb-3">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="registrationOpen"
                      checked={settings.registrationOpen}
                      onChange={(e) => setSettings({...settings, registrationOpen: e.target.checked})}
                    />
                    <label className="form-check-label text-white-50" htmlFor="registrationOpen">
                      Allow New Registrations
                    </label>
                  </div>
                </div>
                <div className="mb-3">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="emailVerification"
                      checked={settings.emailVerification}
                      onChange={(e) => setSettings({...settings, emailVerification: e.target.checked})}
                    />
                    <label className="form-check-label text-white-50" htmlFor="emailVerification">
                      Require Email Verification
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Settings Tab */}
      {activeTab === 'payment' && (
        <div className="row">
          <div className="col-md-6">
            <div className="card bg-dark border-secondary mb-4">
              <div className="card-header bg-transparent border-secondary">
                <h6 className="mb-0 text-warning">Platform Fees</h6>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <label className="form-label text-white-50">Platform Fee (%)</label>
                  <div className="input-group">
                    <input
                      type="number"
                      className="form-control bg-dark border-secondary text-white"
                      value={settings.platformFee}
                      onChange={(e) => setSettings({...settings, platformFee: e.target.value})}
                      min="0"
                      max="100"
                    />
                    <button 
                      className="btn btn-outline-warning"
                      onClick={handleUpdatePlatformFee}
                      disabled={saving || !SETTINGS_API_AVAILABLE}
                    >
                      Update
                    </button>
                  </div>
                  <small className="text-white-50">Percentage taken from each sale</small>
                </div>
                <div className="mb-3">
                  <label className="form-label text-white-50">Minimum Payout (KES)</label>
                  <div className="input-group">
                    <input
                      type="number"
                      className="form-control bg-dark border-secondary text-white"
                      value={settings.minPayout}
                      onChange={(e) => setSettings({...settings, minPayout: e.target.value})}
                      min="100"
                    />
                    <button 
                      className="btn btn-outline-warning"
                      onClick={handleUpdatePayoutSettings}
                      disabled={saving || !SETTINGS_API_AVAILABLE}
                    >
                      Update
                    </button>
                  </div>
                  <small className="text-white-50">Minimum amount photographers can withdraw</small>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-6">
            <div className="card bg-dark border-secondary mb-4">
              <div className="card-header bg-transparent border-secondary">
                <h6 className="mb-0 text-warning">Payment Methods</h6>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="enableMpesa"
                      checked={settings.enableMpesa}
                      onChange={(e) => setSettings({...settings, enableMpesa: e.target.checked})}
                    />
                    <label className="form-check-label text-white-50" htmlFor="enableMpesa">
                      Enable M-Pesa Payments
                    </label>
                  </div>
                </div>
                <div className="mb-3">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="enableWallet"
                      checked={settings.enableWallet}
                      onChange={(e) => setSettings({...settings, enableWallet: e.target.checked})}
                    />
                    <label className="form-check-label text-white-50" htmlFor="enableWallet">
                      Enable Wallet System
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="card bg-dark border-secondary">
              <div className="card-header bg-transparent border-secondary">
                <h6 className="mb-0 text-warning">Payment Gateway Keys</h6>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <label className="form-label text-white-50">Razorpay Key</label>
                  <input
                    type="text"
                    className="form-control bg-dark border-secondary text-white"
                    value={settings.razorpayKey}
                    onChange={(e) => setSettings({...settings, razorpayKey: e.target.value})}
                    placeholder="rzp_test_..."
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label text-white-50">Stripe Public Key</label>
                  <input
                    type="text"
                    className="form-control bg-dark border-secondary text-white"
                    value={settings.stripeKey}
                    onChange={(e) => setSettings({...settings, stripeKey: e.target.value})}
                    placeholder="pk_test_..."
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Settings Tab */}
      {activeTab === 'upload' && (
        <div className="row">
          <div className="col-md-6">
            <div className="card bg-dark border-secondary mb-4">
              <div className="card-header bg-transparent border-secondary">
                <h6 className="mb-0 text-warning">Upload Limits</h6>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <label className="form-label text-white-50">Max Upload Size (MB)</label>
                  <input
                    type="number"
                    className="form-control bg-dark border-secondary text-white"
                    value={settings.maxUploadSize}
                    onChange={(e) => setSettings({...settings, maxUploadSize: e.target.value})}
                    min="1"
                    max="100"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-6">
            <div className="card bg-dark border-secondary mb-4">
              <div className="card-header bg-transparent border-secondary">
                <h6 className="mb-0 text-warning">File Formats</h6>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <label className="form-label text-white-50">Allowed Formats</label>
                  <input
                    type="text"
                    className="form-control bg-dark border-secondary text-white"
                    value={settings.allowedFormats.join(", ")}
                    onChange={(e) => setSettings({...settings, allowedFormats: e.target.value.split(",").map(f => f.trim())})}
                    placeholder="jpg, png, mp4"
                  />
                  <small className="text-white-50">Comma separated values</small>
                </div>
                <div className="mb-3">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="requireApproval"
                      checked={settings.requireApproval}
                      onChange={(e) => setSettings({...settings, requireApproval: e.target.checked})}
                    />
                    <label className="form-check-label text-white-50" htmlFor="requireApproval">
                      Require Admin Approval
                    </label>
                  </div>
                </div>
                <div className="mb-3">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="autoPublish"
                      checked={settings.autoPublish}
                      onChange={(e) => setSettings({...settings, autoPublish: e.target.checked})}
                    />
                    <label className="form-check-label text-white-50" htmlFor="autoPublish">
                      Auto-Publish Uploads
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Email Settings Tab */}
      {activeTab === 'email' && (
        <div className="row">
          <div className="col-md-6">
            <div className="card bg-dark border-secondary mb-4">
              <div className="card-header bg-transparent border-secondary">
                <h6 className="mb-0 text-warning">SMTP Configuration</h6>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <label className="form-label text-white-50">SMTP Host</label>
                  <input
                    type="text"
                    className="form-control bg-dark border-secondary text-white"
                    value={settings.smtpHost}
                    onChange={(e) => setSettings({...settings, smtpHost: e.target.value})}
                    placeholder="smtp.gmail.com"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label text-white-50">SMTP Port</label>
                  <input
                    type="number"
                    className="form-control bg-dark border-secondary text-white"
                    value={settings.smtpPort}
                    onChange={(e) => setSettings({...settings, smtpPort: e.target.value})}
                    placeholder="587"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label text-white-50">SMTP Username</label>
                  <input
                    type="text"
                    className="form-control bg-dark border-secondary text-white"
                    value={settings.smtpUser}
                    onChange={(e) => setSettings({...settings, smtpUser: e.target.value})}
                    placeholder="user@example.com"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label text-white-50">SMTP Password</label>
                  <input
                    type="password"
                    className="form-control bg-dark border-secondary text-white"
                    value={settings.smtpPass}
                    onChange={(e) => setSettings({...settings, smtpPass: e.target.value})}
                    placeholder="••••••••"
                  />
                </div>
                <button 
                  className="btn btn-outline-warning"
                  onClick={handleTestEmail}
                  disabled={saving || !SETTINGS_API_AVAILABLE}
                >
                  <i className="fas fa-paper-plane me-2"></i>
                  Test Email
                </button>
              </div>
            </div>
          </div>

          <div className="col-md-6">
            <div className="card bg-dark border-secondary">
              <div className="card-header bg-transparent border-secondary">
                <h6 className="mb-0 text-warning">Email Templates</h6>
              </div>
              <div className="card-body">
                <p className="text-white-50">Manage email templates sent to users</p>
                <div className="list-group list-group-flush bg-dark">
                  <div className="list-group-item bg-transparent text-white border-secondary d-flex justify-content-between align-items-center">
                    <span>Welcome Email</span>
                    <button className="btn btn-sm btn-outline-warning">Edit</button>
                  </div>
                  <div className="list-group-item bg-transparent text-white border-secondary d-flex justify-content-between align-items-center">
                    <span>Password Reset</span>
                    <button className="btn btn-sm btn-outline-warning">Edit</button>
                  </div>
                  <div className="list-group-item bg-transparent text-white border-secondary d-flex justify-content-between align-items-center">
                    <span>Purchase Confirmation</span>
                    <button className="btn btn-sm btn-outline-warning">Edit</button>
                  </div>
                  <div className="list-group-item bg-transparent text-white border-secondary d-flex justify-content-between align-items-center">
                    <span>Withdrawal Notification</span>
                    <button className="btn btn-sm btn-outline-warning">Edit</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Security Settings Tab */}
      {activeTab === 'security' && (
        <div className="row">
          <div className="col-md-6">
            <div className="card bg-dark border-secondary mb-4">
              <div className="card-header bg-transparent border-secondary">
                <h6 className="mb-0 text-warning">Security Options</h6>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <label className="form-label text-white-50">Session Timeout (minutes)</label>
                  <input
                    type="number"
                    className="form-control bg-dark border-secondary text-white"
                    value={30}
                    min="5"
                    max="120"
                  />
                </div>
                <div className="mb-3">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="twoFactorAuth"
                      defaultChecked={false}
                    />
                    <label className="form-check-label text-white-50" htmlFor="twoFactorAuth">
                      Require Two-Factor Authentication for Admins
                    </label>
                  </div>
                </div>
                <div className="mb-3">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="httpsOnly"
                      defaultChecked={true}
                    />
                    <label className="form-check-label text-white-50" htmlFor="httpsOnly">
                      HTTPS Only (Force SSL)
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-6">
            <div className="card bg-dark border-secondary">
              <div className="card-header bg-transparent border-secondary">
                <h6 className="mb-0 text-warning">API Security</h6>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <label className="form-label text-white-50">API Rate Limit (requests/minute)</label>
                  <input
                    type="number"
                    className="form-control bg-dark border-secondary text-white"
                    value={60}
                    min="10"
                    max="1000"
                  />
                </div>
                <button className="btn btn-outline-danger">
                  <i className="fas fa-key me-2"></i>
                  Rotate API Keys
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminSettings;