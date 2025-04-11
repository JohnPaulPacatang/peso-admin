import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AiOutlineEllipsis, AiOutlineEdit, AiOutlineDelete } from 'react-icons/ai';
import { CiSearch } from "react-icons/ci";
import { collection, getDocs, doc, deleteDoc, updateDoc, query, where } from "firebase/firestore";
import { FaRegFilePdf, FaFileCsv } from "react-icons/fa6";
import { CSVLink } from 'react-csv';
import { db } from "../firebase";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { BeatLoader } from "react-spinners";
import jsPDF from 'jspdf';
import 'jspdf-autotable';


const Jobs = () => {
    const navigate = useNavigate();
    const [jobs, setJobs] = useState([]);
    const [filteredJobs, setFilteredJobs] = useState([]);
    const [selectedJob, setSelectedJob] = useState(null);
    const [sortOption, setSortOption] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [companies, setCompanies] = useState([]);
    const [selectedCompany, setSelectedCompany] = useState('all');
    const dropdownRef = useRef(null);
    const searchInputRef = useRef(null);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [applicantCounts, setApplicantCounts] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSearching, setIsSearching] = useState(false);

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [jobsPerPage] = useState(10);

    // Calculate pagination values
    const indexOfLastJob = currentPage * jobsPerPage;
    const indexOfFirstJob = indexOfLastJob - jobsPerPage;
    const currentJobs = filteredJobs.slice(indexOfFirstJob, indexOfLastJob);
    const totalPages = Math.ceil(filteredJobs.length / jobsPerPage);

    // Function to change page
    const paginate = (pageNumber) => {
        if (pageNumber > 0 && pageNumber <= totalPages) {
            setCurrentPage(pageNumber);
        }
    };

    //fetch jobs
    useEffect(() => {
        const fetchApplicantCounts = async () => {
            if (jobs.length === 0) return;

            try {
                const counts = {};
                const promises = jobs.map(async (job) => {
                    const q = query(
                        collection(db, 'applications'),
                        where('job_id', '==', job.id)
                    );
                    const snapshot = await getDocs(q);
                    counts[job.id] = snapshot.size;
                });

                await Promise.all(promises);
                setApplicantCounts(counts);
            } catch (error) {
                console.error('Error fetching applicant count:', error);
            }
        };

        fetchApplicantCounts();
    }, [jobs]);

    //closed open
    useEffect(() => {
        const fetchJobs = async (sortValue) => {
            setIsLoading(true);
            try {
                let jobsQuery;
                if (sortValue === 'open') {
                    jobsQuery = query(collection(db, 'jobs'), where('isOpen', '==', true));
                } else if (sortValue === 'closed') {
                    jobsQuery = query(collection(db, 'jobs'), where('isOpen', '==', false));
                } else {
                    jobsQuery = collection(db, 'jobs');
                }

                const querySnapshot = await getDocs(jobsQuery);
                const fetchedJobs = querySnapshot.docs.map((doc) => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        title: data.job_title,
                        company: data.company,
                        location: data.location,
                        salaryMin: data.salary_min,
                        salaryMax: data.salary_max,
                        jobPosted: data.date_posted ? data.date_posted.toDate() : null,
                        applicants: 0,
                        isOpen: data.isOpen ?? true,
                        jobCategory: data.job_category,
                        jobDescription: data.job_description,
                        jobType: data.job_type,
                        logo: data.logo,
                        skills: data.skills,
                        experience: data.experience,
                    };
                });

                fetchedJobs.sort((a, b) => (b.jobPosted ? b.jobPosted.getTime() : 0) - (a.jobPosted ? a.jobPosted.getTime() : 0));

                const uniqueCompanies = [...new Set(fetchedJobs.map(job => job.company))];
                setCompanies(uniqueCompanies);

                setJobs(fetchedJobs);
                setFilteredJobs(fetchedJobs);
                setCurrentPage(1);
            } catch (error) {
                console.error('Error fetching jobs:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchJobs(sortOption);
    }, [sortOption]);

    //search har
    const filterJobs = useCallback(() => {
        let result = [...jobs];
        if (searchTerm.trim() !== '') {
            const searchLower = searchTerm.toLowerCase();
            result = result.filter(job =>
                job.title.toLowerCase().includes(searchLower)
            );
        }

        if (selectedCompany !== 'all') {
            result = result.filter(job => job.company === selectedCompany);
        }

        setFilteredJobs(result);
        setCurrentPage(1);
    }, [jobs, searchTerm, selectedCompany]);


    useEffect(() => {
        setIsSearching(true);
        const debounceTimer = setTimeout(() => {
            filterJobs();
            setIsSearching(false);
            if (searchTerm.trim() !== '' && searchInputRef.current) {
                searchInputRef.current.focus();
            }
        }, 500);

        return () => clearTimeout(debounceTimer);
    }, [searchTerm, selectedCompany, jobs, filterJobs]);

    const handleDeleteClick = (job) => {
        setSelectedJob(job);
        setIsDeleteConfirmOpen(true);
    };

    //delete
    const confirmDelete = async () => {
        const deletePromise = new Promise(async (resolve, reject) => {
            try {
                await deleteDoc(doc(db, "jobs", selectedJob.id));

                setJobs(prevJobs => prevJobs.filter(job => job.id !== selectedJob.id));
                setFilteredJobs(prevJobs => prevJobs.filter(job => job.id !== selectedJob.id));

                setIsDeleteConfirmOpen(false);
                setSelectedJob(null);

                resolve("Deleted successfully!");
            } catch (error) {
                reject("Failed to delete!");
            }
        });

        toast.promise(deletePromise, {
            loading: "Deleting job, please wait...",
            success: "Deleted successfully!",
            error: "Failed to delete!",
        });
    };

    const cancelDelete = () => {
        setIsDeleteConfirmOpen(false);
        setSelectedJob(null);
    };

    const handleActionClick = (job) => {
        setSelectedJob(selectedJob && selectedJob.id === job.id ? null : job);
    };

    //papunta edit page ng jobs
    const handleUpdate = (job) => {
        navigate(`/admin/jobs/edit/${job.id}`, {
            state: {
                job: {
                    id: job.id,
                    company: job.company,
                    job_title: job.title,
                    job_description: job.jobDescription,
                    job_category: job.jobCategory,
                    location: job.location,
                    salary_min: job.salaryMin,
                    salary_max: job.salaryMax,
                    job_type: job.jobType,
                    experience: job.experience,
                    logo: job.logo,
                    skills: job.skills,
                }
            }
        });
    };

    //taga open saka close
    const handleToggleJobStatus = async (job) => {
        const togglePromise = new Promise(async (resolve, reject) => {
            try {
                const jobRef = doc(db, "jobs", job.id);
                const newStatus = !job.isOpen;

                await updateDoc(jobRef, { isOpen: newStatus });

                const updatedJobs = jobs.map((j) =>
                    j.id === job.id ? { ...j, isOpen: newStatus } : j
                );

                setJobs(updatedJobs);
                setFilteredJobs(filteredJobs.map((j) =>
                    j.id === job.id ? { ...j, isOpen: newStatus } : j
                ));

                resolve(`Job marked as ${newStatus ? "Open" : "Closed"}`);
            } catch (error) {
                console.error("Error updating job status:", error);
                reject("Failed to update job status");
            }
        });

        toast.promise(togglePromise, {
            loading: "Updating job status, please wait...",
            success: (msg) => msg,
            error: "Failed to update job status.",
        });
    };


    //export pdf pwedee print
    const handleExportPDF = () => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const marginX = 10;

        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(52, 73, 94);
        doc.text('Jobs Report', pageWidth / 2, 20, { align: 'center' });

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

        const tableData = filteredJobs.map(job => [
            job.title,
            job.company,
            job.location,
            `${job.salaryMin} - ${job.salaryMax}`,
            job.jobPosted ? job.jobPosted.toLocaleDateString('en-US') : 'N/A',
            applicantCounts[job.id] || 0,
            job.isOpen ? 'Open' : 'Closed'
        ]);

        const headers = [['Title', 'Company', 'Location', 'Salary Range', 'Posted Date', 'Applicants', 'Status']];

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

    //export to excel
    const prepareCSVData = () => {
        const headers = [
            { label: 'Title', key: 'title' },
            { label: 'Company', key: 'company' },
            { label: 'Location', key: 'location' },
            { label: 'Salary Range', key: 'salaryRange' },
            { label: 'Posted Date', key: 'postedDate' },
            { label: 'Applicants', key: 'applicants' },
            { label: 'Status', key: 'status' }
        ];

        const csvData = filteredJobs.map(job => ({
            title: job.title,
            company: job.company,
            location: job.location,
            salaryRange: `${job.salaryMin} - ${job.salaryMax}`,
            postedDate: job.jobPosted ? job.jobPosted.toLocaleDateString('en-US') : 'N/A',
            applicants: applicantCounts[job.id] || 0,
            status: job.isOpen ? 'Open' : 'Closed'
        }));

        return { headers, data: csvData };
    };


    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isDeleteConfirmOpen) return;
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setSelectedJob(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isDeleteConfirmOpen]);

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const clearSearch = () => {
        setSearchTerm('');
        if (searchInputRef.current) {
            searchInputRef.current.focus();
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-screen">
                <BeatLoader color="#36d7b7" size={15} />
                <p className="mt-4 text-gray-600">Loading Jobs...</p>
            </div>
        );
    }

    return (
        <div className="py-10 px-4 sm:px-6 lg:px-10">
            {/* Header Section */}
            <div className="max-w-8xl mx-auto py-4">
                <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Job Listings</h1>
                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                        <div className="relative w-full sm:w-auto">
                            <input
                                type="text"
                                placeholder="Search by Job Title..."
                                value={searchTerm}
                                onChange={handleSearchChange}
                                ref={searchInputRef}
                                className="border border-gray-300 pl-10 pr-4 py-2 rounded-lg text-sm w-full sm:w-64 md:w-80"
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
                        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-4 w-full sm:w-auto">
                            <div className="flex items-center space-x-2 w-full sm:w-auto">
                                <p className="font-semibold">Status:</p>
                                <select
                                    value={sortOption}
                                    onChange={(e) => setSortOption(e.target.value)}
                                    className="border border-gray-300 rounded-lg py-2 px-4 text-sm text-gray-700 w-full sm:w-auto"
                                >
                                    <option value="all">All Jobs</option>
                                    <option value="open">Open</option>
                                    <option value="closed">Closed</option>
                                </select>
                            </div>
                            <div className="flex items-center space-x-2 w-full sm:w-auto">
                                <p className="font-semibold">Company:</p>
                                <select
                                    value={selectedCompany}
                                    onChange={(e) => setSelectedCompany(e.target.value)}
                                    className="border border-gray-300 rounded-lg py-2 px-4 text-sm text-gray-700 w-full sm:w-auto"
                                >
                                    <option value="all">All Companies</option>
                                    {companies.map((company) => (
                                        <option key={company} value={company}>{company}</option>
                                    ))}
                                </select>
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
                                filename={`jobs-report-${new Date().toISOString().slice(0, 10)}.csv`}
                                className="bg-white text-gray-700 border border-gray-300  hover:bg-gray-100 py-2 px-4 rounded-lg text-sm flex items-center gap-1 w-full sm:w-auto justify-center sm:justify-start"
                            >
                                <FaFileCsv className="text-green-600" /> Export CSV
                            </CSVLink>
                        </div>
                    </div>
                </div>
            </div>

            {/* Jobs Table */}
            <div className="max-w-8xl mx-auto pt-4">
                <div className="shadow-md sm:rounded-lg bg-white">
                    <table className="min-w-full border-gray-200 rounded-lg">
                        <thead>
                            <tr className="bg-gray-300">
                                <th className="px-3 py-3 text-left text-sm font-semibold text-black rounded-tl-lg">Title</th>
                                <th className="px-3 py-3 text-left text-sm font-semibold text-black">Company</th>
                                <th className="px-3 py-3 text-left text-sm font-semibold text-black">Location</th>
                                <th className="px-3 py-3 text-left text-sm font-semibold text-black">Salary Range</th>
                                <th className="px-3 py-3 text-left text-sm font-semibold text-black">Job Posted</th>
                                <th className="px-3 py-3 text-left text-sm font-semibold text-black">Applicants</th>
                                <th className="px-3 py-3 text-left text-sm font-semibold text-black">Status</th>
                                <th className="px-3 py-3 text-left text-sm font-semibold text-black rounded-tr-lg">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isSearching ? (
                                <tr>
                                    <td colSpan="8" className="px-4 py-4 text-center">
                                        <div className="flex justify-center items-center py-8">
                                            <BeatLoader color="#36d7b7" size={10} />
                                        </div>
                                    </td>
                                </tr>
                            ) : currentJobs.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="px-4 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                            </svg>
                                            <p className="text-gray-500 text-lg font-medium">No jobs found matching your search criteria.</p>
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
                                currentJobs.map((job) => (
                                    <tr key={job.id} className="border-b border-gray-200">
                                        <td className="px-3 py-3 text-sm text-gray-700">{job.title}</td>
                                        <td className="px-3 py-3 text-sm text-gray-700">{job.company}</td>
                                        <td className="px-3 py-3 text-sm text-gray-700">{job.location}</td>
                                        <td className="px-3 py-3 text-sm text-gray-700">{job.salaryMin} - {job.salaryMax}</td>
                                        <td className="px-3 py-3 text-sm text-gray-700">
                                            {job.jobPosted ? job.jobPosted.toLocaleDateString('en-US') : 'N/A'}
                                        </td>
                                        <td className="px-3 py-3 text-sm text-gray-700">
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    onClick={() => navigate(`/admin/jobs/${job.id}/applicants`)}
                                                    className="bg-blue-600 text-white hover:bg-blue-700 px-3 py-1 rounded-full text-xs font-semibold"
                                                >
                                                    {applicantCounts[job.id] || 0} applicants
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-3 py-3 text-sm">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${job.isOpen
                                                ? 'bg-green-100 text-green-600'
                                                : 'bg-red-100 text-red-600'
                                                }`}>
                                                {job.isOpen ? 'Open' : 'Closed'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 text-3xl text-gray-700 relative">
                                            <button className="text-gray-500 hover:text-blue-700" onClick={() => handleActionClick(job)}>
                                                <AiOutlineEllipsis />
                                            </button>
                                            {selectedJob && selectedJob.id === job.id && (
                                                <div ref={dropdownRef} className="absolute bg-white border shadow-md mt-2 top-10 rounded-md py-2 w-36 right-4 z-10">
                                                    <button onClick={() => handleUpdate(job)} className="flex items-center w-full text-sm text-gray-700 hover:bg-gray-100 py-2 px-4">
                                                        <AiOutlineEdit className="mr-2" />
                                                        Edit
                                                    </button>
                                                    <button onClick={() => handleDeleteClick(job)} className="flex items-center w-full text-sm text-red-600 hover:bg-gray-100 py-2 px-4">
                                                        <AiOutlineDelete className="mr-2" />
                                                        Delete
                                                    </button>
                                                    <button
                                                        onClick={() => handleToggleJobStatus(job)}
                                                        className="flex items-center w-full text-sm text-blue-600 hover:bg-gray-100 py-2 px-4"
                                                    >
                                                        <AiOutlineEdit className="mr-2" />
                                                        <span>Mark {job.isOpen ? 'Closed' : 'Open'}</span>
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>

                    {/*pagination*/}
                    <div className="px-6 py-3 flex items-center justify-between border-t border-gray-200">
                        <div className="flex-1 flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-700">
                                    Showing <span className="font-medium">{indexOfFirstJob + 1}</span> to{" "}
                                    <span className="font-medium">
                                        {Math.min(indexOfLastJob, filteredJobs.length)}
                                    </span>{" "}
                                    of <span className="font-medium">{filteredJobs.length}</span> results
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

            {/* Modal for dlete */}
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
        </div>
    );
};

export default Jobs;