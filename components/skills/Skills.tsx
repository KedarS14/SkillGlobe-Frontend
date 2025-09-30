"use client";

import { useState, useEffect } from "react";
import { Search, Plus, X, Star, Trash2 } from "lucide-react";
import SkillsSuccessModal from "../modal/SkillsSuccessModal";
import { getSkills, Skill } from "@/app/api/job postings/addjobPosting";
import {
  addSkills,
  AddSkillsRequest,
  SkillData as APISkillData,
  deleteSkill2,
  getSkillsList,
  SkillListResponse,
} from "@/app/api/Individual Skills/addSkills";
import { getAuthData } from "@/utils/auth";
import { toast } from "react-hot-toast";
import { createGlobalSkillAPI } from "@/app/api/Individual Skills/groqSkillsAPI";

interface SkillsProps {
  onSkillsComplete?: () => void;
  onSkip?: () => void;
  className?: string;
}

interface SkillData {
  name: string;
  canonical_name?: string;
  skill_id?: string;
  skill_UID?: string;
}

export default function Skills({
  onSkillsComplete,
  onSkip,
  className = "",
}: SkillsProps) {
  const [selectedSkills, setSelectedSkills] = useState<SkillData[]>([]);
  const [selectedSkills2, setSelectedSkills2] = useState<SkillData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Skill[]>([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchError2, setSearchError2] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [aiResultMsg, setAiResultMsg] = useState<string>("");
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [aiResult, setAiResult] = useState<Skill[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingUserSkills, setIsLoadingUserSkills] = useState(false);
  const [existingSkills, setExistingSkills] = useState<SkillData[]>([]);
  const [newSkills, setNewSkills] = useState<SkillData[]>([]);

  // Add a skill
  const addSkill = (skill: string | Skill) => {
    const skillName = typeof skill === "string" ? skill : skill.name;
    if (
      !selectedSkills.some(
        (s) => s.name.toLowerCase() === skillName.toLowerCase()
      )
    ) {
      const skillData: SkillData =
        typeof skill === "string"
          ? { name: skill }
          : {
              name: skill.name,
              canonical_name: skill.canonical_name,
              skill_id: skill.skill_id,
              skill_UID: skill.skill_UID,
            };

      // Add to selected skills
      setSelectedSkills([...selectedSkills, skillData]);

      // Add to new skills if it's not already in existing skills
      if (
        !existingSkills.some(
          (s) => s.name.toLowerCase() === skillName.toLowerCase()
        )
      ) {
        setNewSkills([...newSkills, skillData]);
      }
    }
  };

  // Remove a skill
  const removeSkill = (skillName: string) => {
    setSelectedSkills(selectedSkills.filter((s) => s.name !== skillName));
    // Also remove from new skills if it exists there
    setNewSkills(newSkills.filter((s) => s.name !== skillName));
  };
  const removeSkill2 = async (skillName: string) => {
    try {
      const entityDataStr = localStorage.getItem("entity_data");
      const entityData = entityDataStr ? JSON.parse(entityDataStr) : {};
      const entityId = entityData.details?.entity_id;
      console.log("Entity ID from parsed data:", entityId);

      // if (!entityId) {
      let response = await deleteSkill2({
        entity_id: entityId,
        name: skillName,
      });
      console.log("delete skill response", response);
      if (response.message.status === "success") {
        toast.success(`Successfully deleted the skill: ${skillName}`);
      }
      // }
    } catch (error) {
      console.log("error delete skill response", error);
    }
  };

  // Continue → call API to save skills and then open modal
  const handleContinue = async () => {
    if (newSkills.length === 0) return;

    try {
      setIsSubmitting(true);

      // Get authentication data
      const authData = getAuthData();
      if (
        !authData ||
        !authData.apiKey ||
        !authData.apiSecret ||
        !authData.entityId
      ) {
        throw new Error("Authentication data not found");
      }

      // Prepare the API payload with only new skills
      const skillsPayload: AddSkillsRequest = {
        entity_id: authData.entityId,
        skill: newSkills.map((skill) => ({
          skill: skill.skill_id || skill.name, // Use skill_id if available, otherwise use name
          skill_name: skill.canonical_name || skill.name, // Use canonical_name if available, otherwise use name
        })),
      };

      console.log("Submitting skills payload:", skillsPayload);

      // Call the API
      const response = await addSkills(
        skillsPayload,
        authData.apiKey,
        authData.apiSecret
      );

      if (response.message.status === "success") {
        toast.success(
          `Successfully added ${newSkills.length} new skill${
            newSkills.length !== 1 ? "s" : ""
          }!`
        );
        // Clear new skills since they've been saved
        setNewSkills([]);
        // Refresh the skills list to show the updated skills from the server
        await fetchUserSkills();
        setShowSuccessModal(true);
      } else {
        throw new Error(
          response.message.data?.message || "Failed to add skills"
        );
      }
    } catch (error: any) {
      console.error("Error adding skills:", error);
      toast.error(error.message || "Failed to add skills. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModalClose = () => setShowSuccessModal(false);

  const handleContinueAfterModal = () => {
    setShowSuccessModal(false);
    if (onSkillsComplete) onSkillsComplete();
  };

  const handleSkip = () => {
    if (onSkip) onSkip();
  };

  // Fetch user's existing skills
  const fetchUserSkills = async () => {
    try {
      setIsLoadingUserSkills(true);

      // Get authentication data
      const authData = getAuthData();
      if (
        !authData ||
        !authData.apiKey ||
        !authData.apiSecret ||
        !authData.entityId
      ) {
        console.log("Authentication data not found, skipping skills fetch");
        return;
      }

      // Call the API to get user's skills
      const response = await getSkillsList(
        authData.entityId,
        authData.apiKey,
        authData.apiSecret
      );
      console.log(response, "user skills list response");
      if (
        response.message?.status === "success" &&
        response.message.data?.skills_list
      ) {
        // Convert API response to SkillData format
        const userSkills: SkillData[] = response.message.data.skills_list
          .map((skill) => ({
            name: skill.skill_name || skill.skill || "",
            canonical_name: skill.skill_name || "",
            skill_id: skill.skill || "",
            skill_UID: skill.name || "",
          }))
          .filter((skill) => skill.name); // Filter out empty skills

        console.log("Fetched user skills:", userSkills);
        setExistingSkills(userSkills);
        setSelectedSkills(userSkills);
      }
    } catch (error: any) {
      console.error("Error fetching user skills:", error);
      // Don't show error toast for this as it's not critical
    } finally {
      setIsLoadingUserSkills(false);
    }
  };

  // Mock AI classification function (for static export compatibility)
  const mockClassifySkill = async (query: string) => {
    // Wait for a realistic delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Common skills with their canonical names and aliases
    const skillDatabase = [
      {
        keywords: ["react", "reactjs", "react.js"],
        canonical: "React.js",
        aliases: ["React", "ReactJS", "React Framework"],
      },
      {
        keywords: ["node", "nodejs", "node.js"],
        canonical: "Node.js",
        aliases: ["NodeJS", "Node Runtime", "Node Framework"],
      },
      {
        keywords: ["js", "javascript"],
        canonical: "JavaScript",
        aliases: ["JS", "ECMAScript", "ES6"],
      },
      {
        keywords: ["ts", "typescript"],
        canonical: "TypeScript",
        aliases: ["TS", "Typed JavaScript"],
      },
      {
        keywords: ["py", "python"],
        canonical: "Python",
        aliases: ["Python Programming", "Python Language"],
      },
      {
        keywords: ["java"],
        canonical: "Java",
        aliases: ["Java Programming", "JDK"],
      },
      {
        keywords: ["c#", "csharp", "dotnet", ".net"],
        canonical: "C#",
        aliases: [".NET", "C Sharp", "Microsoft C#"],
      },
    ];

    const queryLower = query.toLowerCase();

    // Find matching skill
    for (const skill of skillDatabase) {
      if (skill.keywords.some((keyword) => queryLower.includes(keyword))) {
        return {
          success: true,
          result: {
            "entered value": query,
            "recognised canonical Name": skill.canonical,
            aliases: skill.aliases,
          },
        };
      }
    }

    // Default response for unknown skills
    return {
      success: true,
      result: {
        "entered value": query,
        "recognised canonical Name":
          query.charAt(0).toUpperCase() + query.slice(1),
        aliases: [],
      },
    };
  };

  // Handle AI search
  const handleAiSearch2 = async () => {
    if (!searchQuery.trim()) return;

    try {
      setIsAiSearching(true);
      setAiResult([]); // Clear previous results
      setAiResultMsg(""); // Clear previous results

      const result = await createGlobalSkillAPI({
        gr: 1,
        skill: searchQuery.trim(),
      });

      if (result.message.status === "success") {
        setAiResult([
          {
            canonical_name: result.message.data?.canonical_name ?? "",
            name: result.message.data?.skill_id ?? "",
          },
        ]);
        setAiResultMsg("Suggested skills");
        toast.success(`Found skills`);
        console.log([
          {
            canonical_name: result.message.data?.canonical_name ?? "",
            name: result.message.data?.skill_id ?? "",
          },
        ]);
        console.log("✅ Skill created:", result.message.data);
      } else {
        setAiResultMsg(result.message.message);
        console.warn("⚠️ Info:", result.message.message);
        toast.success(`This skill is already in your list`);
      }
    } catch (err) {
      console.error("❌ Error creating skill:", err);
      toast.error("AI search failed. Please try again.");
      setAiResult([]);
      setAiResultMsg("");
    } finally {
      setIsAiSearching(false);
    }
  };

  // Fetch all skills when input is clicked
  const fetchAllSkills = async () => {
    try {
      setIsSearching(true);
      setSearchError(null);
      // setAiResult([]);

      // Get authentication data
      const authData = getAuthData();
      if (!authData || !authData.apiKey || !authData.apiSecret) {
        throw new Error("Authentication data not found");
      }

      // Call the API with empty search to get all skills
      const skills = await getSkills("", authData.apiKey, authData.apiSecret);
      setAllSkills(skills);
      setSearchResults(skills);
    } catch (error: any) {
      console.error("Error fetching skills:", error);
      setSearchError(error.message || "Failed to fetch skills");
      toast.error("Failed to fetch skills. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  // Handle input focus - show dropdown and fetch skills if not already loaded
  const handleInputFocus = () => {
    setShowDropdown(true);
    if (allSkills.length === 0 && !isSearching) {
      fetchAllSkills();
    } else if (searchQuery.trim() === "") {
      setSearchResults(allSkills);
    }
  };

  // Handle input blur - hide dropdown after a delay
  const handleInputBlur = (e: React.FocusEvent) => {
    // Don't close if focus is moving to dropdown
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (relatedTarget && relatedTarget.closest(".skills-dropdown")) {
      return;
    }

    // Delay hiding to allow clicking on dropdown items
    setTimeout(() => {
      setShowDropdown(false);
    }, 200);
  };

  // API-based search functionality
  useEffect(() => {
    const searchSkills = async () => {
      if (searchQuery.trim() === "") {
        // If search is empty and we have all skills, show them
        if (allSkills.length > 0) {
          setSearchResults(allSkills);
        } else {
          setSearchResults([]);
        }
        setSearchError(null);
        return;
      }

      // First try to filter from existing skills
      if (allSkills.length > 0) {
        const searchTerm = searchQuery.trim().toLowerCase();
        const filtered = allSkills.filter(
          (skill) =>
            skill.name.toLowerCase().includes(searchTerm) ||
            (skill.canonical_name &&
              skill.canonical_name.toLowerCase().includes(searchTerm))
        );

        // If we found matches locally, use them
        if (filtered.length > 0) {
          setSearchResults(filtered);
          setSearchError(null);
          return;
        }
      }

      // If no local matches or query is long enough, call API
      try {
        setIsSearching(true);
        setSearchError(null);

        // Get authentication data
        const authData = getAuthData();
        if (!authData || !authData.apiKey || !authData.apiSecret) {
          throw new Error("Authentication data not found");
        }

        // Call the API
        const skills = await getSkills(
          searchQuery.trim(),
          authData.apiKey,
          authData.apiSecret
        );
        setSearchResults(skills);
      } catch (error: any) {
        console.error("Error searching skills:", error);
        setSearchError(error.message || "Failed to search skills");
        toast.error("Failed to search skills. Please try again.");
      } finally {
        setIsSearching(false);
      }
    };

    // Debounce the search to avoid too many API calls
    const timeoutId = setTimeout(searchSkills, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, allSkills]);

  // Handle clicking outside dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (
        !target.closest(".skills-dropdown") &&
        !target.closest('input[placeholder="Search for skills..."]')
      ) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDropdown]);

  // Fetch user's existing skills on component mount
  useEffect(() => {
    fetchUserSkills();
  }, []);

  return (
    <div
      className={`bg-white rounded-xl shadow-sm p-3 space-y-6 w-full font-rubik ${className}`}
    >
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          What are you good at?
        </h1>
        <p className="text-gray-600">
          Help us match you with the right opportunities by selecting your
          skills
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          size={18}
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setShowDropdown(true); // Always show dropdown when typing
          }}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          className="w-1/2 pl-10 pr-12 py-3 bg-gray-50 rounded-xl border-0 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          placeholder="Search for skills..."
        />
        {isSearching && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          </div>
        )}

        {/* Skills Dropdown */}
        {showDropdown && (
          // <div className="skills-dropdown w-1/2 absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-80 overflow-hidden">
          <div className="skills-dropdown w-1/2 absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-100 overflow-auto">
            <div className="max-h-60 overflow-y-auto">
              {searchError ? (
                <div className="p-4 text-center">
                  <p className="text-red-500 text-sm">{searchError}</p>
                  <button
                    onClick={fetchAllSkills}
                    className="mt-2 text-blue-500 underline text-sm"
                  >
                    Try again
                  </button>
                </div>
              ) : isSearching ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                  <span className="ml-2 text-gray-600 text-sm">
                    Loading skills...
                  </span>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="py-2">
                  {searchResults.map((skill) => {
                    const isSelected = selectedSkills.some(
                      (s) => s.name.toLowerCase() === skill.name.toLowerCase()
                    );
                    return (
                      <button
                        key={skill.skill_id || skill.name}
                        onClick={() => {
                          if (isSelected) {
                            removeSkill(skill.name);
                          } else {
                            addSkill(skill);
                          }
                          // Don't close dropdown for multiple selection
                          // setShowDropdown(false);
                        }}
                        className={`w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors flex items-center justify-between ${
                          isSelected
                            ? "bg-blue-50 text-blue-700"
                            : "text-gray-900"
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          {/* <span className="text-sm font-medium block truncate">{skill.name}</span> */}
                          {skill.canonical_name &&
                            skill.canonical_name !== skill.name && (
                              <span className="text-md text-black block truncate">
                                {skill.canonical_name}
                              </span>
                            )}
                        </div>
                        {isSelected ? (
                          <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center ml-2 flex-shrink-0">
                            <X className="text-white" size={10} />
                          </div>
                        ) : (
                          <Plus
                            className="text-gray-400 ml-2 flex-shrink-0"
                            size={14}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 text-center">
                  <p className="text-gray-500 text-sm">
                    {searchQuery.trim()
                      ? "No skills found matching your search"
                      : "No skills available"}
                  </p>
                </div>
              )}
            </div>

            {/* AI Search Bar inside dropdown */}
            <div className="border-t border-gray-200 p-4">
              {/* <div className="py-2">
                len {aiResult.length} {aiResult[0]?.canonical_name}
              </div> */}

              <div className="flex flex-col space-y-2">
                <div className="flex items-center bg-gray-50 rounded-full border border-gray-200 p-2 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all">
                  {/* <input
                    type="text"    
                    value={aiSearchQuery}
                    onChange={(e) => setAiSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAiSearch();
                      }
                    }}
                    className="flex-1 bg-transparent px-4 py-2 text-gray-900 placeholder-gray-500 focus:outline-none text-sm"
                    placeholder="Describe your skills..."
                  /> */}
                  <button
                    onClick={handleAiSearch2}
                    disabled={isAiSearching}
                    className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white font-semibold px-4 py-1.5 rounded-full border border-gray-300 hover:opacity-90 transition-all duration-200 shadow-sm text-sm disabled:opacity-70 flex items-center justify-center min-w-[40px]"
                  >
                    {isAiSearching ? (
                      <div className="animate-spin rounded-full h-auto w-auto border-2 border-t-transparent border-white"></div>
                    ) : (
                      "AI Search"
                    )}
                  </button>
                </div>

                {/* AI Result Display */}
                <div className="max-h-60 overflow-y-auto">
                  {aiResultMsg !== "" && <div>{aiResultMsg}</div>}
                  {aiResult?.length > 0 && (
                    <div className="py-2">
                      {aiResult?.map((skill) => {
                        const isSelected2 = selectedSkills.some(
                          (s) =>
                            s.name.toLowerCase() === skill.name.toLowerCase()
                        );
                        return (
                          <button
                            key={skill.name}
                            onClick={() => {
                              if (isSelected2) {
                                removeSkill(skill.name);
                              } else {
                                addSkill(skill);
                              }
                              // Don't close dropdown for multiple selection
                              // setShowDropdown(false);
                            }}
                            className={`w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors flex items-center justify-between ${
                              isSelected2
                                ? "bg-blue-50 text-blue-700"
                                : "text-gray-900"
                            }`}
                          >
                            <div className="flex-1 min-w-0">
                              {/* <span className="text-sm font-medium block truncate">{skill.name}</span> */}
                              {skill.canonical_name &&
                                skill.canonical_name !== skill.name && (
                                  <span className="text-md text-black block truncate">
                                    {skill.canonical_name}
                                  </span>
                                )}
                            </div>
                            {isSelected2 ? (
                              <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center ml-2 flex-shrink-0">
                                <X className="text-white" size={10} />
                              </div>
                            ) : (
                              <Plus
                                className="text-gray-400 ml-2 flex-shrink-0"
                                size={14}
                              />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Selected Skills */}
      <div className="bg-white p-4 rounded-xl border border-gray-200">
        <h3 className="font-semibold text-gray-900 mb-3">Selected Skills</h3>
        {isLoadingUserSkills ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            <span className="ml-2 text-gray-600 text-sm">
              Loading your skills...
            </span>
          </div>
        ) : selectedSkills.length > 0 ? (
          <div className="grid grid-cols-3 gap-3">
            {selectedSkills.map((skill) => (
              <div
                key={skill.name}
                className="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm border border-gray-100"
              >
                <span className="text-sm font-medium text-blue-800">
                  {skill.canonical_name || skill.name}
                </span>
                <button
                  onClick={() => {
                    removeSkill(skill.name);
                    if (skill.skill_UID) {
                      removeSkill2(skill.skill_UID);
                    }
                  }}
                  className="text-red-500 hover:text-red-700 transition-colors"
                  aria-label={`Remove ${skill.name}`}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">
            {searchQuery
              ? "Search for skills to add them here"
              : "No skills selected yet"}
          </p>
        )}
      </div>

      {/* Pro Tip */}
      <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
        <div className="flex items-start space-x-3">
          <Star className="text-blue-600 mt-0.5" size={16} />
          <div className="text-sm">
            <p className="text-blue-900 font-medium mb-1">Pro Tip</p>
            <p className="text-blue-700">
              Select skills that best represent your expertise. You can always
              add more later.
            </p>
          </div>
        </div>
      </div>

      {/* Continue */}
      <div className="flex space-x-3">
        <button
          onClick={handleContinue}
          disabled={newSkills.length === 0 || isSubmitting}
          className="max-w-[12rem] mx-auto flex-1 bg-blue-500 text-white font-semibold py-3 px-6 rounded-xl hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-t-transparent border-white mr-2"></div>
              Saving...
            </>
          ) : (
            "Continue"
          )}
        </button>
      </div>

      {/* Success Modal */}
      <SkillsSuccessModal
        isOpen={showSuccessModal}
        onClose={handleModalClose}
        skillCount={selectedSkills.length}
      />
    </div>
  );
}
