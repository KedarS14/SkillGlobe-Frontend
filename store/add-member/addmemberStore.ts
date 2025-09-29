import { create } from 'zustand';
import { addMember, getAuthData, getBusinessMembers, deactivateMember, AddMemberData, AddMemberResponse, BusinessMember, GetMembersResponse, DeactivateMemberResponse } from '@/app/api/Add Member/addMember';

interface AddMemberState {
  isLoading: boolean;
  error: string | null;
  success: boolean;
  members: BusinessMember[];
  isLoadingMembers: boolean;
  membersError: string | null;
  isDeactivating: boolean;
  deactivateError: string | null;
  deactivateSuccess: boolean;
  searchQuery: string;
  addMemberToTeam: (memberData: Omit<AddMemberData, 'entity_id'>) => Promise<void>;
  fetchBusinessMembers: (searchQuery?: string) => Promise<void>;
  deactivateMember: (businessUserId: string) => Promise<void>;
  resetState: () => void;
  setSearchQuery: (query: string) => void;
}

export const useAddMemberStore = create<AddMemberState>((set, get) => ({
  isLoading: false,
  error: null,
  success: false,
  members: [],
  isLoadingMembers: false,
  membersError: null,
  isDeactivating: false,
  deactivateError: null,
  deactivateSuccess: false,
  searchQuery: '',
  
  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },

  addMemberToTeam: async (memberData: Omit<AddMemberData, 'entity_id'>) => {
    set({ isLoading: true, error: null, success: false });

    try {
      // Get authentication data
      const authData = getAuthData();
      
      if (!authData) {
        throw new Error('Authentication data not found. Please login again.');
      }

      // Prepare the complete member data with entity_id
      const completeData: AddMemberData = {
        ...memberData,
        entity_id: authData.entityId
      };

      console.log('Adding member with data:', completeData);

      // Call the API
      const response = await addMember(completeData, authData.apiKey, authData.apiSecret);

      if (response.message.status === 'success') {
        set({ isLoading: false, success: true, error: null });
        console.log('Member added successfully:', response);
      } else {
        throw new Error(response.message.message || 'Failed to add member');
      }
    } catch (error: any) {
      console.error('Error adding member:', error);
      const errorMessage = error.response?.data?.message?.message || 
                          error.response?.data?.message || 
                          error.message || 
                          'Failed to add member';
      set({ isLoading: false, error: errorMessage, success: false });
    }
  },

  fetchBusinessMembers: async (searchQuery?: string) => {
    // Use provided searchQuery or get from state
    const query = searchQuery !== undefined ? searchQuery : get().searchQuery;
    set({ isLoadingMembers: true, membersError: null });

    try {
      // Get authentication data
      const authData = getAuthData();
      
      if (!authData) {
        throw new Error('Authentication data not found. Please login again.');
      }

      console.log('Fetching business members for entity:', authData.entityId);

      // Call the API with search query if provided
      const response = await getBusinessMembers(authData.entityId, authData.apiKey, authData.apiSecret, query);

      if (response.message.status === 'success') {
        set({ 
          isLoadingMembers: false, 
          members: response.message.data.members, 
          membersError: null 
        });
        console.log('Business members fetched successfully:', response.message.data.members);
      } else {
        throw new Error(response.message.message || 'Failed to fetch business members');
      }
    } catch (error: any) {
      console.error('Error fetching business members:', error);
      const errorMessage = error.response?.data?.message?.message || 
                          error.response?.data?.message || 
                          error.message || 
                          'Failed to fetch business members';
      set({ isLoadingMembers: false, membersError: errorMessage, members: [] });
    }
  },

  deactivateMember: async (businessUserId: string) => {
    set({ isDeactivating: true, deactivateError: null, deactivateSuccess: false });

    try {
      // Get authentication data
      const authData = getAuthData();
      
      if (!authData) {
        throw new Error('Authentication data not found. Please login again.');
      }

      console.log('Deactivating business member with ID:', businessUserId);

      // Call the API
      const response = await deactivateMember(
        authData.entityId, 
        businessUserId, 
        authData.apiKey, 
        authData.apiSecret
      );

      if (response.message.status === 'success') {
        set({ isDeactivating: false, deactivateSuccess: true, deactivateError: null });
        console.log('Member deactivated successfully:', response);
        
        // Refresh the members list after successful deactivation
        await get().fetchBusinessMembers();
      } else {
        throw new Error(response.message.message || 'Failed to deactivate member');
      }
    } catch (error: any) {
      console.error('Error deactivating member:', error);
      const errorMessage = error.response?.data?.message?.message || 
                          error.response?.data?.message || 
                          error.message || 
                          'Failed to deactivate member';
      set({ isDeactivating: false, deactivateError: errorMessage, deactivateSuccess: false });
    }
  },

  resetState: () => {
    set({ 
      isLoading: false, 
      error: null, 
      success: false,
      isDeactivating: false,
      deactivateError: null,
      deactivateSuccess: false
    });
  }
}));