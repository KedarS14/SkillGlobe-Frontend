import { create } from "zustand";
import {
  getProfilesByOpportunity,
  getAuthData,
  ProfilesByOpportunityResponse,
  ProfileData,
  markAsPreferredWithStoredAuth,
} from "@/app/api/job postings/profilesbyOpportunity";

// Interface for transformed applicant data for UI
export interface Applicant {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  shown_interest_timestamp: string;
  status: "pending" | "shortlisted" | "rejected" | "hired" | "interested";
  backendStatus?: string; // Original status from backend
  experience: string;
  skills: string[];
  creation: string;
  resumeUrl?: string;
  profileImage?: string;
  rating?: number;
  coverLetter?: string;
  matchScore?: number;
  opportunityMatchId?: string;
  profileOwner?: string;
  roleBasedProfile?: string;
  // New fields for enhanced display
  currentRole?: string; // rbp_desired_job_role
  domain?: string; // rbp_space
  workModePreference?: string; // rbp_work_mode
  primarySkills?: string[]; // Separate primary skills
  higherEducation?: string; // latest_education_level
}

// Utility function to convert API profile data to Applicant format
const mapProfileDataToApplicant = (profile: ProfileData): Applicant => {
  // Process primary and secondary skills - convert objects to strings
  const primarySkills = Array.isArray(profile.primary_skills)
    ? profile.primary_skills.map((skill) => {
        if (typeof skill === "object" && skill !== null) {
          return skill.skill_name || skill.skill || String(skill);
        }
        return String(skill);
      })
    : [];

  const secondarySkills = Array.isArray(profile.secondary_skills)
    ? profile.secondary_skills.map((skill) => {
        if (typeof skill === "object" && skill !== null) {
          return skill.skill_name || skill.skill || String(skill);
        }
        return String(skill);
      })
    : [];

  // Combine primary and secondary skills as strings
  const allSkills = [...primarySkills, ...secondarySkills];

  // Format phone number with masking
  const maskPhoneNumber = (phone: string) => {
    if (!phone || phone.length < 4) return phone;
    const visibleDigits = phone.slice(-4);
    const maskedDigits = "*".repeat(phone.length - 4);
    return maskedDigits + visibleDigits;
  };

  const phoneNumber =
    profile.mobile_number && profile.country_code
      ? `${profile.country_code} ${maskPhoneNumber(profile.mobile_number)}`
      : profile.mobile_number
      ? maskPhoneNumber(profile.mobile_number)
      : "-";

  // Determine status based on API data
  let status: Applicant["status"] = "pending";

  // First check fe_status (higher priority for actual workflow statuses)
  if (profile.fe_status && typeof profile.fe_status === "string") {
    const lowerStatus = profile.fe_status.toLowerCase();
    if (lowerStatus === "shortlisted") {
      status = "shortlisted";
    } else if (lowerStatus === "rejected") {
      status = "rejected";
    } else if (lowerStatus === "hired") {
      status = "hired";
    } else if (lowerStatus === "interested") {
      status = "interested";
    } else if (lowerStatus === "pending") {
      // For pending status, check if business has shown interest (is_preferred = 1)
      const isPreferred = profile.is_preferred === 1;
      if (isPreferred) {
        status = "interested";
      } else {
        status = "pending";
      }
     } else {
      // If fe_status exists but doesn't match above statuses, check is_preferred
      const isPreferred = profile.is_preferred === 1;
      if (isPreferred) {
        status = "interested";
      }
    }
  } else {
    // If no fe_status, check if profile is marked as preferred by the business (this means "interested")
    const isPreferred = profile.is_preferred === 1;
    if (isPreferred) {
      status = "interested";
    }
  }


  // Store the original backend status for filtering
  const backendStatus = profile.fe_status?.toLowerCase() || "";

  // Format location - handle empty strings and null values
  const hasCity =
    profile.rbp_preferred_city && profile.rbp_preferred_city.trim() !== "";
  const hasCountry =
    profile.rbp_preferred_country &&
    profile.rbp_preferred_country.trim() !== "";

  const location =
    hasCity && hasCountry
      ? `${profile.rbp_preferred_city}, ${profile.rbp_preferred_country}`
      : hasCity
      ? profile.rbp_preferred_city
      : hasCountry
      ? profile.rbp_preferred_country
      : "-";

  return {
    id: profile.opportunity_match_id,
    name: profile.full_name,
    email: profile.email,
    phone: phoneNumber,
    location: location,
    shown_interest_timestamp: profile.shown_interest_timestamp ? profile.shown_interest_timestamp.split(" ")[0] : profile.creation.split(" ")[0], // Extract date part
    status: status,
    experience: `${profile.rbp_relevant_experience} years`,
    skills: allSkills,
    rating: Math.min((profile.match_score / 100) * 5, 5), // Convert match score to 5-star rating
    matchScore: profile.match_score,
    opportunityMatchId: profile.opportunity_match_id,
    profileOwner: profile.profile_owner,
    roleBasedProfile: profile.role_based_profile,
    // New fields mapping
    currentRole:
      profile.rbp_desired_job_role || profile.desired_job_role || undefined,
    domain: profile.rbp_space || undefined,
    workModePreference: profile.rbp_work_mode || undefined,
    primarySkills: primarySkills,
    higherEducation: profile.latest_education_level || undefined,
    creation: profile.creation || "",
  };
};

// Interface for job details
export interface JobDetails {
  creation: string | number | Date;
  id: string;
  title: string;
  skillCategory: string;
  employmentType: string;
  workMode: string;
  location: string;
  postedDate: string;
  applicationDeadline?: string;
  totalApplicants: number;
}

// Interface for the store state
interface ProfilesByOpportunityState {
  // Profiles data
  profiles: ProfileData[] | null;
  applicants: Applicant[] | null; // Transformed data for UI
  jobDetails: JobDetails | null;
  isLoading: boolean;
  error: string | null;
  totalProfiles: number;
  totalPages: number;
  currentPage: number;
  searchQuery: string;

  // Actions
  fetchProfilesByOpportunity: (opportunityPostingId: string, searchQuery?: string) => Promise<void>;
  updateApplicantStatus: (
    applicantId: string,
    newStatus: Applicant["status"]
  ) => Promise<void>;
  setJobDetails: (jobDetails: JobDetails) => void;
  setSearchQuery: (query: string) => void;
  clearError: () => void;
  resetStore: () => void;
}

// Initial state
const initialState = {
  profiles: null,
  applicants: null,
  jobDetails: null,
  isLoading: false,
  error: null,
  totalProfiles: 0,
  totalPages: 0,
  currentPage: 1,
  searchQuery: '',
};

// Create the store
export const useProfilesByOpportunityStore = create<ProfilesByOpportunityState>(
  (set, get) => ({
    ...initialState,

    // Set search query
    setSearchQuery: (query: string) => {
      set({ searchQuery: query });
    },
    
    // Fetch profiles by opportunity data
    fetchProfilesByOpportunity: async (opportunityPostingId: string, searchQuery?: string) => {
      try {
        set({ isLoading: true, error: null });

        // Get authentication data
        const authData = getAuthData();
        if (!authData) {
          throw new Error("Authentication data not found. Please login again.");
        }

        const { entityId, apiKey, apiSecret } = authData;

        if (!apiKey || !apiSecret) {
          throw new Error("API credentials not found. Please login again.");
        }

        console.log("Fetching profiles for opportunity:", opportunityPostingId);

        // Use provided searchQuery or get from state
        const query = searchQuery !== undefined ? searchQuery : get().searchQuery;
        
        // Call the API
        const response: ProfilesByOpportunityResponse =
          await getProfilesByOpportunity(
            entityId,
            opportunityPostingId,
            apiKey,
            apiSecret,
            query
          );

        // Check if the response is successful
        if (response.message.status === "success") {
          // Transform API data to UI format
          const transformedApplicants = response.message.data.map(
            mapProfileDataToApplicant
          );

          // Extract job details from first profile (if available)
          const firstProfile = response.message.data[0];
          let jobDetails: JobDetails | null = null;

          if (firstProfile) {
            jobDetails = {
              id: firstProfile.opportunity_posting,
              title: firstProfile.opportunity_title,
              skillCategory: firstProfile.desired_job_role,
              employmentType: firstProfile.opportunity_type,
              workMode: firstProfile.work_mode,
              location: firstProfile.rbp_preferred_country,
              postedDate: new Date(firstProfile.creation).toLocaleDateString(),
              totalApplicants: response.message.total_count,
              creation: firstProfile.creation,
            };
          }

          set({
            profiles: response.message.data,
            applicants: transformedApplicants,
            jobDetails: jobDetails,
            totalProfiles: response.message.total_count,
            totalPages: response.message.total_pages,
            currentPage: response.message.current_page,
            isLoading: false,
            error: null,
          });
        } else {
          throw new Error(
            response.message.message ||
              "Failed to fetch profiles by opportunity"
          );
        }
      } catch (error: any) {
        console.error("Error fetching profiles by opportunity:", error);

        // For authentication errors or API failures, show empty data instead of error
        if (
          error.message?.includes("Authentication data not found") ||
          error.message?.includes("API credentials not found") ||
          error.message?.includes("Entity ID not found") ||
          error.message?.includes("Entity ID is required")
        ) {
          console.log("Setting empty profiles due to auth issues");
          set({
            profiles: [],
            applicants: [],
            jobDetails: null,
            totalProfiles: 0,
            totalPages: 0,
            currentPage: 1,
            isLoading: false,
            error: null,
          });
        } else {
          set({
            isLoading: false,
            error: error.message || "Failed to fetch profiles by opportunity",
            profiles: null,
            applicants: null,
          });
        }
      }
    },

    // Update applicant status
    updateApplicantStatus: async (
      applicantId: string,
      newStatus: Applicant["status"]
    ) => {
      try {
        // If the new status is 'interested', call the mark as preferred API
        if (newStatus === "interested") {
          console.log("Marking profile as preferred:", applicantId);
          await markAsPreferredWithStoredAuth(applicantId);
          console.log("Successfully marked profile as preferred");
        }

        // Update the local state regardless of API call result
        const { applicants } = get();
        if (applicants) {
          const updatedApplicants = applicants.map((applicant) =>
            applicant.id === applicantId
              ? { ...applicant, status: newStatus }
              : applicant
          );
          set({ applicants: updatedApplicants });
        }
      } catch (error: any) {
        console.error("Error updating applicant status:", error);

        // Still update local state even if API call fails
        const { applicants } = get();
        if (applicants) {
          const updatedApplicants = applicants.map((applicant) =>
            applicant.id === applicantId
              ? { ...applicant, status: newStatus }
              : applicant
          );
          set({ applicants: updatedApplicants });
        }

        // You might want to show a toast notification here about the API failure
        // For now, we'll just log the error
        console.warn("API call failed but local state was updated");
      }
    },

    // Set job details
    setJobDetails: (jobDetails: JobDetails) => {
      set({ jobDetails });
    },

    // Clear error
    clearError: () => {
      set({ error: null });
    },

    // Reset store to initial state
    resetStore: () => {
      set(initialState);
    },
  })
);
