import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { BeatLoader } from "react-spinners";
import { CiSearch } from "react-icons/ci";
import { IoChevronBackOutline } from "react-icons/io5";
import { FaRegFilePdf } from "react-icons/fa6";
import { Link } from "react-router-dom";
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const DeletedLogsEmployersTable = () => {
    const [deletedEmployers, setDeletedEmployers] = useState([]);
    const [filteredEmployers, setFilteredEmployers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [logsPerPage] = useState(10);

    useEffect(() => {
        const fetchDeletedLogs = async () => {
            setIsLoading(true);
            try {
                // Fetch all employer deleted logs without filtering in the query
                const logsQuery = query(
                    collection(db, "deleted_logs"),
                    where("accType", "==", "employer")
                );

                const querySnapshot = await getDocs(logsQuery);
                const logsData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                }));

                // Sort by deletion date (most recent first)
                logsData.sort((a, b) => {
                    const aTime = a.deletedAt ? a.deletedAt.seconds : 0;
                    const bTime = b.deletedAt ? b.deletedAt.seconds : 0;
                    return bTime - aTime;
                });

                setDeletedEmployers(logsData);
                setFilteredEmployers(logsData);
            } catch (error) {
                console.error('Error fetching deleted logs:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDeletedLogs();
    }, []);

    // Apply client-side filtering whenever searchTerm changes
    useEffect(() => {
        if (searchTerm.trim() === '') {
            setFilteredEmployers(deletedEmployers);
        } else {
            const lowercaseSearch = searchTerm.toLowerCase();
            const filtered = deletedEmployers.filter(employer => {
                // Case-insensitive search on company name
                const companyName = (employer.companyName || '').toLowerCase();
                const email = (employer.email || '').toLowerCase();
                const employerId = (employer.employerId || '').toLowerCase();
                
                return companyName.includes(lowercaseSearch) || 
                       email.includes(lowercaseSearch) || 
                       employerId.includes(lowercaseSearch);
            });
            setFilteredEmployers(filtered);
            setCurrentPage(1); // Reset to first page when search changes
        }
    }, [searchTerm, deletedEmployers]);

    // Pagination logic
    const indexOfLastLog = currentPage * logsPerPage;
    const indexOfFirstLog = indexOfLastLog - logsPerPage;
    const currentLogs = filteredEmployers.slice(indexOfFirstLog, indexOfLastLog);
    const totalPages = Math.ceil(filteredEmployers.length / logsPerPage);

    const paginate = (pageNumber) => {
        if (pageNumber > 0 && pageNumber <= totalPages) {
            setCurrentPage(pageNumber);
        }
    };

    const formatTimestamp = (timestamp) => {
        if (!timestamp) return 'N/A';
        try {
            return new Date(timestamp.seconds * 1000).toLocaleString();
        } catch (error) {
            return 'Invalid Date';
        }
    };

    const handleExportPDF = () => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const marginX = 10;

        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text('Deleted Employers Report', pageWidth / 2, 20, { align: 'center' });

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Generated on ${new Date().toLocaleDateString()}`, pageWidth / 2, 28, { align: 'center' });

        const headers = [['Employer ID', 'Company Name', 'Email', 'Deleted At']];
        const tableData = filteredEmployers.map(log => [
            log.employerId || 'N/A',
            log.companyName || 'N/A',
            log.email || 'N/A',
            log.deletedAt ? new Date(log.deletedAt.seconds * 1000).toLocaleDateString() : 'N/A'
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

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-screen">
                <BeatLoader color="#36d7b7" size={15} />
                <p className="mt-4 text-gray-600">Loading Deleted Logs...</p>
            </div>
        );
    }

    return (
        <div className="py-10 px-4 sm:px-6 lg:px-10">
            <div className="max-w-8xl mx-auto py-4">
                <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
                    <h1 className="text-2xl sm:text-2xl font-bold text-gray-800">Deleted Employer Logs</h1>
                    <div className="flex space-x-4">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search by company, email, ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="border border-gray-300 pl-10 pr-4 py-2 rounded-lg text-sm w-64 md:w-80"
                            />
                            <CiSearch className="absolute left-3 top-2.5 text-gray-400 text-lg" />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-gray-200 text-gray-700 hover:bg-gray-300 py-1 px-2 rounded-lg text-xs"
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                        <button onClick={handleExportPDF} className="bg-green-600 text-white hover:bg-green-700 py-2 px-4 rounded-lg text-sm flex items-center gap-1">
                            <FaRegFilePdf /> Export PDF
                        </button>
                        <Link to="/admin/manage-employers" className="bg-blue-600 text-white hover:bg-blue-700 py-2 px-4 rounded-lg text-sm flex items-center gap-1">
                            <IoChevronBackOutline /> Back to Employers
                        </Link>
                    </div>
                </div>
            </div>

            <div className="max-w-8xl mx-auto pt-4">
                <div className="shadow-md sm:rounded-lg bg-white">
                    <table className="min-w-full border-gray-200 rounded-lg">
                        <thead>
                            <tr className="bg-gray-300">
                                <th className="px-3 py-3 text-left text-sm font-semibold text-black rounded-tl-lg">Employer ID</th>
                                <th className="px-3 py-3 text-left text-sm font-semibold text-black">Company Name</th>
                                <th className="px-3 py-3 text-left text-sm font-semibold text-black">Email</th>
                                <th className="px-3 py-3 text-left text-sm font-semibold text-black rounded-tr-lg">Deleted At</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentLogs.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-4 py-4 text-center text-sm text-gray-500">
                                        No deleted employer logs found
                                    </td>
                                </tr>
                            ) : (
                                currentLogs.map((log) => (
                                    <tr key={log.id} className="border-b border-gray-200 hover:bg-gray-50">
                                        <td className="px-3 py-3 text-sm text-gray-700">{log.employerId}</td>
                                        <td className="px-3 py-3 text-sm text-gray-700">{log.companyName || 'N/A'}</td>
                                        <td className="px-3 py-3 text-sm text-gray-700">{log.email || 'N/A'}</td>
                                        <td className="px-3 py-3 text-sm text-gray-700">{formatTimestamp(log.deletedAt)}</td>
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
                                    Showing <span className="font-medium">{filteredEmployers.length > 0 ? indexOfFirstLog + 1 : 0}</span> to{" "}
                                    <span className="font-medium">
                                        {Math.min(indexOfLastLog, filteredEmployers.length)}
                                    </span>{" "}
                                    of <span className="font-medium">{filteredEmployers.length}</span> results
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
        </div>
    );
};

export default DeletedLogsEmployersTable;