import React from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import MyJobs from './pages/MyJobs';
import PostJob from './pages/PostJob';
import Announcement from './pages/Announcement';
import PostAnnouncement from './pages/PostAnnouncement';
import ManageAccounts from './pages/ManageAccounts';

function App() {
  return (
    <Router>
      <MainApp />
    </Router>
  );
}

function MainApp() {
  const location = useLocation();

  const showSidebar = location.pathname !== '/';

  return (
    <div className="flex">
      {/* Sidebar (conditionally rendered) */}
      {showSidebar && <Sidebar />}

      {/* Main Content */}
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/jobs" element={<MyJobs />} />
          <Route path="/submit-job" element={<PostJob />} />
          <Route path="/announcement" element={<Announcement />} />
          <Route path="/post-announcement" element={<PostAnnouncement />} />
          <Route path="/manage-account" element={<ManageAccounts />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
