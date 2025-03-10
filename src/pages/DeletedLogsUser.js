import React from 'react'
import DeletedLogsUsersTable from '../components/DeletedLogsUserTable'

const DeletedLogsUser = () => {
    return (
        <div className="h-screen flex flex-col bg-green-50 overflow-hidden corner-radius">
            <div className="flex-1 overflow-y-scroll ">
                <DeletedLogsUsersTable />
            </div>
        </div>
    )
}

export default DeletedLogsUser