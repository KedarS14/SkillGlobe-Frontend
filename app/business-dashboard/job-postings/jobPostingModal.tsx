'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { useJobPostingStore, JobPostingFormData } from '@/store/job-postings/addjobpostingStore';
import { getSkills, getApplyOpportunities, getCityList, getAuthData, type Skill, type City } from '@/app/api/job postings/addjobPosting';
import { getProfileCount } from '@/app/api/job postings/jobfilterElasticSearch';
import { createGlobalSkillAPI, type CreateSkillPayload, type CreateSkillResponse } from '@/app/api/Individual Skills/groqSkillsAPI';

// Define document type interface
export interface DocumentFile {
  name: string;
  size: number;
  type: string;
  lastModified: number;
}

// Define job posting interface for edit functionality
export interface JobPosting {
  id: string;
  title: string;
  skillCategory?: string;
  employmentType: string;
  workMode?: string;
  experienceRequired?: string;
  location: string;
  salary?: string;
  primarySkills?: string[];
  secondarySkills?: string[];
  genderPreference?: string[];
  languageRequirement?: string[];
  description?: string;
  documents?: DocumentFile[];
  applicationDeadline?: string;
  postedDate: string;
  status: string;
}

// Define job form state interface
export interface JobFormState {
  title: string;
  skillCategory: string;
  opportunityType: string;
  employmentType: string;
  workMode: string;
  experienceRequired: string;
  minRemuneration: string;
  applicationDeadline: string;
  opportunityClosed: boolean;
  numberOfOpenings: string;
  description: string;
  primarySkills: string[];
  secondarySkills: string[];
  preferredQualifications: string;
  location: string[];
  gender: string[];
  language: string[];
  visibilitySettings: string;
  anticipatedApplications: string;
  documents: DocumentFile[];
}

interface JobPostingModalProps {
  showModal: boolean;
  setShowModal: (show: boolean) => void;
  onSubmit: (job: JobFormState) => void;
  editData?: JobPosting;
}

export default function JobPostingModal({ showModal, setShowModal, onSubmit, editData }: JobPostingModalProps) {
  const [primarySkillsDropdownOpen, setPrimarySkillsDropdownOpen] = useState(false);
  const [secondarySkillsDropdownOpen, setSecondarySkillsDropdownOpen] = useState(false);
  const [genderDropdownOpen, setGenderDropdownOpen] = useState(false);
  const [languageDropdownOpen, setLanguageDropdownOpen] = useState(false);
  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false);
  const primarySkillsDropdownRef = useRef<HTMLDivElement>(null);
  const secondarySkillsDropdownRef = useRef<HTMLDivElement>(null);
  const genderDropdownRef = useRef<HTMLDivElement>(null);
  const languageDropdownRef = useRef<HTMLDivElement>(null);
  const locationDropdownRef = useRef<HTMLDivElement>(null);
  const primaryAiDropdownRef = useRef<HTMLDivElement>(null);
  const secondaryAiDropdownRef = useRef<HTMLDivElement>(null);
  
  // Ref to prevent overlapping API calls
  const isApiCallInProgress = useRef<boolean>(false);
  
  // Skills API state
  const [availableSkills, setAvailableSkills] = useState<Skill[]>([]);
  const [primarySkillsSearch, setPrimarySkillsSearch] = useState('');
  const [secondarySkillsSearch, setSecondarySkillsSearch] = useState('');
  const [skillsLoading, setSkillsLoading] = useState(false);
  const [filteredPrimarySkills, setFilteredPrimarySkills] = useState<Skill[]>([]);
  const [filteredSecondarySkills, setFilteredSecondarySkills] = useState<Skill[]>([]);
  
  // Apply opportunities API state
  const [applyOpportunities, setApplyOpportunities] = useState<string[]>([]);
  const [applyOpportunitiesLoading, setApplyOpportunitiesLoading] = useState(false);
  
  // City list API state
  const [cityList, setCityList] = useState<City[]>([]);
  const [cityListLoading, setCityListLoading] = useState(false);
  const [locationSearch, setLocationSearch] = useState('');
  const [filteredCities, setFilteredCities] = useState<City[]>([]);
  
  // Date validation state
  const [dateError, setDateError] = useState<string>('');
  
  // Primary skills validation state
  const [primarySkillsError, setPrimarySkillsError] = useState<string>('');
  
  // Profile count state
  const [profileCount, setProfileCount] = useState<number>(0);
  const [isLoadingCount, setIsLoadingCount] = useState<boolean>(false);
  
  // AI Search state for primary skills
  const [primaryAiSearch, setPrimaryAiSearch] = useState<string>('');
  const [primaryAiSearchLoading, setPrimaryAiSearchLoading] = useState<boolean>(false);
  const [primaryAiAliases, setPrimaryAiAliases] = useState<string[]>([]);
  const [primaryAiDropdownOpen, setPrimaryAiDropdownOpen] = useState<boolean>(false);
  const [primaryAiCanonicalName, setPrimaryAiCanonicalName] = useState<string>('');
  const [primaryAiSkillId, setPrimaryAiSkillId] = useState<string>('');
  const [primaryAiInfoMessage, setPrimaryAiInfoMessage] = useState<string>('');
  
  // Store mapping between SK codes and their canonical names
  const [skillCodeToNameMap, setSkillCodeToNameMap] = useState<Record<string, string>>({});
  
  // Utility function to get the display name for a skill
  const getSkillDisplayName = (skillId: string): string => {
    // Check if it's an SK code
    if (typeof skillId === 'string' && skillId.startsWith('SK-')) {
      // Use the stored mapping if available
      if (skillCodeToNameMap[skillId]) {
        return skillCodeToNameMap[skillId];
      }
      
      // If not in the mapping, try to find it in availableSkills
      const matchingSkill = availableSkills.find(s => s.name === skillId || s.skill_id === skillId);
      if (matchingSkill) {
        // Update the mapping for future use
        setSkillCodeToNameMap(prev => ({
          ...prev,
          [skillId]: matchingSkill.canonical_name
        }));
        return matchingSkill.canonical_name;
      }
    }
    
    // For regular skills, find in availableSkills
    const skill = availableSkills.find(s => s.name === skillId);
    return skill?.canonical_name || skillId;
  };
  
  // AI Search state for secondary skills
  const [secondaryAiSearch, setSecondaryAiSearch] = useState<string>('');
  const [secondaryAiSearchLoading, setSecondaryAiSearchLoading] = useState<boolean>(false);
  const [secondaryAiAliases, setSecondaryAiAliases] = useState<string[]>([]);
  const [secondaryAiDropdownOpen, setSecondaryAiDropdownOpen] = useState<boolean>(false);
  const [secondaryAiCanonicalName, setSecondaryAiCanonicalName] = useState<string>('');
  const [secondaryAiSkillId, setSecondaryAiSkillId] = useState<string>('');
  const [secondaryAiInfoMessage, setSecondaryAiInfoMessage] = useState<string>('');
  
  const [newJob, setNewJob] = useState<JobFormState>({
    title: '',
    skillCategory: '',
    opportunityType: 'Permanent',
    employmentType: 'Full-Time',
    workMode: '',
    experienceRequired: '0',
    minRemuneration: '',
    applicationDeadline: '',
    opportunityClosed: false,
    numberOfOpenings: '1',
    description: '',
    primarySkills: [],
    secondarySkills: [],
    preferredQualifications: '',
    location: [],
    gender: [],
    language: [],
    visibilitySettings: 'all',
    anticipatedApplications: '10',
    documents: []

  });

  // Function to fetch skills from API
  const fetchSkills = useCallback(async (searchTerm: string = '') => {
    const authData = getAuthData();
    if (!authData) {
      console.error('No auth data available for skills API');
      return [];
    }

    setSkillsLoading(true);
    try {
      const skills = await getSkills(searchTerm, authData.apiKey, authData.apiSecret);
      return skills;
    } catch (error) {
      console.error('Error fetching skills:', error);
      return [];
    } finally {
      setSkillsLoading(false);
    }
  }, []);

  // Function to fetch apply opportunities from API
  const fetchApplyOpportunities = useCallback(async () => {
    const authData = getAuthData();
    if (!authData) {
      console.error('No auth data available for apply opportunities API');
      return [];
    }

    setApplyOpportunitiesLoading(true);
    try {
      const opportunities = await getApplyOpportunities(authData.apiKey, authData.apiSecret);
      return opportunities;
    } catch (error) {
      console.error('Error fetching apply opportunities:', error);
      return [];
    } finally {
      setApplyOpportunitiesLoading(false);
    }
  }, []);

  // Function to fetch city list from API
  const fetchCityList = useCallback(async () => {
    const authData = getAuthData();
    if (!authData) {
      console.error('No auth data available for city list API');
      return [];
    }

    setCityListLoading(true);
    try {
      const cities = await getCityList(authData.apiKey, authData.apiSecret);
      return cities;
    } catch (error) {
      console.error('Error fetching city list:', error);
      return [];
    } finally {
      setCityListLoading(false);
    }
  }, []);
  
  // Function to handle AI skill search for primary skills
  const handlePrimaryAiSearch = async () => {
    if (!primaryAiSearch.trim()) return;
    
    setPrimaryAiSearchLoading(true);
    try {
      // clear any prior info and dropdown
      setPrimaryAiInfoMessage('');
      setPrimaryAiDropdownOpen(false);
      const payload: CreateSkillPayload = {
        gr: 1,
        skill: primaryAiSearch.trim()
      };
      
      const response: CreateSkillResponse = await createGlobalSkillAPI(payload);
      
      if (response.message.status === 'success' && response.message.data) {
        const skillId = response.message.data.skill_id;
        const canonicalName = response.message.data.canonical_name;
        
        // Store the skill ID and canonical name
        setPrimaryAiAliases(response.message.data.aliases);
        setPrimaryAiCanonicalName(canonicalName);
        setPrimaryAiSkillId(skillId);
        setPrimaryAiDropdownOpen(true);
        setPrimaryAiInfoMessage('');
        
        console.log('AI search found skill:', skillId, 'with canonical name:', canonicalName);
        
        // Update the mapping between skill code and canonical name
        if (skillId && skillId.startsWith('SK-')) {
          setSkillCodeToNameMap(prev => {
            const updatedMap = {
              ...prev,
              [skillId]: canonicalName
            };
            console.log('Updated skill code to name map in search:', updatedMap);
            return updatedMap;
          });
          
          // Also check if this skill is already in the list but with the code showing instead of name
          const existingSkills = [...newJob.primarySkills];
          const updatedSkills = existingSkills.map(existingSkill => {
            if (existingSkill === skillId) {
              console.log('Found existing skill with code, updating display name');
              return skillId; // Keep the code but update the mapping
            }
            return existingSkill;
          });
          
          if (JSON.stringify(existingSkills) !== JSON.stringify(updatedSkills)) {
            setNewJob(prev => ({
              ...prev,
              primarySkills: updatedSkills
            }));
          }
        }
      } else if (response.message.status === 'info' && (response.message as any).message) {
        // Show backend info (e.g., skill already exists)
        setPrimaryAiAliases([]);
        setPrimaryAiDropdownOpen(false);
        setPrimaryAiInfoMessage((response.message as any).message);
      }
    } catch (error) {
      console.error('Error in AI skill search:', error);
      setPrimaryAiAliases([]);
      // Optionally show a generic message; keeping silent to avoid confusion
    } finally {
      setPrimaryAiSearchLoading(false);
    }
  };
  
  // Function to handle AI skill search for secondary skills
  const handleSecondaryAiSearch = async () => {
    if (!secondaryAiSearch.trim()) return;
    
    setSecondaryAiSearchLoading(true);
    try {
      // clear any prior info and dropdown
      setSecondaryAiInfoMessage('');
      setSecondaryAiDropdownOpen(false);
      const payload: CreateSkillPayload = {
        gr: 1,
        skill: secondaryAiSearch.trim()
      };
      
      const response: CreateSkillResponse = await createGlobalSkillAPI(payload);
      
      if (response.message.status === 'success' && response.message.data) {
        const skillId = response.message.data.skill_id;
        const canonicalName = response.message.data.canonical_name;
        
        // Store the skill ID and canonical name
        setSecondaryAiAliases(response.message.data.aliases);
        setSecondaryAiCanonicalName(canonicalName);
        setSecondaryAiSkillId(skillId);
        setSecondaryAiDropdownOpen(true);
        setSecondaryAiInfoMessage('');
        
        console.log('Secondary AI search found skill:', skillId, 'with canonical name:', canonicalName);
        
        // Update the mapping between skill code and canonical name
        if (skillId && skillId.startsWith('SK-')) {
          setSkillCodeToNameMap(prev => {
            const updatedMap = {
              ...prev,
              [skillId]: canonicalName
            };
            console.log('Updated skill code to name map in secondary search:', updatedMap);
            return updatedMap;
          });
          
          // Also check if this skill is already in the list but with the code showing instead of name
          const existingSkills = [...newJob.secondarySkills];
          const updatedSkills = existingSkills.map(existingSkill => {
            if (existingSkill === skillId) {
              console.log('Found existing secondary skill with code, updating display name');
              return skillId; // Keep the code but update the mapping
            }
            return existingSkill;
          });
          
          if (JSON.stringify(existingSkills) !== JSON.stringify(updatedSkills)) {
            setNewJob(prev => ({
              ...prev,
              secondarySkills: updatedSkills
            }));
          }
        }
      } else if (response.message.status === 'info' && (response.message as any).message) {
        setSecondaryAiAliases([]);
        setSecondaryAiDropdownOpen(false);
        setSecondaryAiInfoMessage((response.message as any).message);
      }
    } catch (error) {
      console.error('Error in AI skill search:', error);
      setSecondaryAiAliases([]);
    } finally {
      setSecondaryAiSearchLoading(false);
    }
  };
  
  // Function to select AI alias for primary skills
  const selectPrimaryAiAlias = (alias: string) => {
    // Use the skill ID (SK-xxxxxxxxxx) instead of the canonical name
    const skillToAdd = primaryAiSkillId || primaryAiCanonicalName;
    
    console.log('Adding AI skill with ID:', skillToAdd, 'Canonical name:', primaryAiCanonicalName);
    
    // Store the mapping between skill code and canonical name
    if (primaryAiSkillId && primaryAiSkillId.startsWith('SK-')) {
      // Make sure we store the mapping between skill code and canonical name
      setSkillCodeToNameMap(prev => {
        const updatedMap = {
          ...prev,
          [primaryAiSkillId]: primaryAiCanonicalName
        };
        console.log('Updated skill code to name map:', updatedMap);
        return updatedMap;
      });
    }
    
    if (!newJob.primarySkills.includes(skillToAdd)) {
      setNewJob(prev => ({
        ...prev,
        primarySkills: [...prev.primarySkills, skillToAdd]
      }));
    }
    
    // Reset AI search state
    setPrimaryAiSearch('');
    setPrimaryAiAliases([]);
    setPrimaryAiDropdownOpen(false);
    setPrimaryAiCanonicalName('');
    setPrimaryAiSkillId('');
    setPrimaryAiInfoMessage('');
  };
  
  // Function to select AI alias for secondary skills
  const selectSecondaryAiAlias = (alias: string) => {
    // Use the skill ID (SK-xxxxxxxxxx) instead of the canonical name
    const skillToAdd = secondaryAiSkillId || secondaryAiCanonicalName;
    
    console.log('Adding secondary AI skill with ID:', skillToAdd, 'Canonical name:', secondaryAiCanonicalName);
    
    // Store the mapping between skill code and canonical name
    if (secondaryAiSkillId && secondaryAiSkillId.startsWith('SK-')) {
      // Make sure we store the mapping between skill code and canonical name
      setSkillCodeToNameMap(prev => {
        const updatedMap = {
          ...prev,
          [secondaryAiSkillId]: secondaryAiCanonicalName
        };
        console.log('Updated skill code to name map for secondary skill:', updatedMap);
        return updatedMap;
      });
    }
    
    if (!newJob.secondarySkills.includes(skillToAdd)) {
      setNewJob(prev => ({
        ...prev,
        secondarySkills: [...prev.secondarySkills, skillToAdd]
      }));
    }
    
    // Reset AI search state
    setSecondaryAiSearch('');
    setSecondaryAiAliases([]);
    setSecondaryAiDropdownOpen(false);
    setSecondaryAiCanonicalName('');
    setSecondaryAiSkillId('');
    setSecondaryAiInfoMessage('');
  };
  
  // Function to fetch profile count based on current filters
  const fetchProfileCount = useCallback(async () => {
    // Prevent overlapping API calls
    if (isApiCallInProgress.current) {
      console.log('API call already in progress, skipping...');
      return;
    }
    
    // Ensure availableSkills is loaded before making API calls with skills
    if ((newJob.primarySkills.length > 0 || newJob.secondarySkills.length > 0) && availableSkills.length === 0) {
      console.log('Skills not loaded yet, skipping API call...');
      return;
    }
    
    isApiCallInProgress.current = true;
    setIsLoadingCount(true);
    try {
      // Build filter parameters object with only defined values
      const filterParams: Record<string, string | number> = {};
      
      // Add multiple cities if selected (comma-separated)
      if (newJob.location.length > 0) {
        filterParams.city = newJob.location.join(',');
        console.log('Adding city filter:', filterParams.city);
      }
      
      // Add work mode if selected
      if (newJob.workMode) {
        filterParams.work_mode = newJob.workMode;
        console.log('Adding work_mode filter:', newJob.workMode);
      }
      
      // Handle experienceRequired - extract numeric value
      if (newJob.experienceRequired && newJob.experienceRequired !== '0') {
        let min_experience;
        if (typeof newJob.experienceRequired === 'string') {
          // Check if it's in the format '0-2 years' or just a number
          if (newJob.experienceRequired.includes('-')) {
            min_experience = newJob.experienceRequired.split('-')[0].trim();
          } else {
            // It might be just a number
            min_experience = newJob.experienceRequired.trim();
          }
        } else {
          min_experience = newJob.experienceRequired;
        }
        
        // Only add if it's a valid number and not 0
        if (min_experience && min_experience !== '0') {
          filterParams.min_experience = min_experience;
          console.log('Adding min_experience filter:', min_experience);
        }
      }
      
      // Combine primary and secondary skills with canonical names
      const allSelectedSkills: string[] = [];
      
      // Add primary skills with canonical names
      if (newJob.primarySkills.length > 0) {
        const primarySkillCanonicalNames = newJob.primarySkills.map(skillName => {
          // Check if it's already a canonical name (from AI search) or needs to be mapped
          const skill = availableSkills.find(s => s.name === skillName);
          return skill?.canonical_name || skillName; // If not found in availableSkills, it's likely from AI search
        });
        allSelectedSkills.push(...primarySkillCanonicalNames);
        console.log('Adding primary skills with canonical names:', primarySkillCanonicalNames);
      }
      
      // Add secondary skills with canonical names
      if (newJob.secondarySkills.length > 0) {
        const secondarySkillCanonicalNames = newJob.secondarySkills.map(skillName => {
          // Check if it's already a canonical name (from AI search) or needs to be mapped
          const skill = availableSkills.find(s => s.name === skillName);
          return skill?.canonical_name || skillName; // If not found in availableSkills, it's likely from AI search
        });
        allSelectedSkills.push(...secondarySkillCanonicalNames);
        console.log('Adding secondary skills with canonical names:', secondarySkillCanonicalNames);
      }
      
      // Add combined skills as comma-separated string
      if (allSelectedSkills.length > 0) {
        filterParams.skills = allSelectedSkills.join(',');
        console.log('Adding combined skills filter:', filterParams.skills);
      }
      
      console.log('Final filter parameters:', filterParams);
      
      // Call the API with the filter parameters (empty object if no filters)
      const count = await getProfileCount(filterParams);
      console.log('API response count:', count);
      
      setProfileCount(count);
    } catch (error) {
      console.error('Error fetching profile count:', error);
      setProfileCount(0); // Set to 0 on error
    } finally {
      setIsLoadingCount(false);
      isApiCallInProgress.current = false; // Reset the flag
    }
  }, [newJob.location, newJob.workMode, newJob.experienceRequired, newJob.primarySkills, newJob.secondarySkills]);

  // Load initial data on component mount
  useEffect(() => {
    const loadInitialData = async () => {
      const [skills, opportunities, cities] = await Promise.all([
        fetchSkills(),
        fetchApplyOpportunities(),
        fetchCityList()
      ]);
      
      setAvailableSkills(skills);
      setFilteredPrimarySkills(skills);
      setFilteredSecondarySkills(skills);
      setApplyOpportunities(opportunities);
      setCityList(cities);
      setFilteredCities(cities);
      
      // Fetch initial profile count without filters
      setIsLoadingCount(true);
      try {
        const count = await getProfileCount({});
        setProfileCount(count);
      } catch (error) {
        console.error('Error fetching initial profile count:', error);
        setProfileCount(0);
      } finally {
        setIsLoadingCount(false);
      }
    };
    
    if (showModal) {
      loadInitialData();
    }
  }, [showModal, fetchSkills, fetchApplyOpportunities, fetchCityList]);
  
  // Debounced profile count update when relevant filters change
  useEffect(() => {
    if (!showModal) {
      // Reset API call flag when modal closes
      isApiCallInProgress.current = false;
      return;
    }
    
    // Debounce the API call to prevent continuous requests
    const debounceTimer = setTimeout(() => {
      fetchProfileCount();
    }, 500); // 500ms debounce delay
    
    return () => clearTimeout(debounceTimer);
  }, [newJob.location, newJob.workMode, newJob.experienceRequired, newJob.primarySkills, newJob.secondarySkills, showModal]);

  // Filter skills based on search terms
  useEffect(() => {
    if (primarySkillsSearch.trim()) {
      const filtered = availableSkills.filter(skill => 
        skill.canonical_name.toLowerCase().includes(primarySkillsSearch.toLowerCase())
      );
      setFilteredPrimarySkills(filtered);
    } else {
      setFilteredPrimarySkills(availableSkills);
    }
  }, [primarySkillsSearch, availableSkills]);

  useEffect(() => {
    if (secondarySkillsSearch.trim()) {
      const filtered = availableSkills.filter(skill => 
        skill.canonical_name.toLowerCase().includes(secondarySkillsSearch.toLowerCase())
      );
      setFilteredSecondarySkills(filtered);
    } else {
      setFilteredSecondarySkills(availableSkills);
    }
  }, [secondarySkillsSearch, availableSkills]);

  useEffect(() => {
    if (locationSearch.trim()) {
      const filtered = cityList.filter(city => 
        city.name.toLowerCase().includes(locationSearch.toLowerCase())
      );
      setFilteredCities(filtered);
    } else {
      setFilteredCities(cityList);
    }
  }, [locationSearch, cityList]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Special handling for date fields to ensure proper format
    if (name === 'applicationDeadline' && value) {
      // Ensure date is in YYYY-MM-DD format for HTML date input
      const dateValue = new Date(value).toISOString().split('T')[0];
      setNewJob(prev => ({
        ...prev,
        [name]: dateValue
      }));
    } else {
      setNewJob(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setNewJob(prev => ({
      ...prev,
      [name]: checked
    }));
  };
  
  const togglePrimarySkill = (skillId: string) => {
    console.log('Toggling primary skill ID:', skillId);
    
    // Clear primary skills error when user selects a skill
    setPrimarySkillsError('');
    
    setNewJob(prev => {
      if (prev.primarySkills.includes(skillId)) {
        const newSkills = prev.primarySkills.filter(s => s !== skillId);
        console.log('Removed skill, new primary skills:', newSkills);
        return {
          ...prev,
          primarySkills: newSkills
        };
      } else {
        const newSkills = [...prev.primarySkills, skillId];
        console.log('Added skill, new primary skills:', newSkills);
        return {
          ...prev,
          primarySkills: newSkills
        };
      }
    });
  };
  
  const toggleSecondarySkill = (skillId: string) => {
    setNewJob(prev => {
      if (prev.secondarySkills.includes(skillId)) {
        return {
          ...prev,
          secondarySkills: prev.secondarySkills.filter(s => s !== skillId)
        };
      } else {
        return {
          ...prev,
          secondarySkills: [...prev.secondarySkills, skillId]
        };
      }
    });
  };
  
  const toggleGender = (gender: string) => {
    setNewJob(prev => {
      if (prev.gender.includes(gender)) {
        return {
          ...prev,
          gender: prev.gender.filter(g => g !== gender)
        };
      } else {
        return {
          ...prev,
          gender: [...prev.gender, gender]
        };
      }
    });
  };
  
  const toggleLanguage = (language: string) => {
    setNewJob(prev => {
      if (prev.language.includes(language)) {
        return {
          ...prev,
          language: prev.language.filter(l => l !== language)
        };
      } else {
        return {
          ...prev,
          language: [...prev.language, language]
        };
      }
    });
  };
  
  // Effect to populate form with edit data when provided
  useEffect(() => {
    if (editData) {
      // Format application deadline if available
      let formattedDeadline = '';
      try {
        // Try to format the date if it exists
        if (editData.applicationDeadline) {
          formattedDeadline = new Date(editData.applicationDeadline).toISOString().split('T')[0];
        }
      } catch (error) {
        console.error('Error formatting application deadline:', error);
      }
      
      // Handle backward compatibility with old data format
      let primarySkills: string[] = [];
      let secondarySkills: string[] = [];
      
      // If we have the new data structure with separate primary and secondary skills
      if (editData.primarySkills || editData.secondarySkills) {
        primarySkills = editData.primarySkills || [];
        secondarySkills = editData.secondarySkills || [];
      } 
      // For backward compatibility with old data structure
      else if ('skillsRequired' in editData && Array.isArray(editData.skillsRequired)) {
        // Put all skills in primary skills for backward compatibility
        primarySkills = editData.skillsRequired;
      }
      
      setNewJob({
        title: editData.title || '',
        skillCategory: editData.skillCategory || '',
        opportunityType: 'Permanent', // Default value if not in editData
        employmentType: editData.employmentType || 'Full-Time',
        workMode: editData.workMode || '',
        experienceRequired: editData.experienceRequired || '0',
        minRemuneration: editData.salary || '',
        applicationDeadline: formattedDeadline,
        opportunityClosed: false,
        numberOfOpenings: '1',
        description: editData.description || '',
        primarySkills: primarySkills,
        secondarySkills: secondarySkills,
        preferredQualifications: '',
        location: editData.location ? [editData.location] : [],
        gender: editData.genderPreference || [],
        language: editData.languageRequirement || [],
        visibilitySettings: 'all',
        anticipatedApplications: '10',
        documents: editData.documents || []
      });
    }
  }, [editData]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (primarySkillsDropdownRef.current && !primarySkillsDropdownRef.current.contains(event.target as Node)) {
        setPrimarySkillsDropdownOpen(false);
      }
      if (secondarySkillsDropdownRef.current && !secondarySkillsDropdownRef.current.contains(event.target as Node)) {
        setSecondarySkillsDropdownOpen(false);
      }
      if (genderDropdownRef.current && !genderDropdownRef.current.contains(event.target as Node)) {
        setGenderDropdownOpen(false);
      }
      if (languageDropdownRef.current && !languageDropdownRef.current.contains(event.target as Node)) {
        setLanguageDropdownOpen(false);
      }
      if (locationDropdownRef.current && !locationDropdownRef.current.contains(event.target as Node)) {
        setLocationDropdownOpen(false);
      }
      // Close AI search dropdowns when clicking outside
      if (primaryAiDropdownRef.current && !primaryAiDropdownRef.current.contains(event.target as Node)) {
        setPrimaryAiDropdownOpen(false);
      }
      if (secondaryAiDropdownRef.current && !secondaryAiDropdownRef.current.contains(event.target as Node)) {
        setSecondaryAiDropdownOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const removePrimarySkill = (skillIdToRemove: string) => {
    setNewJob(prev => ({
      ...prev,
      primarySkills: prev.primarySkills.filter(skillId => skillId !== skillIdToRemove)
    }));
  };
  
  const removeSecondarySkill = (skillIdToRemove: string) => {
    setNewJob(prev => ({
      ...prev,
      secondarySkills: prev.secondarySkills.filter(skillId => skillId !== skillIdToRemove)
    }));
  };
  
  const removeGender = (genderToRemove: string) => {
    setNewJob(prev => ({
      ...prev,
      gender: prev.gender.filter(gender => gender !== genderToRemove)
    }));
  };
  
  const removeLanguage = (languageToRemove: string) => {
    setNewJob(prev => ({
      ...prev,
      language: prev.language.filter(language => language !== languageToRemove)
    }));
  };

  const toggleLocation = (cityName: string) => {
    setNewJob(prev => {
      if (prev.location.includes(cityName)) {
        return {
          ...prev,
          location: prev.location.filter(loc => loc !== cityName)
        };
      } else {
        return {
          ...prev,
          location: [...prev.location, cityName]
        };
      }
    });
  };

  const removeLocation = (cityToRemove: string) => {
    setNewJob(prev => ({
      ...prev,
      location: prev.location.filter(city => city !== cityToRemove)
    }));
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const fileList = Array.from(e.target.files);
      const newDocuments = fileList.map(file => ({
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified
      }));
      
      setNewJob(prev => ({
        ...prev,
        documents: [...prev.documents, ...newDocuments]
      }));
    }
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    
    if (e.dataTransfer.files) {
      const fileList = Array.from(e.dataTransfer.files);
      const newDocuments = fileList.map(file => ({
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified
      }));
      
      setNewJob(prev => ({
        ...prev,
        documents: [...prev.documents, ...newDocuments]
      }));
    }
  };
  
  const removeDocument = (fileName: string) => {
    setNewJob(prev => ({
      ...prev,
      documents: prev.documents.filter(doc => doc.name !== fileName)
    }));
  };

  const { submitJobPosting, isSubmitting, submitSuccess, submitError, resetSubmitState } = useJobPostingStore();

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setPrimarySkillsError('');
    
    // Validate primary skills locally
    if (newJob.primarySkills.length === 0) {
      setPrimarySkillsError('Please select at least one primary skill');
      return;
    }
    
    try {
      // Convert JobFormState to JobPostingFormData format
      const jobPostingData: JobPostingFormData = {
        ...newJob,
        location: newJob.location, // Pass the full location array
        documents: newJob.documents || []
      };
      
      const response = await submitJobPosting(jobPostingData);
      
      if (response) {
        // Success - call the original onSubmit for any additional handling
        onSubmit(newJob);
        setShowModal(false);
        // Reset form
        setNewJob({
          title: '',
          skillCategory: '',
          opportunityType: 'Permanent',
          employmentType: 'Full-Time',
          workMode: '',
          experienceRequired: '0',
          minRemuneration: '',
          applicationDeadline: '',
          opportunityClosed: false,
          numberOfOpenings: '1',
          description: '',
          primarySkills: [],
          secondarySkills: [],
          preferredQualifications: '',
          location: [],
          gender: [],
          language: [],
          visibilitySettings: 'all',
          anticipatedApplications: '10',
          documents: []
        });
        // Reset validation errors
        setPrimarySkillsError('');
        setDateError('');
      }
    } catch (error) {
      console.error('Error submitting job posting:', error);
    }
  };

  if (!showModal) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between border-b border-gray-200 p-4">
  {/* Left Side */}
  <h3 className="text-lg font-semibold text-gray-900">
    New Opportunity Posting
  </h3>

  {/* Right Side (Badge + Close Button) */}
  <div className="flex items-center gap-3">
    {isLoadingCount ? (
      <span className="text-sm text-gray-500 animate-pulse">Loading count...</span>
    ) : (
      <span className="text-sm px-3 py-1 rounded-full 
        bg-gradient-to-r from-orange-600 to-red-500 
        text-white font-bold shadow-lg 
        shadow-red-500/40 animate-pulse">
        Relevant Profiles : {profileCount}
      </span>
    )}

    <button 
      onClick={() => setShowModal(false)}
      className="p-1 rounded-md hover:bg-gray-100"
    >
      <X size={20} />
    </button>
  </div>
</div>

  
  <form onSubmit={handleCreateJob} className="p-6 space-y-6 font-rubik">
  <div>
      {/* <label className="block text-sm font-medium text-gray-700 mb-1">
        Attach Documents
      </label> */}
      {/* <div className="flex items-center justify-center gap-4 mt-3">
        <label className="relative inline-flex items-center justify-center px-6 py-3 overflow-hidden font-medium text-white transition duration-300 ease-out bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full shadow-lg cursor-pointer group hover:shadow-xl">
          <span className="absolute inset-0 w-full h-full bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
          <svg xmlns="http://www.w3.org/2000/svg" className="relative z-10 mr-2" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <span className="relative z-10 text-sm font-semibold">Upload Documents</span>
          <input
            id="file-upload"
            type="file"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            multiple
            accept=".pdf,.jpg,.jpeg,.png"
          />
        </label>
        
        {newJob.documents.length > 0 && (
          <div className="mt-3 bg-gray-50 border border-gray-200 rounded-lg p-3">
            <p className="text-sm font-medium text-gray-700 mb-2">Attached Documents:</p>
            <div className="space-y-2">
              {newJob.documents.map((doc, index) => (
                <div key={index} className="flex items-center justify-between bg-white p-2 rounded border border-gray-200">
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium truncate max-w-[200px]">{doc.name}</p>
                      <p className="text-xs text-gray-500">{(doc.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  <button 
                    type="button" 
                    className="text-red-500 hover:text-red-700"
                    onClick={() => removeDocument(doc.name)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div> */}
    </div>
    <h4 className="text-md font-semibold text-blue-600 mb-2">Step 1: Basic Information</h4>
    
    {/* Job Title */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Opportunity Title <span className="text-red-500">*</span>
      </label>
      <input
        type="text"
        name="title"
        value={newJob.title}
        onChange={handleInputChange}
        className="w-full px-4 py-2 bg-gray-50 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
        placeholder="Clear and descriptive title"
        required
      />
    </div>
    
    {/* Role/Skill Category */}
    <div className='grid grid-cols-2 gap-4'>
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Role / Skill Category <span className="text-red-500">*</span>
      </label>
      <input
        type="text"
        name="skillCategory"
        value={newJob.skillCategory}
        onChange={handleInputChange}
        className="w-full px-4 py-2 bg-gray-50 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
        placeholder="e.g. Frontend Development, Data Science"
        required
      />
    </div>
    
    {/* Opportunity Type */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Opportunity Type <span className="text-red-500">*</span>
      </label>
      <select
        name="opportunityType"
        value={newJob.opportunityType}
        onChange={handleInputChange}
        className="w-full px-4 py-2 bg-gray-50 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
        required
      >
        <option value="Permanent">Permanent</option>
        <option value="Contract2Hire">Contract2Hire</option>
        <option value="Internship">Internship</option>
        <option value="Project">Project</option>
        <option value="Services / Gig">Services / Gig</option>
        <option value="Contractual / Freelancer Work">Contractual / Freelancer Work</option>
        <option value="All">All</option>
      </select>
    </div>
    </div>
    
    {/* Employment Type */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Employment Type <span className="text-red-500">*</span>
      </label>
      <div className="flex gap-4">
        <label className="inline-flex items-center">
          <input
            type="radio"
            name="employmentType"
            value="Full-Time"
            checked={newJob.employmentType === 'Full-Time'}
            onChange={handleInputChange}
            className="form-radio h-4 w-4 text-blue-500"
          />
          <span className="ml-2 text-sm text-gray-700">Full-Time</span>
        </label>
        <label className="inline-flex items-center">
          <input
            type="radio"
            name="employmentType"
            value="Part-Time"
            checked={newJob.employmentType === 'Part-Time'}
            onChange={handleInputChange}
            className="form-radio h-4 w-4 text-blue-500"
          />
          <span className="ml-2 text-sm text-gray-700">Part-Time</span>
        </label>
      </div>
    </div>
    
    {/* Work Mode */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Work Mode <span className="text-red-500">*</span>
      </label>
      <div className="flex gap-4">
        <label className="inline-flex items-center">
          <input
            type="radio"
            name="workMode"
            value="WFO"
            checked={newJob.workMode === 'WFO'}
            onChange={handleInputChange}
            className="form-radio h-4 w-4 text-blue-500"
          />
          <span className="ml-2 text-sm text-gray-700">WFO (Office)</span>
        </label>
        <label className="inline-flex items-center">
          <input
            type="radio"
            name="workMode"
            value="WFH"
            checked={newJob.workMode === 'WFH'}
            onChange={handleInputChange}
            className="form-radio h-4 w-4 text-blue-500"
          />
          <span className="ml-2 text-sm text-gray-700">WFH (Remote)</span>
        </label>
        <label className="inline-flex items-center">
          <input
            type="radio"
            name="workMode"
            value="Hybrid"
            checked={newJob.workMode === 'Hybrid'}
            onChange={handleInputChange}
            className="form-radio h-4 w-4 text-blue-500"
          />
          <span className="ml-2 text-sm text-gray-700">Hybrid</span>
        </label>
      </div>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Experience Required */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Experience Required <span className="text-gray-500 text-xs">(In Years)</span>
        </label>
        <input
          type="number"
          name="experienceRequired"
          value={newJob.experienceRequired}
          onChange={handleInputChange}
          className="w-full px-4 py-2 bg-gray-50 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          placeholder="Enter years of experience"
          min="0"
          step="0.1"
        />
      </div>
      
      {/* Min Remuneration */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Min Remuneration
        </label>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">₹</span>
          <input
            type="number"
            name="minRemuneration"
            value={newJob.minRemuneration}
            onChange={handleInputChange}
            className="w-full pl-8 px-4 py-2 bg-gray-50 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            placeholder="e.g. 500000"
            min="0"
          />
        </div>
      </div>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Application Deadline */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Application Deadline <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          name="applicationDeadline"
          value={newJob.applicationDeadline}
          min={new Date().toISOString().split('T')[0]} // Prevent past dates
          onChange={(e) => {
            const selectedDate = e.target.value;
            const currentDate = new Date().toISOString().split('T')[0];
            
            // Clear any previous date error
            setDateError('');
            
            // Check if selected date is in the past
            if (selectedDate && selectedDate < currentDate) {
              setDateError('Application deadline cannot be in the past. Please select today or a future date.');
              return;
            }
            
            // Direct update to ensure date format is preserved
            setNewJob(prev => ({
              ...prev,
              applicationDeadline: selectedDate
            }));
          }}
          className={`w-full px-4 py-2 bg-gray-50 rounded-lg border transition-all ${
            dateError 
              ? 'border-red-300 focus:ring-2 focus:ring-red-500 focus:border-red-500' 
              : 'border-gray-200 focus:ring-2 focus:ring-blue-500 focus:bg-white'
          }`}
          required
        />
        {dateError && (
          <p className="mt-1 text-sm text-red-600">{dateError}</p>
        )}
      </div>
      
      {/* Number of Openings */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Number of Openings
        </label>
        <input
          type="number"
          name="numberOfOpenings"
          value={newJob.numberOfOpenings}
          onChange={handleInputChange}
          className="w-full px-4 py-2 bg-gray-50 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          placeholder="e.g. 3"
          min="1"
        />
      </div>
    </div>
    
    {/* Location */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Location <span className="text-red-500">*</span>
      </label>
      <div className="flex gap-4">
        <div className="w-1/2 relative" ref={locationDropdownRef}>
          <div 
            className="w-full px-4 py-2 bg-gray-50 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all flex justify-between items-center cursor-pointer"
            onClick={() => setLocationDropdownOpen(!locationDropdownOpen)}
          >
            <span className={newJob.location.length === 0 ? "text-gray-500" : ""}>
              {newJob.location.length === 0 ? 'Select locations' : `${newJob.location.length} location(s) selected`}
            </span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
          
          {locationDropdownOpen && (
            <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
              <div className="p-2 border-b border-gray-200">
                <input
                  type="text"
                  placeholder="Search locations..."
                  value={locationSearch}
                  onChange={(e) => setLocationSearch(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              {cityListLoading ? (
                <div className="px-4 py-2 text-center text-gray-500">
                  Loading locations...
                </div>
              ) : filteredCities.length > 0 ? (
                filteredCities.map((city) => (
                  <div 
                    key={city.name} 
                    className="px-4 py-2 hover:bg-blue-50 cursor-pointer flex items-center justify-between"
                    onClick={() => toggleLocation(city.name)}
                  >
                    <span>{city.name}</span>
                    {newJob.location.includes(city.name) && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                ))
              ) : (
                <div className="px-4 py-2 text-center text-gray-500">
                  No locations found
                </div>
              )}
            </div>
          )}
        </div>
        <div className="w-1/2 bg-gray-50 border border-gray-200 rounded-lg p-2 min-h-[42px] max-h-[150px] overflow-y-auto">
          {newJob.location.length > 0 ? (
            newJob.location.map((cityName) => (
              <div key={cityName} className="inline-flex items-center bg-green-100 text-green-800 rounded-full px-3 py-1 text-sm mr-2 mb-2">
                {cityName}
                <button 
                  type="button"
                  className="ml-1 text-blue-600 hover:text-blue-800"
                  onClick={() => removeLocation(cityName)}
                >
                  ×
                </button>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500 italic">No locations selected</p>
          )}
        </div>
      </div>
    </div>
    
    <h4 className="text-md font-semibold text-blue-600 mt-6 mb-2">Step 2: Detailed Information</h4>
    
    {/* Description */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Description <span className="text-red-500">*</span>
      </label>
      <textarea
        name="description"
        value={newJob.description}
        onChange={handleInputChange}
        className="w-full px-4 py-2 bg-gray-50 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
        rows={5}
        placeholder="Opportunity summary, responsibilities, etc."
        required
      ></textarea>
    </div>
    
    {/* Primary Skills */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Primary Skills <span className="text-red-500">*</span>
      </label>
      <div className="flex gap-4">
        <div className="w-1/2 relative" ref={primarySkillsDropdownRef}>
          <div 
            className="w-full px-4 py-2 bg-gray-50 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all flex justify-between items-center cursor-pointer"
            onClick={() => setPrimarySkillsDropdownOpen(!primarySkillsDropdownOpen)}
          >
            <span className={newJob.primarySkills.length === 0 ? "text-gray-500" : ""}>
              {newJob.primarySkills.length === 0 ? 'Select primary skills' : 'Primary skills selected'}
            </span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
          
          {primarySkillsDropdownOpen && (
            <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
              <div className="p-2 border-b border-gray-200">
                <input
                  type="text"
                  placeholder="Search skills..."
                  value={primarySkillsSearch}
                  onChange={(e) => setPrimarySkillsSearch(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              {skillsLoading ? (
                <div className="px-4 py-2 text-center text-gray-500">
                  Loading skills...
                </div>
              ) : filteredPrimarySkills.length > 0 ? (
                filteredPrimarySkills.map((skill) => (
                  <div 
                    key={skill.name} 
                    className="px-4 py-2 hover:bg-blue-50 cursor-pointer flex items-center justify-between"
                    onClick={() => togglePrimarySkill(skill.name)}
                  >
                    <span>{skill.canonical_name}</span>
                    {newJob.primarySkills.includes(skill.name) && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                ))
              ) : (
                <div className="px-4 py-2 text-center text-gray-500">
                  No skills found
                </div>
              )}
            </div>
          )}
        </div>
        <div className="w-1/2 bg-gray-50 border border-gray-200 rounded-lg p-2 min-h-[42px] max-h-[150px] overflow-y-auto">
          {newJob.primarySkills.length > 0 ? (
            newJob.primarySkills.map((skillId) => {
              const skill = availableSkills.find(s => s.name === skillId);
              
              // Determine if this is an SK code (from AI search)
              const isSkCode = typeof skillId === 'string' && skillId.startsWith('SK-');
              
              // Get the display name for the skill using our utility function
              const displayName = getSkillDisplayName(skillId);
              
              // Log for debugging
              if (isSkCode) {
                console.log('Displaying SK code skill:', skillId, 'as:', displayName);
              }
              
              return (
                <div key={skillId} className="inline-flex items-center bg-blue-100 text-blue-800 rounded-full px-3 py-1 text-sm mr-2 mb-2">
                  {displayName}
                  {/* {(isSkCode || !skill) && (
                    <span className="ml-1 text-xs bg-purple-200 text-purple-700 px-1 rounded">AI</span>
                  )} */}
                  <button 
                    type="button"
                    className="ml-1 text-blue-600 hover:text-blue-800"
                    onClick={() => removePrimarySkill(skillId)}
                  >
                    ×
                  </button>
                </div>
              );
            })
          ) : (
            <p className="text-sm text-gray-500 italic">No primary skills selected</p>
          )}
        </div>
      </div>
      {primarySkillsError && (
        <p className="mt-1 text-sm text-red-600">{primarySkillsError}</p>
      )}
      
      {/* AI Search for Primary Skills */}
      <div className="mt-3 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
        <label className="block text-sm font-medium text-purple-700 mb-2">
          🤖 AI Skill Search - Primary Skills
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Enter skill to search with AI..."
            value={primaryAiSearch}
            onChange={(e) => {
              setPrimaryAiSearch(e.target.value);
              if (primaryAiInfoMessage) setPrimaryAiInfoMessage('');
            }}
            className="flex-1 px-3 py-2 text-sm border border-purple-200 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            onKeyPress={(e) => e.key === 'Enter' && handlePrimaryAiSearch()}
          />
          <button
            type="button"
            onClick={handlePrimaryAiSearch}
            disabled={primaryAiSearchLoading || !primaryAiSearch.trim()}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-medium rounded-md hover:from-purple-700 hover:to-blue-700 focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {primaryAiSearchLoading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Searching...
              </>
            ) : (
              <>
                🤖 AI Search
              </>
            )}
          </button>
        </div>
        {primaryAiInfoMessage && (
          <p className="mt-2 text-sm text-purple-700">{primaryAiInfoMessage}</p>
        )}
        
        {/* AI Aliases Dropdown */}
        {primaryAiDropdownOpen && primaryAiAliases.length > 0 && (
          <div ref={primaryAiDropdownRef} className="mt-2 bg-white border border-purple-200 rounded-lg shadow-lg max-h-40 overflow-auto">
            <div className="p-2 border-b border-purple-100 bg-purple-50">
              <p className="text-xs text-purple-700 font-medium">
                Found: {primaryAiCanonicalName}
              </p>
            </div>
            {primaryAiAliases.map((alias, index) => (
              <div
                key={index}
                className="px-3 py-2 hover:bg-purple-50 cursor-pointer text-sm border-b border-gray-100 last:border-b-0"
                onClick={() => selectPrimaryAiAlias(alias)}
              >
                <span className="text-gray-700">{alias}</span>
                <span className="text-xs text-purple-600 ml-2">→ {primaryAiCanonicalName}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    
    {/* Secondary Skills */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Secondary Skills
      </label>
      <div className="flex gap-4">
        <div className="w-1/2 relative" ref={secondarySkillsDropdownRef}>
          <div 
            className="w-full px-4 py-2 bg-gray-50 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all flex justify-between items-center cursor-pointer"
            onClick={() => setSecondarySkillsDropdownOpen(!secondarySkillsDropdownOpen)}
          >
            <span className={newJob.secondarySkills.length === 0 ? "text-gray-500" : ""}>
              {newJob.secondarySkills.length === 0 ? 'Select secondary skills' : 'Secondary skills selected'}
            </span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
          
          {secondarySkillsDropdownOpen && (
            <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
              <div className="p-2 border-b border-gray-200">
                <input
                  type="text"
                  placeholder="Search skills..."
                  value={secondarySkillsSearch}
                  onChange={(e) => setSecondarySkillsSearch(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              {skillsLoading ? (
                <div className="px-4 py-2 text-center text-gray-500">
                  Loading skills...
                </div>
              ) : filteredSecondarySkills.length > 0 ? (
                filteredSecondarySkills.map((skill) => (
                  <div 
                    key={skill.name} 
                    className="px-4 py-2 hover:bg-blue-50 cursor-pointer flex items-center justify-between"
                    onClick={() => toggleSecondarySkill(skill.name)}
                  >
                    <span>{skill.canonical_name}</span>
                    {newJob.secondarySkills.includes(skill.name) && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                ))
              ) : (
                <div className="px-4 py-2 text-center text-gray-500">
                  No skills found
                </div>
              )}
            </div>
          )}
        </div>
        <div className="w-1/2 bg-gray-50 border border-gray-200 rounded-lg p-2 min-h-[42px] max-h-[150px] overflow-y-auto">
          {newJob.secondarySkills.length > 0 ? (
            newJob.secondarySkills.map((skillId) => {
              const skill = availableSkills.find(s => s.name === skillId);
              
              // Determine if this is an SK code (from AI search)
              const isSkCode = typeof skillId === 'string' && skillId.startsWith('SK-');
              
              // Get the display name for the skill using our utility function
              const displayName = getSkillDisplayName(skillId);
              
              // Log for debugging
              if (isSkCode) {
                console.log('Displaying secondary SK code skill:', skillId, 'as:', displayName);
              }
              
              return (
                <div key={skillId} className="inline-flex items-center bg-green-100 text-green-800 rounded-full px-3 py-1 text-sm mr-2 mb-2">
                  {displayName}
                  {/* Hide the AI badge as requested */}
                  {/* {(isSkCode || !skill) && (
                    <span className="ml-1 text-xs bg-purple-200 text-purple-700 px-1 rounded">AI</span>
                  )} */}
                  <button 
                    type="button"
                    className="ml-1 text-blue-600 hover:text-blue-800"
                    onClick={() => removeSecondarySkill(skillId)}
                  >
                    ×
                  </button>
                </div>
              );
            })
          ) : (
            <p className="text-sm text-gray-500 italic">No secondary skills selected</p>
          )}
        </div>
      </div>
      
      {/* AI Search for Secondary Skills */}
      <div className="mt-3 p-4 bg-gradient-to-r from-green-50 to-teal-50 rounded-lg border border-green-200">
        <label className="block text-sm font-medium text-green-700 mb-2">
          🤖 AI Skill Search - Secondary Skills
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Enter skill to search with AI..."
            value={secondaryAiSearch}
            onChange={(e) => {
              setSecondaryAiSearch(e.target.value);
              if (secondaryAiInfoMessage) setSecondaryAiInfoMessage('');
            }}
            className="flex-1 px-3 py-2 text-sm border border-green-200 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
            onKeyPress={(e) => e.key === 'Enter' && handleSecondaryAiSearch()}
          />
          <button
            type="button"
            onClick={handleSecondaryAiSearch}
            disabled={secondaryAiSearchLoading || !secondaryAiSearch.trim()}
            className="px-4 py-2 bg-gradient-to-r from-green-600 to-teal-600 text-white text-sm font-medium rounded-md hover:from-green-700 hover:to-teal-700 focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {secondaryAiSearchLoading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Searching...
              </>
            ) : (
              <>
                🤖 AI Search
              </>
            )}
          </button>
        </div>
        {secondaryAiInfoMessage && (
          <p className="mt-2 text-sm text-green-700">{secondaryAiInfoMessage}</p>
        )}
        
        {/* AI Aliases Dropdown */}
        {secondaryAiDropdownOpen && secondaryAiAliases.length > 0 && (
          <div ref={secondaryAiDropdownRef} className="mt-2 bg-white border border-green-200 rounded-lg shadow-lg max-h-40 overflow-auto">
            <div className="p-2 border-b border-green-100 bg-green-50">
              <p className="text-xs text-green-700 font-medium">
                Found: {secondaryAiCanonicalName}
              </p>
            </div>
            {secondaryAiAliases.map((alias, index) => (
              <div
                key={index}
                className="px-3 py-2 hover:bg-green-50 cursor-pointer text-sm border-b border-gray-100 last:border-b-0"
                onClick={() => selectSecondaryAiAlias(alias)}
              >
                <span className="text-gray-700">{alias}</span>
                <span className="text-xs text-green-600 ml-2">→ {secondaryAiCanonicalName}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    
    {/* Preferred Qualifications */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Preferred Qualifications
      </label>
      <input
        type="text"
        name="preferredQualifications"
        value={newJob.preferredQualifications}
        onChange={handleInputChange}
        className="w-full px-4 py-2 bg-gray-50 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
        placeholder="Education, certifications"
      />
    </div>
    
    
    {/* <h4 className="text-md font-semibold text-blue-600 mt-6 mb-2">Step 3: Additional Filters</h4> */}
    
    {/* <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
      
    
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Language Requirement
      </label>
      <div className="flex gap-4">
        <div className="w-1/2 relative" ref={languageDropdownRef}>
          <div 
            className="w-full px-4 py-2 bg-gray-50 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all flex justify-between items-center cursor-pointer"
            onClick={() => setLanguageDropdownOpen(!languageDropdownOpen)}
          >
            <span className={newJob.language.length === 0 ? "text-gray-500" : ""}>
              {newJob.language.length === 0 ? 'Select language requirements' : 'Languages selected'}
            </span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
          
          {languageDropdownOpen && (
            <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-auto">
              {[
                { value: "english", label: "English" },
                { value: "spanish", label: "Spanish" },
                { value: "french", label: "French" },
                { value: "german", label: "German" },
                { value: "chinese", label: "Chinese" },
                { value: "japanese", label: "Japanese" },
                { value: "arabic", label: "Arabic" },
                { value: "hindi", label: "Hindi" }
              ].map((option) => (
                <div 
                  key={option.value} 
                  className="px-4 py-2 hover:bg-blue-50 cursor-pointer flex items-center justify-between"
                  onClick={() => toggleLanguage(option.value)}
                >
                  <span>{option.label}</span>
                  {newJob.language.includes(option.value) && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="w-1/2 bg-gray-50 border border-gray-200 rounded-lg p-2 min-h-[42px] max-h-[150px] overflow-y-auto">
          {newJob.language.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {newJob.language.map((language) => (
                <div key={language} className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-md flex items-center">
                  {language === 'english' ? 'English' : 
                   language === 'spanish' ? 'Spanish' : 
                   language === 'french' ? 'French' : 
                   language === 'german' ? 'German' : 
                   language === 'chinese' ? 'Chinese' : 
                   language === 'japanese' ? 'Japanese' : 
                   language === 'arabic' ? 'Arabic' : 
                   language === 'hindi' ? 'Hindi' : language}
                  <button 
                    type="button" 
                    className="ml-1 text-blue-600 hover:text-blue-800"
                    onClick={() => removeLanguage(language)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic">No languages selected</p>
          )}
        </div>
      </div>
    </div>
    </div> */}
    
    <h4 className="text-md font-semibold text-blue-600 mt-6 mb-2">Step 3: Visibility Settings</h4>
    
    {/* Visibility Settings */}
    {/* <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Who can view or apply to this opportunity?
      </label>
      <select
        name="visibilitySettings"
        value={newJob.visibilitySettings}
        onChange={handleInputChange}
        className="w-full px-4 py-2 bg-gray-50 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
        disabled={applyOpportunitiesLoading}
      >
        {applyOpportunitiesLoading ? (
          <option value="">Loading options...</option>
        ) : applyOpportunities.length > 0 ? (
          applyOpportunities.map((opportunity, index) => (
            <option key={index} value={opportunity.toLowerCase().replace(/[^a-z0-9]/g, '-')}>
              {opportunity}
            </option>
          ))
        ) : (
          <option value="all">All verified users</option>
        )}
      </select>
    </div> */}
    
    {/* Anticipated Applications */}
    <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
    Anticipated Number of Applications
  </label>
  <input
    type="number"
    name="anticipatedApplications"
    value={newJob.anticipatedApplications}
    onChange={handleInputChange}
    min="1"
    className="w-full px-4 py-2 bg-gray-50 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
    placeholder="Enter number"
  />
</div>

    
    <div className="flex justify-center pt-4 min-h-[60px]">
      <button
        type="submit"
        disabled={isSubmitting}
        className="bg-[#007BCA] border text-white font-semibold py-2 px-8 rounded-lg hover:bg-white hover:text-[#007BCA] hover:border-[#007BCA] hover:shadow-2xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed h-10"
      >
        {isSubmitting ? 'Posting...' : 'Create'}
      </button>
    </div>
    
    {/* Error message */}
    {submitError && (
      <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
        {/* <p className="text-sm font-medium">Error:</p> */}
        <p className="text-sm">{submitError}</p>
      </div>
    )}
    
    {/* Success message */}
    {submitSuccess && (
      <div className="mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg">
        <p className="text-sm">Job posting submitted successfully!</p>
      </div>
    )}
  </form>
      </div>
    </div>
  );
}