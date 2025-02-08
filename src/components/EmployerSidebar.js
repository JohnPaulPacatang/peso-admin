import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  CiViewList,
  CiSquarePlus,
  CiGrid41,
  CiLogout,
} from "react-icons/ci";
import Profile from '../assets/user.png';
import mainLogo from '../assets/mainLogo.png';

const EmployerSidebar = () => {
  const location = useLocation();

  const isActive = (path) =>
    location.pathname === path ? 'bg-green-200' : 'hover:bg-green-100';

  const handleLogout = (e) => {
    e.preventDefault(); 

    const isConfirmed = window.confirm('Are you sure you want to log out?');

    if (isConfirmed) {
      alert('Logged out successfully!');
      window.location.href = '/';
    }
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-full bg-white p-6 flex flex-col overflow-hidden">
        {/* Logo Section */}
        <div className="flex items-center justify-center p-4">
          <img className="w-auto h-12" src={mainLogo} alt="logo" />
        </div>

        {/* Profile Section */}
        <div className="flex flex-col items-center mb-6">
          <img
            src={Profile}
            alt="Profile"
            className="rounded-full h-12 w-12 object-cover"
          />
          <span className="text-lg mt-2">Company Name</span>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-2">
          <Link
            to="/employer/dashboard"
            className={`flex items-center p-2 text-gray-700 ${isActive(
              '/employer/dashboard'
            )} rounded-lg transition duration-300`}
          >
            <CiGrid41 className="mr-2 text-2xl" />
            Dashboard
          </Link>
          <Link
            to="/employer/jobs"
            className={`flex items-center p-2 text-gray-700 ${isActive(
              '/employer/jobs'
            )} rounded-lg transition duration-300`}
          >
            <CiViewList className="mr-2 text-2xl" />
            My Jobs
          </Link>
          <Link
            to="/employer/post-job"
            className={`flex items-center p-2 text-gray-700 ${isActive(
              '/employer/post-job'
            )} rounded-lg transition duration-300`}
          >
            <CiSquarePlus className="mr-2 text-2xl" />
            Post a Job
          </Link>
        </nav>

        {/* Log Out Link */}
        <div className="mt-auto p-4">
          <a
            href="/"
            onClick={handleLogout}
            className={`flex items-center p-2 text-gray-700 ${isActive(
              '/logout'
            )} rounded-lg transition duration-300`}
          >
            <CiLogout className="mr-2 text-2xl" />
            Log Out
          </a>
        </div>
      </div>
    </div>
  );
};

export default EmployerSidebar;
