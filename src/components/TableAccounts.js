import React, { useState, useEffect, useRef } from 'react';
import { AiOutlineEllipsis, AiOutlineEdit, AiOutlineDelete } from 'react-icons/ai';

const ManageAccountsTable = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedAccount, setSelectedAccount] = useState(null);
    const dropdownRef = useRef(null);

    const accounts = [
        { lastName: 'Garcia', firstName: 'Juan', email: 'juan.garcia@example.com' },
        { lastName: 'Santos', firstName: 'Maria', email: 'maria.santos@example.com' },
        { lastName: 'Cruz', firstName: 'Pedro', email: 'pedro.cruz@example.com' },
        { lastName: 'Reyes', firstName: 'Anna', email: 'anna.reyes@example.com' },
        { lastName: 'Dela Cruz', firstName: 'Luis', email: 'luis.delacruz@example.com' },
        { lastName: 'Torres', firstName: 'Sophia', email: 'sophia.torres@example.com' },
    ];

    const filteredAccounts = accounts.filter((account) =>
        account.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleActionClick = (account) => {
        setSelectedAccount(selectedAccount && selectedAccount.email === account.email ? null : account);
    };

    const handleUpdate = () => alert('Update functionality goes here');
    const handleDelete = () => alert('Delete functionality goes here');

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

    return (
        <div className="py-10 px-4 sm:px-6 lg:px-14">
            <div className="max-w-8xl mx-auto py-4">
                <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Manage Accounts</h1>
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

            <div className="max-w-8xl mx-auto pt-4">
                <div className="overflow-x-auto shadow-md sm:rounded-3xl bg-white">
                    <table className="min-w-full border-gray-200 rounded-lg">
                        <thead>
                            <tr className="bg-gray-300">
                                <th className="px-6 py-3 text-left text-sm font-semibold text-black border-t rounded-tl-lg">Last Name</th>
                                <th className="px-6 py-3 text-left text-sm font-semibold text-black border-t">First Name</th>
                                <th className="px-6 py-3 text-left text-sm font-semibold text-black border-t">Email</th>
                                <th className="px-6 py-3 text-left text-sm font-semibold text-black border-t rounded-tr-lg">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAccounts.map((account, index) => (
                                <tr key={index} className="border-b border-gray-200">
                                    <td className="px-6 py-4 text-sm text-gray-700">{account.lastName}</td>
                                    <td className="px-6 py-4 text-sm text-gray-700">{account.firstName}</td>
                                    <td className="px-6 py-4 text-sm text-gray-700">{account.email}</td>
                                    <td className="px-6 py-4 text-3xl text-gray-700 relative">
                                        <button
                                            className="text-gray-500 hover:text-blue-700"
                                            onClick={() => handleActionClick(account)}
                                        >
                                            <AiOutlineEllipsis />
                                        </button>
                                        {selectedAccount && selectedAccount.email === account.email && (
                                            <div
                                                ref={dropdownRef}
                                                className="absolute bg-white border shadow-md mt-2 top-5 rounded-md py-2 w-28 right-14 z-10"
                                            >
                                                <button
                                                    onClick={handleUpdate}
                                                    className="flex items-center w-full text-sm text-gray-700 hover:bg-gray-100 py-2 px-4"
                                                >
                                                    <AiOutlineEdit className="mr-2" />
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={handleDelete}
                                                    className="flex items-center w-full text-sm text-red-600 hover:bg-gray-100 py-2 px-4"
                                                >
                                                    <AiOutlineDelete className="mr-2" />
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

export default ManageAccountsTable;
