'use client';

import { useState, useEffect } from 'react';
import { Briefcase, Search, Users, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import BusinessSidebar from '@/components/dashboard/BusinessSidebar';
import BusinessDashboardHeader from '@/components/dashboard/BusinessDashboardHeader';
import { getClosedOpportunities, ClosedOpportunity as ApiClosedOpportunity } from '@/app/api/job postings/jobpostingList';
import { useAuthStore } from '@/store/authStore';

// Job posting interface
interface JobPosting {
  id: string;
  title: string;
  skillCategory?: string;
  employmentType: string;
  workMode?: string;
  experienceRequired?: string;
  location: string;
  salary?: string;
  skillsRequired?: string[];
  genderPreference?: string[];
  languageRequirement?: string[];
  description?: string;
  applicationDeadline?: string;
  postedDate: string;
  status: string;
  applicantCount?: number;
  closedDate?: string;
}

export default function ClosedOpportunitiesPage() {
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [closedJobs, setClosedJobs] = useState<JobPosting[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get entity ID from auth store
  const { entity } = useAuthStore();
  const entityId = entity?.details?.entity_id || "";

  useEffect(() => {
    const fetchClosedOpportunities = async () => {
      if (!entityId) {
        console.log('Waiting for entity_id to be loaded...');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        console.log('Fetching closed opportunities for entity_id:', entityId);
        const response = await getClosedOpportunities(entityId);
        
        console.log('API Response:', response);
        console.log('Closed opportunities data:', response.message.data.closed_opportunity_posting);
        
        if (response.message.status === 'success') {
          // Map API response to UI format
          const mappedClosedJobs: JobPosting[] = response.message.data.closed_opportunity_posting.map((job: ApiClosedOpportunity) => ({
            id: job.name,
            title: job.opportunity_title,
            skillCategory: job.role_skill_category,
            employmentType: job.employment_type,
            workMode: job.work_mode,
            experienceRequired: job.experience_required,
            location: job.location || 'Not specified',
            applicationDeadline: job.application_deadline,
            postedDate: 'N/A',
            closedDate: 'Recently closed',
            status: 'Closed',
            applicantCount: job.profiles_match_count || 0
          }));
          
          console.log('Mapped closed jobs:', mappedClosedJobs);
          setClosedJobs(mappedClosedJobs);
        } else {
          console.log('API response status not success:', response.message.status);
          setError('Failed to fetch closed opportunities');
        }
      } catch (error: any) {
        console.error('Error fetching closed opportunities:', error);
        setError(error.message || 'Failed to fetch closed opportunities');
      } finally {
        setIsLoading(false);
      }
    };

    fetchClosedOpportunities();
  }, [entityId]);

  const handleTitleClick = (jobId: string) => {
    router.push(`/business-dashboard/job-applied-users?jobId=${jobId}`);
  };

  const navigateBack = () => {
    router.push('/business-dashboard/job-postings');
  };

  const filteredJobs = closedJobs.filter(job =>
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.skillCategory?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle sidebar collapse change
  const handleSidebarCollapseChange = (isCollapsed: boolean) => {
    setSidebarCollapsed(isCollapsed);
  };

  return (
    <div className="flex h-screen bg-gray-100 font-rubik">
      <BusinessSidebar onCollapseChange={handleSidebarCollapseChange} />
      
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 w-full ${sidebarCollapsed ? 'lg:ml-24' : 'lg:ml-[310px]'}`}>
        <BusinessDashboardHeader title="Closed Opportunities" />
        
        <div className="flex-1 bg-gray-50 p-2 sm:p-4 md:p-6 pb-20 lg:pb-8 w-full overflow-y-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3 sm:gap-0">
            <button
              onClick={navigateBack}
              className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg flex items-center justify-center w-full sm:w-auto transition-all duration-300"
            >
              <ArrowLeft size={20} className="mr-1" /> Back to Opportunity Postings
            </button>
            
            <div className="text-sm text-gray-600 text-center sm:text-right w-full sm:w-auto">
              Total Closed Opportunities: {closedJobs.length}
            </div>
          </div>

          {/* Loading and error states */}
          {(!entityId || isLoading) && (
            <div className="flex justify-center items-center p-8">
              <div className="w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-2">
                {!entityId ? 'Loading user session...' : 'Loading closed opportunities...'}
              </span>
            </div>
          )}
          
          {error && entityId && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 w-96">
              {/* {error} */}
              Not able to fetch closed opportunities
            </div>
          )}
          
          <div className="bg-white rounded-xl shadow-sm mb-6">
            {/* <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search closed opportunities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
              </div>
            </div> */}
            
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
              {filteredJobs.length === 0 && !isLoading && !error ? (
                <div className="text-center py-8">
                  <div className="text-gray-500 mb-2">No closed opportunities found</div>
                  <div className="text-sm text-gray-400">
                    {searchTerm ? 'Try adjusting your search criteria' : 'Closed job postings will appear here'}
                  </div>
                </div>
              ) : (
                <>
                  {/* Mobile card view */}
                  <div className="md:hidden space-y-3 w-full">
                    {filteredJobs.map((job) => (
                      <div key={job.id} className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 w-full">
                        <div className="flex items-center mb-3">
                          <div className="flex-shrink-0 h-10 w-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                            <Briefcase className="h-5 w-5 text-red-600" />
                          </div>
                          <button
                            onClick={() => handleTitleClick(job.id)}
                            className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer flex items-center gap-2"
                          >
                            {job.title}
                            <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                              <Users size={12} />
                              {job.applicantCount || 0}
                            </span>
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                          <div>
                            <span className="text-gray-500 block">Skill Category:</span>
                            <span>{job.skillCategory || 'Not specified'}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 block">Employment Type:</span>
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                              {job.employmentType || 'Not specified'}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500 block">Work Mode:</span>
                            <span>{job.workMode || 'Not specified'}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 block">Experience:</span>
                            <span>{job.experienceRequired || 'Not specified'}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Desktop table view */}
                  <table className="hidden md:table w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Skill Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employment Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Work Mode</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Experience</th>
                      {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th> */}
                      {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Closed Date</th> */}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredJobs.map((job) => (
                      <tr key={job.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-red-100 rounded-full flex items-center justify-center">
                              <Briefcase className="h-5 w-5 text-red-600" />
                            </div>
                            <div className="ml-4">
                              <button
                                onClick={() => handleTitleClick(job.id)}
                                className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer flex items-center gap-2"
                              >
                                {job.title}
                                <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                  <Users size={12} />
                                  {job.applicantCount || 0}
                                </span>
                              </button>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {job.skillCategory || 'Not specified'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                            {job.employmentType || 'Not specified'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {job.workMode || 'Not specified'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {job.experienceRequired || 'Not specified'}
                        </td>
                        {/* <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{job.location}</div>
                        </td> */}
                        {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {job.closedDate || 'Not specified'}
                        </td> */}
                      </tr>
                    ))}
                  </tbody>
                </table>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
