import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://skillglobedev.m.frappe.cloud';

// Helper function to get API key and secret from localStorage
const getApiCredentials = (): { apiKey: string | null; apiSecret: string | null } => {
  if (typeof window !== 'undefined') {
    const apiKey = localStorage.getItem('auth_api_key');
    const apiSecret = localStorage.getItem('auth_api_secret');
    
    return { apiKey, apiSecret };
  }
  return { apiKey: null, apiSecret: null };
};

// Interface for job posting
export interface JobPosting {
  name: string;
  opportunity_title: string;
  role_skill_category: string;
  employment_type: string;
  work_mode: string;
  experience_required: string;
  location: string | null;
  created_date?: string;
  application_deadline?: string;
  application_count?: number;
  status?: string;
  profiles_match_count?: number;
}

// Interface for job posting list response
export interface JobPostingListResponse {
  message: {
    status: string;
    message: string;
    data: {
      opportunity_posting: JobPosting[];
      entity_id: string;
    };
    timestamp: string;
  };
}

// Interface for close opportunity request
export interface CloseOpportunityRequest {
  entity_id: string;
  name: string;
}

// Interface for close opportunity response
export interface CloseOpportunityResponse {
  message: {
    status: string;
    message: string;
    timestamp: string;
  };
}

// Interface for closed opportunities request
export interface ClosedOpportunitiesRequest {
  entity_id: string;
}

// Interface for closed opportunity data
export interface ClosedOpportunity {
  name: string;
  opportunity_title: string;
  role_skill_category: string;
  employment_type: string;
  work_mode: string;
  experience_required: string;
  location: string;
  application_deadline: string;
  profiles_match_count: number;
}

// Interface for closed opportunities response
export interface ClosedOpportunitiesResponse {
  message: {
    status: string;
    message: string;
    data: {
      closed_opportunity_posting: ClosedOpportunity[];
      entity_id: string;
    };
    timestamp: string;
  };
}

export const getJobPostingList = async (entityId: string, searchQuery?: string): Promise<JobPostingListResponse> => {
  try {
    // Get API credentials
    const { apiKey, apiSecret } = getApiCredentials();
    
    // Create authorization header using API key and secret
    const authHeader = `token ${apiKey}:${apiSecret}`;
    
    // Build URL with query parameters
    const url = new URL(`${API_BASE_URL}/api/method/skillglobe_be.api.opportunity_posting.list.get_job_posting_list`);
    
    // Add parameters
    url.searchParams.append('entity_id', entityId);
    if (searchQuery && searchQuery.trim() !== '') {
      url.searchParams.append('search_query', searchQuery.trim());
    }
    
    const response = await axios.get<JobPostingListResponse>(
      url.toString(),
      {
        headers: {
          'Accept': 'application/json',
          'Authorization': authHeader
        }
      }
    );
    
    console.log('Job posting list response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Job posting list error:', error.response?.data || error.message || error);
    throw error;
  }
};

export const closeOpportunity = async (entityId: string, opportunityName: string): Promise<CloseOpportunityResponse> => {
  try {
    // Get API credentials
    const { apiKey, apiSecret } = getApiCredentials();
    
    // Create authorization header using API key and secret
    const authHeader = `token ${apiKey}:${apiSecret}`;
    
    const requestBody: CloseOpportunityRequest = {
      entity_id: entityId,
      name: opportunityName
    };
    
    const response = await axios.post<CloseOpportunityResponse>(
      `${API_BASE_URL}/api/method/skillglobe_be.api.opportunity_posting.form.enable_opportunity_closed`,
      requestBody,
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': authHeader
        }
      }
    );
    
    console.log('Close opportunity response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Close opportunity error:', error.response?.data || error.message || error);
    throw error;
  }
};

export const getClosedOpportunities = async (entityId: string): Promise<ClosedOpportunitiesResponse> => {
  try {
    // Get API credentials
    const { apiKey, apiSecret } = getApiCredentials();
    
    // Create authorization header using API key and secret
    const authHeader = `token ${apiKey}:${apiSecret}`;
    
    const response = await axios.get<ClosedOpportunitiesResponse>(
      `${API_BASE_URL}/api/method/skillglobe_be.api.opportunity_posting.form.get_closed_opportunity_posting?entity_id=${entityId}`,
      {
        headers: {
          'Accept': 'application/json',
          'Authorization': authHeader
        }
      }
    );
    
    console.log('Closed opportunities response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Closed opportunities error:', error.response?.data || error.message || error);
    throw error;
  }
};
