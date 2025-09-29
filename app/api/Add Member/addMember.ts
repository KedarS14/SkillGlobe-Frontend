import axios from 'axios';

// Base URL for API calls
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// Interface for add member data
export interface AddMemberData {
  entity_id: string;
  email: string;
  full_name: string;
  password: string;
  send_welcome_email: boolean;
}

// Interface for add member response
export interface AddMemberResponse {
  message: {
    status: string;
    data?: any;
    message?: string;
  };
}

// Interface for get members request
export interface GetMembersRequest {
  entity_id: string;
  search_query?: string;
}

// Interface for member data from API
export interface BusinessMember {
  full_name: string;
  email: string;
  role: string;
  status: string;
  name: string;
}

// Interface for get members response
export interface GetMembersResponse {
  message: {
    status: string;
    message: string;
    data: {
      members: BusinessMember[];
    };
    timestamp: string;
    entity_id: string;
  };
}

// Interface for deactivate member request
export interface DeactivateMemberRequest {
  entity_id: string;
  business_user_id: string;
}

// Interface for deactivate member response
export interface DeactivateMemberResponse {
  message: {
    status: string;
    message: string;
    data?: any;
    timestamp: string;
  };
}

export const addMember = async (
  memberData: AddMemberData,
  apiKey: string,
  apiSecret: string
): Promise<AddMemberResponse> => {
  try {
    console.log('Adding member with entity ID:', memberData.entity_id);
    
    // Create authorization header
    const authHeader = `token ${apiKey}:${apiSecret}`;
    
    const response = await axios.post<AddMemberResponse>(
      `${API_BASE_URL}/api/method/skillglobe_be.api.business_admin.form.add_business_user`,
      memberData,
      {
        headers: {
          'Authorization': authHeader,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Add member response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Add member error:', error.response?.data || error.message || error);
    throw error;
  }
};

export const getBusinessMembers = async (
  entityId: string,
  apiKey: string,
  apiSecret: string,
  searchQuery?: string
): Promise<GetMembersResponse> => {
  try {
    console.log('Fetching business members for entity ID:', entityId);
    
    // Create authorization header
    const authHeader = `token ${apiKey}:${apiSecret}`;
    
    const requestData: GetMembersRequest = {
      entity_id: entityId,
      ...(searchQuery ? { search_query: searchQuery } : {})
    };
    
    const response = await axios.get<GetMembersResponse>(
      `${API_BASE_URL}/api/method/skillglobe_be.api.business_profile.form.get_business_members`,
      {
        params: requestData,
        headers: {
          'Authorization': authHeader,
          'Accept': 'application/json'
        }
      }
    );
    
    console.log('Get business members response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Get business members error:', error.response?.data || error.message || error);
    throw error;
  }
};

export const deactivateMember = async (
  entityId: string,
  businessUserId: string,
  apiKey: string,
  apiSecret: string
): Promise<DeactivateMemberResponse> => {
  try {
    console.log('Deactivating business member with ID:', businessUserId);
    
    // Create authorization header
    const authHeader = `token ${apiKey}:${apiSecret}`;
    
    const requestData: DeactivateMemberRequest = {
      entity_id: entityId,
      business_user_id: businessUserId
    };
    
    const response = await axios.post<DeactivateMemberResponse>(
      `${API_BASE_URL}/api/method/skillglobe_be.api.business_admin.form.remove_business_user`,
      requestData,
      {
        headers: {
          'Authorization': authHeader,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Deactivate member response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Deactivate member error:', error.response?.data || error.message || error);
    throw error;
  }
};

export const getAuthData = () => {
  if (typeof window !== 'undefined') {
    try {
      // Get token and entity data from localStorage
      const token = localStorage.getItem('auth_token');
      const entityDataStr = localStorage.getItem('entity_data');
      const entityData = entityDataStr ? JSON.parse(entityDataStr) : {};
      
      const apiKey = localStorage.getItem('auth_api_key');
      const apiSecret = localStorage.getItem('auth_api_secret');
      
      // If we don't have the API credentials in localStorage, try to get them from auth-storage
      if (!apiKey || !apiSecret) {
        console.log('API credentials not found in direct localStorage, checking auth-storage...');
        const authString = localStorage.getItem('auth-storage');
        
        if (authString) {
          const authStorage = JSON.parse(authString);
          const state = authStorage.state;
          
          // Try to get API credentials from state
          if (state && state.token) {
            console.log('Found token in auth-storage, checking for auth data...');
          }
        }
      }
      
      // Check if we have all required auth data
      if (!token || !entityData?.details?.entity_id || !apiKey || !apiSecret) {
        console.log('Missing auth data:', { 
          hasToken: !!token, 
          hasEntityId: !!entityData?.details?.entity_id, 
          hasApiKey: !!apiKey, 
          hasApiSecret: !!apiSecret 
        });
        return null;
      }
      
      return {
        token,
        entityId: entityData.details.entity_id,
        apiKey,
        apiSecret
      };
    } catch (error) {
      console.error('Error getting auth data:', error);
      return null;
    }
  }
  return null;
};