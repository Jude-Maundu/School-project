
import React, { useState, useEffect } from "react";
import BuyerLayout from "./BuyerLayout";
import { Link } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL, API_ENDPOINTS } from "../../../api/apiConfig";
import { getUserFollowers, getUserFollowing } from "../../../api/API";


const API = API_BASE_URL;

const BuyerProfile = () => {
  const [profile, setProfile] = useState({
    name: "",
    username: "",
    email: "",
    phone: "",
    location: "",
    bio: "",
    profilePicture: ""
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [stats, setStats] = useState({
    memberSince: "",
    totalPurchases: 0,
    totalSpent: 0
  });
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [followersLoading, setFollowersLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('edit');

  const token = localStorage.getItem("token");
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : {};
  const userId = user.id || user._id;
  
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  // Fetch wallet balance
  const fetchWalletBalance = async () => {
    if (!userId) return;
    
    try {
      const response = await axios.get(`${API}/payments/wallet/${userId}`, { headers });
      let balance = 0;
      if (typeof response.data === 'number') {
        balance = response.data;
      } else if (response.data?.balance !== undefined) {
        balance = response.data.balance;
      }
      setWalletBalance(balance || 0);
    } catch (err) {
      console.error("Error fetching wallet:", err);
    }
  };

  // Fetch followers
  const fetchFollowers = async () => {
    if (!userId) return;
    
    try {
      setFollowersLoading(true);
      const response = await getUserFollowers(userId);
      setFollowers(response.data.followers || []);
    } catch (err) {
      console.error("Error fetching followers:", err);
    } finally {
      setFollowersLoading(false);
    }
  };

  // Fetch following
  const fetchFollowing = async () => {
    if (!userId) return;
    
    try {
      setFollowersLoading(true);
      const response = await getUserFollowing(userId);
      setFollowing(response.data.following || []);
    } catch (err) {
      console.error("Error fetching following:", err);
    } finally {
      setFollowersLoading(false);
    }
  };

  // Load user data
  useEffect(() => {
    const loadUserFromServer = async () => {
      if (!userId) return;
      try {
        const res = await axios.get(API_ENDPOINTS.AUTH.GET_USER(userId), { headers, timeout: 10000 });
        const serverUser = res.data || {};
        const storedProfilePic = localStorage.getItem("profilePicture");
        const memberDate = localStorage.getItem("memberSince") || new Date().toISOString().split('T')[0];
        const purchases = localStorage.getItem("totalPurchases") || "0";
        const spent = localStorage.getItem("totalSpent") || "0";

        setProfile({
          name: serverUser.name || serverUser.username || user.name || user.username || "",
          username: serverUser.username || user.username || "",
          email: serverUser.email || user.email || "",
          phone: serverUser.phoneNumber || user.phoneNumber || user.phone || "",
          location: serverUser.location || user.location || "",
          bio: serverUser.bio || user.bio || "",
          profilePicture: storedProfilePic || serverUser.profilePicture || user.profilePicture || user.avatar || ""
        });

        setStats({
          memberSince: memberDate,
          totalPurchases: parseInt(purchases),
          totalSpent: parseInt(spent)
        });

        localStorage.setItem("user", JSON.stringify({ ...user, ...serverUser }));
      } catch (err) {
        console.log("Failed to fetch user profile from backend, falling back to localStorage", err);

        const storedProfilePic = localStorage.getItem("profilePicture");
        const memberDate = localStorage.getItem("memberSince") || new Date().toISOString().split('T')[0];
        const purchases = localStorage.getItem("totalPurchases") || "0";
        const spent = localStorage.getItem("totalSpent") || "0";

        setProfile({
          name: user.name || user.username || "",
          username: user.username || "",
          email: user.email || "",
          phone: user.phone || "",
          location: user.location || "",
          bio: user.bio || "",
          profilePicture: storedProfilePic || user.profilePicture || user.avatar || ""
        });

        setStats({
          memberSince: memberDate,
          totalPurchases: parseInt(purchases),
          totalSpent: parseInt(spent)
        });
      } finally {
        fetchWalletBalance();
        fetchFollowers();
        fetchFollowing();
        setLoading(false);
      }
    };

    loadUserFromServer();
  }, []);

  // Handle profile picture upload
  const handleProfilePictureUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5MB");
      return;
    }

    try {
      setUploading(true);
      setError(null);
      setImageError(false);
      
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64Image = reader.result;
        
        setProfile(prev => ({
          ...prev,
          profilePicture: base64Image
        }));
        
        localStorage.setItem("profilePicture", base64Image);
        
        const updatedUser = { ...user, profilePicture: base64Image };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        
        setSuccess("Profile picture updated!");
        setTimeout(() => setSuccess(null), 3000);
      };
      
    } catch (err) {
      console.error("Error uploading profile picture:", err);
      setError("Failed to upload profile picture");
    } finally {
      setUploading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const updatePayload = {
        username: profile.username || user.username,
        email: profile.email || user.email,
        phoneNumber: profile.phone || user.phoneNumber,
        profilePicture: profile.profilePicture || user.profilePicture,
        watermark: user.watermark || "",
        location: profile.location,
        bio: profile.bio,
      };

      // Update backend
      await axios.put(API_ENDPOINTS.AUTH.UPDATE_USER(userId), updatePayload, { headers });

      // Update local storage and UI state
      const updatedUser = { ...user, ...updatePayload, name: profile.name };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setProfile(prev => ({ ...prev, ...updatedUser }));

      setSuccess("Profile updated successfully!");
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      console.error("Error saving profile:", err);
      setError(err.response?.data?.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const handleImageError = () => {
    setImageError(true);
  };

  if (!token || !userId) {
    return (
      <BuyerLayout>
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
          <div className="text-center">
            <i className="fas fa-user-lock text-warning fa-4x mb-3"></i>
            <h4 className="text-white mb-3">Authentication Required</h4>
            <p className="text-white-50 mb-4">Please login to view your profile</p>
            <Link to="/login" className="btn btn-warning rounded-pill px-4">
              <i className="fas fa-sign-in-alt me-2"></i>
              Go to Login
            </Link>
          </div>
        </div>
      </BuyerLayout>
    );
  }

  if (loading) {
    return (
      <BuyerLayout>
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
          <div className="text-center">
            <div className="spinner-border text-warning mb-3" style={{ width: '3rem', height: '3rem' }}></div>
            <p className="text-white-50">Loading your profile...</p>
          </div>
        </div>
      </BuyerLayout>
    );
  }

  return (
    <BuyerLayout>
      <div className="buyer-profile-container container-fluid px-0">
        {/* Page Title */}
        <div className="mb-4">
          <h2 className="fw-bold mb-1">
            <i className="fas fa-user-circle me-2 text-warning"></i>
            My Profile
          </h2>
          <p className="text-white-50 mb-0">Manage your personal information and account settings</p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="alert alert-danger alert-dismissible fade show mb-4" role="alert">
            <i className="fas fa-exclamation-circle me-2"></i>
            {error}
            <button type="button" className="btn-close" onClick={() => setError(null)}></button>
          </div>
        )}
        
        {success && (
          <div className="alert alert-success alert-dismissible fade show mb-4" role="alert">
            <i className="fas fa-check-circle me-2"></i>
            {success}
            <button type="button" className="btn-close" onClick={() => setSuccess(null)}></button>
          </div>
        )}

        <div className="row">
          {/* Left Column - Profile Card & Wallet */}
          <div className="col-md-5 col-lg-4 mb-4">
            {/* Profile Card */}
            <div className="card bg-dark border-secondary mb-4">
              <div className="card-body text-center p-4">
                {/* Profile Picture */}
                <div className="position-relative d-inline-block mb-3">
                  {profile.profilePicture && !imageError ? (
                    <img 
                      src={profile.profilePicture}
                      alt={profile.name || "Profile"}
                      className="rounded-circle border border-2 border-warning"
                      style={{ 
                        width: "120px", 
                        height: "120px", 
                        objectFit: "cover"
                      }}
                      onError={handleImageError}
                    />
                  ) : (
                    <div 
                      className="rounded-circle bg-secondary d-flex align-items-center justify-content-center"
                      style={{ width: "120px", height: "120px" }}
                    >
                      <i className="fas fa-user-circle fa-5x text-warning"></i>
                    </div>
                  )}
                  
                  <label 
                    htmlFor="profile-picture-upload"
                    className="position-absolute bottom-0 end-0 btn btn-sm btn-warning rounded-circle p-2"
                    style={{ 
                      width: "36px", 
                      height: "36px", 
                      cursor: "pointer"
                    }}
                  >
                    {uploading ? (
                      <span className="spinner-border spinner-border-sm"></span>
                    ) : (
                      <i className="fas fa-camera"></i>
                    )}
                    <input
                      id="profile-picture-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePictureUpload}
                      style={{ display: "none" }}
                      disabled={uploading}
                    />
                  </label>
                </div>
                
                {/* User Info */}
                <h5 className="fw-bold mb-1">{profile.name || profile.username || "Buyer"}</h5>
                <p className="text-white-50 small mb-2">{profile.email}</p>
                
                {profile.location && (
                  <p className="text-white-50 small mb-2">
                    <i className="fas fa-map-marker-alt me-1 text-warning"></i>
                    {profile.location}
                  </p>
                )}
                
                {profile.bio && (
                  <div className="mt-3 p-2 rounded bg-dark bg-opacity-50">
                    <p className="small text-white-50 mb-0">{profile.bio}</p>
                  </div>
                )}
              </div>
              
              {/* Stats */}
              <div className="card-footer bg-transparent border-secondary p-3">
                <div className="row text-center">
                  <div className="col-4">
                    <div className="text-warning fw-bold fs-5">{stats.totalPurchases}</div>
                    <small className="text-white-50">Purchases</small>
                  </div>
                  <div className="col-4">
                    <div className="text-warning fw-bold fs-5">KES {stats.totalSpent.toLocaleString()}</div>
                    <small className="text-white-50">Spent</small>
                  </div>
                  <div className="col-4">
                    <div className="text-warning fw-bold fs-5">
                      {new Date(stats.memberSince).toLocaleDateString('en-KE', { month: 'short', year: 'numeric' })}
                    </div>
                    <small className="text-white-50">Joined</small>
                  </div>
                </div>
              </div>
            </div>

            {/* Wallet Card */}
            <div className="card bg-dark border-warning">
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="text-white-50 mb-1">Wallet Balance</h6>
                    <h3 className="text-warning fw-bold mb-0">KES {walletBalance.toLocaleString()}</h3>
                  </div>
                  <div className="rounded-circle p-3 bg-warning bg-opacity-10">
                    <i className="fas fa-wallet text-warning fa-2x"></i>
                  </div>
                </div>
                <Link to="/buyer/wallet" className="btn btn-outline-warning w-100 mt-3 rounded-pill">
                  <i className="fas fa-arrow-right me-2"></i>
                  Manage Wallet
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column - Edit Profile Form */}
          <div className="col-md-7 col-lg-8">
            <div className="card bg-dark border-secondary">
              <div className="card-header bg-transparent border-secondary p-4">
                <h5 className="fw-bold mb-0">
                  <i className="fas fa-edit me-2 text-warning"></i>
                  Personal Information
                </h5>
                <small className="text-white-50">Update your profile details</small>
              </div>
              
              <div className="card-body p-4">
                <form onSubmit={handleSubmit}>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label text-white-50 small">
                        <i className="fas fa-user me-2 text-warning"></i>
                        Full Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        className="form-control bg-dark border-secondary text-white"
                        value={profile.name}
                        onChange={handleChange}
                        placeholder="Enter your full name"
                      />
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label text-white-50 small">
                        <i className="fas fa-user-tag me-2 text-warning"></i>
                        Username
                      </label>
                      <input
                        type="text"
                        className="form-control bg-dark border-secondary text-white"
                        value={profile.username}
                        disabled
                      />
                      <small className="text-white-50">Username cannot be changed</small>
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label text-white-50 small">
                        <i className="fas fa-envelope me-2 text-warning"></i>
                        Email Address
                      </label>
                      <input
                        type="email"
                        className="form-control bg-dark border-secondary text-white"
                        value={profile.email}
                        disabled
                      />
                      <small className="text-white-50">Email cannot be changed</small>
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label text-white-50 small">
                        <i className="fas fa-phone me-2 text-warning"></i>
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        className="form-control bg-dark border-secondary text-white"
                        value={profile.phone}
                        onChange={handleChange}
                        placeholder="Enter your phone number"
                      />
                    </div>

                    <div className="col-12 mb-3">
                      <label className="form-label text-white-50 small">
                        <i className="fas fa-map-marker-alt me-2 text-warning"></i>
                        Location
                      </label>
                      <input
                        type="text"
                        name="location"
                        className="form-control bg-dark border-secondary text-white"
                        value={profile.location}
                        onChange={handleChange}
                        placeholder="Enter your city/country"
                      />
                    </div>

                    <div className="col-12 mb-4">
                      <label className="form-label text-white-50 small">
                        <i className="fas fa-align-left me-2 text-warning"></i>
                        Bio
                      </label>
                      <textarea
                        name="bio"
                        className="form-control bg-dark border-secondary text-white"
                        rows="3"
                        value={profile.bio}
                        onChange={handleChange}
                        placeholder="Tell us about yourself..."
                      ></textarea>
                    </div>

                    <div className="col-12">
                      <button 
                        type="submit" 
                        className="btn btn-warning px-5 rounded-pill"
                        disabled={saving}
                      >
                        {saving ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2"></span>
                            Saving...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-save me-2"></i>
                            Save Changes
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>

            {/* Followers & Following */}
            <div className="card bg-dark border-secondary mt-4">
              <div className="card-header bg-transparent border-secondary p-4">
                <h5 className="fw-bold mb-0">
                  <i className="fas fa-users me-2 text-warning"></i>
                  Social Network
                </h5>
                <small className="text-white-50">Your followers and people you follow</small>
              </div>
              
              <div className="card-body p-0">
                {/* Tabs */}
                <ul className="nav nav-tabs bg-dark border-bottom border-secondary" id="socialTabs" role="tablist">
                  <li className="nav-item" role="presentation">
                    <button 
                      className={`nav-link ${activeTab === 'followers' ? 'active text-warning' : 'text-white-50'}`}
                      onClick={() => setActiveTab('followers')}
                      type="button"
                    >
                      <i className="fas fa-user-friends me-2"></i>
                      Followers ({followers.length})
                    </button>
                  </li>
                  <li className="nav-item" role="presentation">
                    <button 
                      className={`nav-link ${activeTab === 'following' ? 'active text-warning' : 'text-white-50'}`}
                      onClick={() => setActiveTab('following')}
                      type="button"
                    >
                      <i className="fas fa-user-plus me-2"></i>
                      Following ({following.length})
                    </button>
                  </li>
                </ul>

                {/* Tab Content */}
                <div className="tab-content p-4">
                  {activeTab === 'followers' && (
                    <div className="tab-pane fade show active">
                      {followersLoading ? (
                        <div className="text-center py-4">
                          <div className="spinner-border text-warning"></div>
                          <p className="text-white-50 mt-2">Loading followers...</p>
                        </div>
                      ) : followers.length === 0 ? (
                        <div className="text-center py-4">
                          <i className="fas fa-user-friends text-white-50 fa-3x mb-3"></i>
                          <p className="text-white-50">No followers yet</p>
                          <small className="text-white-50">Share your profile to gain followers!</small>
                        </div>
                      ) : (
                        <div className="row g-3">
                          {followers.map((user) => (
                            <div key={user._id} className="col-md-6">
                              <div className="d-flex align-items-center p-3 rounded bg-dark bg-opacity-50 border border-secondary">
                                <img 
                                  src={user.profilePicture || '/default-avatar.png'}
                                  alt={user.username}
                                  className="rounded-circle me-3"
                                  style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                                  onError={(e) => { e.target.src = '/default-avatar.png'; }}
                                />
                                <div className="flex-grow-1">
                                  <h6 className="text-white mb-0 fw-bold">{user.username}</h6>
                                  <small className="text-white-50">{user.email}</small>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'following' && (
                    <div className="tab-pane fade show active">
                      {followersLoading ? (
                        <div className="text-center py-4">
                          <div className="spinner-border text-warning"></div>
                          <p className="text-white-50 mt-2">Loading following...</p>
                        </div>
                      ) : following.length === 0 ? (
                        <div className="text-center py-4">
                          <i className="fas fa-user-plus text-white-50 fa-3x mb-3"></i>
                          <p className="text-white-50">Not following anyone yet</p>
                          <small className="text-white-50">Follow photographers to see their latest work!</small>
                        </div>
                      ) : (
                        <div className="row g-3">
                          {following.map((user) => (
                            <div key={user._id} className="col-md-6">
                              <div className="d-flex align-items-center p-3 rounded bg-dark bg-opacity-50 border border-secondary">
                                <img 
                                  src={user.profilePicture || '/default-avatar.png'}
                                  alt={user.username}
                                  className="rounded-circle me-3"
                                  style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                                  onError={(e) => { e.target.src = '/default-avatar.png'; }}
                                />
                                <div className="flex-grow-1">
                                  <h6 className="text-white mb-0 fw-bold">{user.username}</h6>
                                  <small className="text-white-50">{user.email}</small>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Account Actions */}
            <div className="card bg-dark border-secondary mt-4">
              <div className="card-body p-4">
                <h6 className="fw-bold mb-3">
                  <i className="fas fa-cog me-2 text-warning"></i>
                  Account Actions
                </h6>
                <div className="d-flex gap-3 flex-wrap">
                  <Link to="/buyer/transactions" className="btn btn-outline-info rounded-pill px-4">
                    <i className="fas fa-history me-2"></i>
                    Transaction History
                  </Link>
                  <button className="btn btn-outline-secondary rounded-pill px-4">
                    <i className="fas fa-download me-2"></i>
                    Export Data
                  </button>
                  <button className="btn btn-outline-danger rounded-pill px-4">
                    <i className="fas fa-shield-alt me-2"></i>
                    Privacy Settings
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </BuyerLayout>
  );
};

export default BuyerProfile;