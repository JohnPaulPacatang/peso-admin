import React from 'react'
import EmployerDashboardCard from '../components/EmployerDashboardCard';
import EmployerJobDashboard from '../components/EmployerJobDashboard';

const EmployerDashboard = () => {
  return (
    <div className="h-screen flex flex-col bg-green-50 overflow-hidden corner-radius">
      <div className="flex-1 overflow-y-scroll ">
          <EmployerDashboardCard />
          <EmployerJobDashboard />
      </div>
    </div>
  )
}

export default EmployerDashboard