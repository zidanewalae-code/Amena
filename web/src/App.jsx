import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProductsPage from './pages/ProductsPage';
import AlertsPage from './pages/AlertsPage';
import DashboardPage from './pages/DashboardPage';
import OrdersPage from './pages/OrdersPage';
import DonationsPage from './pages/DonationsPage';
import ProfilePage from './pages/ProfilePage';
import PaymentsPage from './pages/PaymentsPage';
import HistoryPage from './pages/HistoryPage';
import ProtectedRoute from './components/ProtectedRoute';
import { getDashboardPath, getPageAccess, roles } from './lib/access';
import { useAuth } from './lib/auth';

function DashboardRedirect() {
  const { user } = useAuth();

  return <Navigate to={getDashboardPath(user?.role)} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/products"
        element={
          <ProtectedRoute roles={getPageAccess('products')}>
            <ProductsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/donations"
        element={
          <ProtectedRoute roles={getPageAccess('donations')}>
            <DonationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/orders"
        element={
          <ProtectedRoute roles={getPageAccess('orders')}>
            <OrdersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/alerts"
        element={
          <ProtectedRoute roles={getPageAccess('alerts')}>
            <AlertsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/payments"
        element={
          <ProtectedRoute roles={getPageAccess('payments')}>
            <PaymentsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/history"
        element={
          <ProtectedRoute roles={getPageAccess('history')}>
            <HistoryPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute roles={roles}>
            <ProfilePage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute roles={roles}>
            <DashboardRedirect />
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard/admin"
        element={
          <ProtectedRoute roles={[ 'admin' ]}>
            <DashboardPage role="admin" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/donator"
        element={
          <ProtectedRoute roles={[ 'donator' ]}>
            <DashboardPage role="donator" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/organization"
        element={
          <ProtectedRoute roles={[ 'organization' ]}>
            <DashboardPage role="organization" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/delivery-person"
        element={
          <ProtectedRoute roles={[ 'delivery_person' ]}>
            <DashboardPage role="delivery_person" />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}