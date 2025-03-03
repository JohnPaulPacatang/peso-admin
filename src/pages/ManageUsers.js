import React from 'react'
import TableUsers from '../components/TableUsers'

const ManageUsers = () => {
    return (
        <div className="h-screen flex flex-col bg-green-50 overflow-hidden corner-radius">
            <div className="flex-1 overflow-y-scroll ">
                <TableUsers />
            </div>
        </div>
    )
}

export default ManageUsers