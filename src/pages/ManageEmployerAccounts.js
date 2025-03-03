import React from 'react'
import TableEmployerAccounts from '../components/TableEmployerAccounts'

const ManageAccounts = () => {
    return (
        <div className="h-screen flex flex-col bg-green-50 overflow-hidden corner-radius">
            <div className="flex-1 overflow-y-scroll ">
                <TableEmployerAccounts />
            </div>
        </div>
    )
}

export default ManageAccounts