import React, { useState, useEffect } from "react";
import { FaUserCircle, FaCheckCircle, FaPaperPlane, FaBriefcase } from "react-icons/fa";
import { db, auth } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

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

// Skeleton Card Component
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
function EmployerDashboard() {
  const [jobCount, setJobCount] = useState(0);
  const [openJobsCount, setOpenJobsCount] = useState(0);
  const [applicationsCount, setApplicationsCount] = useState(0);
  const [savedCandidatesCount, setSavedCandidatesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [employerUid, setEmployerUid] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // console.log("Logged-in employer UID:", user.uid);
        setEmployerUid(user.uid);
      } else {
        console.error("No employer is logged in.");
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchJobData = async () => {
      if (!employerUid) return;
      try {
        const jobsQuery = query(collection(db, "jobs"), where("employerUid", "==", employerUid));
        const jobSnapshot = await getDocs(jobsQuery);

        const totalJobs = jobSnapshot.size;
        const jobIds = jobSnapshot.docs.map((doc) => doc.id);
        const openJobs = jobSnapshot.docs.filter((doc) => doc.data().isOpen === true).length;

        setJobCount(totalJobs);
        setOpenJobsCount(openJobs);

        if (jobIds.length > 0) {
          const applicationsQuery = query(collection(db, "applications"), where("job_id", "in", jobIds));
          const applicationsSnapshot = await getDocs(applicationsQuery);
          setApplicationsCount(applicationsSnapshot.size);
        } else {
          setApplicationsCount(0);
        }

        setSavedCandidatesCount(4); // Placeholder, replace with actual logic
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchJobData();
  }, [employerUid]);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="my-6 sm:my-8 flex justify-start">
        <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6 sm:gap-8 lg:gap-10">
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            <DashboardCard number={jobCount} label="Posted Jobs" icon={<FaUserCircle />} />
            <DashboardCard number={openJobsCount} label="Open Jobs" icon={<FaCheckCircle />} />
            <DashboardCard number={applicationsCount} label="Applications" icon={<FaPaperPlane />} />
            <DashboardCard number={savedCandidatesCount} label="Saved Candidates" icon={<FaBriefcase />} />
          </>
        )}
      </div>
    </div>
  );
}

export default EmployerDashboard;