import React from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/AdminDashboard';
import MyJobs from './pages/MyJobs';
import PostJob from './pages/PostJob';
import Announcement from './pages/Announcement';
import PostAnnouncement from './pages/PostAnnouncement';
import ManageAccounts from './pages/ManageAccounts';
import EmployerSignup from './components/EmployerSignup';
import EmployerSidebar from './components/EmployerSidebar';
import EmployerDashboard from './pages/EmployerDashboard';
import EmployerTableJobs from './pages/EmployerTableJobs'
import EmployerPostJob from './pages/EmployerPostJob'

function App() {
  return (
    <Router>
      <MainApp />
    </Router>
  );
}

function MainApp() {
  const location = useLocation();

  const isAdminRoute = location.pathname.startsWith('/admin');
  const isEmployerRoute = location.pathname.startsWith('/employer');
  const isEmployerSignup = location.pathname === '/employer-signup';

  return (
    <div className="flex">
      {!isEmployerSignup && isAdminRoute && <Sidebar />}
      {!isEmployerSignup && isEmployerRoute && <EmployerSidebar />}

      {/* Main Content */}
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/employer-signup" element={<EmployerSignup />} />
          
          {/* Admin Routes */}
          <Route path="/admin/dashboard" element={<Dashboard />} />
          <Route path="/admin/jobs" element={<MyJobs />} />
          <Route path="/admin/submit-job" element={<PostJob />} />
          <Route path="/admin/announcement" element={<Announcement />} />
          <Route path="/admin/post-announcement" element={<PostAnnouncement />} />
          <Route path="/admin/manage-account" element={<ManageAccounts />} />
          
          {/* Employer Routes */}
          <Route path="/employer/dashboard" element={<EmployerDashboard />} />
          <Route path="/employer/jobs" element={<EmployerTableJobs />} />
          <Route path="/employer/post-job" element={<EmployerPostJob />} />
        </Routes>
      </div>
    </div>
  );
}


export default App;
