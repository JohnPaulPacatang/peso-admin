import React from 'react'
import EmployerEditJobPage from '../components/EmployerEditJobPage'

const EmployerEditJobs = () => {
    return (
        <div className="h-screen flex flex-col bg-green-50 overflow-hidden corner-radius">
            <div className="flex-1 overflow-y-scroll ">
                <EmployerEditJobPage />
            </div>
        </div>
    )
}

export default EmployerEditJobs