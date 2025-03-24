import React, { useState, useEffect, useRef } from 'react';
import { AiOutlineEllipsis, AiOutlineEdit, AiOutlineDelete } from 'react-icons/ai';
import { CiSearch } from "react-icons/ci";
import { FaRegFilePdf, FaFileCsv } from "react-icons/fa6";
import { CSVLink } from 'react-csv';
import { MdOutlineAutoDelete } from "react-icons/md";
import { db } from '../firebase';
import { collection, getDocs, deleteDoc, doc, updateDoc, addDoc } from 'firebase/firestore';
import { toast } from "react-hot-toast";
import { BeatLoader } from "react-spinners";
import { Link } from "react-router-dom";
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const TableUsers = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const dropdownRef = useRef(null);

  // sa pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10);

  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // Fetch all users 
  useEffect(() => {
    const fetchAllUsers = async () => {
      try {
        const profilesRef = collection(db, "profiles");
        const querySnapshot = await getDocs(profilesRef);

        const usersData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Sort by creation time
        usersData.sort((a, b) => {
          const aTime = a.createdAt ? a.createdAt.seconds : 0;
          const bTime = b.createdAt ? b.createdAt.seconds : 0;
          return bTime - aTime;
        });

        setUsers(usersData);
        setFilteredUsers(usersData);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching users:', error);
        toast.error("Failed to fetch users");
        setIsLoading(false);
      }
    };

    fetchAllUsers();
  }, []);

  //sa saeach
  useEffect(() => {
    if (searchTerm.trim() !== '') {
      setIsSearching(true);
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      if (searchTerm.trim() === '') {
        setFilteredUsers(users);
        setIsSearching(false);
      } else {
        const lowercaseSearchTerm = searchTerm.trim().toLowerCase();
        const filtered = users.filter(user =>
          user.name && user.name.toLowerCase().includes(lowercaseSearchTerm)
        );

        setFilteredUsers(filtered);
        setIsSearching(false);
      }


      setCurrentPage(1);
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm, users]);

  // Pagination logic
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  const paginate = (pageNumber) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
      setSelectedUser(null);
    }
  };

  const handleActionClick = (user) => {
    setSelectedUser(selectedUser && selectedUser.id === user.id ? null : user);
  };

  const handleEditClick = (user) => {
    setEditingUser({ ...user });
    setIsEditModalOpen(true);
    setSelectedUser(null);
  };

  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setIsDeleteConfirmOpen(true);
    setSelectedUser(null);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;

    const deletePromise = new Promise(async (resolve, reject) => {
      try {
        // Store user data before deletion
        const userData = {
          userId: userToDelete.id,
          email: userToDelete.email || 'N/A',
          name: userToDelete.name || 'N/A',
          deletedAt: new Date(),
          accType: "user"
        };
        // punta deleted logs yung acc
        await addDoc(collection(db, "deleted_logs"), userData);
        // tapos delete sa profiles
        await deleteDoc(doc(db, "profiles", userToDelete.id));

        // Update both users and filteredUsers states
        const updatedUsers = users.filter(user => user.id !== userToDelete.id);
        setUsers(updatedUsers);
        setFilteredUsers(
          filteredUsers.filter(user => user.id !== userToDelete.id)
        );

        setIsDeleteConfirmOpen(false);
        setUserToDelete(null);

        resolve("The user profile has been successfully deleted and logged!");
      } catch (error) {
        console.error("Error in delete process: ", error);
        reject("Failed to complete the delete operation. Please try again.");
      }
    });

    toast.promise(deletePromise, {
      loading: "Deleting the profile, please wait...",
      success: "Deleted successfully!",
      error: "Error during deletion process.",
    });
  };

  const cancelDelete = () => {
    setIsDeleteConfirmOpen(false);
    setUserToDelete(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditingUser(prev => ({
      ...prev,
      [name]: value
    }));
  };


  //edit
  const handleSubmitEdit = async (e) => {
    e.preventDefault();

    const updatePromise = new Promise(async (resolve, reject) => {
      try {
        const userRef = doc(db, "profiles", editingUser.id);
        await updateDoc(userRef, {
          name: editingUser.name,
          email: editingUser.email,
          contactNumber: editingUser.contactNumber,
          address: editingUser.address,
        });

        // Update both users and filteredUsers states
        const updatedUsers = users.map(user =>
          user.id === editingUser.id ? { ...user, ...editingUser } : user
        );

        setUsers(updatedUsers);
        setFilteredUsers(
          filteredUsers.map(user =>
            user.id === editingUser.id ? { ...user, ...editingUser } : user
          )
        );

        setIsEditModalOpen(false);
        resolve("Updated successfully!");
      } catch (error) {
        console.error("Error updating profile:", error);
        reject("Error updating profile.");
      }
    });

    toast.promise(updatePromise, {
      loading: "Updating profile, please wait...",
      success: "Updated successfully!",
      error: "Error updating profile.",
    });
  };

  const truncateText = (text, maxLength = 30) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  //export pdf or print
  const handleExportPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginX = 10;

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(52, 73, 94);
    doc.text('User Profiles Report', pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    const formattedDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    doc.text(`Generated on ${formattedDate}`, pageWidth / 2, 28, { align: 'center' });

    doc.setDrawColor(52, 73, 94);
    doc.setLineWidth(0.5);
    doc.line(marginX, 31, pageWidth - marginX, 31);

    const headers = [['Name', 'Email', 'Contact Number', 'Address', 'Verified', 'Created At']];
    const tableData = filteredUsers.map(user => [
      user.name || 'N/A',
      user.email || 'N/A',
      user.contactNumber || 'N/A',
      user.address || 'N/A',
      user.isVerified ? 'Yes' : 'No',
      user.createdAt ? new Date(user.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'
    ]);

    doc.autoTable({
      head: headers,
      body: tableData,
      startY: 35,
      tableWidth: 'auto',
      styles: {
        fontSize: 7,
        cellPadding: 3,
        overflow: 'linebreak'
      },
      headStyles: {
        fillColor: [52, 73, 94],
        textColor: 255,
        fontSize: 8,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      margin: { left: marginX, right: marginX, top: 35 },
      didDrawPage: () => {
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Page ${doc.internal.getNumberOfPages()}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
      }
    });

    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    iframe.src = pdfUrl;
    iframe.onload = () => {
      iframe.contentWindow.print();
    };
  };


  //export csv
  const prepareCSVData = () => {
    const headers = [
      { label: 'Name', key: 'name' },
      { label: 'Email', key: 'email' },
      { label: 'Contact Number', key: 'contactNumber' },
      { label: 'Address', key: 'address' },
      { label: 'Verified', key: 'isVerified' },
      { label: 'Created At', key: 'createdAt' }
    ];

    const csvData = filteredUsers.map(user => ({
      name: user.name || 'N/A',
      email: user.email || 'N/A',
      contactNumber: user.contactNumber || 'N/A',
      address: user.address || 'N/A',
      isVerified: user.isVerified ? 'Yes' : 'No',
      createdAt: user.createdAt ?
        new Date(user.createdAt.seconds * 1000).toLocaleDateString('en-US') :
        'N/A'
    }));

    return { headers, data: csvData };
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setSelectedUser(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setIsSearching(false);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      return new Date(timestamp.seconds * 1000).toLocaleDateString();
    } catch (error) {
      return 'Invalid Date';
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <BeatLoader color="#36d7b7" size={15} />
        <p className="mt-4 text-gray-600">Loading Users...</p>
      </div>
    );
  }

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-10">

      {/* Header */}
      <div className="max-w-8xl mx-auto py-4">
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
          <h1 className="text-2xl sm:text-2xl font-bold text-gray-800">Manage Users</h1>
          <div className="flex space-x-4">
            <div className="relative">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search by Name..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="border border-gray-300 pl-10 pr-4 py-2 rounded-lg text-sm w-64 md:w-80"
              />
              <CiSearch className="absolute left-3 top-2.5 text-gray-400 text-lg" />
              {searchTerm && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-gray-200 text-gray-700 hover:bg-gray-300 py-1 px-2 rounded-lg text-xs"
                >
                  Clear
                </button>
              )}
            </div>
            <button
              onClick={handleExportPDF}
              className="bg-white text-gray-700 border border-gray-300 hover:bg-gray-100 py-2 px-4 rounded-lg text-sm flex items-center gap-1 w-full sm:w-auto justify-center sm:justify-start"
            >
              <FaRegFilePdf className="text-red-600" /> Export PDF
            </button>
            <CSVLink
              data={prepareCSVData().data}
              headers={prepareCSVData().headers}
              filename={`users-report-${new Date().toISOString().slice(0, 10)}.csv`}
              className="bg-white text-gray-700 border border-gray-300  hover:bg-gray-100 py-2 px-4 rounded-lg text-sm flex items-center gap-1 w-full sm:w-auto justify-center sm:justify-start"
            >
              <FaFileCsv className="text-green-600" /> Export CSV
            </CSVLink>
            <Link
              to="/admin/deleted-users"
              className="bg-red-600 text-white hover:bg-red-700 py-2 px-4 rounded-lg text-sm transition duration-300 flex items-center gap-1"
            >
              <MdOutlineAutoDelete />  View Deleted Logs
            </Link>
          </div>
        </div>
      </div>

      {/* Lameeeeeeeeesa */}
      <div className="max-w-8xl mx-auto pt-4">
        <div className="shadow-md sm:rounded-lg bg-white">
          <table className="min-w-full border-gray-200 rounded-lg">
            <thead>
              <tr className="bg-gray-300">
                <th className="px-3 py-3 text-left text-sm font-semibold text-black rounded-tl-lg">Name</th>
                <th className="px-3 py-3 text-left text-sm font-semibold text-black">Email</th>
                <th className="px-3 py-3 text-left text-sm font-semibold text-black">Contact Number</th>
                <th className="px-3 py-3 text-left text-sm font-semibold text-black">Address</th>
                <th className="px-3 py-3 text-left text-sm font-semibold text-black">Verified</th>
                <th className="px-3 py-3 text-left text-sm font-semibold text-black">Created At</th>
                <th className="px-3 py-3 text-left text-sm font-semibold text-black rounded-tr-lg">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isSearching ? (
                <tr>
                  <td colSpan="7" className="px-4 py-4 text-center">
                    <div className="flex justify-center items-center py-8">
                      <BeatLoader color="#36d7b7" size={10} />
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      <p className="text-gray-500 text-lg font-medium">No users found matching your search criteria.</p>
                      {searchTerm && (
                        <button
                          onClick={clearSearch}
                          className="mt-4 bg-blue-600 text-white py-2 px-4 rounded-lg text-sm hover:bg-blue-700 transition-colors"
                        >
                          Clear Search
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                currentUsers.map((user, index) => (
                  <tr key={user.id || index} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-3 py-3 text-sm text-gray-700">{user.name}</td>
                    <td className="px-3 py-3 text-sm text-gray-700">
                      <a
                        href={`https://mail.google.com/mail/?view=cm&fs=1&to=${user.email}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {user.email}
                      </a>
                    </td>

                    <td className="px-3 py-3 text-sm text-gray-700">{user.contactNumber || '-'}</td>
                    <td className="px-3 py-3 text-sm text-gray-700">{truncateText(user.address) || '-'}</td>
                    <td className="px-3 py-3 text-sm text-gray-700">
                      {user.isVerified ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-600">
                          Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-600">
                          Not Verified
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-700">{formatTimestamp(user.createdAt)}</td>
                    <td className="px-3 py-3 text-3xl text-gray-700 relative">
                      <button
                        className="text-gray-500 hover:text-blue-700"
                        onClick={() => handleActionClick(user)}
                      >
                        <AiOutlineEllipsis />
                      </button>
                      {selectedUser && selectedUser.id === user.id && (
                        <div
                          ref={dropdownRef}
                          className="absolute bg-white border shadow-md mt-2 top-5 rounded-md py-2 w-28 right-1 z-10"
                        >
                          <button
                            onClick={() => handleEditClick(user)}
                            className="flex items-center w-full text-sm text-gray-700 hover:bg-gray-100 py-2 px-4"
                          >
                            <AiOutlineEdit className="mr-2" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteClick(user)}
                            className="flex items-center w-full text-sm text-red-600 hover:bg-gray-100 py-2 px-4"
                          >
                            <AiOutlineDelete className="mr-2" />
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="px-6 py-3 flex items-center justify-between border-t border-gray-200">
            <div className="flex-1 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{filteredUsers.length > 0 ? indexOfFirstUser + 1 : 0}</span> to{" "}
                  <span className="font-medium">
                    {Math.min(indexOfLastUser, filteredUsers.length)}
                  </span>{" "}
                  of <span className="font-medium">{filteredUsers.length}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-xs font-medium ${currentPage === 1
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-gray-500 hover:bg-gray-50'
                      }`}
                  >
                    <svg className="h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>

                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => paginate(i + 1)}
                      className={`relative inline-flex items-center px-2 py-1 border border-gray-300 text-xs font-large ${currentPage === i + 1
                        ? 'z-10 bg-blue-50 border-blue text-blue'
                        : 'bg-white text-gray-500 hover:bg-gray-50'
                        }`}
                    >
                      {i + 1}
                    </button>
                  ))}

                  <button
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-xs font-medium ${currentPage === totalPages
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-gray-500 hover:bg-gray-50'
                      }`}
                  >
                    <svg className="h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm transition-opacity duration-200">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4 transform transition-all duration-200 scale-100">
            <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center tracking-tight">
              Confirm Deletion
            </h3>
            <p className="text-gray-600 text-center mb-8 text-sm">
              Are you sure you want to delete this item? This action cannot be undone.
            </p>
            <div className="flex gap-4 justify-center">
              <button
                className="flex-1 bg-red-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-red-700 focus:ring-4 focus:ring-red-200 focus:outline-none transition-colors duration-150 text-sm"
                onClick={confirmDelete}
              >
                Yes, Delete
              </button>
              <button
                className="flex-1 bg-gray-200 text-gray-800 px-4 py-2.5 rounded-lg font-medium hover:bg-gray-300 focus:ring-4 focus:ring-gray-200 focus:outline-none transition-colors duration-150 text-sm"
                onClick={cancelDelete}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm transition-opacity duration-200">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4 transform transition-all duration-200 scale-100">
            <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center tracking-tight">
              Edit User Details
            </h3>
            <form onSubmit={handleSubmitEdit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={editingUser.name || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={editingUser.email || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Number
                  </label>
                  <input
                    type="text"
                    name="contactNumber"
                    value={editingUser.contactNumber || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Verified
                  </label>
                  <div className="mt-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${editingUser.isVerified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-600'}`}>
                      {editingUser.isVerified ? 'Completed' : 'Not Completed'}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={editingUser.address || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
              </div>
              <div className="flex gap-4 justify-center mt-8">
                <button
                  type="button"
                  className="flex-1 bg-gray-200 text-gray-800 px-4 py-2.5 rounded-lg font-medium hover:bg-gray-300 focus:ring-4 focus:ring-gray-200 focus:outline-none transition-colors duration-150 text-sm"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 focus:outline-none transition-colors duration-150 text-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableUsers;