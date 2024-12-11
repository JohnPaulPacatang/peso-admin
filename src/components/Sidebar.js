import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { SiAwssecretsmanager } from "react-icons/si";
import {
  CiViewList,
  CiSquarePlus,
  CiGrid41,
  CiLogout,
  CiBellOn,
  CiBullhorn,
} from "react-icons/ci";
import Profile from '../assets/user.png';
import mainLogo from '../assets/mainLogo.png';

const Sidebar = () => {
  const location = useLocation();

  const isActive = (path) =>
    location.pathname === path ? 'bg-green-200' : 'hover:bg-green-100';

  const handleLogout = (e) => {
    e.preventDefault(); // Prevent the default navigation behavior

    // Simple confirmation dialog
    const isConfirmed = window.confirm('Are you sure you want to log out?');

    if (isConfirmed) {
      // Add logout logic here (e.g., clearing session data)
      alert('Logged out successfully!');
      window.location.href = '/';
    }
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-full bg-white p-8 flex flex-col overflow-hidden">
        {/* Logo Section */}
        <div className="flex items-center justify-center p-4">
          <img className="w-auto h-16" src={mainLogo} alt="logo" />
        </div>

        {/* Profile Section */}
        <div className="flex flex-col items-center mb-6">
          <img
            src={Profile}
            alt="Profile"
            className="rounded-full h-16 w-16 object-cover"
          />
          <span className="text-lg mt-2">Administrator</span>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-2">
          <Link
            to="/dashboard"
            className={`flex items-center p-2 text-gray-700 ${isActive(
              '/dashboard'
            )} rounded-lg transition duration-300`}
          >
            <CiGrid41 className="mr-2 text-3xl" />
            Dashboard
          </Link>
          <Link
            to="/jobs"
            className={`flex items-center p-2 text-gray-700 ${isActive(
              '/jobs'
            )} rounded-lg transition duration-300`}
          >
            <CiViewList className="mr-2 text-3xl" />
            My Jobs
          </Link>
          <Link
            to="/submit-job"
            className={`flex items-center p-2 text-gray-700 ${isActive(
              '/submit-job'
            )} rounded-lg transition duration-300`}
          >
            <CiSquarePlus className="mr-2 text-3xl" />
            Post a Job
          </Link>
          <Link
            to="/announcement"
            className={`flex items-center p-2 text-gray-700 ${isActive(
              '/announcement'
            )} rounded-lg transition duration-300`}
          >
            <CiBellOn className="mr-2 text-3xl" />
            Announcement
          </Link>
          <Link
            to="/post-announcement"
            className={`flex items-center p-2 text-gray-700 ${isActive(
              '/post-announcement'
            )} rounded-lg transition duration-300`}
          >
            <CiBullhorn className="mr-2 text-3xl" />
            Post Announcement
          </Link>
          <Link
            to="/manage-account"
            className={`flex items-center p-2 text-gray-700 ${isActive(
              '/delete-account'
            )} rounded-lg transition duration-300`}
          >
            <SiAwssecretsmanager className="mr-2 text-3xl" />
            Manage Account
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
            <CiLogout className="mr-2 text-3xl" />
            Log Out
          </a>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
