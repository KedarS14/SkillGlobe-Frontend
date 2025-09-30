import { create } from "zustand";
import {
  uploadResume,
  getAuthData,
  ResumeUploadResponse,
} from "../../app/api/portfolio/resumeUpload";

interface ResumeState {
  isUploading: boolean;
  isUploaded: boolean;
  resumeFile: File | null;
  resumeUrl: string | null;
  error: string | null;
  uploadProgress: number;
  uploadResume: (file: File) => Promise<{ success: boolean; data?: any }>;
  resetState: () => void;
}

export const useResumeStore = create<ResumeState>((set, get) => ({
  isUploading: false,
  isUploaded: false,
  resumeFile: null,
  resumeUrl: null,
  error: null,
  uploadProgress: 0,

  uploadResume: async (file: File) => {
    set({
      isUploading: true,
      error: null,
      resumeFile: file,
      uploadProgress: 0,
    });

    const MIN_DURATION = 30000; // 30 seconds
    const startTime = Date.now();
    let progress = 0;

    // Animate progress to 99% over 30s
    const progressInterval = setInterval(() => {
      progress = Math.min(progress + 2, 99);
      set({ uploadProgress: progress });
    }, MIN_DURATION / 50);

    try {
      const authData = getAuthData();
      if (!authData?.entityId || !authData?.apiKey || !authData?.apiSecret) {
        throw new Error("Authentication data not found. Please log in again.");
      }

      // Upload API call
      const response = await uploadResume(
        file,
        authData.entityId,
        authData.apiKey,
        authData.apiSecret
      );

      // Wait remaining time to reach 30s animation
      const elapsed = Date.now() - startTime;
      const remainingTime = Math.max(MIN_DURATION - elapsed, 0);

      await new Promise<void>((resolve) => {
        setTimeout(() => {
          clearInterval(progressInterval);

          // Update state as uploaded
          set({
            isUploading: false,
            isUploaded: true,
            resumeUrl: response.message.data.file_url || null,
            uploadProgress: 100,
          });

          // Store info in localStorage
          if (typeof window !== "undefined") {
            localStorage.setItem("portfolioResumeUploaded", "true");
            if (response.message.data.file_url) {
              localStorage.setItem(
                "portfolioResumeUrl",
                response.message.data.file_url
              );
            }
          }

          // Optional: auto-reset isUploaded after another 30s
          setTimeout(() => {
            set({ isUploaded: false, uploadProgress: 0 });
          }, 30000);

          resolve();
        }, remainingTime);
      });

      // Return after full 30s animation
      return { success: true, data: response.message.data };
    } catch (error: any) {
      clearInterval(progressInterval);
      console.error("Resume upload failed:", error);

      set({
        isUploading: false,
        isUploaded: false,
        error: error.message || "Failed to upload resume",
        uploadProgress: 0,
      });

      return { success: false };
    }
  },

  resetState: () => {
    set({
      isUploading: false,
      isUploaded: false,
      resumeFile: null,
      resumeUrl: null,
      error: null,
      uploadProgress: 0,
    });

    if (typeof window !== "undefined") {
      localStorage.removeItem("portfolioResumeUploaded");
      localStorage.removeItem("portfolioResumeUrl");
    }
  },
}));

// import { create } from 'zustand';
// import { uploadResume, getAuthData, ResumeUploadResponse } from '../../app/api/portfolio/resumeUpload';

// interface ResumeState {
//   isUploading: boolean;
//   isUploaded: boolean;
//   resumeFile: File | null;
//   resumeUrl: string | null;
//   error: string | null;
//   uploadProgress: number;
//   uploadResume: (file: File) => Promise<{ success: boolean; data?: any }>;
//   resetState: () => void;
// }

// export const useResumeStore = create<ResumeState>((set, get) => ({
//   isUploading: false,
//   isUploaded: false,
//   resumeFile: null,
//   resumeUrl: null,
//   error: null,
//   uploadProgress: 0,
  
//   uploadResume: async (file: File) => {
//     set({ 
//       isUploading: true, 
//       error: null, 
//       resumeFile: file,
//       uploadProgress: 0 
//     });
    
//     try {
//       // Get authentication data from localStorage
//       const authData = getAuthData();
      
//       if (!authData || !authData.entityId || !authData.apiKey || !authData.apiSecret) {
//         throw new Error('Authentication data not found. Please log in again.');
//       }
      
//       // Simulate upload progress (for UX purposes)
//       const progressInterval = setInterval(() => {
//         const currentProgress = get().uploadProgress;
//         if (currentProgress < 90) {
//           set({ uploadProgress: currentProgress + 10 });
//         }
//       }, 300);
      
//       // Upload the resume
//       const response = await uploadResume(
//         file,
//         authData.entityId,
//         authData.apiKey,
//         authData.apiSecret
//       );
      
//       // Clear the progress interval
//       clearInterval(progressInterval);
      
//       // Update state with success
//       set({
//         isUploading: false,
//         isUploaded: true,
//         resumeUrl: response.message.data.file_url || null,
//         uploadProgress: 100
//       });
      
//       // Store upload status in localStorage
//       if (typeof window !== 'undefined') {
//         localStorage.setItem('portfolioResumeUploaded', 'true');
//         if (response.message.data.file_url) {
//           localStorage.setItem('portfolioResumeUrl', response.message.data.file_url);
//         }
//       }
      
//       return { 
//         success: true, 
//         data: response.message.data 
//       };
//     } catch (error: any) {
//       console.error('Resume upload failed:', error);
      
//       // Update state with error
//       set({
//         isUploading: false,
//         isUploaded: false,
//         error: error.message || 'Failed to upload resume',
//         uploadProgress: 0
//       });
      
//       return { 
//         success: false 
//       };
//     }
//   },
  
//   resetState: () => {
//     set({
//       isUploading: false,
//       isUploaded: false,
//       resumeFile: null,
//       resumeUrl: null,
//       error: null,
//       uploadProgress: 0
//     });
    
//     // Clear from localStorage
//     if (typeof window !== 'undefined') {
//       localStorage.removeItem('portfolioResumeUploaded');
//       localStorage.removeItem('portfolioResumeUrl');
//     }
//   }
// }));
