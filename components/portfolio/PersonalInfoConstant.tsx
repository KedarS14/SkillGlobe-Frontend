'use client';

import { useState, useEffect } from 'react';
import { usePersonalInfoStore } from '@/store/portfolio/personalinfoStore';
import { PersonalInfoData } from '@/app/api/portfolio/personalInfo';
import { useAuthStore } from '@/store/authStore';

export interface PersonalInfoFormProps {
  onSave?: (data: any) => void;
  onCancel?: () => void;
  initialData?: any;
}

export const usePersonalInfoForm = ({ onSave, onCancel, initialData = {} }: PersonalInfoFormProps) => {
  console.log('DEBUG - PersonalInfoForm - initialData received:', initialData);
  
  // Get store state and actions
  const { 
    personalInfo, 
    isLoading, 
    isSubmitting, 
    error, 
    submitError, 
    fetchPersonalInfo, 
    updatePersonalInfo 
  } = usePersonalInfoStore();
  
  // console.log('DEBUG - PersonalInfoForm - personalInfo from store:', personalInfo);

  const [userName, setUserName] = useState('');
  const { user, isAuthenticated } = useAuthStore();
  const [userEmail, setUserEmail] = useState('');
const [userMobile, setUserMobile] = useState('');

useEffect(() => {
    if (isAuthenticated && user) {
      if (user.full_name) {
        setUserName(user.full_name);
      }
      if (user.email) {
        setUserEmail(user.email);
      }
      if (user.mobile_no) {
        setUserMobile(user.mobile_no);
      }
  
      // Also update the formData to ensure consistency
      setFormData(prevData => ({
        ...prevData,
        fullName: user.full_name || prevData.fullName,
        email: user.email || prevData.email,
        mobile_no: user.mobile_no || prevData.mobile_no
      }));
    }
  }, [isAuthenticated, user]);
  
  // Success state for UI feedback
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState({
    permanentPincode: '',
    pincode: '',
    mobile_no: '',
    dateOfBirth: '',
  });
  
  // Fetch personal info on component mount
  useEffect(() => {
    fetchPersonalInfo();
  }, [fetchPersonalInfo]);
  
  // Update form data when initialData or personalInfo changes
  useEffect(() => {
    console.log('DEBUG - PersonalInfoForm - useEffect triggered with initialData:', initialData);
    
    // Check if initialData has values (not empty object)
    const hasInitialData = Object.keys(initialData).length > 0 && 
                          Object.values(initialData).some(value => value !== '');
    
    if (hasInitialData) {
      console.log('DEBUG - PersonalInfoForm - Using initialData to populate form');
      setFormData({
        fullName: initialData.fullName || '',
        email: initialData.email || '',
        mobile_no: initialData.mobile_no || '',
        gender: initialData.gender || '',
        dateOfBirth: initialData.dateOfBirth || '',
        nationality: initialData.nationality || '',
        country: initialData.country || '',
        city: initialData.city || '',
        landmark: initialData.landmark || '',
        pincode: initialData.pincode || '',
        currentAddress: initialData.currentAddress || '',
        permanentAddress: initialData.permanentAddress || '',
        permanentCountry: initialData.country || '',
        permanentCity: initialData.city || '',
        permanentLandmark: initialData.landmark || '',
        permanentPincode: initialData.pincode || '',
        sameAsCurrentAddress: initialData.permanentAddress === initialData.currentAddress,
        twitterHandle: initialData.twitterHandle || '',
        linkedinHandle: initialData.linkedinHandle || '',
        instagramHandle: initialData.instagramHandle || '',
        facebookHandle: initialData.facebookHandle || '',
        employmentStatus: initialData.employmentStatus || '',
        profilePicture: null,
        website: initialData.website || '',
        totalExperience: initialData.totalExperience || '',
        noticePeriod: initialData.noticePeriod || '',
        professionalSummary: initialData.professionalSummary || '',
      });
    } else if (personalInfo) {
      console.log('DEBUG - PersonalInfoForm - Using personalInfo from store to populate form');
      setFormData({
        fullName: `${personalInfo.first_name} ${personalInfo.last_name}`.trim(),
        email: personalInfo.email || '',
        mobile_no: personalInfo.mobile_no || '',
        gender: personalInfo.gender || '',
        dateOfBirth: personalInfo.date_of_birth || '',
        nationality: personalInfo.nationality || '',
        country: personalInfo.country || '',
        city: personalInfo.city || '',
        landmark: personalInfo.landmark || '',
        pincode: personalInfo.pincode || '',
        currentAddress: personalInfo.current_address || '',
        permanentAddress: personalInfo.permanent_address || '',
        permanentCountry: personalInfo.country || '',
        permanentCity: personalInfo.city || '',
        permanentLandmark: personalInfo.landmark || '',
        permanentPincode: personalInfo.pincode || '',
        sameAsCurrentAddress: personalInfo.permanent_address === personalInfo.current_address,
        twitterHandle: personalInfo.twitter_handle || '',
        linkedinHandle: personalInfo.linkedin_profile || '',
        instagramHandle: personalInfo.instagram_handle || '',
        facebookHandle: personalInfo.facebook_profile || '',
        employmentStatus: personalInfo.employment_status || '',
        profilePicture: null,
        website: personalInfo.website || '',
        totalExperience: personalInfo.total_experience || '',
        noticePeriod: personalInfo.last_working_day || '',
        professionalSummary: personalInfo.professional_summary || '',
      });
    }
  }, [initialData, personalInfo]);
  
  const [formData, setFormData] = useState({
    fullName: initialData.fullName || '',
    email: initialData.email || '',
    mobile_no: initialData.mobile_no || '',
    gender: initialData.gender || '',
    dateOfBirth: initialData.dateOfBirth || '',
    nationality: initialData.nationality || '',
    country: initialData.country || '',
    city: initialData.city || '',
    landmark: initialData.landmark || '',
    pincode: initialData.pincode || '',
    currentAddress: initialData.currentAddress || '',
    permanentAddress: initialData.permanentAddress || '',
    permanentCountry: initialData.permanentCountry || '',
    permanentCity: initialData.permanentCity || '',
    permanentLandmark: initialData.permanentLandmark || '',
    permanentPincode: initialData.permanentPincode || '',
    sameAsCurrentAddress: initialData.permanentAddress === initialData.currentAddress,
    twitterHandle: initialData.twitterHandle || '',
    linkedinHandle: initialData.linkedinHandle || '',
    instagramHandle: initialData.instagramHandle || '',
    facebookHandle: initialData.facebookHandle || '',
    employmentStatus: initialData.employmentStatus || '',
    profilePicture: initialData.profilePicture || null,
    website: initialData.website || '',
    totalExperience: initialData.totalExperience || '',
    noticePeriod: initialData.noticePeriod || '',
    professionalSummary: initialData.professionalSummary || '',
  });

  const [profilePreview, setProfilePreview] = useState<string | null>(null);

  useEffect(() => {
    if (user?.mobile_no) {
      setFormData(prev => ({
        ...prev,
        phone: user.mobile_no  // Pre-fill formData.phone from auth store
      }));
    }
  }, [user]);
  
  // We don't need this effect anymore as we'll handle email differently
  
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
  
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked,
        ...(name === 'sameAsCurrentAddress' && checked
          ? { permanentAddress: formData.currentAddress }
          : {})
      }));
    } else if (name === 'dateOfBirth') {
      // Date of birth validation for minimum age of 15
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
      
      // Calculate if the user is at least 15 years old
      const birthDate = new Date(value);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      // Adjust age if birthday hasn't occurred yet this year
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      setErrors(prev => ({
        ...prev,
        [name]: age < 15 ? 'You must be at least 15 years old' : ''
      }));
    } else if (name === 'permanentPincode' || name === 'pincode') {
      const onlyDigits = value.replace(/\D/g, ''); // Remove non-digit characters
  
      setFormData(prev => ({
        ...prev,
        [name]: onlyDigits
      }));
  
      setErrors(prev => ({
        ...prev,
        [name]: onlyDigits.length > 0 && onlyDigits.length < 6 ? '6 digits required' : ''
      }));
    } else if (name === 'totalExperience') {
      const numericValue = parseFloat(value);
      if (!isNaN(numericValue) && numericValue >= 0) {
        setFormData(prev => ({
          ...prev,
          [name]: value
        }));
        setErrors(prev => ({
          ...prev,
          [name]: ''
        }));
      } else if (value === '') {
        setFormData(prev => ({
          ...prev,
          [name]: ''
        }));
        setErrors(prev => ({
          ...prev,
          [name]: ''
        }));
      } else {
        setErrors(prev => ({
          ...prev,
          [name]: 'Only non-negative numbers allowed'
        }));
      }
    } else if (name === 'mobile') {
      const digitsOnly = value.replace(/\D/g, '');
  
      setFormData(prev => ({
        ...prev,
        [name]: digitsOnly
      }));
  
      setErrors(prev => ({
        ...prev,
        [name]: !digitsOnly
          ? 'Mobile number is required'
          : digitsOnly.length !== 12
          ? 'Mobile number must be exactly 12 digits'
          : ''
      }));
    } else if (name === 'email') {
      // Special handling for email field
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
      
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        ...(name === 'currentAddress' && formData.sameAsCurrentAddress
          ? { permanentAddress: value }
          : {})
      }));
  
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  
  
  // const handleInputChange = (
  //   e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  // ) => {
  //   const { name, value, type } = e.target;
  
  //   if (type === 'checkbox') {
  //     const checked = (e.target as HTMLInputElement).checked;
  //     setFormData(prev => ({
  //       ...prev,
  //       [name]: checked,
  //       ...(name === 'sameAsCurrentAddress' && checked
  //         ? { permanentAddress: formData.currentAddress }
  //         : {})
  //     }));
  //   } else {
  //     if (name === 'permanentPincode' || name === 'pincode') {
  //       const onlyDigits = value.replace(/\D/g, ''); // Remove non-digit characters
  
  //       setFormData(prev => ({
  //         ...prev,
  //         [name]: onlyDigits
  //       }));
  
  //       setErrors(prev => ({
  //         ...prev,
  //         [name]: onlyDigits.length > 0 && onlyDigits.length < 6 ? '6 digits required' : ''
  //       }));
  //     } else if (name === 'totalExperience') {
  //       const numericValue = parseFloat(value);
  //       if (!isNaN(numericValue) && numericValue >= 0) {
  //         setFormData(prev => ({
  //           ...prev,
  //           [name]: value
  //         }));
  //         setErrors(prev => ({
  //           ...prev,
  //           [name]: ''
  //         }));
  //       } else if (value === '') {
  //         setFormData(prev => ({
  //           ...prev,
  //           [name]: ''
  //         }));
  //         setErrors(prev => ({
  //           ...prev,
  //           [name]: ''
  //         }));
  //       } else {
  //         setErrors(prev => ({
  //           ...prev,
  //           [name]: 'Only non-negative numbers allowed'
  //         }));
  //       }
  //     } else {
  //       setFormData(prev => ({
  //         ...prev,
  //         [name]: value,
  //         ...(name === 'currentAddress' && formData.sameAsCurrentAddress
  //           ? { permanentAddress: value }
  //           : {})
  //       }));
  
  //       setErrors(prev => ({
  //         ...prev,
  //         [name]: ''
  //       }));
  //     }
  //   }
  // };
  
  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, profilePicture: file }));

      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submitting personal info form...');
    
    // Reset success state
    setIsSuccess(false);
    
    // Extract first and last name from fullName
    const nameParts = formData.fullName.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    
    // Prepare data for API
    const personalInfoData: Partial<PersonalInfoData> = {
      first_name: firstName,
      last_name: lastName,
      email: formData.email,
      mobile_no: formData.mobile_no,
      gender: formData.gender,
      date_of_birth: formData.dateOfBirth,
      nationality: formData.nationality,
      country: formData.country,
      city: formData.city,
      landmark: formData.landmark,
      pincode: formData.pincode,
      current_address: formData.currentAddress,
      permanent_address: formData.permanentAddress,
      twitter_handle: formData.twitterHandle,
      linkedin_profile: formData.linkedinHandle,
      instagram_handle: formData.instagramHandle,
      facebook_profile: formData.facebookHandle,
      website: formData.website,
      employment_status: formData.employmentStatus,
      total_experience: formData.totalExperience,
      last_working_day: formData.noticePeriod,
      professional_summary: formData.professionalSummary
    };
    
    console.log('Personal info data to submit:', personalInfoData);
    
    // Call API through store
    const success = await updatePersonalInfo(personalInfoData);
    
    if (success) {
      console.log('Personal info updated successfully');
      setIsSuccess(true);
      
      // Reset success state after 3 seconds
      setTimeout(() => {
        setIsSuccess(false);
      }, 3000);
      
      // Call onSave if provided
      if (onSave) {
        onSave(formData);
      }
    }
  };

  return {
    formData,
    setFormData,
    profilePreview,
    setProfilePreview,
    isLoading,
    isSubmitting,
    error,
    submitError,
    isSuccess,
    errors,
    setErrors,
    handleInputChange,
    handleProfilePictureChange,
    handleSubmit,
    onCancel,
    userName ,
    userEmail,
    userMobile, // Expose userName for read-only display
  };
};
