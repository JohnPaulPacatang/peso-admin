import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { BeatLoader } from "react-spinners";
import { CiSearch } from "react-icons/ci";
import { IoChevronBackOutline } from "react-icons/io5";
import { FaRegFilePdf, FaFileCsv } from "react-icons/fa6";
import { CSVLink } from 'react-csv';
import { Link } from "react-router-dom";
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const DeletedLogsUsersTable = () => {
    const [allDeletedUsers, setAllDeletedUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSearching, setIsSearching] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [logsPerPage] = useState(10);

    useEffect(() => {
        const fetchAllDeletedLogs = async () => {
            setIsLoading(true);
            try {
                const logsQuery = query(
                    collection(db, "deleted_logs"),
                    where("accType", "==", "user")
                );

                const querySnapshot = await getDocs(logsQuery);
                const logsData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                }));

                logsData.sort((a, b) => {
                    const aTime = a.deletedAt ? a.deletedAt.seconds : 0;
                    const bTime = b.deletedAt ? b.deletedAt.seconds : 0;
                    return bTime - aTime;
                });

                setAllDeletedUsers(logsData);
                setFilteredUsers(logsData);
            } catch (error) {
                console.error('Error fetching deleted logs:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAllDeletedLogs();
    }, []);

    useEffect(() => {
        const performSearch = async () => {
            setIsSearching(true);

            try {
                await new Promise(resolve => setTimeout(resolve, 300));

                if (searchTerm.trim() === '') {
                    setFilteredUsers(allDeletedUsers);
                } else {
                    const lowercaseSearch = searchTerm.toLowerCase();
                    const filtered = allDeletedUsers.filter(user => {
                        return user.name && user.name.toLowerCase().includes(lowercaseSearch);
                    });
                    setFilteredUsers(filtered);
                }
                setCurrentPage(1);
            } finally {
                setIsSearching(false);
            }
        };

        performSearch();
    }, [searchTerm, allDeletedUsers]);

    // Pagination logic
    const indexOfLastLog = currentPage * logsPerPage;
    const indexOfFirstLog = indexOfLastLog - logsPerPage;
    const currentLogs = filteredUsers.slice(indexOfFirstLog, indexOfLastLog);
    const totalPages = Math.ceil(filteredUsers.length / logsPerPage);

    const paginate = (pageNumber) => {
        if (pageNumber > 0 && pageNumber <= totalPages) {
            setCurrentPage(pageNumber);
        }
    };

    const clearSearch = () => {
        setSearchTerm('');
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
        const pageHeight = doc.internal.pageSize.getHeight();
        const marginX = 10;

        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(52, 73, 94);
        doc.text('Deleted Users Report', pageWidth / 2, 20, { align: 'center' });

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

        const headers = [['User ID', 'Name', 'Email', 'Deleted At']];
        const tableData = filteredUsers.map(log => [
            log.userId || 'N/A',
            log.name || 'N/A',
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

    const prepareCSVData = () => {
        const headers = [
            { label: 'User ID', key: 'userId' },
            { label: 'Name', key: 'name' },
            { label: 'Email', key: 'email' },
            { label: 'Deleted At', key: 'deletedAt' }
        ];

        const csvData = filteredUsers.map(log => ({
            userId: log.userId || 'N/A',
            name: log.name || 'N/A',
            email: log.email || 'N/A',
            deletedAt: log.deletedAt ?
                new Date(log.deletedAt.seconds * 1000).toLocaleDateString('en-US') :
                'N/A'
        }));

        return { headers, data: csvData };
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
                    <h1 className="text-2xl sm:text-2xl font-bold text-gray-800">Deleted User Logs</h1>
                    <div className="flex space-x-4">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search by Name..."
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
                        <button
                            onClick={handleExportPDF}
                            className="bg-white text-gray-700 border border-gray-300 hover:bg-gray-100 py-2 px-4 rounded-lg text-sm flex items-center gap-1 w-full sm:w-auto justify-center sm:justify-start"
                        >
                            <FaRegFilePdf className="text-red-600" /> Export PDF
                        </button>
                        <CSVLink
                            data={prepareCSVData().data}
                            headers={prepareCSVData().headers}
                            filename={`deleted-users-report-${new Date().toISOString().slice(0, 10)}.csv`}
                            className="bg-white text-gray-700 border border-gray-300  hover:bg-gray-100 py-2 px-4 rounded-lg text-sm flex items-center gap-1 w-full sm:w-auto justify-center sm:justify-start"
                        >
                            <FaFileCsv className="text-green-600" /> Export CSV
                        </CSVLink>

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
                                <th className="px-3 py-3 text-left text-sm font-semibold text-black rounded-tl-lg">User ID</th>
                                <th className="px-3 py-3 text-left text-sm font-semibold text-black">Name</th>
                                <th className="px-3 py-3 text-left text-sm font-semibold text-black">Email</th>
                                <th className="px-3 py-3 text-left text-sm font-semibold text-black rounded-tr-lg">Deleted At</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isSearching ? (
                                <tr>
                                    <td colSpan="4" className="px-4 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <BeatLoader color="#36d7b7" size={10} />
                                        </div>
                                    </td>
                                </tr>
                            ) : currentLogs.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-4 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                            </svg>
                                            <p className="text-gray-500 text-lg font-medium">No deleted users found matching your search criteria.</p>
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
                                currentLogs.map((log) => (
                                    <tr key={log.id} className="border-b border-gray-200 hover:bg-gray-50">
                                        <td className="px-3 py-3 text-sm text-gray-700">{log.userId || 'N/A'}</td>
                                        <td className="px-3 py-3 text-sm text-gray-700">{log.name || 'N/A'}</td>
                                        <td className="px-3 py-3 text-sm text-gray-700">{log.email || 'N/A'}</td>
                                        <td className="px-3 py-3 text-sm text-gray-700">{formatTimestamp(log.deletedAt)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>

                    <div className="px-6 py-3 flex items-center justify-between border-t border-gray-200">
                        <div className="flex-1 flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-700">
                                    Showing <span className="font-medium">{filteredUsers.length > 0 ? indexOfFirstLog + 1 : 0}</span> to{" "}
                                    <span className="font-medium">
                                        {Math.min(indexOfLastLog, filteredUsers.length)}
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
        </div>
    );
};

export default DeletedLogsUsersTable;