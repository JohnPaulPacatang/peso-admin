import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { BeatLoader } from "react-spinners";
import { CiSearch } from "react-icons/ci";
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const JobApplicants = () => {
    const [applications, setApplications] = useState([]);
    const [filteredApplications, setFilteredApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();
    const { jobId } = useParams();
    const [currentPage, setCurrentPage] = useState(1);
    const [applicationsPerPage] = useState(15);

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
            } finally {
                setLoading(false);
            }
        };

        if (jobId) {
            fetchApplications();
        }
    }, [jobId]);

    // Real-time filtering as user types
    useEffect(() => {
        if (searchTerm.trim() === '') {
            setFilteredApplications(applications);
            setCurrentPage(1);
            return;
        }

        const lowercaseSearchTerm = searchTerm.toLowerCase();
        const filtered = applications.filter(app => 
            app.applicantName.toLowerCase().includes(lowercaseSearchTerm)
        );
        
        setFilteredApplications(filtered);
        setCurrentPage(1); // Reset to first page when search results change
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
                                className="border border-gray-300 pl-10 pr-4 py-2 rounded-full text-sm"
                            />
                            <CiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
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
                            className="bg-green-500 text-white hover:bg-green-700 py-2 px-4 rounded-full text-sm font-semibold"
                        >
                            Export PDF
                        </button>
                        <button
                            onClick={() => navigate(-1)}
                            className="bg-blue-500 text-white hover:bg-blue-700 py-2 px-4 rounded-full text-sm font-semibold"
                        >
                            Back to Jobs
                        </button>
                    </div>
                </div>

                <div className="bg-white shadow-md rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead>
                                <tr className="bg-gray-300">
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-black">Applicant Name</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-black">Email</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-black">Contact</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-black">Address</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-black">Application Date</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-black">Resume</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentApplications.length > 0 ? (
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
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="px-4 py-4 text-center text-sm text-gray-500">
                                            No applications found
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
        </div>
    );
};

export default JobApplicants;