import React from 'react';
import { AiOutlineEllipsis } from 'react-icons/ai';

const Jobs = () => {
    const jobs = [
        {
            title: 'Brand & Producer Designer',
            company: 'APT Studio',
            jobCreated: '13 Aug, 2022',
            applicants: '130 Applications',
            status: 'Active',
            location: 'Spain',
        },
        {
            title: 'Marketing Specialist',
            company: 'Talipapa Market',
            jobCreated: '05 Jun, 2022',
            applicants: '20 Applicants',
            status: 'Pending',
            location: 'UK',
        },
        {
            title: 'Accounting Manager',
            company: 'Accounting Office',
            jobCreated: '27 Sep, 2021',
            applicants: '273 Applicants',
            status: 'Expired',
            location: 'USA',
        },
        {
            title: 'Developer for IT Company',
            company: 'Appliance Repair',
            jobCreated: '14 Feb, 2021',
            applicants: '70 Applicants',
            status: 'Active',
            location: 'Germany',
        },
        {
            title: 'Developer for IT Company',
            company: 'APT Studio',
            jobCreated: '14 Feb, 2021',
            applicants: '70 Applicants',
            status: 'Active',
            location: 'Germany',
        },
        {
            title: 'Developer for IT Company',
            company: 'APT Studio',
            jobCreated: '14 Feb, 2021',
            applicants: '70 Applicants',
            status: 'Active',
            location: 'Germany',
        },
        {
            title: 'Developer for IT Company',
            company: 'APT Studio',
            jobCreated: '14 Feb, 2021',
            applicants: '70 Applicants',
            status: 'Active',
            location: 'Germany',
        },
        {
            title: 'Developer for IT Company',
            company: 'APT Studio',
            jobCreated: '14 Feb, 2021',
            applicants: '70 Applicants',
            status: 'Active',
            location: 'Germany',
        },
    ];

    return (
        <div className="py-10 px-4 sm:px-6 lg:px-14">
            {/* Header Section */}
            <div className="max-w-8xl mx-auto py-4">
                <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">My Jobs</h1>
                    <div className="flex flex-wrap items-center space-x-4">
                        <button className="bg-blue-600 text-white hover:bg-blue-700 py-2 px-4 rounded-full text-sm font-semibold mb-2 sm:mb-0">
                            All
                        </button>
                        <button className="bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-4 rounded-full text-sm font-semibold mb-2 sm:mb-0">
                            New
                        </button>
                        <p className="font-semibold mb-2 sm:mb-0">Sort by:</p>
                        <select className="border border-gray-300 rounded-full py-2 px-4 text-sm font-semibold text-gray-700 mb-2 sm:mb-0">
                            <option value="active">Active</option>
                            <option value="pending">Pending</option>
                            <option value="expired">Expired</option>
                        </select>
                        <button className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-full text-sm font-semibold">
                            Post a Job
                        </button>
                    </div>
                </div>
            </div>

            {/* Jobs Table */}
            <div className="max-w-8xl mx-auto pt-4">
                <div className="overflow-x-auto shadow-md sm:rounded-3xl bg-white">
                    <table className="min-w-full border-gray-200 rounded-lg">
                        <thead>
                            <tr className="bg-gray-300">
                                <th className="px-6 py-3 text-left text-sm font-semibold text-black border-t rounded-tl-lg">Title</th>
                                <th className="px-6 py-3 text-left text-sm font-semibold text-black border-t">Company</th>
                                <th className="px-6 py-3 text-left text-sm font-semibold text-black border-t">Job Created</th>
                                <th className="px-6 py-3 text-left text-sm font-semibold text-black border-t">Applicants</th>
                                <th className="px-6 py-3 text-left text-sm font-semibold text-black border-t">Status</th>
                                <th className="px-6 py-3 text-left text-sm font-semibold text-black border-t rounded-tr-lg">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {jobs.map((job, index) => (
                                <tr key={index} className="border-b border-gray-200">
                                    <td className="px-6 py-4 text-sm text-gray-700">{job.title}</td>
                                    <td className="px-6 py-4 text-sm text-gray-700">{job.company}</td>
                                    <td className="px-6 py-4 text-sm text-gray-700">{job.jobCreated}</td>
                                    <td className="px-6 py-4 text-sm text-gray-700">{job.applicants}</td>
                                    <td className="px-6 py-4 text-sm">
                                        <span
                                            className={`px-2 py-1 text-xs font-semibold rounded-full ${job.status === 'Active'
                                                    ? 'bg-green-100 text-green-600'
                                                    : job.status === 'Pending'
                                                        ? 'bg-yellow-100 text-yellow-600'
                                                        : 'bg-red-100 text-red-600'
                                                }`}
                                        >
                                            {job.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-3xl text-gray-700">
                                        <button className="text-gray-500 hover:text-blue-700">
                                            <AiOutlineEllipsis />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination Section */}
            <div className="flex items-center justify-center space-x-2 mt-4">
                {/* Page Numbers */}
                <span className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">1</span>
                <span className="px-3 py-1 bg-gray-200 rounded-lg hover:bg-gray-300 text-gray-800 cursor-pointer">2</span>
                <span className="px-3 py-1 bg-gray-200 rounded-lg hover:bg-gray-300 text-gray-800 cursor-pointer">3</span>

                {/* Dots */}
                <span className="text-gray-800">...</span>

                {/* Last Page Number */}
                <span className="px-3 py-1 bg-gray-200 rounded-lg hover:bg-gray-300 text-gray-800 cursor-pointer">7</span>

                {/* Next Button */}
                <button className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg cursor-pointer">
                    &gt;
                </button>
            </div>
        </div>
    );
};

export default Jobs;
