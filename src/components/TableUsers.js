import React, { useState, useEffect, useRef } from 'react';
import { AiOutlineEllipsis, AiOutlineEdit, AiOutlineDelete } from 'react-icons/ai';
import { CiSearch } from "react-icons/ci";
import { db } from '../firebase';
import { collection, getDocs, deleteDoc, doc, updateDoc, query, where } from 'firebase/firestore';
import { toast } from "react-hot-toast";
import { BeatLoader } from "react-spinners";
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const TableUsers = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const dropdownRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        let usersQuery;

        if (searchTerm.trim() !== "") {
          // Search by name in database
          usersQuery = query(
            collection(db, "profiles"),
            where("name", ">=", searchTerm),
            where("name", "<=", searchTerm + "\uf8ff")
          );
        } else {
          // If no search term, fetch all users
          usersQuery = collection(db, "profiles");
        }

        const querySnapshot = await getDocs(usersQuery);
        const usersData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        usersData.sort((a, b) => {
          const aTime = a.createdAt ? a.createdAt.seconds : 0;
          const bTime = b.createdAt ? b.createdAt.seconds : 0;
          return bTime - aTime;
        });

        setUsers(usersData);
      } catch (error) {
        console.error('Error fetching users:', error);
        toast.error("Failed to fetch users");
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(() => {
      fetchUsers();
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  const filteredUsers = users;

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
        await deleteDoc(doc(db, "profiles", userToDelete.id));
        setUsers(users.filter(user => user.id !== userToDelete.id));
        setIsDeleteConfirmOpen(false);
        setUserToDelete(null);
        resolve("The user profile has been successfully deleted!");
      } catch (error) {
        console.error("Error deleting: ", error);
        reject("Failed to delete the user profile. Please try again.");
      }
    });

    toast.promise(deletePromise, {
      loading: "Deleting the profile, please wait...",
      success: "Deleted successfully!",
      error: "Error deleting.",
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

        // Update local state
        setUsers(users.map(user =>
          user.id === editingUser.id ? { ...user, ...editingUser } : user
        ));

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

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const marginX = 10;

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('User Profiles Report', pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, pageWidth / 2, 28, { align: 'center' });

    const headers = [['Name', 'Email', 'Contact Number', 'Address', 'Verified', 'Created At']];
    const tableData = users.map(user => [
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
      margin: { left: marginX, right: marginX, top: 35 }
    });

    window.open(doc.output('bloburl'), '_blank');
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

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const clearSearch = () => {
    setSearchTerm('');
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
      <div className="max-w-8xl mx-auto py-4">
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Manage Users</h1>
          <div className="flex space-x-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by Name..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="border border-gray-300 pl-10 pr-4 py-2 rounded-3xl text-sm w-64 md:w-80"
              />
              <CiSearch className="absolute left-3 top-2.5 text-gray-400 text-lg" />
              {searchTerm && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-gray-200 text-gray-700 hover:bg-gray-300 py-1 px-2 rounded-full text-xs"
                >
                  Clear
                </button>
              )}
            </div>
            <button
              onClick={handleExportPDF}
              className="bg-green-600 text-white hover:bg-green-700 py-2 px-4 rounded-full text-sm font-semibold"
            >
              Export PDF
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-8xl mx-auto pt-4">
        <div className="shadow-md sm:rounded-3xl bg-white">
          <table className="min-w-full border-gray-200 rounded-lg">
            <thead>
              <tr className="bg-gray-300">
                <th className="px-3 py-3 text-left text-sm font-semibold text-black border-t rounded-tl-xl">Name</th>
                <th className="px-3 py-3 text-left text-sm font-semibold text-black border-t">Email</th>
                <th className="px-3 py-3 text-left text-sm font-semibold text-black border-t">Contact Number</th>
                <th className="px-3 py-3 text-left text-sm font-semibold text-black border-t">Address</th>
                <th className="px-3 py-3 text-left text-sm font-semibold text-black border-t">Verified</th>
                <th className="px-3 py-3 text-left text-sm font-semibold text-black border-t">Created At</th>
                <th className="px-3 py-3 text-left text-sm font-semibold text-black border-t rounded-tr-xl">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-4 text-center text-sm text-gray-500">
                    No users found
                  </td>
                </tr>
              ) : (
                currentUsers.map((user, index) => (
                  <tr key={user.id || index} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-3 py-4 text-sm text-gray-700">{user.name}</td>
                    <td className="px-3 py-4 text-sm text-gray-700">
                      <a
                        href={`https://mail.google.com/mail/?view=cm&fs=1&to=${user.email}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {user.email}
                      </a>
                    </td>

                    <td className="px-3 py-4 text-sm text-gray-700">{user.contactNumber || '-'}</td>
                    <td className="px-3 py-4 text-sm text-gray-700">{truncateText(user.address) || '-'}</td>
                    <td className="px-3 py-4 text-sm text-gray-700">
                      {user.isVerified ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-600">
                          Completed
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-600">
                          Not Completed
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-4 text-sm text-gray-700">{formatTimestamp(user.createdAt)}</td>
                    <td className="px-3 py-4 text-3xl text-gray-700 relative">
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
        <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl mx-4">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Edit User Details
            </h3>
            <form onSubmit={handleSubmitEdit}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={editingUser.name || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={editingUser.email || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Number
                  </label>
                  <input
                    type="text"
                    name="contactNumber"
                    value={editingUser.contactNumber || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Verified
                  </label>
                  <div className="mt-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${editingUser.isVerified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-600'}`}>
                      {editingUser.isVerified ? 'Completed' : 'Not Completed'}
                    </span>
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={editingUser.address || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                {/* Profile Image is commented out as requested
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Profile Image
                                    </label>
                                    <input
                                        type="text"
                                        name="profileImage"
                                        value={editingUser.profileImage || ''}
                                        readOnly
                                        className="w-full px-3 py-2 border bg-gray-50 text-gray-600 cursor-default border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                */}
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
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