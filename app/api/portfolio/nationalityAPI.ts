import axios from "axios";

// Base URL for API calls
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export interface Nationality {
  name: string;
}

export interface NationalityListResponse {
  message: {
    status: string;
    message?: string;
    data?: Nationality[];
    timestamp?: string;
  };
}

/**
 * Get authentication data from local storage
 * @returns Object containing entity ID, API key, and API secret
 */
export const getAuthData = () => {
  if (typeof window !== "undefined") {
    try {
      // Get token and entity data from localStorage
      const token = localStorage.getItem("auth_token");
      const entityDataStr = localStorage.getItem("entity_data");
      console.log("Entity data from localStorage:", entityDataStr);

      const entityData = entityDataStr ? JSON.parse(entityDataStr) : {};
      console.log("Parsed entity data:", entityData);

      // Entity ID is stored in details.entity_id, not directly in entity_id
      const entityId = entityData.details?.entity_id;
      console.log("Entity ID from parsed data:", entityId);

      // Store auth data directly in localStorage during login
      const apiKey = localStorage.getItem("auth_api_key");
      const apiSecret = localStorage.getItem("auth_api_secret");

      // If we don't have the API credentials in localStorage, try to get them from auth-storage
      if (!apiKey || !apiSecret) {
        console.log(
          "API credentials not found in direct localStorage, checking auth-storage..."
        );
        const authString = localStorage.getItem("auth-storage");

        if (authString) {
          const authStorage = JSON.parse(authString);
          const state = authStorage.state;

          // Try to get API credentials from state
          if (state && state.token) {
            const retrievedEntityId = entityId || state.entityId || "";

            if (!retrievedEntityId) {
              console.error(
                "Entity ID not found in localStorage or auth-storage"
              );
              return null;
            }

            console.log(
              "Using entity ID from auth-storage:",
              retrievedEntityId
            );

            return {
              entityId: retrievedEntityId,
              apiKey: state.apiKey || "",
              apiSecret: state.apiSecret || "",
            };
          }
        }

        return null;
      }

      const retrievedEntityId = entityId || "";

      if (!retrievedEntityId) {
        console.error("Entity ID not found in localStorage");
        return null;
      }

      // Log the entity ID being used
      console.log("Using entity ID:", retrievedEntityId);

      return {
        entityId: retrievedEntityId,
        apiKey,
        apiSecret,
      };
    } catch (error) {
      console.error("Error getting auth data:", error);
      return null;
    }
  }

  return null;
};

/**
 * Fetch nationalities from the API
 * @returns Promise with the response containing nationality list
 */
export const fetchNationalitiesAPI =
  async (): Promise<NationalityListResponse> => {
    try {
      const authData = getAuthData();
      if (!authData) {
        throw new Error("Authentication data not found. Please log in again.");
      }

      const response = await axios.get<NationalityListResponse>(
        `${API_BASE_URL}/api/method/skillglobe_be.api.portfolio.nationality.get_nationality`,
        {
          headers: {
            Authorization: `token ${authData.apiKey}:${authData.apiSecret}`,
            Accept: "application/json",
          },
        }
      );

      return response.data;
    } catch (error: any) {
      console.error(
        "Get nationalities error:",
        error.response?.data || error.message || error
      );
      throw error;
    }
  };
