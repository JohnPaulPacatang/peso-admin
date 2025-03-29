import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from "react-hot-toast";
import {
  CiViewList,
  CiSquarePlus,
  CiGrid41,
  CiLogout,
  CiBellOn,
  CiBullhorn
} from "react-icons/ci";
import { PiUserGearThin } from "react-icons/pi";
import { SiAwssecretsmanager } from "react-icons/si";
import Profile from '../assets/peso-logo.webp';

// Define navigation items 
const navigationItems = [
  { path: '/admin/dashboard', icon: CiGrid41, label: 'Dashboard' },
  { path: '/admin/jobs', icon: CiViewList, label: 'My Jobs' },
  { path: '/admin/submit-job', icon: CiSquarePlus, label: 'Post a Job' },
  { path: '/admin/announcement', icon: CiBellOn, label: 'Announcement' },
  { path: '/admin/post-announcement', icon: CiBullhorn, label: 'Post Announcement' },
  { path: '/admin/manage-employers', icon: SiAwssecretsmanager, label: 'Manage Employers' },
  { path: '/admin/manage-users', icon: PiUserGearThin, label: 'Manage Users' },
];

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  //active tab
  const isActive = (path) =>
    location.pathname === path ? 'bg-green-200 text-green-800' : 'hover:bg-green-100';

  const handleLogout = () => {
    setIsLogoutConfirmOpen(true);
  };

  const confirmLogout = () => {
    setIsLogoutConfirmOpen(false);
    localStorage.removeItem('admin');
    navigate('/');
    setTimeout(() => {
      toast.success('Logged out successfully', {
        duration: 2000,
      });
    }, 500);
  };

  const cancelLogout = () => {
    setIsLogoutConfirmOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Logout confirmation modal component
  const LogoutConfirmationModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm transition-opacity duration-200">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4 transform transition-all duration-200 scale-100">
        <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center tracking-tight">
          Confirm Logout
        </h3>
        <p className="text-gray-600 text-center mb-8 text-sm">
          Are you sure you want to end your session?
        </p>
        <div className="flex gap-4 justify-center">
          <button
            className="flex-1 bg-red-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-red-700 focus:ring-4 focus:ring-red-200 focus:outline-none transition-colors duration-150 text-sm"
            onClick={confirmLogout}
          >
            Log Out
          </button>
          <button
            className="flex-1 bg-gray-200 text-gray-800 px-4 py-2.5 rounded-lg font-medium hover:bg-gray-300 focus:ring-4 focus:ring-gray-200 focus:outline-none transition-colors duration-150 text-sm"
            onClick={cancelLogout}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile menu toggle button - only visible on small screens */}
      <button
        className="fixed top-5 left-5 z-40 md:hidden bg-white p-3 rounded-lg shadow-md"
        onClick={toggleMobileMenu}
        aria-label="Toggle menu"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 text-gray-700"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          {isMobileMenuOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>


      <div className={`${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 ease-in-out fixed md:static inset-y-0 left-0 z-30 w-80 bg-white shadow-lg md:shadow-none`}>
        <div className="flex flex-col h-full px-4 py-4 overflow-y-auto">
          {/* Logo and title */}
          <div className="flex flex-col items-center justify-center mb-6 pt-2">
            <img
              src={Profile}
              alt="PESO Logo"
              className="h-16 w-16 object-contain mb-3"
            />
            <h1 className="text-lg font-bold text-center text-blue-500 leading-tight">
              Public Employment <br /> Service Office
            </h1>
            <div className="flex w-full max-w-xs justify-center mt-3">
              <div className="w-12 h-1 bg-green-500 rounded-full mx-1"></div>
              <div className="w-24 h-1 bg-blue-500 rounded-full mx-1"></div>
              <div className="w-12 h-1 bg-green-500 rounded-full mx-1"></div>
            </div>
          </div>

          {/* Profile Section */}
          <div className="flex items-center text-center py-3 px-4 bg-gray-50 rounded-lg mb-6">
            <div className="flex-1">
              <p className="text-sm font-bold text-gray-800">Administrator</p>
              <p className="text-xs text-gray-500">Admin Panel</p>
            </div>
          </div>

          {/* Navigation Links - added more side padding */}
          <nav className="flex-1 space-y-2 text-sm font-medium">
            {navigationItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-4 py-3 ${isActive(item.path)} rounded-lg transition-all duration-200`}
              >
                <item.icon className="mr-3 text-xl text-gray-600" />
                <span>{item.label}</span>
                {item.path === location.pathname && (
                  <span className="ml-auto w-1.5 h-6 bg-green-500 rounded-full"></span>
                )}
              </Link>
            ))}
          </nav>

          {/* Log Out Button */}
          <div className="mt-auto pt-4 text-sm border-gray-200">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-3 text-red-500 hover:bg-red-50 rounded-lg transition-colors duration-200"
            >
              <CiLogout className="mr-3 text-xl" />
              <span className="font-medium">Log Out</span>
            </button>
          </div>

          {/* Footer */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              © 2025 The Researcher. All rights reserved.
            </p>
          </div>
        </div>
      </div>

      {/* Render logout confirmation modal when open */}
      {isLogoutConfirmOpen && <LogoutConfirmationModal />}

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-gray-900/20 z-20 md:hidden"
          onClick={toggleMobileMenu}
        ></div>
      )}
    </>
  );
};

export default Sidebar;