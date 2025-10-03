'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BusinessSidebar from '@/components/dashboard/BusinessSidebar';
import BusinessDashboardHeader from '@/components/dashboard/BusinessDashboardHeader';
import {
  Users,
  Briefcase,
  TrendingUp,
  Eye,
  Plus,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  BarChart3,
  Check as CheckIcon,
  ScrollText
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/hooks/use-toast';
import JobPostingModal, { JobFormState } from './job-postings/jobPostingModal';
import { getJobPostingList, JobPosting as ApiJobPosting } from '@/app/api/job postings/jobpostingList';
import { getCityList, getAuthData, type City } from '@/app/api/job postings/addjobPosting';
import { useBusinessDashboardStore } from '@/store/dashboard/businessdashboardStore';
import { getRecentProfiles, getProfileStatus, RecentProfile } from '@/app/api/Business Profile/recentProfiles';

// Static configuration for stats display
const statsConfig = [
  {
    key: 'total_postings',
    title: 'Total Opportunities',
    icon: Briefcase,
    color: 'bg-blue-500',
  },
  {
    key: 'active_postings',
    title: 'Active Opportunities',
    icon: Users,
    color: 'bg-green-500',
  },
  {
    key: 'shortlisted',
    title: 'Shortlisted',
    icon: ScrollText,
    color: 'bg-orange-500',
  },
];


// Static data removed - will be replaced with API data

export default function BusinessDashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, entity, isAuthenticated } = useAuthStore();
  const { toast } = useToast();
  const router = useRouter();
  const [opportunities, setOpportunities] = useState([]);
  const [showJobModal, setShowJobModal] = useState(false);
  const [apiJobPostings, setApiJobPostings] = useState<ApiJobPosting[]>([]);
  const [recentProfiles, setRecentProfiles] = useState<RecentProfile[]>([]);
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(false);
  const [profilesError, setProfilesError] = useState<string | null>(null);
  
  // City list state
  const [cityList, setCityList] = useState<City[]>([]);
  const [cityListLoading, setCityListLoading] = useState(false);

  const appliedDate = new Date(); // or your actual date value

  const formattedDate = appliedDate.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Business dashboard store
  const {
    insights,
    isLoadingInsights,
    insightsError,
    fetchOrganizationInsights,
    clearInsightsError
  } = useBusinessDashboardStore();

  // Get business name from entity details or fall back to user name
  const businessName = entity?.details?.name || 'Your Business';

  // Fetch city list when component mounts
  useEffect(() => {
    const fetchCityList = async () => {
      const authData = getAuthData();
      if (!authData) {
        console.log('No auth data available for city list');
        return;
      }

      setCityListLoading(true);
      try {
        const cities = await getCityList(authData.apiKey, authData.apiSecret);
        setCityList(cities);
      } catch (error) {
        console.error('Error fetching city list:', error);
      } finally {
        setCityListLoading(false);
      }
    };

    fetchCityList();
  }, []);

  // Fetch job postings, organization insights, and recent profiles from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (entity?.details?.entity_id) {
          // Fetch job postings
          const response = await getJobPostingList(entity.details.entity_id);
          setApiJobPostings(response.message.data.opportunity_posting || []);

          // Fetch organization insights
          await fetchOrganizationInsights();

          // Fetch recent profiles
          setIsLoadingProfiles(true);
          setProfilesError(null);
          try {
            // Call getRecentProfiles with the entity ID, API key and secret are retrieved internally
            const profiles = await getRecentProfiles(entity.details.entity_id);
            setRecentProfiles(profiles);
          } catch (profileError: any) {
            console.error('Error fetching recent profiles:', profileError);
            setProfilesError(profileError.message || 'Failed to fetch recent profiles');
          } finally {
            setIsLoadingProfiles(false);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [entity?.details?.entity_id, fetchOrganizationInsights]);

  // Handle job creation
  const handleCreateJob = (jobData: JobFormState) => {
    console.log('Creating job:', jobData);
    // Here you would typically call an API to create the job
    // For now, we'll just close the modal
    setShowJobModal(false);

    // Optionally refresh the job postings list
    if (entity?.details?.entity_id) {
      getJobPostingList(entity.details.entity_id)
        .then(response => {
          setApiJobPostings(response.message.data.opportunity_posting || []);
        })
        .catch(error => {
          console.error('Error refreshing job postings:', error);
        });
    }
  };
  // const userName = user?.full_name || user?.name || 'User';
  // const userEmail = user?.email || 'business@example.com';

  // Helper function to get user role from localStorage
  const getUserRole = (): string | null => {
    if (typeof window !== 'undefined') {
      try {
        const entityDataStr = localStorage.getItem('entity_data');
        const userDataStr = localStorage.getItem('user_data');

        if (entityDataStr && userDataStr) {
          const entityData = JSON.parse(entityDataStr);
          const userData = JSON.parse(userDataStr);

          // Get current user's email
          const currentUserEmail = userData.email;

          // Find user's role in business_users array
          const businessUsers = entityData.details?.business_users;
          if (businessUsers && Array.isArray(businessUsers)) {
            const currentUser = businessUsers.find(user => user.email === currentUserEmail);
            return currentUser?.role || null;
          }
        }
      } catch (error) {
        console.error('Error getting user role:', error);
      }
    }
    return null;
  };

  useEffect(() => {
    // Check user role and redirect Business Users to opportunity postings
    const userRole = getUserRole();
    if (userRole === 'Business User' && window.location.pathname === '/business-dashboard') {
      router.push('/business-dashboard/job-postings');
      return;
    }

    if (isAuthenticated && user && window.location.pathname.includes('business-dashboard')) {
      // Show toast notification for Business Buyer
      const roles = user.roles;
      let isBusinessBuyer = false;

      // Check roles in different formats
      if (Array.isArray(roles)) {
        isBusinessBuyer = roles.includes('Business Buyer');
      } else if (typeof roles === 'string') {
        isBusinessBuyer = (roles as string).indexOf('Business Buyer') >= 0;
      }

      // Use URL parameter to detect fresh login vs refresh
      const urlParams = new URLSearchParams(window.location.search);
      const fromLogin = urlParams.get('fromLogin') === 'true';

      // Show toast on fresh login or if fromLogin parameter is present
      if (isBusinessBuyer && fromLogin) {
        // Create toast with custom timeout
        const { dismiss } = toast({
          title: "Login Successful",
          description: `You are logged in as ${user.full_name || user.name}`,
          variant: "default",
          action: <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center"><CheckIcon className="h-4 w-4 text-green-600" /></div>,
        });

        // Set custom timeout (e.g., 3000ms = 3 seconds)
        setTimeout(() => {
          dismiss();
        }, 20000);

        // Remove the fromLogin parameter from URL without refreshing
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, [isAuthenticated, user, toast, router]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'shortlisted':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'active':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Function to format date difference as "X days/hours/minutes ago"
  const formatDateDifference = (dateString: string): string => {
    try {
      const postDate = new Date(dateString);
      const currentDate = new Date();
      const diffInMs = currentDate.getTime() - postDate.getTime();
      const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

      if (diffInDays > 0) {
        return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
      }

      const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
      if (diffInHours > 0) {
        return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
      }

      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      if (diffInMinutes > 0) {
        return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
      }

      return 'just now';
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'recently';
    }
  };

  // Function to filter opportunities with current or future deadlines
  const filterCurrentAndUpcomingOpportunities = (opportunities: ApiJobPosting[]): ApiJobPosting[] => {
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0); // Set to start of current day
    
    return opportunities.filter(opportunity => {
      if (!opportunity.application_deadline) {
        return true; // Include opportunities without deadline
      }
      
      try {
        const deadlineDate = new Date(opportunity.application_deadline);
        deadlineDate.setHours(0, 0, 0, 0); // Set to start of deadline day
        return deadlineDate >= currentDate; // Include current date and future dates
      } catch (error) {
        console.error('Error parsing deadline date:', error);
        return true; // Include if date parsing fails
      }
    });
  };

  // Helper function to parse location from API format using city list
  const parseLocationFromAPI = (locationData: any): string => {
    if (!locationData) return 'Not specified';
    
    try {
      let cityName = '';
      
      // If it's already a string, extract city name
      if (typeof locationData === 'string') {
        // Try to parse if it looks like JSON
        if (locationData.startsWith('[') && locationData.endsWith(']')) {
          const parsed = JSON.parse(locationData);
          if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].city) {
            cityName = parsed[0].city;
          }
        } else {
          cityName = locationData;
        }
      }
      
      // If it's an array of objects with city property
      if (Array.isArray(locationData) && locationData.length > 0 && locationData[0].city) {
        cityName = locationData[0].city;
      }
      
      // If we have a city name, try to find it in the city list for consistent display
      if (cityName && cityList.length > 0) {
        const foundCity = cityList.find(city => 
          city.name.toLowerCase() === cityName.toLowerCase()
        );
        if (foundCity) {
          return foundCity.name; // Return the exact name from city list
        }
      }
      
      // Fallback to the parsed city name or 'Not specified'
      return cityName || 'Not specified';
    } catch (error) {
      console.error('Error parsing location:', error);
      return 'Not specified';
    }
  };

  // State for mobile sidebar toggle
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // Handle sidebar collapse change
  const handleSidebarCollapseChange = (isCollapsed: boolean) => {
    setSidebarCollapsed(isCollapsed);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-rubik">
      <BusinessSidebar 
        mobileOpen={mobileMenuOpen} 
        onCollapseChange={handleSidebarCollapseChange}
      />

      <div className={`min-h-screen transition-all duration-300 ${sidebarCollapsed ? 'lg:pl-24' : 'lg:pl-[310px]'}`}>
        <BusinessDashboardHeader
          title="Dashboard"
          onMenuClick={toggleMobileMenu}
        />

        <main className="overflow-y-auto bg-gray-50 w-full">
          <div className="px-2 sm:px-4 md:px-6 py-4 pb-20 lg:pb-6">
            {/* Welcome Section */}
            <div className="mb-8">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                Welcome to {businessName}! 🚀
              </h1>
              {/* <p className="text-gray-600">{userName} ({userEmail})</p> */}
              <p className="text-gray-600">
                Manage your opportunities, review applications, and grow your team.
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {isLoadingInsights ? (
                // Loading state
                statsConfig.map((stat, index) => (
                  <div key={index} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-md font-medium text-gray-600 mb-1">{stat.title}</p>
                        <div className="h-8 bg-gray-200 rounded animate-pulse mb-2"></div>
                        <div className="h-4 bg-gray-100 rounded animate-pulse w-24"></div>
                      </div>
                      <div className={`w-14 h-14 ${stat.color} rounded-xl flex items-center justify-center`}>
                        <stat.icon className="text-white" size={24} />
                      </div>
                    </div>
                  </div>
                ))
              ) : insightsError ? (
                // Error state
                <div className="col-span-full bg-red-50 border border-red-200 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-red-800 font-medium">Failed to load organization insights</h3>
                      <p className="text-red-600 text-sm mt-1">{insightsError}</p>
                    </div>
                    <button
                      onClick={() => {
                        clearInsightsError();
                        fetchOrganizationInsights();
                      }}
                      className="bg-red-100 hover:bg-red-200 text-red-800 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              ) : (
                // Data loaded successfully
                statsConfig.map((stat, index) => {
                  const Icon = stat.icon;
                  const value = insights?.[stat.key as keyof typeof insights] || 0;
                  const changeKey = `${stat.key}_change` as keyof typeof insights;
                  // const change = insights?.[changeKey] || 'No change';

                  return (
                    <div key={index} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-md font-medium text-gray-600 mb-1">{stat.title}</p>
                          <p className="text-3xl font-bold text-gray-900">{value.toLocaleString()}</p>
                          {/* <p className="text-sm text-green-600 font-medium mt-1">{change}</p> */}
                        </div>
                        <div className={`w-14 h-14 ${stat.color} rounded-xl flex items-center justify-center`}>
                          <Icon className="text-white" size={24} />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Recent Opportunities */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                  <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold text-gray-900">Recent Opportunities</h2>
                      {/* <button className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors flex items-center">
                        <Plus size={16} className="mr-2" />
                        Post New
                      </button> */}
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4">
                      {(() => {
                        const filteredOpportunities = filterCurrentAndUpcomingOpportunities(apiJobPostings);
                        return filteredOpportunities.length > 0 ? (
                          filteredOpportunities.slice(0, 5).map((opportunity: ApiJobPosting) => (
                            <div key={opportunity.name} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-2">
                                  <h3 className="font-semibold text-gray-900">{opportunity.opportunity_title}</h3>
                                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor('active')}`}>
                                    active
                                  </span>
                                </div>
                                <div className="flex items-center space-x-4 text-sm text-gray-600">
                                  <span>{opportunity.employment_type}</span>
                                  <span>{opportunity.role_skill_category}</span>
                                  {/* <span>{parseLocationFromAPI(opportunity.location)}</span> */}
                                  <span>{opportunity.profiles_match_count || 0} applications</span>
                                  {/* <span>Posted {opportunity.created_date ? formatDateDifference(opportunity.created_date) : 'recently'}</span> */}
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-gray-500">Deadline</p>
                                <p className="font-medium text-gray-900">{opportunity.application_deadline || 'No deadline'}</p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8">
                            <div className="text-gray-500 mb-2">No current opportunities found</div>
                            <div className="text-sm text-gray-400">
                              {apiJobPostings.length > 0 
                                ? 'All opportunities have expired deadlines' 
                                : 'Create your first job posting to get started'
                              }
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions & Recent Applications */}
              <div className="lg:col-span-1 space-y-6">
                {/* Quick Actions */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                  <div className="p-6 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
                  </div>
                  <div className="p-6">
                    <div className="space-y-3">
                      <button
                        onClick={() => setShowJobModal(true)}
                        className="w-full bg-gradient-to-r from-orange-500 to-blue-500 text-white font-semibold py-3 px-4 rounded-lg hover:shadow-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                      >
                        Post New Opportunity
                      </button>
                      {/* <button className="w-full border-2 border-orange-500 text-orange-600 font-semibold py-3 px-4 rounded-lg hover:bg-orange-50 transition-all duration-300">
                        Review Profiles
                      </button> */}
                      <button
                        onClick={() => router.push('/business-dashboard/business-team-member')}
                        className="w-full border-2 border-blue-500 text-blue-600 font-semibold py-3 px-4 rounded-lg hover:bg-blue-50 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      >
                        Manage Team
                      </button>
                      {/* <button className="w-full border-2 border-purple-500 text-purple-600 font-semibold py-3 px-4 rounded-lg hover:bg-purple-50 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2">
                        View Analytics
                      </button> */}
                    </div>
                  </div>
                </div>

                {/* Recent Applications */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                  <div className="p-6 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900">Recent Profiles</h2>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4">
                      {/* Loading state */}
                      {isLoadingProfiles && (
                        <div className="flex justify-center items-center p-8">
                          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                          <span className="ml-2 text-gray-600">Loading recent profiles...</span>
                        </div>
                      )}

                      {/* Error state */}
                      {profilesError && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                          {profilesError}
                        </div>
                      )}

                      {/* Not an array state */}
                      {!isLoadingProfiles && !profilesError && !Array.isArray(recentProfiles) && (
                        <div className="flex flex-col items-center justify-center p-6 text-center text-gray-500 border border-dashed border-gray-300 rounded-lg">
                          <img
                            src="/Images/Profile_not_found.gif"
                            alt="No profiles found"
                            className="w-28 h-28 mb-1 object-contain"
                          />
                          <p className="text-lg font-medium">No recent profiles found</p>
                        </div>
                      )}


                      {/* No profiles state */}
                      {!isLoadingProfiles && !profilesError && Array.isArray(recentProfiles) && recentProfiles.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <p>No recent profiles found</p>
                          <p className="text-sm text-gray-400 mt-1">Recent profile applications will appear here</p>
                        </div>
                      )}

                      {/* Profiles list */}
                      {!isLoadingProfiles && !profilesError && Array.isArray(recentProfiles) && recentProfiles.map((profile) => {
                        const status = getProfileStatus(profile);
                        const appliedDate = new Date(profile.creation).toLocaleDateString();

                        return (
                          <div key={profile.full_name} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h4 className="font-semibold text-gray-900">{profile.full_name}</h4>
                                <p className="text-sm text-gray-600">{profile.opportunity_title}</p>
                              </div>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(status.toLowerCase())}`}>
                                {status}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600 mb-2">
                              <p>{profile.relevant_experience} years experience</p>
                              <p>Applied On: {formattedDate}</p>
                              <p>Match Score: {profile.match_score}%</p>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                {profile.desired_job_role}
                              </span>
                              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                                {profile.work_mode}
                              </span>
                              <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                                {profile.opportunity_type}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Job Posting Modal */}
      <JobPostingModal
        showModal={showJobModal}
        setShowModal={setShowJobModal}
        onSubmit={handleCreateJob}
      />
    </div>
  );
}