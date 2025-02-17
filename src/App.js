import React, { useEffect, useState } from "react";
import './App.css';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from "react-router-dom";
import Login from "./components/Login";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/AdminDashboard";
import MyJobs from "./pages/MyJobs";
import PostJob from "./pages/PostJob";
import Announcement from "./pages/Announcement";
import PostAnnouncement from "./pages/PostAnnouncement";
import ManageAccounts from "./pages/ManageAccounts";
import EmployerSignup from "./components/EmployerSignup";
import EmployerSidebar from "./components/EmployerSidebar";
import EmployerDashboard from "./pages/EmployerDashboard";
import EmployerJobs from "./pages/EmployerJobs";
import EmployerPostJob from "./pages/EmployerPostJob";
import EmployerProfile from "./pages/EmployerProfile";

function App() {
  return (
    <Router>
      <MainApp />
    </Router>
  );
}

function MainApp() {
  const location = useLocation();
  const [admin, setAdmin] = useState(() => JSON.parse(localStorage.getItem("admin")) || null);
  const [employer, setEmployer] = useState(() => JSON.parse(localStorage.getItem("employer")) || null);
  const [loading, setLoading] = useState(true);
  const authenticateUser = () => {
    const adminData = JSON.parse(localStorage.getItem("admin"));
    const employerData = JSON.parse(localStorage.getItem("employer"));

    setAdmin(adminData || null);
    setEmployer(employerData || null);
  };

  useEffect(() => {
    authenticateUser();
    setLoading(false);
    window.addEventListener("storage", authenticateUser);
    return () => {
      window.removeEventListener("storage", authenticateUser);
    };
  }, []);

  if (loading) return <div>Loading...</div>;

  const isLoginPage = location.pathname === "/";
  const isEmployerSignup = location.pathname === "/employer-signup";

  return (
    <div className="flex">
      {/* Show Sidebar only when logged in */}
      {!isLoginPage && !isEmployerSignup && admin && <Sidebar />}
      {!isLoginPage && !isEmployerSignup && employer && <EmployerSidebar />}

      {/* Main Content */}
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<Login onLogin={authenticateUser} />} />
          <Route path="/employer-signup" element={<EmployerSignup />} />

          {/* Admin Routes - Protect Access */}
          {admin ? (
            <>
              <Route path="/admin/dashboard" element={<Dashboard />} />
              <Route path="/admin/jobs" element={<MyJobs />} />
              <Route path="/admin/submit-job" element={<PostJob />} />
              <Route path="/admin/announcement" element={<Announcement />} />
              <Route path="/admin/post-announcement" element={<PostAnnouncement />} />
              <Route path="/admin/manage-account" element={<ManageAccounts />} />
            </>
          ) : (
            <Route path="/admin/*" element={<Navigate to="/" replace />} />
          )}

          {/* Employer Routes - Protect Access */}
          {employer ? (
            <>
              <Route path="/employer/dashboard" element={<EmployerDashboard />} />
              <Route path="/employer/profile" element={<EmployerProfile employer={employer} />} />
              <Route path="/employer/jobs" element={<EmployerJobs />} />
              <Route path="/employer/post-job" element={<EmployerPostJob />} />
            </>
          ) : (
            <Route path="/employer/*" element={<Navigate to="/" replace />} />
          )}

          {/* Catch-All: Redirect Unauthorized Users */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
