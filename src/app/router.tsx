import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { PublicQueuePage } from '../pages/public/QueuePage';
import { JoinPage } from '../pages/public/JoinPage';
import { AdminLoginPage } from '../pages/admin/LoginPage';
import { AdminQueuePage } from '../pages/admin/QueuePage';
import { AdminStatsPage } from '../pages/admin/StatsPage';
import { NotFoundPage } from '../pages/public/NotFoundPage';

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/b/:slug" element={<PublicQueuePage />} />
        <Route path="/b/:slug/join" element={<JoinPage />} />

        {/* Admin routes */}
        <Route path="/admin/:slug/login" element={<AdminLoginPage />} />
        <Route path="/admin/:slug/queue" element={<AdminQueuePage />} />
        <Route path="/admin/:slug/stats" element={<AdminStatsPage />} />

        {/* Redirects */}
        <Route path="/" element={<Navigate to="/b/demo" replace />} />

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
