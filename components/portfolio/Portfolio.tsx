"use client";

import { useState, useEffect } from "react";
import {
  Upload,
  User,
  GraduationCap,
  Briefcase,
  Award,
  FileText,
  Plus,
  X,
  Loader2,
} from "lucide-react";
import { useResumeStore } from "../../store/portfolio/resumeStore";
import PersonalInfoForm from "./PersonalInfoForm";
import EducationForm from "./EducationForm";
import ExperienceForm from "./ExperienceForm";
import CertificateForm from "./CertificateForm";
import SubmitFormModal from "../modal/SubmitFormModal";
import {
  getPortfolio,
  getAuthData,
} from "../../app/api/portfolio/getPortfolio";
import { fetchResumePreviewAPI } from "@/app/api/portfolio/previewResumeAPI";

interface PortfolioProps {
  activeSection?: string;
  setActiveSection?: (section: string) => void;
  sections?: {
    id: string;
    name: string;
    icon: any;
    completed: boolean;
  }[];
  setResumeUploaded?: (value: boolean) => void;
  setPersonalInfoCompleted?: (value: boolean) => void;
  setEducationCompleted?: (value: boolean) => void;
  setExperienceCompleted?: (value: boolean) => void;
  setCertificatesCompleted?: (value: boolean) => void;
  onPortfolioComplete?: () => void;
  onSkip?: () => void;
  className?: string;
}

export default function Portfolio({
  activeSection: propActiveSection,
  setActiveSection: propSetActiveSection,
  sections: propSections,
  setResumeUploaded: propSetResumeUploaded,
  setPersonalInfoCompleted: propSetPersonalInfoCompleted,
  setEducationCompleted: propSetEducationCompleted,
  setExperienceCompleted: propSetExperienceCompleted,
  setCertificatesCompleted: propSetCertificatesCompleted,
  onPortfolioComplete,
  onSkip,
  className = "",
}: PortfolioProps) {
  // Use local state if props are not provided
  const [localActiveSection, setLocalActiveSection] = useState("resume");
  const [localResumeUploaded, setLocalResumeUploaded] = useState(false);
  const [localPersonalInfoCompleted, setLocalPersonalInfoCompleted] =
    useState(false);
  const [localEducationCompleted, setLocalEducationCompleted] = useState(false);
  const [localExperienceCompleted, setLocalExperienceCompleted] =
    useState(false);
  const [localCertificatesCompleted, setLocalCertificatesCompleted] =
    useState(false);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [flag1resume, setFlag1resume] = useState<boolean>(false);
  const [flag2UpdateResume, setFlag2UpdateResume] = useState<boolean>(false);
  const [resumeUrl, setResumeUrl] = useState<string>("");

  // Use props if provided, otherwise use local state
  const activeSection = propActiveSection || localActiveSection;
  const setActiveSection = propSetActiveSection || setLocalActiveSection;
  const resumeUploaded = propSections
    ? propSections[0].completed
    : localResumeUploaded;
  const personalInfoCompleted = propSections
    ? propSections[1].completed
    : localPersonalInfoCompleted;
  const educationCompleted = propSections
    ? propSections[2].completed
    : localEducationCompleted;
  const experienceCompleted = propSections
    ? propSections[3].completed
    : localExperienceCompleted;
  const certificatesCompleted = propSections
    ? propSections[4].completed
    : localCertificatesCompleted;

  // Set completion functions that update both local state and parent state if provided
  const updateResumeUploaded = (value: boolean) => {
    setLocalResumeUploaded(value);
    if (propSetResumeUploaded) propSetResumeUploaded(value);
    localStorage.setItem("portfolioResumeUploaded", value.toString());
  };

  const updatePersonalInfoCompleted = (value: boolean) => {
    setLocalPersonalInfoCompleted(value);
    if (propSetPersonalInfoCompleted) propSetPersonalInfoCompleted(value);
    localStorage.setItem("portfolioPersonalInfoCompleted", value.toString());
  };

  const updateEducationCompleted = (value: boolean) => {
    setLocalEducationCompleted(value);
    if (propSetEducationCompleted) propSetEducationCompleted(value);
    localStorage.setItem("portfolioEducationCompleted", value.toString());
  };

  const updateExperienceCompleted = (value: boolean) => {
    setLocalExperienceCompleted(value);
    if (propSetExperienceCompleted) propSetExperienceCompleted(value);
    localStorage.setItem("portfolioExperienceCompleted", value.toString());
  };

  const updateCertificatesCompleted = (value: boolean) => {
    setLocalCertificatesCompleted(value);
    if (propSetCertificatesCompleted) propSetCertificatesCompleted(value);
    localStorage.setItem("portfolioCertificatesCompleted", value.toString());
  };

  // Other state
  const [personalInfo, setPersonalInfo] = useState({});
  const [education, setEducation] = useState([]);
  const [experience, setExperience] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [certificateList, setCertificateList] = useState<any[]>([]);

  // preview resume
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading1, setLoading1] = useState(false);
  const [error1, setError1] = useState<string | null>(null);

  // Load saved data from localStorage and API on component mount
  useEffect(() => {
    const loadPortfolioData = async () => {
      if (typeof window !== "undefined") {
        try {
          // First, try to fetch data from API
          const authData = getAuthData();
          console.log("Auth data:", authData);

          if (authData) {
            console.log("Calling getPortfolio API...");
            const response = await getPortfolio(
              authData.entityId,
              authData.apiKey,
              authData.apiSecret
            );

            console.log("Full API response:", response);

            // Check both possible response structures
            let portfolioData = null;
            if (
              response &&
              response.message &&
              response.message.data &&
              response.message.data.portfolio
            ) {
              portfolioData = response.message.data.portfolio;
              console.log("Found portfolio in response.message.data.portfolio");
            } else if (response && response.data && response.data.portfolio) {
              portfolioData = response.data.portfolio;
              console.log("Found portfolio in response.data.portfolio");
            }

            if (portfolioData) {
              console.log("Portfolio data:", portfolioData);
              console.log("Resume field:", portfolioData.resume);
              console.log("Resume exists check:", !!portfolioData.resume);
              console.log("Resume type:", typeof portfolioData.resume);

              // Check if resume exists in API response (check for both null and empty string)
              if (
                portfolioData.resume &&
                portfolioData.resume.toString().trim() !== ""
              ) {
                setFlag1resume(true);
                setResumeUrl(portfolioData?.resume);
                console.log("✅ Resume found in API:", portfolioData.resume);
                setLocalResumeUploaded(true);
                if (propSetResumeUploaded) propSetResumeUploaded(true);
                localStorage.setItem("portfolioResumeUploaded", "true");
                console.log("✅ Resume upload status set to true");
              } else {
                console.log("❌ No resume found in API response");
              }

              // Check if personal info is complete
              const hasPersonalInfo =
                portfolioData.first_name ||
                portfolioData.last_name ||
                portfolioData.email ||
                portfolioData.date_of_birth ||
                portfolioData.gender ||
                portfolioData.nationality;
              if (hasPersonalInfo) {
                console.log("✅ Personal info found in API");
                setLocalPersonalInfoCompleted(true);
                if (propSetPersonalInfoCompleted)
                  propSetPersonalInfoCompleted(true);
                localStorage.setItem("portfolioPersonalInfoCompleted", "true");
              }

              // Check and load education data
              if (
                portfolioData.education &&
                portfolioData.education.length > 0
              ) {
                console.log(
                  "✅ Education data found:",
                  portfolioData.education.length,
                  "entries"
                );
                const mappedEducation = portfolioData.education.map(
                  (edu: any) => ({
                    id: edu.name || Date.now() + Math.random(),
                    educationLevel: edu.education_level || "",
                    yearOfCompletion: edu.year_of_completion || "",
                    stream: edu.stream || "",
                    score: edu.score || "",
                    universityBoard: edu.university_board || "",
                    certificate: edu.certificate || null,
                  })
                );
                setEducation(mappedEducation);
                localStorage.setItem(
                  "portfolioEducation",
                  JSON.stringify(mappedEducation)
                );
                setLocalEducationCompleted(true);
                if (propSetEducationCompleted) propSetEducationCompleted(true);
                localStorage.setItem("portfolioEducationCompleted", "true");
              }

              // Check and load work experience data
              if (
                portfolioData.work_experience &&
                portfolioData.work_experience.length > 0
              ) {
                console.log(
                  "✅ Work experience data found:",
                  portfolioData.work_experience.length,
                  "entries"
                );
                const mappedExperience = portfolioData.work_experience.map(
                  (exp: any) => ({
                    id: exp.name || Date.now() + Math.random(),
                    space: exp.space || "",
                    designation: exp.designation || "",
                    company: exp.company || "",
                    relevantExperience: exp.relevant_experience || 0,
                  })
                );
                setExperience(mappedExperience);
                localStorage.setItem(
                  "portfolioExperience",
                  JSON.stringify(mappedExperience)
                );
                setLocalExperienceCompleted(true);
                if (propSetExperienceCompleted)
                  propSetExperienceCompleted(true);
                localStorage.setItem("portfolioExperienceCompleted", "true");
              }

              // Check and load certificates data
              if (
                portfolioData.certificates &&
                portfolioData.certificates.length > 0
              ) {
                console.log(
                  "✅ Certificates data found:",
                  portfolioData.certificates.length,
                  "entries"
                );
                const mappedCertificates = portfolioData.certificates.map(
                  (cert: any) => ({
                    id: cert.name || Date.now() + Math.random(),
                    documentName: cert.document_name || "",
                    certificateType: cert.certificate_type || "",
                    documentUpload: cert.document_upload || null,
                    issuingOrganisation: cert.issuing_organisation || "",
                  })
                );
                setCertificates(mappedCertificates);
                localStorage.setItem(
                  "portfolioCertificates",
                  JSON.stringify(mappedCertificates)
                );
                setLocalCertificatesCompleted(true);
                if (propSetCertificatesCompleted)
                  propSetCertificatesCompleted(true);
                localStorage.setItem("portfolioCertificatesCompleted", "true");
              }

              // Map the portfolio data to the personalInfo format
              const mappedPersonalInfo = {
                fullName: `${portfolioData.first_name || ""} ${
                  portfolioData.last_name || ""
                }`.trim(),
                email: portfolioData.email || "",
                phone: portfolioData.phone || "",
                gender: portfolioData.gender || "",
                dateOfBirth: portfolioData.date_of_birth || "",
                nationality: portfolioData.nationality || "",
                country: portfolioData.country || "",
                city: portfolioData.city || "",
                landmark: portfolioData.landmark || "",
                pincode: portfolioData.pincode || "",
                currentAddress: portfolioData.current_address || "",
                permanentAddress: portfolioData.permanent_address || "",
                twitterHandle: portfolioData.twitter_handle || "",
                linkedinHandle: portfolioData.linkedin_profile || "",
                instagramHandle: portfolioData.instagram_handle || "",
                facebookHandle: portfolioData.facebook_profile || "",
                employmentStatus: portfolioData.employment_status || "",
                website: portfolioData.website || "",
                totalExperience: portfolioData.total_experience || "",
                noticePeriod: portfolioData.last_working_day || "",
                professionalSummary: portfolioData.professional_summary || "",
              };

              // Update the personalInfo state with API data
              setPersonalInfo(mappedPersonalInfo);
              localStorage.setItem(
                "portfolioPersonalInfo",
                JSON.stringify(mappedPersonalInfo)
              );

              console.log(
                "Portfolio data loaded from API:",
                mappedPersonalInfo
              );
            } else {
              console.log("❌ No portfolio data found in API response");
            }
          }
        } catch (error) {
          console.error("❌ Error fetching portfolio data from API:", error);
          console.log("Falling back to localStorage data...");
        }

        // Load active section
        const savedSection = localStorage.getItem("portfolioActiveSection");
        if (savedSection) {
          setLocalActiveSection(savedSection);
          // Also update the parent's active section if available
          if (propSetActiveSection) propSetActiveSection(savedSection);
        }

        // Load completion status from localStorage (fallback if API doesn't have this info)
        const savedResumeUploaded =
          localStorage.getItem("portfolioResumeUploaded") === "true";
        const savedPersonalInfoCompleted =
          localStorage.getItem("portfolioPersonalInfoCompleted") === "true";
        const savedEducationCompleted =
          localStorage.getItem("portfolioEducationCompleted") === "true";
        const savedExperienceCompleted =
          localStorage.getItem("portfolioExperienceCompleted") === "true";
        const savedCertificatesCompleted =
          localStorage.getItem("portfolioCertificatesCompleted") === "true";

        // Update local state (only if not already set by API)
        if (!localResumeUploaded) {
          setLocalResumeUploaded(savedResumeUploaded);
          if (propSetResumeUploaded) propSetResumeUploaded(savedResumeUploaded);
        }
        if (!localPersonalInfoCompleted) {
          setLocalPersonalInfoCompleted(savedPersonalInfoCompleted);
          if (propSetPersonalInfoCompleted)
            propSetPersonalInfoCompleted(savedPersonalInfoCompleted);
        }
        if (!localEducationCompleted) {
          setLocalEducationCompleted(savedEducationCompleted);
          if (propSetEducationCompleted)
            propSetEducationCompleted(savedEducationCompleted);
        }
        if (!localExperienceCompleted) {
          setLocalExperienceCompleted(savedExperienceCompleted);
          if (propSetExperienceCompleted)
            propSetExperienceCompleted(savedExperienceCompleted);
        }
        if (!localCertificatesCompleted) {
          setLocalCertificatesCompleted(savedCertificatesCompleted);
          if (propSetCertificatesCompleted)
            propSetCertificatesCompleted(savedCertificatesCompleted);
        }

        // Load other form data from localStorage (only if not already loaded from API)
        if (education.length === 0) {
          const savedEducation = localStorage.getItem("portfolioEducation");
          if (savedEducation) setEducation(JSON.parse(savedEducation));
        }
        if (experience.length === 0) {
          const savedExperience = localStorage.getItem("portfolioExperience");
          if (savedExperience) setExperience(JSON.parse(savedExperience));
        }
        if (certificates.length === 0) {
          const savedCertificates = localStorage.getItem(
            "portfolioCertificates"
          );
          if (savedCertificates) setCertificates(JSON.parse(savedCertificates));
        }

        // Check if we need to show the reminder modal
        const currentResumeUploaded =
          localResumeUploaded || savedResumeUploaded;
        const allCompleted =
          currentResumeUploaded &&
          savedPersonalInfoCompleted &&
          savedEducationCompleted &&
          savedExperienceCompleted &&
          savedCertificatesCompleted;

        const hasStarted =
          currentResumeUploaded ||
          savedPersonalInfoCompleted ||
          savedEducationCompleted ||
          savedExperienceCompleted ||
          savedCertificatesCompleted;

        // Only show reminder if user has started but not completed all steps
        if (hasStarted && !allCompleted) {
          setShowReminderModal(true);
        }
      }
    };

    loadPortfolioData();
  }, [
    propSetActiveSection,
    propSetResumeUploaded,
    propSetPersonalInfoCompleted,
    propSetEducationCompleted,
    propSetExperienceCompleted,
    propSetCertificatesCompleted,
    localResumeUploaded,
  ]);

  // Use provided sections or create local ones
  const sections = propSections || [
    {
      id: "resume",
      name: "Resume Upload",
      icon: FileText,
      completed: resumeUploaded,
    },
    {
      id: "personal",
      name: "Personal Info",
      icon: User,
      completed: personalInfoCompleted,
    },
    {
      id: "education",
      name: "Education",
      icon: GraduationCap,
      completed: educationCompleted,
    },
    {
      id: "experience",
      name: "Experience",
      icon: Briefcase,
      completed: experienceCompleted,
    },
    {
      id: "certificates",
      name: "Certificates",
      icon: Award,
      completed: certificatesCompleted,
    },
  ];

  // Get resume store functions
  const { uploadResume, isUploading, isUploaded, error, uploadProgress } =
    useResumeStore();

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        // Upload the resume using our store
        const result = await uploadResume(file);

        if (result.success) {
          updateResumeUploaded(true);
          setFlag2UpdateResume(false);
          //make preview url null first to refresh iframe
          setPdfUrl(null);
          setLoading1(false);
          setError1(null);
          setResumeUrl(result?.data.resume_url);

          // After resume is uploaded, automatically switch to personal info section
          // setTimeout(() => {
          //   setActiveSection("personal");
          // }, 1000);
        } else {
          // Handle upload failure
          console.error("Resume upload failed");
        }
      } catch (err) {
        console.error("Error uploading resume:", err);
      }
    }
  };

  const handlePersonalInfoSave = (data: any) => {
    setPersonalInfo(data);
    localStorage.setItem("portfolioPersonalInfo", JSON.stringify(data));
    updatePersonalInfoCompleted(true);
    setActiveSection("education");
    localStorage.setItem("portfolioActiveSection", "education");
  };

  const handleEducationSave = (data: any) => {
    setEducation(data);
    localStorage.setItem("portfolioEducation", JSON.stringify(data));
    updateEducationCompleted(true);
    setActiveSection("experience");
    localStorage.setItem("portfolioActiveSection", "experience");
  };

  const handleExperienceSave = (data: any) => {
    setExperience(data);
    localStorage.setItem("portfolioExperience", JSON.stringify(data));
    updateExperienceCompleted(true);
    setActiveSection("certificates");
    localStorage.setItem("portfolioActiveSection", "certificates");
  };

  const handleCertificatesSave = (data: any) => {
    setCertificates(data);
    localStorage.setItem("portfolioCertificates", JSON.stringify(data));
    updateCertificatesCompleted(true);
  };

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    }
  };

  const handleModalSubmit = () => {
    // Call the onPortfolioComplete callback when the form is successfully submitted
    if (onPortfolioComplete) {
      onPortfolioComplete();
    }
  };

  // Handle closing the reminder modal
  const handleCloseReminderModal = () => {
    setShowReminderModal(false);
  };

  // Handle continuing from the reminder modal
  const handleContinueFromReminder = () => {
    setShowReminderModal(false);
    // Find the first incomplete section and navigate to it
    if (!resumeUploaded) {
      setActiveSection("resume");
      localStorage.setItem("portfolioActiveSection", "resume");
    } else if (!personalInfoCompleted) {
      setActiveSection("personal");
      localStorage.setItem("portfolioActiveSection", "personal");
    } else if (!educationCompleted) {
      setActiveSection("education");
      localStorage.setItem("portfolioActiveSection", "education");
    } else if (!experienceCompleted) {
      setActiveSection("experience");
      localStorage.setItem("portfolioActiveSection", "experience");
    } else if (!certificatesCompleted) {
      setActiveSection("certificates");
      localStorage.setItem("portfolioActiveSection", "certificates");
    }
  };

  const [isLoading, setIsLoading] = useState(false);
  const [portfolioData, setPortfolioData] = useState<any>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const handleNext = () => {
    const sectionFlow: Record<string, string> = {
      resume: "personal",
      personal: "education",
      education: "experience",
      experience: "certificates",
      // certificates: null, // or loop back to something else if needed
    };

    if (activeSection in sectionFlow) {
      setActiveSection?.(sectionFlow[activeSection]);
    }
  };

  const handleContinue = async () => {
    setIsLoading(true);
    setApiError(null);

    try {
      // Get auth data for API call
      const authData = getAuthData();

      if (!authData) {
        setApiError("Authentication data not found. Please log in again.");
        setIsLoading(false);
        return;
      }

      // Call the getPortfolio API
      const response = await getPortfolio(
        authData.entityId,
        authData.apiKey,
        authData.apiSecret
      );

      console.log("Portfolio data retrieved:", response);
      setPortfolioData(response);

      // Extract portfolio data from the response
      if (response && response.data && response.data.portfolio) {
        const portfolioData = response.data.portfolio;

        // Map the portfolio data to the personalInfo format
        const mappedPersonalInfo = {
          fullName: `${portfolioData.first_name || ""} ${
            portfolioData.last_name || ""
          }`.trim(),
          email: portfolioData.email || "",
          phone: portfolioData.phone || "",
          gender: portfolioData.gender || "",
          dateOfBirth: portfolioData.date_of_birth || "",
          nationality: portfolioData.nationality || "",
          country: portfolioData.country || "",
          city: portfolioData.city || "",
          landmark: portfolioData.landmark || "",
          pincode: portfolioData.pincode || "",
          currentAddress: portfolioData.current_address || "",
          permanentAddress: portfolioData.permanent_address || "",
          twitterHandle: portfolioData.twitter_handle || "",
          linkedinHandle: portfolioData.linkedin_profile || "",
          instagramHandle: portfolioData.instagram_handle || "",
          facebookHandle: portfolioData.facebook_profile || "",
          employmentStatus: portfolioData.employment_status || "",
          website: portfolioData.website || "",
          totalExperience: portfolioData.total_experience || "",
          noticePeriod: portfolioData.last_working_day || "",
          professionalSummary: portfolioData.professional_summary || "",
        };

        // Update the personalInfo state
        setPersonalInfo(mappedPersonalInfo);

        // Save to localStorage for persistence
        localStorage.setItem(
          "portfolioPersonalInfo",
          JSON.stringify(mappedPersonalInfo)
        );

        console.log(
          "Personal info updated from portfolio data:",
          mappedPersonalInfo
        );
      }

      // Open the modal after successful API call
      setIsModalOpen(true);

      // After showing the modal, navigate to the personal info section
      // This will ensure the form is populated with the updated data
      setTimeout(() => {
        setActiveSection("personal");
      }, 1500); // Short delay to allow the modal to be seen
    } catch (error: any) {
      console.error("Error fetching portfolio data:", error);
      setApiError(error.message || "Failed to fetch portfolio data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateResume = () => {
    setFlag2UpdateResume(true);
  };

  const handlePreview = async () => {
    setLoading1(true);
    setError1(null);
    try {
      const response = await fetchResumePreviewAPI();

      if (
        response.message?.status === "success" &&
        response.message.data?.file_content
      ) {
        const { file_content, content_type, file_name } = response.message.data;

        // Convert base64 to Blob
        const byteCharacters = atob(file_content);
        const byteNumbers = new Array(byteCharacters.length)
          .fill(0)
          .map((_, i) => byteCharacters.charCodeAt(i));
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: content_type });

        // Create object URL and set to state
        const url = URL.createObjectURL(blob);
        setPdfUrl(url);
      } else {
        setError1("Resume data not available");
      }
    } catch (err) {
      console.error(err);
      setError1("Failed to fetch resume preview");
    } finally {
      setLoading1(false);
    }
  };

  return (
    <div
      className={`bg-white rounded-xl w-full shadow-sm p-3 space-y-6 font-rubik ${className}`}
      style={{ width: "100%" }}
    >
      {/* Active Section Content */}
      <div className="bg-white p-4 rounded-xl shadow-lg">
        {activeSection === "resume" && (
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">
              Resume Upload & Smart Parsing
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Upload your resume and we&apos;ll automatically extract your
              information to build your profile
            </p>

            {!resumeUploaded || flag2UpdateResume ? (
              <div>
                <label
                  className={`block ${
                    isUploading ? "opacity-50 pointer-events-none" : ""
                  }`}
                >
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-orange-500 transition-colors cursor-pointer">
                    {isUploading ? (
                      <Loader2
                        className="mx-auto text-blue-500 mb-2 animate-spin"
                        size={24}
                      />
                    ) : (
                      <Upload
                        className="mx-auto text-gray-400 mb-2"
                        size={24}
                      />
                    )}
                    <p className="text-sm font-medium text-gray-900">
                      {isUploading
                        ? `Uploading resume (${uploadProgress}%)`
                        : "Upload your resume"}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      PDF, DOC, DOCX (max 10MB)
                    </p>

                    {/* Show error message if upload failed */}
                    {error && (
                      <p className="text-xs text-red-500 mt-2">{error}</p>
                    )}

                    {/* Show upload progress bar */}
                    {isUploading && (
                      <div className="w-full h-2 bg-gray-200 rounded-full mt-3">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleResumeUpload}
                    className="hidden"
                    disabled={isUploading}
                  />
                </label>
                {/* Cancel Button (only in update mode) */}
                {flag2UpdateResume && (
                  <div className="mt-4 flex justify-center">
                    <button
                      onClick={() => setFlag2UpdateResume(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg shadow-sm"
                      disabled={isUploading}
                    >
                      Cancel Resume Update
                    </button>
                  </div>
                )}{" "}
              </div>
            ) : (
              <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                    <FileText className="text-green-600" size={20} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      Resume uploaded successfully!
                    </p>
                    <p className="text-sm text-gray-600">
                      Your resume data has been loaded from your portfolio.
                    </p>
                    {/* Open Resume Button */}
                    <div className="mt-3 flex space-x-3">
                      <button
                        onClick={handlePreview}
                        disabled={loading1}
                        className="mt-2 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg shadow-sm"
                      >
                        Preview
                      </button>
                      <button
                        onClick={handleUpdateResume}
                        className="mt-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
                      >
                        Update Resume
                      </button>
                    </div>
                  </div>
                </div>
                {/* preview resume */}
                <div>
                  {error1 && <p className="text-red-500 mt-2">{error1}</p>}
                  {pdfUrl && (
                    <div className="mt-4 h-[500px] border rounded-lg overflow-hidden">
                      <iframe
                        src={pdfUrl}
                        title="Resume Preview"
                        className="w-full h-full"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeSection === "personal" && (
          <>
            {console.log(
              "DEBUG - Portfolio - personalInfo being passed to PersonalInfoForm:",
              personalInfo
            )}
            <PersonalInfoForm
              initialData={personalInfo}
              onSave={handlePersonalInfoSave}
              onCancel={() => setActiveSection("resume")}
            />
          </>
        )}

        {activeSection === "education" && (
          <EducationForm
            initialData={education}
            onSave={handleEducationSave}
            onCancel={() => setActiveSection("personal")}
          />
        )}

        {activeSection === "experience" && (
          <ExperienceForm
            initialData={experience}
            onSave={handleExperienceSave}
            onCancel={() => setActiveSection("education")}
          />
        )}

        {activeSection === "certificates" && (
          <CertificateForm
            initialData={certificates}
            onSave={handleCertificatesSave}
            onCancel={() => setActiveSection("experience")}
            setCertificateList={setCertificateList}
          />
        )}

        {activeSection !== "resume" &&
          activeSection !== "personal" &&
          activeSection !== "education" &&
          activeSection !== "experience" &&
          activeSection !== "certificates" && (
            <div className="text-center py-8">
              <Plus className="mx-auto text-gray-400 mb-3" size={32} />
              <h3 className="font-semibold text-gray-900 mb-2">
                {sections.find((s) => s.id === activeSection)?.name}
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                This section will be available after you complete the previous
                sections
              </p>
              <button
                onClick={() => {
                  // Navigate to the appropriate previous section
                  if (!personalInfoCompleted) {
                    setActiveSection("personal");
                  } else if (
                    !educationCompleted &&
                    activeSection === "experience"
                  ) {
                    setActiveSection("education");
                  } else if (
                    !experienceCompleted &&
                    activeSection === "certificates"
                  ) {
                    setActiveSection("experience");
                  } else {
                    setActiveSection("personal");
                  }
                }}
                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                Go to Previous Section
              </button>
            </div>
          )}
      </div>

      {/* Smart Parsing Benefits */}
      <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">
          Smart Resume Parsing
        </h3>
        <div className="space-y-2 text-sm text-blue-700">
          <div className="flex items-center space-x-2">
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
            <p>
              Automatically extracts personal information, education, and
              experience
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
            <p>Identifies skills and technologies from your background</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
            <p>You can review and edit all extracted information</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col space-y-3">
        {apiError && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
            {apiError}
          </div>
        )}

        {(activeSection === "resume" && flag1resume === true) ||
        activeSection === "certificates" ? (
          <div className="flex space-x-3"></div>
        ) : (
          <div className="flex space-x-3">
            <button
              onClick={handleNext}
              // onClick={handleContinue}
              disabled={isLoading}
              className={`max-w-xs mx-auto flex-1 ${
                isLoading ? "bg-blue-400" : "bg-blue-500 hover:shadow-lg"
              } text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 flex items-center justify-center`}
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin mr-2" />
                  Loading...
                </>
              ) : (
                `Next`
              )}
            </button>
          </div>
        )}
      </div>

      {/* Submit Form Modal */}
      <SubmitFormModal
        isOpen={false}
        // isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        portfolioData={portfolioData}
      />

      {/* Reminder Modal */}
      {showReminderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-1 bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md transform transition-all">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-xl font-semibold text-gray-900">
                Complete Your Portfolio
              </h3>
              <button
                onClick={handleCloseReminderModal}
                className="text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              <p className="text-gray-600 mb-4">
                You have started your portfolio but haven&apos;t completed all
                sections. Would you like to continue where you left off?
              </p>

              {/* Progress indicators */}
              <div className="space-y-2 mb-6">
                <div className="flex items-center">
                  <div
                    className={`w-4 h-4 rounded-full mr-2 ${
                      resumeUploaded ? "bg-green-500" : "bg-gray-300"
                    }`}
                  ></div>
                  <span
                    className={
                      resumeUploaded ? "text-green-600" : "text-gray-500"
                    }
                  >
                    Resume Upload
                  </span>
                </div>
                <div className="flex items-center">
                  <div
                    className={`w-4 h-4 rounded-full mr-2 ${
                      personalInfoCompleted ? "bg-green-500" : "bg-gray-300"
                    }`}
                  ></div>
                  <span
                    className={
                      personalInfoCompleted ? "text-green-600" : "text-gray-500"
                    }
                  >
                    Personal Information
                  </span>
                </div>
                <div className="flex items-center">
                  <div
                    className={`w-4 h-4 rounded-full mr-2 ${
                      educationCompleted ? "bg-green-500" : "bg-gray-300"
                    }`}
                  ></div>
                  <span
                    className={
                      educationCompleted ? "text-green-600" : "text-gray-500"
                    }
                  >
                    Education
                  </span>
                </div>
                <div className="flex items-center">
                  <div
                    className={`w-4 h-4 rounded-full mr-2 ${
                      experienceCompleted ? "bg-green-500" : "bg-gray-300"
                    }`}
                  ></div>
                  <span
                    className={
                      experienceCompleted ? "text-green-600" : "text-gray-500"
                    }
                  >
                    Experience
                  </span>
                </div>
                <div className="flex items-center">
                  <div
                    className={`w-4 h-4 rounded-full mr-2 ${
                      certificatesCompleted ? "bg-green-500" : "bg-gray-300"
                    }`}
                  ></div>
                  <span
                    className={
                      certificatesCompleted ? "text-green-600" : "text-gray-500"
                    }
                  >
                    Certificates
                  </span>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleCloseReminderModal}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Later
                </button>
                <button
                  onClick={handleContinueFromReminder}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:shadow-lg transition-all duration-300"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
