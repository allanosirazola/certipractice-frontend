import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth.jsx';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import Overview from './pages/Overview.jsx';
import Trends from './pages/Trends.jsx';
import Questions from './pages/Questions.jsx';
import Users from './pages/Users.jsx';
import Funnel from './pages/Funnel.jsx';
import Alerts from './pages/Alerts.jsx';
import NotFound from './pages/NotFound.jsx';

function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="text-sm text-neutral-500">Loading…</div>
      </div>
    );
  }
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Overview />} />
        <Route path="trends" element={<Trends />} />
        <Route path="questions" element={<Questions />} />
        <Route path="users" element={<Users />} />
        <Route path="funnel" element={<Funnel />} />
        <Route path="alerts" element={<Alerts />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
