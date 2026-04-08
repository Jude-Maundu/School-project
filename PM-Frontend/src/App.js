import './App.css';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css'

// Public Pages
import Login from './Components/Pages/Login';
import Register from './Components/Pages/Register';
import AuthCallback from './Components/AuthCallback';

// Protected Route Component
import ProtectedRoute from './Components/ProtectedRoute';

// Admin Pages
import AdminDash from './Components/Pages/Admin/AdminDash';
import AdminMedia from './Components/Pages/Admin/AdminMedia';
import AdminUser from './Components/Pages/Admin/AdminUser';
import AdminReceipts from './Components/Pages/Admin/AdminReceipts';
import AdminRefunds from './Components/Pages/Admin/AdminRefunds';
import AdminSettings from './Components/Pages/Admin/AdminSettings';
import AdminAudit from './Components/Pages/Admin/AdminAudit';

// Photographer Pages
import PhotographerDash from './Components/Pages/Photographer/PhotographerDash';
import PhotographerEarnings from './Components/Pages/Photographer/Earnings';
import PhotographerMedia from './Components/Pages/Photographer/MyMedia';
import PhotographerProfile from './Components/Pages/Photographer/Profile';
import PhotographerSales from './Components/Pages/Photographer/SalesHistory';
import PhotographerUpload from './Components/Pages/Photographer/UploadMedia';
import PhotographerWithdrawals from './Components/Pages/Photographer/Withdrawals';

// BuyerPages 
import BuyerCart from './Components/Pages/Buyer/BuyerCart';
import BuyerDashboard from './Components/Pages/Buyer/BuyerDash';
import BuyerTransactions from './Components/Pages/Buyer/BuyerTransaction';
import BuyerDownloads from './Components/Pages/Buyer/BuyerDownloads';
import BuyerFavorites from './Components/Pages/Buyer/BuyerFavourite';
import BuyerProfile from './Components/Pages/Buyer/BuyerProfile';
import BuyerWallet from './Components/Pages/Buyer/BuyerWallet';
import BuyerExplore from './Components/Pages/Buyer/BuyerExplore';
import BuyerAlbumAccess from './Components/Pages/Buyer/BuyerAlbumAccess';
import MessagingPage from './Components/Pages/Messaging/MessagingPage';
import BuyerFollowPage from './Components/Pages/Buyer/BuyerFollowPage';
import PhotographerFollowPage from './Components/Pages/Photographer/PhotographerFollowPage';
import Explore from './Components/Pages/Explore';
import HomePage from './Components/Pages/HomePage';

function RouteWithBodyClass({ children }) {
  const location = useLocation();

  useEffect(() => {
    const clean = location.pathname.replace(/[:?&=/]+/g, '-').replace(/^-|-$/g, '') || 'home';
    document.body.className = `page-${clean}`;
    return () => {
      document.body.className = '';
    };
  }, [location]);

  return children;
}

function RoleLanding() {
  const token = localStorage.getItem('token');
  const role = String(localStorage.getItem('role') || '').toLowerCase();

  // If user is logged in, redirect to their dashboard
  if (token && role) {
    if (role.includes('admin')) return <Navigate to="/admin/dashboard" replace />;
    if (role.includes('photographer')) return <Navigate to="/photographer/dashboard" replace />;
    return <Navigate to="/buyer/dashboard" replace />;
  }
  
  // If not logged in, show the public explore page as landing
  return <Navigate to="/explore" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <RouteWithBodyClass>
        <Routes>
          {/* Public Routes - Landing Page */}
          <Route path='/' element={<HomePage />} />
          <Route path='/explore' element={<Explore />} />
          <Route path='/login' element={<Login />} />
          <Route path='/register' element={<Register />} />
          <Route path='/auth/google/callback' element={<AuthCallback />} />
          
          {/* Admin Routes */}
          <Route path='/admin/dashboard' element={<ProtectedRoute requiredRole="admin"><AdminDash /></ProtectedRoute>} />
          <Route path="/admin/media" element={<ProtectedRoute requiredRole="admin"><AdminMedia /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute requiredRole="admin"><AdminUser /></ProtectedRoute>} />
          <Route path="/admin/analytics" element={<ProtectedRoute requiredRole="admin"><AdminDash /></ProtectedRoute>} />
          <Route path="/admin/receipts" element={<ProtectedRoute requiredRole="admin"><AdminReceipts /></ProtectedRoute>} />
          <Route path="/admin/refunds" element={<ProtectedRoute requiredRole="admin"><AdminRefunds /></ProtectedRoute>} />
          <Route path="/admin/settings" element={<ProtectedRoute requiredRole="admin"><AdminSettings /></ProtectedRoute>} />
          <Route path="/admin/audit" element={<ProtectedRoute requiredRole="admin"><AdminAudit /></ProtectedRoute>} />
          
          {/* Photographer Routes */}
          <Route path='/photographer/dashboard' element={<ProtectedRoute requiredRole="photographer"><PhotographerDash /></ProtectedRoute>} />
          <Route path="/photographer/earnings" element={<ProtectedRoute requiredRole="photographer"><PhotographerEarnings /></ProtectedRoute>} />
          <Route path="/photographer/media" element={<ProtectedRoute requiredRole="photographer"><PhotographerMedia /></ProtectedRoute>} />
          <Route path="/photographer/profile" element={<ProtectedRoute requiredRole="photographer"><PhotographerProfile /></ProtectedRoute>} />
          <Route path="/photographer/sales" element={<ProtectedRoute requiredRole="photographer"><PhotographerSales /></ProtectedRoute>} />
          <Route path="/photographer/upload" element={<ProtectedRoute requiredRole="photographer"><PhotographerUpload /></ProtectedRoute>} />
          <Route path="/photographer/withdrawals" element={<ProtectedRoute requiredRole="photographer"><PhotographerWithdrawals /></ProtectedRoute>} />
          <Route path="/photographer/follow" element={<ProtectedRoute requiredRole="photographer"><PhotographerFollowPage /></ProtectedRoute>} />
          
          {/* Buyer Routes */}
          <Route path="/buyer/cart" element={<ProtectedRoute requiredRole="buyer"><BuyerCart /></ProtectedRoute>} />
          <Route path="/buyer/dashboard" element={<ProtectedRoute requiredRole="buyer"><BuyerDashboard /></ProtectedRoute>} />
          <Route path="/buyer/transactions" element={<ProtectedRoute requiredRole="buyer"><BuyerTransactions /></ProtectedRoute>} />
          <Route path="/buyer/downloads" element={<ProtectedRoute requiredRole="buyer"><BuyerDownloads /></ProtectedRoute>} />
          <Route path="/buyer/favorites" element={<ProtectedRoute requiredRole="buyer"><BuyerFavorites /></ProtectedRoute>} />
          <Route path="/buyer/profile" element={<ProtectedRoute requiredRole="buyer"><BuyerProfile /></ProtectedRoute>} />
          <Route path="/buyer/wallet" element={<ProtectedRoute requiredRole="buyer"><BuyerWallet /></ProtectedRoute>} />
          <Route path="/buyer/explore" element={<ProtectedRoute requiredRole="buyer"><BuyerExplore /></ProtectedRoute>} />
          <Route path="/buyer/follow" element={<ProtectedRoute requiredRole="buyer"><BuyerFollowPage /></ProtectedRoute>} />
          <Route path="/buyer/messages" element={<ProtectedRoute><MessagingPage /></ProtectedRoute>} />
          <Route path="/messages" element={<ProtectedRoute><MessagingPage /></ProtectedRoute>} />
          <Route path="/album/:albumId/access/:token" element={<ProtectedRoute requiredRole="buyer"><BuyerAlbumAccess /></ProtectedRoute>} />

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/explore" replace />} />
        </Routes>
      </RouteWithBodyClass>
    </BrowserRouter>
  );
}

export default App;