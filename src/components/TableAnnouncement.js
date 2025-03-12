import React, { useState, useEffect, useRef } from "react";
import { AiOutlineEllipsis } from "react-icons/ai";
import { CiSearch } from "react-icons/ci";
import { collection, getDocs, doc, deleteDoc, updateDoc, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { toast } from "react-hot-toast";
import { BeatLoader } from "react-spinners";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { FaRegFilePdf } from "react-icons/fa6";
import EditAnnouncementModal from "./EditAnnouncementModal";

const TableAnnouncements = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [announcements, setAnnouncements] = useState([]);
    const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [announcementToDelete, setAnnouncementToDelete] = useState(null);
    const dropdownRef = useRef(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [announcementsPerPage] = useState(10);
    const modalRef = useRef(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchAnnouncements = async () => {
            setIsLoading(true);
            try {
                // Declare the base query
                let announcementsQuery;
                const normalizedSearchTerm = searchTerm.trim().toLowerCase();

                if (normalizedSearchTerm !== "") {
                    // Fetch all announcements since we need to filter manually for case-insensitive search
                    announcementsQuery = collection(db, "announcements");
                } else {
                    announcementsQuery = collection(db, "announcements");
                }

                const querySnapshot = await getDocs(announcementsQuery);
                let announcementsData = querySnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));

                if (normalizedSearchTerm !== "") {
                    announcementsData = announcementsData.filter((announcement) =>
                        announcement.title.toLowerCase().includes(normalizedSearchTerm)
                    );
                }

                // Sort by date (newest first)
                announcementsData.sort((a, b) => {
                    if (!a.date || !b.date) return 0;
                    return b.date.toDate() - a.date.toDate();
                });

                setAnnouncements(announcementsData);
            } catch (error) {
                console.error("Error fetching announcements:", error);
                toast.error("Failed to fetch announcements");
            } finally {
                setIsLoading(false);
            }
        };

        const debounceTimer = setTimeout(() => {
            fetchAnnouncements();
        }, 500);

        return () => clearTimeout(debounceTimer);
    }, [searchTerm]);

    // Pagination logic
    const indexOfLastAnnouncement = currentPage * announcementsPerPage;
    const indexOfFirstAnnouncement = indexOfLastAnnouncement - announcementsPerPage;
    const currentAnnouncements = announcements.slice(indexOfFirstAnnouncement, indexOfLastAnnouncement);
    const totalPages = Math.ceil(announcements.length / announcementsPerPage);

    const paginate = (pageNumber) => {
        if (pageNumber > 0 && pageNumber <= totalPages) {
            setCurrentPage(pageNumber);
            setSelectedAnnouncement(null);
        }
    };

    const handleActionClick = (announcement) => {
        setSelectedAnnouncement(announcement);
        setIsDropdownOpen(!isDropdownOpen);
    };

    const handleDelete = (announcement) => {
        setAnnouncementToDelete(announcement);
        setIsDeleteConfirmOpen(true);
    };

    const confirmDelete = async () => {
        const deletePromise = new Promise(async (resolve, reject) => {
            try {
                const docRef = doc(db, "announcements", announcementToDelete.id);
                await deleteDoc(docRef);

                setAnnouncements((prevAnnouncements) =>
                    prevAnnouncements.filter((announcement) => announcement.id !== announcementToDelete.id)
                );

                setIsDeleteConfirmOpen(false);
                resolve("Deleted successfully!");
            } catch (error) {
                setIsDeleteConfirmOpen(false);
                reject("Failed to delete!");
            }
        });

        toast.promise(deletePromise, {
            loading: "Deleting announcement, please wait...",
            success: "Deleted successfully!",
            error: "Failed to delete!",
        });
    };

    const cancelDelete = () => {
        setIsDeleteConfirmOpen(false);
        setAnnouncementToDelete(null);
    };

    const handleEdit = () => {
        setIsModalOpen(true);
        setIsDropdownOpen(false);
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setSelectedAnnouncement(null);
    };

    const handleUpdate = async (updatedAnnouncement) => {
        const updatePromise = new Promise(async (resolve, reject) => {
            try {
                const docRef = doc(db, "announcements", updatedAnnouncement.id);
                await updateDoc(docRef, updatedAnnouncement);

                setAnnouncements((prevAnnouncements) =>
                    prevAnnouncements.map((announcement) =>
                        announcement.id === updatedAnnouncement.id ? updatedAnnouncement : announcement
                    )
                );

                handleModalClose();
                resolve("Updated successfully!");
            } catch (error) {
                reject("Failed to update");
            }
        });

        toast.promise(updatePromise, {
            loading: "Updating announcement, please wait...",
            success: "Updated successfully!",
            error: "Failed to update",
        });
    };

    const handleExportPDF = () => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const marginX = 10;

        // Title
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text('Announcements Report', pageWidth / 2, 20, { align: 'center' });

        // Date
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Generated on ${new Date().toLocaleDateString()}`, pageWidth / 2, 28, { align: 'center' });

        // Table Headers & Data
        const headers = [['Title', 'Description', 'Location', 'Date']];
        const tableData = announcements.map(ann => [
            ann.title,
            ann.description,
            ann.location,
            ann.date ? ann.date.toDate().toLocaleDateString() : 'N/A'
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
            if (isDeleteConfirmOpen) return;
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setSelectedAnnouncement(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isDeleteConfirmOpen]);

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
                <p className="mt-4 text-gray-600">Loading Announcements...</p>
            </div>
        );
    }

    return (
        <div className="py-10 px-4 sm:px-6 lg:px-10">
            {/* Header Section */}
            <div className="max-w-8xl mx-auto py-4">
                <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Announcements</h1>
                    <div className="flex space-x-3">
                        {/* Search input with icon */}
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search by Title..."
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
                    </div>
                </div>
            </div>

            {/* Announcements Table */}
            <div className="max-w-8xl mx-auto pt-4">
                <div className="shadow-md sm:rounded-lg bg-white">
                    <table className="min-w-full border-gray-200 rounded-lg">
                        <thead>
                            <tr className="bg-gray-300">
                                <th className="px-3 py-3 text-left text-sm font-semibold text-black rounded-tl-lg">Title</th>
                                <th className="px-3 py-3 text-left text-sm font-semibold text-black">Description</th>
                                <th className="px-3 py-3 text-left text-sm font-semibold text-black">Location</th>
                                <th className="px-3 py-3 text-left text-sm font-semibold text-black">Posted Date</th>
                                <th className="px-3 py-3 text-left text-sm font-semibold text-black rounded-tr-lg">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentAnnouncements.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="px-4 py-4 text-center text-sm text-gray-500">
                                        No announcement found
                                    </td>
                                </tr>
                            ) : (
                                currentAnnouncements.map((announcement) => (
                                    <tr key={announcement.id} className="border-b border-gray-200">
                                        <td className="px-3 py-3 text-sm text-gray-700">{announcement.title}</td>
                                        <td className="px-3 py-3 text-sm text-gray-700">{announcement.description}</td>
                                        <td className="px-3 py-3 text-sm text-gray-700">{announcement.location}</td>
                                        <td className="px-3 py-3 text-sm text-gray-700">
                                            {announcement.date && announcement.date.toDate().toLocaleDateString()}
                                        </td>
                                        <td className="px-3 py-3 text-3xl text-gray-700 relative">
                                            <button
                                                className="text-gray-500 hover:text-blue-700 text-center"
                                                onClick={() => handleActionClick(announcement)}>
                                                <AiOutlineEllipsis />
                                            </button>
                                            {isDropdownOpen && selectedAnnouncement && selectedAnnouncement.id === announcement.id && (
                                                <div
                                                    ref={dropdownRef}
                                                    className="absolute bg-white border shadow-md mt-2 top-10 rounded-md py-2 w-28 right-2 z-10"
                                                >
                                                    <button
                                                        onClick={handleEdit}
                                                        className="flex items-center w-full text-sm text-gray-700 hover:bg-gray-100 py-2 px-4"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(announcement)}
                                                        className="flex items-center w-full text-sm text-red-600 hover:bg-gray-100 py-2 px-4"
                                                    >
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
                                    Showing <span className="font-medium">{announcements.length > 0 ? indexOfFirstAnnouncement + 1 : 0}</span> to{" "}
                                    <span className="font-medium">
                                        {Math.min(indexOfLastAnnouncement, announcements.length)}
                                    </span>{" "}
                                    of <span className="font-medium">{announcements.length}</span> results
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

            {/* Edit Announcement Modal */}
            {isModalOpen && selectedAnnouncement && (
                <div ref={modalRef}>
                    <EditAnnouncementModal
                        announcement={selectedAnnouncement}
                        isOpen={isModalOpen}
                        onClose={handleModalClose}
                        onSave={handleUpdate}
                    />
                </div>
            )}

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
        </div>
    );
};

export default TableAnnouncements;