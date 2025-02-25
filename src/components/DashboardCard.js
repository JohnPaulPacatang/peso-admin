import React, { useState, useEffect } from "react";
import { FaUserCircle, FaCheckCircle, FaPaperPlane, FaBriefcase } from "react-icons/fa";
import { db } from "../firebase";
import { collection, query, getDocs } from "firebase/firestore";

// Dashboard Card Component
function DashboardCard({ number, label, icon, className }) {
  return (
    <div
      className={`bg-white p-6 m-1 sm:p-8 lg:p-10 rounded-3xl shadow-md flex items-center justify-between transition-transform transform hover:translate-y-[-5px] hover:shadow-lg cursor-pointer ${className}`}
    >
      <div className="flex flex-col items-start text-left">
        <div className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">{number}</div>
        <div className="text-xs sm:text-sm text-gray-500">{label}</div>
      </div>
      <div className="text-green-400 text-4xl sm:text-5xl ml-4">{icon}</div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white p-6 m-1 sm:p-8 lg:p-10 rounded-3xl shadow-md flex items-center justify-between animate-pulse">
      <div className="flex flex-col items-start text-left">
        <div className="h-8 w-16 bg-gray-200 rounded-lg mb-2"></div>
        <div className="h-4 w-24 bg-gray-200 rounded-lg"></div>
      </div>
      <div className="h-12 w-12 bg-gray-200 rounded-full ml-4"></div>
    </div>
  );
}

// Employer Dashboard Component
function Dashboard() {
  const [jobCount, setJobCount] = useState(0);
  const [openJobsCount, setOpenJobsCount] = useState(0);
  const [applicationsCount, setApplicationsCount] = useState(0);

  const [savedCandidatesCount, setSavedCandidatesCount] = useState(4);
  setSavedCandidatesCount(4); 

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch total jobs count
        const jobsQuery = query(collection(db, "jobs"));
        const jobSnapshot = await getDocs(jobsQuery);
        const totalJobs = jobSnapshot.size;
        const openJobs = jobSnapshot.docs.filter((doc) => doc.data().isOpen === true).length;

        setJobCount(totalJobs);
        setOpenJobsCount(openJobs);

        // Fetch total applications count
        const applicationsQuery = query(collection(db, "applications"));
        const applicationsSnapshot = await getDocs(applicationsQuery);
        setApplicationsCount(applicationsSnapshot.size);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="my-6 sm:my-8 flex justify-start">
        <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-4 xl:grid-cols-4 gap-6 sm:gap-8 lg:gap-10">
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            <DashboardCard number={jobCount} label="Total Jobs" icon={<FaUserCircle />} />
            <DashboardCard number={openJobsCount} label="Open Jobs" icon={<FaCheckCircle />} />
            <DashboardCard number={applicationsCount} label="Total Applications" icon={<FaPaperPlane />} />
            <DashboardCard number={savedCandidatesCount} label="Saved Candidates" icon={<FaBriefcase />} />
          </>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
