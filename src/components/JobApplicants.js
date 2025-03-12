import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { BeatLoader } from "react-spinners";
import { CiSearch } from "react-icons/ci";
import { MdDeleteForever } from "react-icons/md";
import { IoChevronBackOutline } from "react-icons/io5";
import { FaRegFilePdf } from "react-icons/fa6";
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import toast from 'react-hot-toast';

const JobApplicants = () => {
    const [applications, setApplications] = useState([]);
    const [filteredApplications, setFilteredApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();
    const { jobId } = useParams();
    const [currentPage, setCurrentPage] = useState(1);
    const [applicationsPerPage] = useState(15);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [applicationToDelete, setApplicationToDelete] = useState(null);

    // Fetch all applications for this job once
    useEffect(() => {
        const fetchApplications = async () => {
            setLoading(true);
            try {
                const applicationsQuery = query(
                    collection(db, 'applications'),
                    where('job_id', '==', jobId)
                );

                const querySnapshot = await getDocs(applicationsQuery);
                const fetchedApplications = querySnapshot.docs.map((doc) => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        applicantName: data.applicant_name,
                        applicantEmail: data.applicant_email,
                        applicantContact: data.applicant_contact,
                        applicantAddress: data.applicant_address,
                        company: data.company,
                        jobTitle: data.job_title,
                        resumeLink: data.resume_link,
                        timestamp: data.timestamp?.toDate(),
                    };
                });

                const sortedApplications = fetchedApplications.sort((a, b) =>
                    b.timestamp - a.timestamp
                );

                setApplications(sortedApplications);
                setFilteredApplications(sortedApplications);
            } catch (error) {
                console.error('Error fetching applications:', error);
                toast.error("Failed to load applications");
            } finally {
                setLoading(false);
            }
        };

        if (jobId) {
            fetchApplications();
        }
    }, [jobId]);

    // Real-time filtering as user types with debounce effect
    useEffect(() => {
        // Show search loading state
        if (searchTerm.trim() !== '') {
            setSearchLoading(true);
        }

        // Set a timeout to simulate search processing and prevent excessive rerenders
        const searchTimeout = setTimeout(() => {
            if (searchTerm.trim() === '') {
                setFilteredApplications(applications);
                setCurrentPage(1);
                setSearchLoading(false);
                return;
            }

            const lowercaseSearchTerm = searchTerm.toLowerCase();
            const filtered = applications.filter(app =>
                app.applicantName.toLowerCase().includes(lowercaseSearchTerm)
            );

            setFilteredApplications(filtered);
            setCurrentPage(1); // Reset to first page when search results change
            setSearchLoading(false);
        }, 500); // 500ms debounce delay

        // Cleanup timeout on component unmount or when searchTerm changes
        return () => clearTimeout(searchTimeout);
    }, [searchTerm, applications]);

    // Clear search and show all applications
    const clearSearch = () => {
        setSearchTerm('');
    };

    // Pagination logic
    const indexOfLastApplication = currentPage * applicationsPerPage;
    const indexOfFirstApplication = indexOfLastApplication - applicationsPerPage;
    const currentApplications = filteredApplications.slice(indexOfFirstApplication, indexOfLastApplication);
    const totalPages = Math.ceil(filteredApplications.length / applicationsPerPage);

    // Pagination function
    const paginate = (pageNumber) => {
        if (pageNumber > 0 && pageNumber <= totalPages) {
            setCurrentPage(pageNumber);
        }
    };

    const handleExportPDF = () => {
        const doc = new jsPDF();

        const pageWidth = doc.internal.pageSize.getWidth();
        const marginX = 10;

        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text('Job Applicants Report', pageWidth / 2, 20, { align: 'center' });

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Generated on ${new Date().toLocaleDateString()}`, pageWidth / 2, 28, { align: 'center' });

        const headers = [['Name', 'Email', 'Contact', 'Address', 'Application Date']];
        const tableData = filteredApplications.map(app => [
            app.applicantName,
            app.applicantEmail,
            app.applicantContact,
            app.applicantAddress,
            app.timestamp ? format(app.timestamp, 'MMM dd, yyyy') : 'N/A',
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

    // Delete functions
    const openDeleteConfirm = (application) => {
        setApplicationToDelete(application);
        setIsDeleteConfirmOpen(true);
    };

    const cancelDelete = () => {
        setIsDeleteConfirmOpen(false);
        setApplicationToDelete(null);
    };

    const confirmDelete = () => {
        if (!applicationToDelete) return;

        // Close the modal first for better UX
        setIsDeleteConfirmOpen(false);

        // Use toast.promise to track the async operation
        toast.promise(
            deleteApplication(),
            {
                loading: 'Deleting application...',
                success: 'Application deleted',
                error: 'Failed to delete application'
            }
        );
    };

    const deleteApplication = async () => {
        try {
            await deleteDoc(doc(db, 'applications', applicationToDelete.id));

            const updatedApplications = applications.filter(app => app.id !== applicationToDelete.id);
            setApplications(updatedApplications);
            setFilteredApplications(updatedApplications);

            setApplicationToDelete(null);

            return true;
        } catch (error) {
            console.error('Error deleting application:', error);
            setApplicationToDelete(null);
            throw error;
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-screen">
                <BeatLoader color="#36d7b7" size={15} />
                <p className="mt-4 text-gray-600">Loading Applicants...</p>
            </div>
        );
    }

    return (
        <div className="py-10 px-4 sm:px-6 lg:px-10">
            <div className="max-w-8xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Job Applicants</h1>
                    <div className="flex items-center space-x-4">
                        <div className="relative flex items-center">
                            <input
                                type="text"
                                placeholder="Search by name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="border border-gray-300 pl-10 pr-4 py-2 rounded-lg text-sm"
                            />
                            <CiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />

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
                            className="bg-green-500 text-white hover:bg-green-700 py-2 px-4 rounded-lg text-sm flex items-center gap-1">
                            <FaRegFilePdf /> Export PDF
                        </button>
                        <button
                            onClick={() => navigate(-1)}
                            className="bg-blue-500 text-white hover:bg-blue-700 py-2 px-4 rounded-lg text-sm flex items-center gap-1">
                            <IoChevronBackOutline /> Back to Jobs
                        </button>
                    </div>
                </div>

                <div className="bg-white shadow-md rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead>
                                <tr className="bg-gray-300">
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-black rounded-tl-lg">Applicant Name</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-black">Email</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-black">Contact</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-black">Address</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-black">Application Date</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-black">Resume</th>
                                    <th className="px-4 py-3 text-center text-sm font-semibold text-black rounded-tr-lg">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {searchLoading ? (
                                    <tr>
                                        <td colSpan="7" className="px-4 py-12 text-center">
                                            <div className="flex flex-col items-center justify-center">
                                                <BeatLoader color="#36d7b7" size={12} />
                                            </div>
                                        </td>
                                    </tr>
                                ) : currentApplications.length > 0 ? (
                                    currentApplications.map((application) => (
                                        <tr key={application.id} className="border-b border-gray-200 hover:bg-gray-50">
                                            <td className="px-4 py-3 text-sm text-gray-700">{application.applicantName}</td>
                                            <td className="px-4 py-3 text-sm text-gray-700">
                                                <a
                                                    href={`https://mail.google.com/mail/?view=cm&fs=1&to=${application.applicantEmail}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:text-blue-800"
                                                >
                                                    {application.applicantEmail}
                                                </a>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-700">{application.applicantContact}</td>
                                            <td className="px-4 py-3 text-sm text-gray-700">{application.applicantAddress}</td>
                                            <td className="px-4 py-3 text-sm text-gray-700">
                                                {application.timestamp ? format(application.timestamp, 'MMM dd, yyyy') : 'N/A'}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-700">
                                                <a href={application.resumeLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                                                    View Resume
                                                </a>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-700 text-center">
                                                <button
                                                    onClick={() => openDeleteConfirm(application)}
                                                    className="text-red-500 hover:text-red-700 focus:outline-none transition-colors duration-150"
                                                    aria-label="Delete application"
                                                    title="Delete application"
                                                >
                                                    <MdDeleteForever size={20} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="px-4 py-12 text-center">
                                            <div className="flex flex-col items-center justify-center">
                                                <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                                </svg>
                                                <p className="text-gray-500 text-lg font-medium">No applicants found matching your search criteria.</p>
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
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination section */}
                    <div className="px-6 py-3 flex items-center justify-between border-t border-gray-200">
                        <div className="flex-1 flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-700">
                                    Showing <span className="font-medium">{filteredApplications.length > 0 ? indexOfFirstApplication + 1 : 0}</span> to{" "}
                                    <span className="font-medium">
                                        {Math.min(indexOfLastApplication, filteredApplications.length)}
                                    </span>{" "}
                                    of <span className="font-medium">{filteredApplications.length}</span> results
                                </p>
                            </div>
                            {filteredApplications.length > 0 && totalPages > 1 && (
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
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete confirmation modal */}
            {isDeleteConfirmOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm transition-opacity duration-200">
                    <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4 transform transition-all duration-200 scale-100">
                        <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center tracking-tight">
                            Confirm Deletion
                        </h3>
                        <p className="text-gray-600 text-center mb-8 text-sm">
                            Are you sure you want to delete this application from {applicationToDelete?.applicantName}? This action cannot be undone.
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
        </div>
    );
};

export default JobApplicants;