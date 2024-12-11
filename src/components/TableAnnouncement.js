import React, { useState, useEffect, useRef } from 'react';
import { AiOutlineEllipsis } from 'react-icons/ai';

const TableAnnouncements = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterLocation, setFilterLocation] = useState('');
    const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
    const dropdownRef = useRef(null);

    const announcements = [
        {
            title: 'Frontend Developer Needed',
            description: 'We are looking for a skilled React.js developer to join our team.',
            location: 'Makati City, Metro Manila',
            timeDate: 'Posted on 12 Dec, 2024',
        },
        {
            title: 'Software Engineer',
            description: 'Seeking a backend engineer with experience in Node.js and SQL.',
            location: 'Taguig City, Metro Manila',
            timeDate: 'Posted on 11 Dec, 2024',
        },
        {
            title: 'Digital Marketing Specialist',
            description: 'Join our growing team to lead digital campaigns and strategy.',
            location: 'Quezon City, Metro Manila',
            timeDate: 'Posted on 10 Dec, 2024',
        },
        {
            title: 'Data Analyst',
            description: 'Looking for a data analyst with expertise in Python and Power BI.',
            location: 'Pasig City, Metro Manila',
            timeDate: 'Posted on 9 Dec, 2024',
        },
        {
            title: 'HR Manager',
            description: 'We are looking for an HR Manager to oversee recruitment and employee relations.',
            location: 'Manila City, Metro Manila',
            timeDate: 'Posted on 8 Dec, 2024',
        },
        {
            title: 'UI/UX Designer',
            description: 'Exciting opportunity for a creative UI/UX designer to join our tech team.',
            location: 'Mandaluyong City, Metro Manila',
            timeDate: 'Posted on 7 Dec, 2024',
        },
    ];

    const filteredAnnouncements = announcements.filter((announcement) => {
        return (
            announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
            (filterLocation ? announcement.location.toLowerCase().includes(filterLocation.toLowerCase()) : true)
        );
    });

    const handleActionClick = (announcement) => {
        setSelectedAnnouncement(
            selectedAnnouncement && selectedAnnouncement.title === announcement.title ? null : announcement
        );
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setSelectedAnnouncement(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div className="py-10 px-4 sm:px-6 lg:px-14">
            {/* Header Section */}
            <div className="max-w-8xl mx-auto py-4">
                <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Announcements</h1>
                    <div className="flex space-x-2">
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="border border-gray-300 px-4 py-2 rounded-3xl text-sm"
                        />
                        <button className="bg-green-600 text-white hover:bg-green-700 py-2 px-4 rounded-full text-sm font-semibold">
                            Export PDF
                        </button>
                    </div>
                </div>
            </div>

            {/* Announcements Table */}
            <div className="max-w-8xl mx-auto pt-4">
                <div className="overflow-x-auto shadow-md sm:rounded-3xl bg-white">
                    <table className="min-w-full border-gray-200 rounded-lg">
                        <thead>
                            <tr className="bg-gray-300">
                                <th className="px-6 py-3 text-left text-sm font-semibold text-black border-t rounded-tl-lg">Title</th>
                                <th className="px-6 py-3 text-left text-sm font-semibold text-black border-t">Description</th>
                                <th className="px-6 py-3 text-left text-sm font-semibold text-black border-t">Location</th>
                                <th className="px-6 py-3 text-left text-sm font-semibold text-black border-t">Time & Date</th>
                                <th className="px-6 py-3 text-left text-sm font-semibold text-black border-t rounded-tr-lg">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAnnouncements.map((announcement, index) => (
                                <tr key={index} className="border-b border-gray-200">
                                    <td className="px-6 py-4 text-sm text-gray-700">{announcement.title}</td>
                                    <td className="px-6 py-4 text-sm text-gray-700">{announcement.description}</td>
                                    <td className="px-6 py-4 text-sm text-gray-700">{announcement.location}</td>
                                    <td className="px-6 py-4 text-sm text-gray-700">{announcement.timeDate}</td>
                                    <td className="px-6 py-4 text-3xl text-gray-700 relative">
                                        <button
                                            className="text-gray-500 hover:text-blue-700"
                                            onClick={() => handleActionClick(announcement)}
                                        >
                                            <AiOutlineEllipsis />
                                        </button>
                                        {selectedAnnouncement &&
                                            selectedAnnouncement.title === announcement.title && (
                                                <div
                                                    ref={dropdownRef}
                                                    className="absolute bg-white border shadow-md mt-2 top-5 rounded-md py-2 w-28 right-20 z-10"
                                                >
                                                    <button
                                                        onClick={() => alert('Edit functionality')}
                                                        className="flex items-center w-full text-sm text-gray-700 hover:bg-gray-100 py-2 px-4"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => alert('Delete functionality')}
                                                        className="flex items-center w-full text-sm text-red-600 hover:bg-gray-100 py-2 px-4"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default TableAnnouncements;
