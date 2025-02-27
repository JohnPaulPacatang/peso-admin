import React from 'react'
import EditJobPage from '../components/EditJobPage'

const EditJobs = () => {
    return (
        <div className="h-screen flex flex-col bg-green-50 overflow-hidden corner-radius">
            <div className="flex-1 overflow-y-scroll ">
                <EditJobPage />
            </div>
        </div>
    )
}

export default EditJobs