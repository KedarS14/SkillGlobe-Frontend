"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Search,
  Filter,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  FileText,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Star,
  Loader2,
  AlertCircle,
} from "lucide-react";
import BusinessSidebar from "@/components/dashboard/BusinessSidebar";
import BusinessDashboardHeader from "@/components/dashboard/BusinessDashboardHeader";
import {
  useProfilesByOpportunityStore,
  type Applicant,
  type JobDetails,
} from "@/store/job-postings/profilesbyopportunityStore";
import {
  getResumeForBuyer,
  getAuthData,
  type ResumeData,
} from "@/app/api/job postings/resumeagainstopportunity";
import { formatDate } from "@/utils/dateformat";
// Interfaces are now imported from the store

export default function JobAppliedUsersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobId = searchParams.get("jobId");

  // Store state
  const {
    applicants,
    jobDetails,
    isLoading,
    error,
    totalProfiles,
    fetchProfilesByOpportunity,
    updateApplicantStatus,
    resetStore
  } = useProfilesByOpportunityStore();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(
    null
  );
  const [detailedProfile, setDetailedProfile] = useState<ResumeData | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Fetch data on component mount
  useEffect(() => {
    if (jobId) {
      fetchProfilesByOpportunity(jobId, searchTerm);
    }

    // Cleanup on unmount
    return () => {
      resetStore();
    };
  }, [jobId, fetchProfilesByOpportunity, resetStore, searchTerm]);
  
  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  
  // Debounced search effect
  useEffect(() => {
    if (!jobId) return;
    
    const timer = setTimeout(() => {
      fetchProfilesByOpportunity(jobId, searchTerm);
    }, 500); // 500ms debounce
    
    return () => clearTimeout(timer);
  }, [searchTerm, fetchProfilesByOpportunity, jobId]);

  const handleStatusChange = async (
    applicantId: string,
    newStatus: Applicant["status"]
  ) => {
    try {
      await updateApplicantStatus(applicantId, newStatus);

      // Show success message for "Show Interest" action
      if (newStatus === "interested") {
        console.log("Successfully showed interest in profile");
        // You can add a toast notification here if needed
      }
    } catch (error) {
      console.error("Error updating status:", error);
      // You can add error handling/toast notification here if needed
    }
  };

  // Helper function to check if a field has a valid value
  const hasValidValue = (value: any): boolean => {
    return value !== null && value !== undefined && value !== "" && value.toString().trim() !== "";
  };

  const handleViewProfile = async (applicant: Applicant) => {
    setSelectedApplicant(applicant);
    setShowProfileModal(true);
    setDetailedProfile(null);
    setProfileError(null);

    if (applicant.roleBasedProfile) {
      setProfileLoading(true);
      try {
        // Get authentication data
        const authData = getAuthData();
        if (!authData) {
          throw new Error("Authentication data not found. Please login again.");
        }

        const response = await getResumeForBuyer(
          applicant.roleBasedProfile,
          authData.apiKey,
          authData.apiSecret
        );
        setDetailedProfile(response.message.data);
      } catch (error: any) {
        console.error("Error fetching detailed profile:", error);
        setProfileError("Failed to load detailed profile information");
      } finally {
        setProfileLoading(false);
      }
    } else {
      setProfileError("Role based profile ID not available");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "shortlisted":
        return "bg-blue-100 text-blue-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "hired":
        return "bg-green-100 text-green-800";
      case "interested":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock size={14} />;
      case "shortlisted":
        return <Star size={14} />;
      case "rejected":
        return <XCircle size={14} />;
      case "hired":
        return <CheckCircle size={14} />;
      case "interested":
        return <Star size={14} />;
      default:
        return <Clock size={14} />;
    }
  };

  const filteredApplicants = (applicants || []).filter((applicant: Applicant) => {
    // We only need to filter by status now, as search is handled by the API
    const matchesStatus =
      statusFilter === "all" || 
      applicant.status === statusFilter ||
      (statusFilter === "pending" && applicant.status === "interested");

    return matchesStatus;
  });

  const statusCounts = {
    all: applicants?.length || 0,
    pending: applicants?.filter((a: Applicant) => a.status === "pending" || a.status === "interested").length || 0,
    shortlisted:
      applicants?.filter((a: Applicant) => a.status === "shortlisted").length || 0,
    rejected: applicants?.filter((a: Applicant) => a.status === "rejected").length || 0,
    hired: applicants?.filter((a: Applicant) => a.status === "hired").length || 0,
  };

  return (
    <div className="flex h-screen bg-gray-100 font-rubik">
      <BusinessSidebar onCollapseChange={setSidebarCollapsed} />

      <div className={`flex-1 flex flex-col overflow-y-auto transition-all duration-300 w-full ${sidebarCollapsed ? 'lg:ml-24' : 'lg:ml-[310px]'}`}>
        <BusinessDashboardHeader title="Opportunity Applicants" />

        <div className="flex-1 bg-gray-50 p-2 sm:p-4 md:p-6 pb-20 lg:pb-8 w-full">
          {/* Header Section */}
          <div className="mb-6">
            <button
              onClick={() => router.back()}
              className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg flex items-center transition-all duration-300 mb-4"
            >
              <ArrowLeft size={20} className="mr-1" /> Back
            </button>

            {jobDetails && (
              <div className="bg-white rounded-xl shadow-sm p-3 sm:p-4 md:p-6 mb-4 sm:mb-6 w-full">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                      {jobDetails.title}
                    </h1>
                    <div className="flex flex-wrap gap-2 sm:gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <MapPin size={16} /> {jobDetails.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar size={16} /> Posted{" "}
                        {formatDate(jobDetails.creation)}
                      </span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                        {jobDetails.employmentType}
                      </span>
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                        {jobDetails.workMode}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">
                      {totalProfiles}
                    </div>
                    <div className="text-sm text-gray-600">
                      Total Applicants
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Filters and Search */}
          <div className="bg-white rounded-xl shadow-sm mb-4 sm:mb-6 w-full">
            <div className="p-3 sm:p-4 border-b border-gray-200">
              <div className="flex flex-col gap-3 sm:gap-4">
                {/* Search Input */}
                <div className="w-full relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Search applicants by city or experience..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  />
                </div>
                
                {/* Status Filters */}
                <div className="flex gap-2 flex-wrap w-full overflow-x-auto pb-1">
                  {Object.entries(statusCounts).map(([status, count]) => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        statusFilter === status
                          ? "bg-blue-500 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)} (
                      {count})
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Applicants List */}
            <div className="p-3 sm:p-4 md:p-6 max-h-none">
              {/* Loading State */}
              {isLoading && (
                <div className="flex items-center justify-center py-12">
                  <Loader2
                    className="animate-spin text-blue-500 mr-2"
                    size={24}
                  />
                  <span className="text-gray-600">Loading applicants...</span>
                </div>
              )}

              {/* Error State */}
              {error && (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="bg-gray-100 rounded-full p-4 mb-4">
                    <User className="text-gray-400" size={32} />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">
                    No Applicants Found
                  </h3>
                  <p className="text-gray-500 text-center max-w-md mb-4">
                    There are currently no applicants for this opportunity.
                  </p>
                </div>
              )}

              {/* Empty State */}
              {!isLoading && !error && filteredApplicants.length === 0 && (
                <div className="text-center py-8">
                  <div className="text-gray-500 mb-2">No applicants found</div>
                  <div className="text-sm text-gray-400">
                    {searchTerm
                      ? "Try adjusting your search criteria"
                      : "No applications received yet"}
                  </div>
                </div>
              )}

              {/* Applicants List */}
              {!isLoading && !error && filteredApplicants.length > 0 && (
                <div className="space-y-3 sm:space-y-4 pb-8">
                  {filteredApplicants.map((applicant) => (
                    <div
                      key={applicant.id}
                      className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-start sm:items-center space-x-3 sm:space-x-4">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900">
                              {applicant.name}
                            </h3>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs sm:text-sm text-gray-600 mt-1">
                              <span className="flex items-center gap-1">
                                <Mail size={14} /> {applicant.email}
                              </span>
                              <span className="flex items-center gap-1">
                                <Phone size={14} /> {applicant.phone}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin size={14} /> {applicant.location || "-"}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                              <span className="text-sm text-gray-600">
                                Experience: {applicant.experience}
                              </span>
                              {/* {applicant.rating && (
                                <div className="flex items-center gap-1">
                                  <Star
                                    size={14}
                                    className="text-yellow-500 fill-current"
                                  />
                                  <span className="text-sm text-gray-600">
                                    {applicant.rating.toFixed(1)}
                                  </span>
                                </div>
                              )} */}
                              {applicant.matchScore && (
                                <div className="flex items-center gap-1">
                                  <span className="text-sm text-blue-600 font-medium">
                                    {applicant.matchScore}% match
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-1 mt-2 max-w-full overflow-hidden">
                              {applicant.skills
                                .slice(0, 4)
                                .map((skill, index) => (
                                  <span
                                    key={index}
                                    className="px-2 py-1 bg-green-100 text-gray-700 text-xs rounded-xl"
                                  >
                                    {skill}
                                  </span>
                                ))}
                              {applicant.skills.length > 4 && (
                                <span className="px-2 py-1 bg-green-100 text-gray-700 text-xs rounded">
                                  +{applicant.skills.length - 4} more
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 justify-end">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                              applicant.status.toLowerCase()
                            )}`}
                          >
                            {applicant.status.charAt(0).toUpperCase() +
                              applicant.status.slice(1)}
                          </span>

                          <div className="flex gap-1 sm:gap-2">
                            {applicant.status !== "pending" && applicant.status !== "interested" && (
                                <button
                                  onClick={() => handleViewProfile(applicant)}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="View Profile"
                                >
                                  <Eye size={16} />
                                </button>
                              )}

                            {applicant.status === "pending" && (
                              <>
                                <button
                                  onClick={() =>
                                    handleStatusChange(
                                      applicant.id,
                                      "interested"
                                    )
                                  }
                                  className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                  title="Show Interest"
                                >
                                  <Star size={16} />
                                </button>
                                {/* <button
                                  onClick={() =>
                                    handleStatusChange(applicant.id, "rejected")
                                  }
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Reject"
                                >
                                  <XCircle size={16} />
                                </button> */}
                              </>
                            )}

                            {/* {applicant.status === "shortlisted" && (
                              <button
                                onClick={() =>
                                  handleStatusChange(applicant.id, "hired")
                                }
                                className="px-3 py-1 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors"
                              >
                                Hire
                              </button>
                            )} */}
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 ml-4 flex items-center gap-3 text-sm text-gray-600">
                        {(applicant.status === "shortlisted" || applicant.status === "rejected" || applicant.status === "hired") && (
                          <span>
                            Applied On: {formatDate(applicant.shown_interest_timestamp)}
                          </span>
                        )}

                        {/* <button className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                          View Resume
                        </button> */}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Profile Modal */}
      {showProfileModal && selectedApplicant && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-4 sm:p-6 w-full max-w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-2xl font-semibold text-gray-900">
                {detailedProfile
                  ? `${detailedProfile.portfolio.first_name} ${detailedProfile.portfolio.last_name}`
                  : selectedApplicant.name}
              </h3>
              <button
                onClick={() => setShowProfileModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle size={24} />
              </button>
            </div>

            {profileLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="animate-spin mr-2" size={24} />
                <span>Loading detailed profile...</span>
              </div>
            )}

            {profileError && (
              <div className="flex items-center justify-center py-8 text-red-600">
                <AlertCircle className="mr-2" size={24} />
                <span>{profileError}</span>
              </div>
            )}

            {detailedProfile && (
              <div className="space-y-6">
                {/* Personal Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">
                    Personal Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    {hasValidValue(detailedProfile.portfolio.email) && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Email
                        </label>
                        <p className="text-gray-900">
                          {detailedProfile.portfolio.email}
                        </p>
                      </div>
                    )}
                    {hasValidValue(detailedProfile.portfolio.mobile_no) && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Mobile
                        </label>
                        <p className="text-gray-900">
                          {detailedProfile.portfolio.mobile_no}
                        </p>
                      </div>
                    )}
                    {(hasValidValue(detailedProfile.portfolio.city) || hasValidValue(detailedProfile.portfolio.country)) && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Location
                        </label>
                        <p className="text-gray-900">
                          {detailedProfile.portfolio.city &&
                          detailedProfile.portfolio.country
                            ? `${detailedProfile.portfolio.city}, ${detailedProfile.portfolio.country}`
                            : detailedProfile.portfolio.city ||
                              detailedProfile.portfolio.country}
                        </p>
                      </div>
                    )}
                    {hasValidValue(detailedProfile.portfolio.linkedin_profile) && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          LinkedIn
                        </label>
                        <p className="text-gray-900">
                          <a
                            href={detailedProfile.portfolio.linkedin_profile}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline"
                          >
                            {detailedProfile.portfolio.linkedin_profile}
                          </a>
                        </p>
                      </div>
                    )}
                    {hasValidValue(detailedProfile.portfolio.github_profile) && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          GitHub
                        </label>
                        <p className="text-gray-900">
                          <a
                            href={detailedProfile.portfolio.github_profile}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline"
                          >
                            {detailedProfile.portfolio.github_profile}
                          </a>
                        </p>
                      </div>
                    )}
                    {hasValidValue(detailedProfile.portfolio.website) && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Website
                        </label>
                        <p className="text-gray-900">
                          <a
                            href={detailedProfile.portfolio.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline"
                          >
                            {detailedProfile.portfolio.website}
                          </a>
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Professional Summary */}
                {hasValidValue(detailedProfile.portfolio.professional_summary) && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">
                      Professional Summary
                    </h4>
                    <p className="text-gray-700 p-3 bg-gray-50 rounded-lg">
                      {detailedProfile.portfolio.professional_summary}
                    </p>
                  </div>
                )}

                {/* Role Information */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">
                    Role Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    {hasValidValue(detailedProfile.role_based_profile.role) && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Role
                        </label>
                        <p className="text-gray-900">
                          {detailedProfile.role_based_profile.role}
                        </p>
                      </div>
                    )}
                    {hasValidValue(detailedProfile.role_based_profile.space) && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Space/Domain
                        </label>
                        <p className="text-gray-900">
                          {detailedProfile.role_based_profile.space}
                        </p>
                      </div>
                    )}
                    {hasValidValue(detailedProfile.role_based_profile.employment_type) && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Employment Type
                        </label>
                        <p className="text-gray-900">
                          {detailedProfile.role_based_profile.employment_type}
                        </p>
                      </div>
                    )}
                    {hasValidValue(detailedProfile.role_based_profile.work_mode) && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Work Mode
                        </label>
                        <p className="text-gray-900">
                          {detailedProfile.role_based_profile.work_mode}
                        </p>
                      </div>
                    )}
                    {(detailedProfile.role_based_profile.relevant_experience > 0) && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Relevant Experience
                        </label>
                        <p className="text-gray-900">
                          {detailedProfile.role_based_profile.relevant_experience} years
                        </p>
                      </div>
                    )}
                    {hasValidValue(detailedProfile.role_based_profile.total_experience_years) && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Total Experience
                        </label>
                        <p className="text-gray-900">
                          {detailedProfile.role_based_profile.total_experience_years} years
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Skills */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">
                    Skills
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Primary Skills
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {detailedProfile.role_based_profile.primary_skills
                          .length > 0 ? (
                          detailedProfile.role_based_profile.primary_skills.map(
                            (skill, index) => (
                              <span
                                key={index}
                                className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                              >
                                {skill.skill_name}
                              </span>
                            )
                          )
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Secondary Skills
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {detailedProfile.role_based_profile.secondary_skills
                          .length > 0 ? (
                          detailedProfile.role_based_profile.secondary_skills.map(
                            (skill, index) => (
                              <span
                                key={index}
                                className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full"
                              >
                                {skill.skill_name}
                              </span>
                            )
                          )
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Work Experience */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">
                    Work Experience
                  </h4>
                  <div className="space-y-3">
                    {detailedProfile.portfolio.work_experience.length > 0 ? (
                      detailedProfile.portfolio.work_experience.map(
                        (exp, index) => (
                          <div
                            key={index}
                            className="p-3 bg-gray-50 rounded-lg"
                          >
                            <p className="font-medium text-gray-900">
                              <span>Designation :</span> {exp.designation || "-"}
                            </p>
                            <p className="text-gray-600">
                              <span>Company :</span> {exp.company || "-"}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              <span>Duration :</span> {exp.duration || "-"} Years
                            </p>
                          </div>
                        )
                      )
                    ) : (
                      <p className="text-gray-500">-</p>
                    )}
                  </div>
                </div>

                {/* Education */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">
                    Education
                  </h4>
                  <div className="space-y-3">
                    {detailedProfile.portfolio.education.length > 0 ? (
                      detailedProfile.portfolio.education.map((edu, index) => (
                        <div key={index} className="p-3 bg-gray-50 rounded-lg">
                          <p className="font-medium text-gray-900">
                          <span>Education Level :</span>  {edu.education_level || "-"}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                          <span>Stream :</span>  {edu.stream || "-"}
                          </p>
                          <p className="text-gray-600">
                          <span>Year of Completion :</span>  {`${edu.university_board || ""} - ${
                              edu.year_of_completion || "-"
                            }`}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500">-</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-6 border-t mt-6">
              <button
                onClick={() => setShowProfileModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
