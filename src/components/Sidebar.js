import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from "react-hot-toast";
import { SiAwssecretsmanager } from "react-icons/si";
import {
  CiViewList,
  CiSquarePlus,
  CiGrid41,
  CiLogout,
  CiBellOn,
  CiBullhorn,
} from "react-icons/ci";
import { PiUserGearThin } from "react-icons/pi";
import Profile from '../assets/peso-logo.webp';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  const isActive = (path) =>
    location.pathname === path ? 'bg-green-200' : 'hover:bg-green-100';

  const handleLogout = () => {
    setIsLogoutConfirmOpen(true);
  };

  const confirmLogout = () => {
    setIsLogoutConfirmOpen(false);
    navigate('/');
    setTimeout(() => {
      toast.success('Logged out!', {
        duration: 2000,
      });
    }, 500);
  };


  const cancelLogout = () => {
    setIsLogoutConfirmOpen(false);
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-full bg-white p-6 flex flex-col overflow-hidden">
        <p className="text-xs text-gray-500 text-center">© 2025 John Paul Pacatang. Rights reserved.</p>
        <hr className='my-1'></hr>
        <div className="flex flex-col items-center justify-center px-3">
          <h1 className="text-xl font-bold text-center px-5 py-2 text-orange-500 ">
            Public Employment <br /> Service Office
          </h1>
        </div>
        <hr className='my-1'></hr>


        {/* Profile Section */}
        <div className="flex flex-col items-center my-4">
          <img
            src={Profile}
            alt="Profile"
            className="rounded-full h-16 w-16 object-cover"
          />
          <span className="text-lg mt-2">Administrator</span>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-2 text-sm">
          <Link to="/admin/dashboard" className={`flex items-center p-2 text-gray-700 ${isActive('/admin/dashboard')} rounded-lg transition duration-300`}>
            <CiGrid41 className="mr-2 text-xl" />
            Dashboard
          </Link>
          <Link to="/admin/jobs" className={`flex items-center p-2 text-gray-700 ${isActive('/admin/jobs')} rounded-lg transition duration-300`}>
            <CiViewList className="mr-2 text-xl" />
            My Jobs
          </Link>
          <Link to="/admin/submit-job" className={`flex items-center p-2 text-gray-700 ${isActive('/admin/submit-job')} rounded-lg transition duration-300`}>
            <CiSquarePlus className="mr-2 text-xl" />
            Post a Job
          </Link>
          <Link to="/admin/announcement" className={`flex items-center p-2 text-gray-700 ${isActive('/announcement')} rounded-lg transition duration-300`}>
            <CiBellOn className="mr-2 text-xl" />
            Announcement
          </Link>
          <Link to="/admin/post-announcement" className={`flex items-center p-2 text-gray-700 ${isActive('/admin/post-announcement')} rounded-lg transition duration-300`}>
            <CiBullhorn className="mr-2 text-xl" />
            Post Announcement
          </Link>
          <Link to="/admin/manage-employers" className={`flex items-center p-2 text-gray-700 ${isActive('/admin/manage-account')} rounded-lg transition duration-300`}>
            <SiAwssecretsmanager className="mr-2 text-xl" />
            Manage Employers
          </Link>
          <Link to="/admin/manage-users" className={`flex items-center p-2 text-gray-700 ${isActive('/admin/manage-account')} rounded-lg transition duration-300`}>
            <PiUserGearThin className="mr-2 text-xl" />
            Manage Users
          </Link>
        </nav>

        {/* Log Out Link */}
        <div className="mt-auto p-2 text-sm">
          <button onClick={handleLogout} className={`flex items-center p-2 text-red-500 font-semibold ${isActive('/logout')} rounded-lg transition duration-300 w-full`}>
            <CiLogout className="mr-2 text-xl" />
            Log Out
          </button>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {isLogoutConfirmOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 z-50">
          <div className="bg-white rounded-lg shadow-lg p-4 w-96 sm:w-80 md:w-96 lg:w-1/5">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 text-center">
              Are you sure you want to log out?
            </h3>
            <div className="flex justify-center space-x-4">
              <button className="bg-red-600 text-white px-2 py-2 rounded-md text-base w-full sm:w-auto" onClick={confirmLogout}>
                Yes, Log Out
              </button>
              <button className="bg-gray-300 text-black px-2 py-2 rounded-md text-base w-full sm:w-auto" onClick={cancelLogout}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
