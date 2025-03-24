import React, { useState, useEffect } from "react";
import { FaUserCircle, FaCheckCircle, FaPaperPlane, FaUsers } from "react-icons/fa";
import { db, auth } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import moment from "moment";

function DashboardCard({ number, label, icon, className }) {
  return (
    <div className={`bg-white p-6 m-1 sm:p-8 lg:p-10 rounded-3xl shadow-md flex items-center justify-between transition-transform transform hover:translate-y-[-5px] hover:shadow-lg cursor-pointer ${className}`}>
      <div className="flex flex-col items-start text-left">
        <div className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">{number}</div>
        <div className="text-xs sm:text-sm text-gray-500">{label}</div>
      </div>
      <div className="text-green-400 text-4xl sm:text-5xl ml-4">{icon}</div>
    </div>
  );
}

//loaderrs buto
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

function SkeletonBarChart() {
  return (
    <div className="animate-pulse">
      <div className="h-8 w-48 bg-gray-200 rounded-lg mb-6"></div>
      <div className="flex justify-between items-end h-64 w-full">
        {[1, 2, 3, 4, 5, 6, 7].map((_, index) => (
          <div key={index} className="w-10 bg-gray-200 rounded-t-lg mx-2" style={{ height: `${Math.random() * 80 + 20}%` }}></div>
        ))}
      </div>
      <div className="flex justify-between mt-4">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
          <div key={index} className="h-4 w-10 bg-gray-200 rounded-lg mx-2"></div>
        ))}
      </div>
    </div>
  );
}

function SkeletonJobList() {
  return (
    <div className="animate-pulse">
      <div className="flex justify-between mb-6">
        <div>
          <div className="h-8 w-32 bg-gray-200 rounded-lg mb-2"></div>
          <div className="h-4 w-48 bg-gray-200 rounded-lg"></div>
        </div>
        <div className="h-6 w-24 bg-gray-200 rounded-full"></div>
      </div>
      <div className="border border-gray-100 rounded-lg">
        {[1, 2, 3, 4, 5].map((_, index) => (
          <div key={index} className="py-4 px-3 flex items-center justify-between border-b border-gray-100 last:border-b-0">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gray-200 rounded-lg mr-4"></div>
              <div>
                <div className="h-5 w-32 bg-gray-200 rounded-lg mb-2"></div>
                <div className="h-3 w-24 bg-gray-200 rounded-lg"></div>
              </div>
            </div>
            <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Custom tooltip for the chart
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-md">
        <p className="font-semibold text-gray-800">{label}</p>
        <p className="text-green-600 font-medium">
          {payload[0].value} applications
        </p>
      </div>
    );
  }
  return null;
};

function EmployerDashboard() {
  const [jobCount, setJobCount] = useState(0);
  const [openJobsCount, setOpenJobsCount] = useState(0);
  const [applicationsCount, setApplicationsCount] = useState(0);
  const [conversionRate, setConversionRate] = useState(0);
  const [weeklyApplications, setWeeklyApplications] = useState([]);
  const [topJobs, setTopJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartView, setChartView] = useState('week');
  const [employerUid, setEmployerUid] = useState(null);
  const [, setJobs] = useState([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setEmployerUid(user.uid);
      } else {
        console.error("No employer is logged in.");
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchEmployerData = async () => {
      if (!employerUid) return;
      
      try {
        // Get all jobs posted by this employer
        const jobsQuery = query(collection(db, "jobs"), where("employerUid", "==", employerUid));
        const jobSnapshot = await getDocs(jobsQuery);
        const jobsData = jobSnapshot.docs.map(doc => ({...doc.data(), id: doc.id}));
        
        setJobs(jobsData);
        setJobCount(jobsData.length);
        setOpenJobsCount(jobsData.filter(job => job.isOpen === true).length);
        
        const jobIds = jobsData.map(job => job.id);
        
        // If there are no jobs, there are no applications
        if (jobIds.length === 0) {
          setApplicationsCount(0);
          setWeeklyApplications([]);
          setTopJobs([]);
          setConversionRate(0);
          setLoading(false);
          return;
        }
        
        // Get all applications for this employer's jobs
        const applicationsQuery = query(collection(db, "applications"), where("job_id", "in", jobIds));
        const applicationsSnapshot = await getDocs(applicationsQuery);
        const applications = applicationsSnapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id,
          timestamp: doc.data().timestamp?.toDate() || new Date()
        }));
        
        setApplicationsCount(applications.length);
        
        // Calculate conversion rate (applications per job posting)
        const rate = jobsData.length > 0 ? (applications.length / jobsData.length).toFixed(1) : 0;
        setConversionRate(rate);
        
        // Process applications data by time period
        processApplicationsData(applications, jobsData, chartView);
        
        // Process top jobs by application count
        processTopJobs(applications, jobsData);
        
      } catch (error) {
        console.error("Error fetching employer data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchEmployerData();
  }, [employerUid, chartView]);
  
  const processApplicationsData = (applications, _jobs, viewType) => {
    let dateFormat, periodStart, groupLabel;
    
    switch (viewType) {
      case 'month':
        dateFormat = 'MMM DD';
        periodStart = moment().subtract(30, 'days').startOf('day');
        groupLabel = 'date';
        break;
      case 'year':
        dateFormat = 'MMM';
        periodStart = moment().subtract(12, 'months').startOf('month');
        groupLabel = 'month';
        break;
      case 'week':
      default:
        dateFormat = 'ddd';
        periodStart = moment().startOf('week');
        groupLabel = 'day';
    }
    
    // Initialize data structure for the period
    const periodData = {};
    
    if (viewType === 'week') {
      for (let i = 0; i < 7; i++) {
        const day = periodStart.clone().add(i, 'days').format(dateFormat);
        periodData[day] = 0;
      }
    } else if (viewType === 'month') {
      for (let i = 0; i < 30; i++) {
        const day = periodStart.clone().add(i, 'days').format(dateFormat);
        periodData[day] = 0;
      }
    } else { // year
      for (let i = 0; i < 12; i++) {
        const month = periodStart.clone().add(i, 'months').format(dateFormat);
        periodData[month] = 0;
      }
    }
    
    // Count applications by period
    applications.forEach(app => {
      const appDate = moment(app.timestamp);
      if (appDate.isSameOrAfter(periodStart)) {
        const period = appDate.format(dateFormat);
        if (periodData.hasOwnProperty(period)) {
          periodData[period] += 1;
        }
      }
    });
    
    // Convert to chart data format
    const chartData = Object.keys(periodData).map(period => ({
      [groupLabel]: period,
      applications: periodData[period]
    }));
    
    setWeeklyApplications(chartData);
  };
  
  const processTopJobs = (applications, jobs) => {
    // Count applications per job
    const jobApplicationCounts = {};
    applications.forEach(app => {
      const jobId = app.job_id;
      jobApplicationCounts[jobId] = (jobApplicationCounts[jobId] || 0) + 1;
    });
    
    // Create job rankings with job details
    const jobRankings = jobs.map(job => {
      return {
        id: job.id,
        job_title: job.job_title, // Using job_title field instead of title
        location: job.location,
        isOpen: job.isOpen,
        appCount: jobApplicationCounts[job.id] || 0
      };
    });
    
    // Sort by application count and get top 5
    const sortedJobs = jobRankings
      .sort((a, b) => b.appCount - a.appCount)
      .slice(0, 5);
    
    setTopJobs(sortedJobs);
  };
  
  const handleChartViewChange = (view) => {
    setChartView(view);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="my-6 sm:my-8 flex justify-start">
        <h1 className="text-2xl sm:text-3xl font-bold">Employer Dashboard</h1>
      </div>
      
      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
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
            <DashboardCard number={applicationsCount} label="Total Applications" icon={<FaPaperPlane />} />
            <DashboardCard number={conversionRate} label="Applications per Job" icon={<FaUsers />} />
          </>
        )}
      </div>

      {/* Charts Section */}
      <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Bar Chart */}
        <div className="bg-white p-6 rounded-3xl shadow-md">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600">
              {chartView === 'week' ? 'Applications This Week' : 
               chartView === 'month' ? 'Applications Last 30 Days' : 
               'Applications Last 12 Months'}
            </h3>
            <div className="flex space-x-2">
              <button 
                onClick={() => handleChartViewChange('week')}
                className={`px-3 py-1 text-xs rounded-full transition-all ${
                  chartView === 'week' 
                    ? 'bg-green-100 text-green-800 font-medium' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Week
              </button>
              <button 
                onClick={() => handleChartViewChange('month')}
                className={`px-3 py-1 text-xs rounded-full transition-all ${
                  chartView === 'month' 
                    ? 'bg-green-100 text-green-800 font-medium' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Month
              </button>
              <button 
                onClick={() => handleChartViewChange('year')}
                className={`px-3 py-1 text-xs rounded-full transition-all ${
                  chartView === 'year' 
                    ? 'bg-green-100 text-green-800 font-medium' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Year
              </button>
            </div>
          </div>
          
          {loading ? (
            <SkeletonBarChart />
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart 
                data={weeklyApplications}
                margin={{ top: 20, right: 30, left: 10, bottom: 30 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                <XAxis 
                  dataKey={chartView === 'week' ? 'day' : chartView === 'month' ? 'date' : 'month'} 
                  axisLine={false}
                  tickLine={false}
                  dy={10}
                />
                <YAxis 
                  allowDecimals={false} 
                  axisLine={false}
                  tickLine={false}
                  dx={-10}
                  domain={[0, 12]}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ bottom: 0 }} />
                <Bar 
                  dataKey="applications" 
                  name="Applications" 
                  fill="#4CAF50" 
                  radius={[4, 4, 0, 0]}
                  barSize={chartView === 'month' ? 10 : 40} 
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
        
        {/* Top Jobs by Applications */}
        <div className="bg-white p-6 rounded-3xl shadow-md h-full">
          {loading ? (
            <SkeletonJobList />
          ) : (
            <>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 mb-1">Top Jobs</h3>
                  <p className="text-sm text-gray-500">Your jobs with the most applications</p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full">
                    {jobCount} Jobs Posted
                  </span>
                </div>
              </div>

              <div className="overflow-hidden rounded-lg border border-gray-100">
                <ul className="divide-y divide-gray-100">
                  {topJobs.length > 0 ? (
                    topJobs.map((job, index) => (
                      <li
                        key={index}
                        className="py-4 px-3 flex items-center justify-between hover:bg-blue-50 transition-all duration-200 group"
                      >
                        <div className="flex items-center">
                          <div className={`w-8 h-8 flex items-center justify-center rounded-lg mr-4 text-sm font-medium shadow-sm group-hover:scale-110 transition-transform ${
                            index === 0 ? 'bg-green-600 text-white border border-green-600' :  
                            index === 1 ? 'bg-green-500 text-white border border-green-500' :  
                            index === 2 ? 'bg-green-400 text-white border border-green-400' :  
                            'bg-green-300 text-white border border-green-300'                  
                          }`}>
                            {index + 1}
                          </div>

                          <div>
                            <h4 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                              {job.job_title}
                            </h4>
                            {job.location && (
                              <p className="text-xs text-gray-500">{job.location}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <div className="flex items-center px-3 py-1 bg-gray-50 rounded-full group-hover:bg-white">
                            <span className="font-bold text-gray-700 mr-1">{job.appCount}</span>
                            <span className="text-gray-400 text-xs">applications</span>
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            <span className={job.isOpen ? "text-green-500" : "text-red-500"}>
                              {job.isOpen ? "Open" : "Closed"}
                            </span>
                          </div>
                        </div>
                      </li>
                    ))
                  ) : (
                    <li className="py-6 px-4 text-center text-gray-500">No jobs with applications yet</li>
                  )}
                </ul>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default EmployerDashboard;