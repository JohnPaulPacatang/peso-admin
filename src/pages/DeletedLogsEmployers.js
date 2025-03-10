import React from 'react'
import DeletedLogsEmployersTable from '../components/DeletedLogsEmployersTable'

const DeletedLogsEmployers = () => {
    return (
        <div className="h-screen flex flex-col bg-green-50 overflow-hidden corner-radius">
            <div className="flex-1 overflow-y-scroll ">
                <DeletedLogsEmployersTable />
            </div>
        </div>
    )
}

export default DeletedLogsEmployers