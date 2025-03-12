import React, { useState, useEffect, useRef } from 'react';
import { AiOutlineEllipsis, AiOutlineEdit, AiOutlineDelete } from 'react-icons/ai';
import { CiSearch } from "react-icons/ci";
import { FaRegFilePdf } from "react-icons/fa6";
import { MdOutlineAutoDelete } from "react-icons/md";
import { db } from '../firebase';
import { collection, getDocs, deleteDoc, doc, updateDoc, query, addDoc, orderBy } from 'firebase/firestore';
import { toast } from "react-hot-toast";
import { BeatLoader } from "react-spinners";
import { Link } from "react-router-dom";
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const ManageEmployerAccounts = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [accounts, setAccounts] = useState([]);
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [accountToDelete, setAccountToDelete] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState(null);
    const dropdownRef = useRef(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [accountsPerPage] = useState(10);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchEmployers = async () => {
            setIsLoading(true);
            try {
                let employersQuery;
                const lowercaseSearchTerm = searchTerm.trim().toLowerCase();

                if (lowercaseSearchTerm !== "") {
                    employersQuery = query(
                        collection(db, "employers"),
                        orderBy("createdAt", "desc")
                    );

                    const querySnapshot = await getDocs(employersQuery);
                    const allEmployersData = querySnapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data(),
                    }));

                    // Filter client-side for case-insensitive search
                    const filteredEmployers = allEmployersData.filter(employer =>
                        employer.companyName &&
                        employer.companyName.toLowerCase().includes(lowercaseSearchTerm)
                    );

                    setAccounts(filteredEmployers);
                } else {
                    // No search term, get all employers sorted by creation date
                    employersQuery = query(
                        collection(db, "employers"),
                        orderBy("createdAt", "desc")
                    );

                    const querySnapshot = await getDocs(employersQuery);
                    const employersData = querySnapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data(),
                    }));

                    setAccounts(employersData);
                }
            } catch (error) {
                console.error('Error fetching employers:', error);
                toast.error("Failed to fetch employers");
            } finally {
                setIsLoading(false);
            }
        };

        const debounceTimer = setTimeout(() => {
            fetchEmployers();
        }, 500);

        return () => clearTimeout(debounceTimer);
    }, [searchTerm]);

    const filteredAccounts = accounts;

    // Pagination logic
    const indexOfLastAccount = currentPage * accountsPerPage;
    const indexOfFirstAccount = indexOfLastAccount - accountsPerPage;
    const currentAccounts = filteredAccounts.slice(indexOfFirstAccount, indexOfLastAccount);
    const totalPages = Math.ceil(filteredAccounts.length / accountsPerPage);

    const paginate = (pageNumber) => {
        if (pageNumber > 0 && pageNumber <= totalPages) {
            setCurrentPage(pageNumber);
            setSelectedAccount(null);
        }
    };

    const handleActionClick = (account) => {
        setSelectedAccount(selectedAccount && selectedAccount.id === account.id ? null : account);
    };

    const handleEditClick = (account) => {
        setEditingAccount({ ...account });
        setIsEditModalOpen(true);
        setSelectedAccount(null);
    };

    const handleDeleteClick = (account) => {
        setAccountToDelete(account);
        setIsDeleteConfirmOpen(true);
        setSelectedAccount(null);
    };

    const confirmDelete = async () => {
        if (!accountToDelete) return;

        const deletePromise = new Promise(async (resolve, reject) => {
            try {
                const employerData = {
                    employerId: accountToDelete.id,
                    companyName: accountToDelete.companyName || 'N/A',
                    email: accountToDelete.email || 'N/A',
                    deletedAt: new Date(),
                    accType: "employer"
                };

                await addDoc(collection(db, "deleted_logs"), employerData);

                // Then delete the employer from employers collection
                await deleteDoc(doc(db, "employers", accountToDelete.id));

                setAccounts(accounts.filter(acc => acc.id !== accountToDelete.id));
                setIsDeleteConfirmOpen(false);
                setAccountToDelete(null);

                resolve("The employer account has been successfully deleted and logged!");
            } catch (error) {
                console.error("Error in delete process: ", error);
                reject("Failed to complete the delete operation. Please try again.");
            }
        });

        toast.promise(deletePromise, {
            loading: "Deleting the account, please wait...",
            success: "Deleted successfully and logged to records!",
            error: "Error during deletion process.",
        });
    };
    const cancelDelete = () => {
        setIsDeleteConfirmOpen(false);
        setAccountToDelete(null);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setEditingAccount(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmitEdit = async (e) => {
        e.preventDefault();

        const updatePromise = new Promise(async (resolve, reject) => {
            try {
                const accountRef = doc(db, "employers", editingAccount.id);
                await updateDoc(accountRef, {
                    contact_person_name: editingAccount.contact_person_name,
                    contact_person_email: editingAccount.contact_person_email,
                    company_address: editingAccount.company_address,
                });

                // Update local state
                setAccounts(accounts.map(acc =>
                    acc.id === editingAccount.id ? { ...acc, ...editingAccount } : acc
                ));

                setIsEditModalOpen(false);
                resolve("Updated successfully!");
            } catch (error) {
                console.error("Error updating account:", error);
                reject("Error updating account.");
            }
        });

        toast.promise(updatePromise, {
            loading: "Updating account, please wait...",
            success: "Updated successfully!",
            error: "Error updating account.",
        });
    };

    const truncateText = (text, maxLength = 30) => {
        if (!text) return '';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    };

    const formatCreatedDate = (createdAt) => {
        if (!createdAt) return 'N/A';
        const date = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    };

    const handleExportPDF = () => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const marginX = 10;

        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text('Employer Accounts Report', pageWidth / 2, 20, { align: 'center' });

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Generated on ${new Date().toLocaleDateString()}`, pageWidth / 2, 28, { align: 'center' });

        const headers = [['Company Name', 'Email', 'Contact Person', 'Contact Email', 'Address', 'Created Date', 'Verified']];
        const tableData = accounts.map(acc => [
            acc.companyName || 'N/A',
            acc.email || 'N/A',
            acc.contact_person_name || 'N/A',
            acc.contact_person_email || 'N/A',
            acc.company_address || 'N/A',
            formatCreatedDate(acc.createdAt),
            acc.verified ? 'Yes' : 'No'
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
                setSelectedAccount(null);
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


    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-screen">
                <BeatLoader color="#36d7b7" size={15} />
                <p className="mt-4 text-gray-600">Loading Accounts...</p>
            </div>
        );
    }

    return (
        <div className="py-10 px-4 sm:px-6 lg:px-10">
            <div className="max-w-8xl mx-auto py-4">
                <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Manage Employers</h1>
                    <div className="flex space-x-4">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search by Company Name..."
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
                        <button onClick={handleExportPDF} className="bg-green-600 text-white hover:bg-green-700 py-2 px-4 rounded-lg text-sm flex items-center gap-1">
                            <FaRegFilePdf /> Export PDF
                        </button>
                        <Link
                            to="/admin/deleted-employers"
                            className="bg-red-600 text-white hover:bg-red-700 py-2 px-4 rounded-lg text-sm transition duration-300 flex items-center gap-1"
                        >
                            <MdOutlineAutoDelete />  View Deleted Logs
                        </Link>
                    </div>
                </div>
            </div>

            <div className="max-w-8xl mx-auto pt-4">
                <div className="shadow-md sm:rounded-lg bg-white">
                    <table className="min-w-full border-gray-200 rounded-lg">
                        <thead>
                            <tr className="bg-gray-300">
                                <th className="px-3 py-3 text-left text-sm font-semibold text-black rounded-tl-lg">Company Name</th>
                                <th className="px-3 py-3 text-left text-sm font-semibold text-black">Email</th>
                                <th className="px-3 py-3 text-left text-sm font-semibold text-black">Contact Person</th>
                                <th className="px-3 py-3 text-left text-sm font-semibold text-black">Contact Email</th>
                                <th className="px-3 py-3 text-left text-sm font-semibold text-black">Address</th>
                                {/* <th className="px-3 py-3 text-left text-sm font-semibold text-black">Created Date</th> */}
                                <th className="px-3 py-3 text-left text-sm font-semibold text-black">Permit</th>
                                <th className="px-3 py-3 text-left text-sm font-semibold text-black">Verified</th>
                                <th className="px-3 py-3 text-left text-sm font-semibold text-black rounded-tr-lg">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAccounts.length === 0 ? (
                                <tr>
                                    <td colSpan="9" className="px-4 py-4 text-center text-sm text-gray-500">
                                        No company found
                                    </td>
                                </tr>
                            ) : (
                                currentAccounts.map((account, index) => (
                                    <tr key={account.id || index} className="border-b border-gray-200 hover:bg-gray-50">
                                        <td className="px-3 py-3 text-sm text-gray-700">{account.companyName}</td>
                                        <td className="px-3 py-3 text-sm text-gray-700">
                                            <a
                                                href={`https://mail.google.com/mail/?view=cm&fs=1&to=${account.email}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:underline"
                                            >
                                                {account.email}
                                            </a>
                                        </td>
                                        <td className="px-3 py-3 text-sm text-gray-700">{account.contact_person_name || '-'}</td>
                                        <td className="px-3 py-3 text-sm text-gray-700">
                                            {account.contact_person_email ? (
                                                <a
                                                    href={`https://mail.google.com/mail/?view=cm&fs=1&to=${account.contact_person_email}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:underline"
                                                >
                                                    {truncateText(account.contact_person_email)}
                                                </a>
                                            ) : (
                                                '-'
                                            )}
                                        </td>
                                        <td className="px-3 py-3 text-sm text-gray-700">{truncateText(account.company_address) || '-'}</td>
                                        {/* <td className="px-3 py-3 text-sm text-gray-700">{formatCreatedDate(account.createdAt)}</td> */}
                                        <td className="px-3 py-3 text-sm text-gray-700">
                                            {account.business_permit ? (
                                                <a
                                                    href={account.business_permit}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:text-blue-800 underline"
                                                >
                                                    View
                                                </a>
                                            ) : '-'}
                                        </td>
                                        <td className="px-3 py-3 text-sm text-gray-700">
                                            {account.verified ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    Verified
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                    Unverified
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-3 py-3 text-3xl text-gray-700 relative">
                                            <button
                                                className="text-gray-500 hover:text-blue-700"
                                                onClick={() => handleActionClick(account)}
                                            >
                                                <AiOutlineEllipsis />
                                            </button>
                                            {selectedAccount && selectedAccount.id === account.id && (
                                                <div
                                                    ref={dropdownRef}
                                                    className="absolute bg-white border shadow-md mt-2 top-5 rounded-md py-2 w-28 right-1 z-10"
                                                >
                                                    <button
                                                        onClick={() => handleEditClick(account)}
                                                        className="flex items-center w-full text-sm text-gray-700 hover:bg-gray-100 py-2 px-4"
                                                    >
                                                        <AiOutlineEdit className="mr-2" />
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteClick(account)}
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
                                    Showing <span className="font-medium">{filteredAccounts.length > 0 ? indexOfFirstAccount + 1 : 0}</span> to{" "}
                                    <span className="font-medium">
                                        {Math.min(indexOfLastAccount, filteredAccounts.length)}
                                    </span>{" "}
                                    of <span className="font-medium">{filteredAccounts.length}</span> results
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
            {isEditModalOpen && editingAccount && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm transition-opacity duration-200">
                    <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-xl mx-4 transform transition-all duration-200 scale-100">
                        <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center tracking-tight">
                            Edit Employer Details
                        </h3>
                        <form onSubmit={handleSubmitEdit}>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="col-span-2 sm:col-span-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Company Name
                                    </label>
                                    <input
                                        type="text"
                                        name="companyName"
                                        value={editingAccount.companyName || ''}
                                        readOnly
                                        className="w-full px-3 py-2 border bg-gray-50 text-gray-600 border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                                    />
                                </div>
                                <div className="col-span-2 sm:col-span-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={editingAccount.email || ''}
                                        readOnly
                                        className="w-full px-3 py-2 border bg-gray-50 text-gray-600 border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                                    />
                                </div>
                                <div className="col-span-2 sm:col-span-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Contact Person Name
                                    </label>
                                    <input
                                        type="text"
                                        name="contact_person_name"
                                        value={editingAccount.contact_person_name || ''}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                                    />
                                </div>
                                <div className="col-span-2 sm:col-span-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Contact Person Email
                                    </label>
                                    <input
                                        type="email"
                                        name="contact_person_email"
                                        value={editingAccount.contact_person_email || ''}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Company Address
                                    </label>
                                    <input
                                        type="text"
                                        name="company_address"
                                        value={editingAccount.company_address || ''}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Business Permit URL
                                    </label>
                                    <input
                                        type="text"
                                        name="business_permit"
                                        value={editingAccount.business_permit || ''}
                                        readOnly
                                        className="w-full px-3 py-2 border bg-gray-50 text-gray-600 cursor-default border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                                    />
                                    {editingAccount.business_permit && (
                                        <div className="mt-2">
                                            <a
                                                href={editingAccount.business_permit}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:text-blue-800 text-sm"
                                            >
                                                View Current Permit
                                            </a>
                                        </div>
                                    )}
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

export default ManageEmployerAccounts;