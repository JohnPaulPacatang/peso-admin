import React from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import MyJobs from './pages/MyJobs';
import PostJob from './pages/PostJob';
// import DeleteAccount from './pages/DeleteAccount';

function App() {
  return (
    <Router>
      <MainApp />
    </Router>
  );
}

function MainApp() {
  const location = useLocation();

  // Check if the current path is '/'; if not, show the sidebar
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
          {/* <Route path="/delete-account" element={<DeleteAccount />} /> */}
        </Routes>
      </div>
    </div>
  );
}

export default App;
