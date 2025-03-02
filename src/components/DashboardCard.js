import React, { useState, useEffect } from "react";
import { FaUserCircle, FaCheckCircle, FaPaperPlane, FaUsers } from "react-icons/fa";
import { db } from "../firebase";
import { collection, query, getDocs, orderBy, limit } from "firebase/firestore";
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

function SkeletonEmployerList() {
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
        <p className="text-blue-600 font-medium">
          {payload[1]?.value || 0} companies
        </p>
      </div>
    );
  }
  return null;
};

function Dashboard() {
  const [employerCount, setEmployerCount] = useState(0);
  const [openJobsCount, setOpenJobsCount] = useState(0);
  const [applicationsCount, setApplicationsCount] = useState(0);
  const [totalUsersCount, setTotalUsersCount] = useState(0);
  const [weeklyApplications, setWeeklyApplications] = useState([]);
  const [employerRankings, setEmployerRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartView, setChartView] = useState('week'); // 'week', 'month', 'year'
  const [companyApplications, setCompanyApplications] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const jobsQuery = query(collection(db, "jobs"));
        const jobSnapshot = await getDocs(jobsQuery);
        const jobs = jobSnapshot.docs.map(doc => ({...doc.data(), id: doc.id}));
        const openJobs = jobs.filter(job => job.isOpen === true).length;
        setOpenJobsCount(openJobs);

        // Get applications data
        const applicationsQuery = query(collection(db, "applications"));
        const applicationsSnapshot = await getDocs(applicationsQuery);
        const applications = applicationsSnapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id,
          // Convert Firestore timestamp to JavaScript Date
          timestamp: doc.data().timestamp?.toDate() || new Date()
        }));
        
        setApplicationsCount(applications.length);

        const usersQuery = query(collection(db, "profiles"));
        const usersSnapshot = await getDocs(usersQuery);
        setTotalUsersCount(usersSnapshot.size);

        const employersQuery = query(collection(db, "employers"));
        const employersSnapshot = await getDocs(employersQuery);
        setEmployerCount(employersSnapshot.size);

        // Process weekly applications count
        processApplicationsData(applications, chartView);

        // Top Employers by Applications Received
        const companyAppCounts = {};
        applications.forEach(app => {
          const company = app.company || "Unknown";
          companyAppCounts[company] = (companyAppCounts[company] || 0) + 1;
        });
        
        setCompanyApplications(companyAppCounts);

        const sortedEmployers = Object.entries(companyAppCounts)
          .map(([company, appCount]) => ({ company, jobCount: appCount }))
          .sort((a, b) => b.jobCount - a.jobCount)
          .slice(0, 5);

        setEmployerRankings(sortedEmployers);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [chartView]);

  const processApplicationsData = (applications, viewType) => {
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
    const companyData = {};
    
    if (viewType === 'week') {
      for (let i = 0; i < 7; i++) {
        const day = periodStart.clone().add(i, 'days').format(dateFormat);
        periodData[day] = 0;
        companyData[day] = 0;
      }
    } else if (viewType === 'month') {
      for (let i = 0; i < 30; i++) {
        const day = periodStart.clone().add(i, 'days').format(dateFormat);
        periodData[day] = 0;
        companyData[day] = 0;
      }
    } else { // year
      for (let i = 0; i < 12; i++) {
        const month = periodStart.clone().add(i, 'months').format(dateFormat);
        periodData[month] = 0;
        companyData[month] = 0;
      }
    }

    // Count applications by period
    const uniqueCompanies = {};
    
    applications.forEach(app => {
      const appDate = moment(app.timestamp);
      if (appDate.isSameOrAfter(periodStart)) {
        const period = appDate.format(dateFormat);
        if (periodData.hasOwnProperty(period)) {
          periodData[period] += 1;
          
          // Track unique companies per period
          if (!uniqueCompanies[period]) {
            uniqueCompanies[period] = new Set();
          }
          uniqueCompanies[period].add(app.company);
        }
      }
    });
    
    // Count unique companies per period
    Object.keys(uniqueCompanies).forEach(period => {
      companyData[period] = uniqueCompanies[period].size;
    });

    // Convert to chart data format
    const chartData = Object.keys(periodData).map(period => ({
      [groupLabel]: period,
      applications: periodData[period],
      companies: companyData[period]
    }));

    setWeeklyApplications(chartData);
  };

  const handleChartViewChange = (view) => {
    setChartView(view);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="my-6 sm:my-8 flex justify-start">
        <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
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
            <DashboardCard number={openJobsCount} label="Open Jobs" icon={<FaCheckCircle />} />
            <DashboardCard number={applicationsCount} label="Total Applications" icon={<FaPaperPlane />} />
            <DashboardCard number={employerCount} label="Total Employers" icon={<FaUserCircle />} />
            <DashboardCard number={totalUsersCount} label="Total Users" icon={<FaUsers />} />
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
                <Bar 
                  dataKey="companies" 
                  name="Companies" 
                  fill="#3B82F6" 
                  radius={[4, 4, 0, 0]}
                  barSize={chartView === 'month' ? 10 : 40} 
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
        
        {/* Top Employers */}
        <div className="bg-white p-6 rounded-3xl shadow-md h-full">
          {loading ? (
            <SkeletonEmployerList />
          ) : (
            <>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 mb-1">Top Employers</h3>
                  <p className="text-sm text-gray-500">Companies with the most applications</p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full">
                    {Object.keys(companyApplications).length} Companies
                  </span>
                </div>
              </div>

              <div className="overflow-hidden rounded-lg border border-gray-100">
                <ul className="divide-y divide-gray-100">
                  {employerRankings.map((employer, index) => (
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
                          <span className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">{employer.company}</span>
                          {employer.industry && (
                            <p className="text-xs text-gray-500">{employer.industry}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="flex items-center px-3 py-1 bg-gray-50 rounded-full group-hover:bg-white">
                          <span className="font-bold text-gray-700 mr-1">{employer.jobCount}</span>
                          <span className="text-gray-400 text-xs">applications</span>
                        </div>
                        <div className="text-xs text-gray-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {employer.jobCount > 10 ? 'View all applications →' : ''}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;