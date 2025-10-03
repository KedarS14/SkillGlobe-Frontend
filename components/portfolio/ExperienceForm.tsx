"use client";

import React, { useState, useEffect } from "react";
import { useExperienceStore } from "@/store/portfolio/addexperienceStore";
import {
  Calendar,
  Briefcase,
  Building,
  Globe,
  Clock,
  FileText,
  Plus,
  Pencil,
  Trash2,
  GripVertical,
} from "lucide-react";
import {
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  DndContext,
  SortableContext,
  closestCenter,
  verticalStrategy,
} from "../ui/dnd-wrapper";
import {
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface ExperienceEntry {
  id: string;
  employmentStatus: string;
  space: string;
  role: string;
  organization: string;
  website: string;
  relevantExperience: string;
  professionalSummary: string;
  name?: string; // Added for API update functionality
}

interface ExperienceFormProps {
  onSave?: (data: ExperienceEntry[]) => void;
  onCancel?: () => void;
  initialData?: ExperienceEntry[];
}

export default function ExperienceForm({
  onSave,
  onCancel,
  initialData = [],
}: ExperienceFormProps) {
  // Get store functions and state
  const {
    fetchExperienceList: fetchExperienceListFromStore,
    experienceEntries: storeEntries,
    isFetchingList: isListLoading,
  } = useExperienceStore();
  const [experienceEntries, setExperienceEntries] = useState<ExperienceEntry[]>(
    initialData.length > 0
      ? initialData
      : [
          {
            id: crypto.randomUUID(),
            employmentStatus: "",
            space: "",
            role: "",
            organization: "",
            website: "",
            relevantExperience: "",
            professionalSummary: "",
          },
        ]
  );

  const [activeEntryId, setActiveEntryId] = useState<string>("");
  const [editMode, setEditMode] = useState(true);
  const [validationErrors, setValidationErrors] = useState<{
    [key: string]: string;
  }>({});
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const [currentEntryName, setCurrentEntryName] = useState("");

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
    entryId: string
  ) => {
    const { name, value } = e.target;
    setExperienceEntries((prev) =>
      prev.map((entry) =>
        entry.id === entryId ? { ...entry, [name]: value } : entry
      )
    );

    // Clear validation error for this field when user types
    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  // Create an empty experience entry without adding it to the list
  const createEmptyEntry = () => {
    const newId = `exp-${Date.now()}`;
    return {
      id: newId,
      employmentStatus: "",
      space: "",
      role: "",
      organization: "",
      website: "",
      relevantExperience: "",
      professionalSummary: "",
    };
  };

  const addNewExperience = () => {
    const newEntry = createEmptyEntry();
    setExperienceEntries((prev) => [...prev, newEntry]);
    setActiveEntryId(newEntry.id);
    setEditMode(true);
    setIsUpdateMode(false);
    setCurrentEntryName("");
  };

  const removeExperience = (entryId: string) => {
    setExperienceEntries((prev) =>
      prev.filter((entry) => entry.id !== entryId)
    );

    // If we removed the active entry, set the first remaining entry as active
    if (activeEntryId === entryId) {
      const remainingEntries = experienceEntries.filter(
        (entry) => entry.id !== entryId
      );
      if (remainingEntries.length > 0) {
        setActiveEntryId(remainingEntries[0].id);
      } else {
        // If no entries left, add a new empty one
        addNewExperience();
      }
    }
  };

  const editExperience = (entryId: string) => {
    setActiveEntryId(entryId);
    setEditMode(true);
    setValidationErrors({});

    // Check if this is an existing entry from the API
    const entry = experienceEntries.find((e) => e.id === entryId);

    if (entry && entry.name) {
      console.log("Setting update mode to TRUE for entry:", entry);
      setIsUpdateMode(true);
      setCurrentEntryName(entry.name);
    } else {
      console.log("Setting update mode to FALSE");
      setIsUpdateMode(false);
      setCurrentEntryName("");
    }
  };

  const validateActiveEntry = () => {
    const activeEntry = experienceEntries.find(
      (entry) => entry.id === activeEntryId
    );
    if (!activeEntry) return false;

    const errors: { [key: string]: string } = {};

    // Mandatory fields
    // if (!activeEntry.space) {
    //   errors.space = "Industry is required";
    // }
    if (!activeEntry.role) {
      errors.role = "Role / Designation is required";
    }
    if (!activeEntry.organization) {
      errors.organization = "Work organization is required";
    }
    if (!activeEntry.relevantExperience) {
      errors.relevantExperience = "Relevant experience is required";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const {
    uploadExperience,
    isUploading,
    uploadSuccess,
    uploadError,
    resetUploadState,
    fetchExperienceList,
    isFetchingList,
    fetchListError,
    updateExperienceAPI,
    isUpdating,
    updateSuccess,
    updateError,
    resetUpdateState,
  } = useExperienceStore();

  useEffect(() => {
    // Reset upload and update states when component mounts
    resetUploadState();
    resetUpdateState();

    // Fetch experience list from API
    fetchExperienceListFromStore()
      .then((fetchedEntries) => {
        console.log("Fetched experience entries:", fetchedEntries);
        if (fetchedEntries && fetchedEntries.length > 0) {
          // Map store entries to component format, adding missing fields
          const mappedEntries = fetchedEntries.map((entry) => ({
            id: entry.id,
            employmentStatus: entry.employmentStatus || "",
            space: entry.space || "",
            role: entry.role || "",
            organization: entry.organization || "",
            relevantExperience: entry.relevantExperience || "",
            website: "", // Add missing fields required by component
            professionalSummary: "", // Add missing fields required by component
            name: entry.id, // Store the original name/id for update API
          }));
          setExperienceEntries(mappedEntries);

          // Create a new empty entry with a temporary ID that we can identify and remove later
          // const newEntry = createEmptyEntry();
          // setExperienceEntries(prev => [...prev, newEntry]);
          setActiveEntryId(mappedEntries[0].id);
          setEditMode(false);
        } else {
          // If no entries, add a new empty one and show the form
          const newEntry = createEmptyEntry();
          setExperienceEntries([newEntry]);
          setActiveEntryId(newEntry.id);
          setEditMode(true);
        }
      })
      .catch((error) => {
        console.error("Error fetching experience list:", error);
        const newEntry = createEmptyEntry();
        setExperienceEntries([newEntry]);
        setActiveEntryId(newEntry.id);
        setEditMode(true);
        // try {
        //   const savedEntries = localStorage.getItem("experienceEntries");
        //   if (savedEntries) {
        //     const parsedEntries = JSON.parse(savedEntries);
        //     setExperienceEntries(parsedEntries);
        //     if (parsedEntries.length > 0 && !activeEntryId) {
        //       setActiveEntryId(parsedEntries[0].id);
        //     }
        //   }
        // } catch (e) {
        //   console.error(
        //     "Error loading experience entries from localStorage:",
        //     e
        //   );
        // }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    // Prevent default form submission
    e.preventDefault();
    e.stopPropagation();

    // If there are no entries, just call onSave
    if (experienceEntries.length === 0) {
      if (onSave) {
        onSave(experienceEntries);
      }
      return;
    }

    // Reset any previous states
    resetUploadState();
    resetUpdateState();

    // If we're in edit mode, validate the active entry
    if (editMode) {
      // Validate active entry
      if (!validateActiveEntry()) {
        console.error("Validation failed");
        return;
      }

      const activeEntry = experienceEntries.find(
        (entry) => entry.id === activeEntryId
      );
      if (activeEntry) {
        try {
          let response;

          // Check if we're in update mode
          console.log(
            "Before API call - isUpdateMode:",
            isUpdateMode,
            "currentEntryName:",
            currentEntryName
          );

          if (isUpdateMode && currentEntryName) {
            // Update existing experience entry
            console.log(
              "Calling updateExperienceAPI with:",
              activeEntry,
              currentEntryName
            );
            response = await updateExperienceAPI(activeEntry, currentEntryName);
            console.log("Experience updated successfully:", response);
          } else {
            // Upload new experience data
            console.log("Calling uploadExperience with:", activeEntry);
            response = await uploadExperience(activeEntry);
            console.log("Experience added successfully:", response);
          }

          if (response) {
            // Call onSave if provided
            if (onSave) {
              onSave(experienceEntries);
            }

            // Set edit mode to false to show the saved entry
            setEditMode(false);

            // Refresh the list
            await fetchExperienceList();
          }
        } catch (error) {
          console.error(
            `Error ${isUpdateMode ? "updating" : "adding"} experience:`,
            error
          );
        }
      }
      return;
    }

    // If we're in list view, just call onSave
    if (onSave) {
      onSave(experienceEntries);
    }
  };

  // Validate website URL
  const validateWebsite = (url: string) => {
    return url === "" || /^https?:\/\/.*/.test(url);
  };

  // Validate experience (numeric with optional decimal)
  const validateExperience = (exp: string) => {
    return exp === "" || /^\d+(\.\d+)?$/.test(exp);
  };

  // Handle drag end event for reordering experience entries
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    if (active.id !== over.id) {
      setExperienceEntries((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  // Set up sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Sortable experience item component
  const SortableExperienceItem = ({
    entry,
    onEdit,
    onRemove,
  }: {
    entry: ExperienceEntry;
    onEdit: (id: string) => void;
    onRemove: (id: string) => void;
  }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: entry.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      marginBottom: "12px",
      zIndex: isDragging ? 10 : 0,
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`p-3 border border-gray-200 rounded-lg ${
          isDragging ? "bg-blue-50 shadow-lg" : "bg-gray-50"
        }`}
        {...attributes}
      >
        <div className="flex items-center w-full">
          <div
            {...listeners}
            className="mr-3 cursor-grab text-gray-400 hover:text-gray-600 flex-shrink-0"
            aria-label="Drag to reorder"
          >
            <GripVertical size={20} />
          </div>
          <div className="flex-grow">
            <h4 className="font-medium text-gray-900">
              {entry.role || "Untitled Position"}
            </h4>
            <p className="text-sm text-gray-600">
              {entry.organization ? `${entry.organization}` : ""}
              {entry.space ? ` - ${entry.space}` : ""}
              {entry.relevantExperience
                ? ` - ${entry.relevantExperience} years`
                : ""}
            </p>
          </div>
          <div className="flex space-x-3 ml-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => onEdit(entry.id)}
              className="text-blue-600 hover:text-blue-800 underline mr-5"
              aria-label="Edit experience entry"
            >
              Edit
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-gray-900">
            Experience Information
          </h3>
          <div className="flex flex-col items-end space-y-2">
            <button
              type="button"
              onClick={addNewExperience}
              className="flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              <Plus size={16} className="mr-1" /> Add Experience
            </button>
            {editMode && (
              <button
                type="button"
                onClick={() => {
                  // Find and remove any empty entries before going back to list
                  const updatedEntries = experienceEntries.filter(
                    (entry) =>
                      (entry.role && entry.role.trim() !== "") ||
                      (entry.organization &&
                        entry.organization.trim() !== "") ||
                      (entry.relevantExperience &&
                        entry.relevantExperience.trim() !== "") ||
                      (entry.space && entry.space.trim() !== "")
                  );
                  setExperienceEntries(updatedEntries);

                  // Return to list view
                  setEditMode(false);
                }}
                className="text-sm text-gray-600 hover:text-gray-800"
                disabled={isUploading || isUpdating}
              >
                Back to List
              </button>
            )}
          </div>
        </div>

        {/* Experience entries list */}
        {!editMode && experienceEntries.length > 0 && (
          <div className="mb-6">
            {/* @ts-ignore - Ignoring type error with DndContext */}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              {/* @ts-ignore - Ignoring type error with SortableContext */}
              <SortableContext
                items={experienceEntries.map((entry) => entry.id)}
                strategy={verticalStrategy}
              >
                {experienceEntries.map((entry) => (
                  <SortableExperienceItem
                    key={entry.id}
                    entry={entry}
                    onEdit={editExperience}
                    onRemove={removeExperience}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>
        )}

        {/* Experience form */}
        {editMode && activeEntryId && (
          <div>
            {experienceEntries.length > 0 && (
              <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-200">
                <h4 className="font-medium text-gray-900">
                  {experienceEntries.find((e) => e.id === activeEntryId)
                    ?.role || "New Experience"}
                </h4>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {experienceEntries
                .filter((entry) => entry.id === activeEntryId)
                .map((entry) => (
                  <React.Fragment key={entry.id}>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Relevant Experience{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Calendar
                          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                          size={16}
                        />
                        <input
                          type="number"
                          min={0}
                          name="relevantExperience"
                          value={entry.relevantExperience}
                          onChange={(e) => handleInputChange(e, entry.id)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Relevant experience"
                        />
                      </div>
                      {validationErrors.relevantExperience && (
                        <p className="text-sm text-red-600 mt-1">
                          {validationErrors.relevantExperience}
                        </p>
                      )}
                    </div>

                    {/* Space/Industry */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Domain
                        {/* <span className="text-red-500">*</span> */}
                      </label>
                      <div className="relative">
                        <Building
                          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                          size={16}
                        />
                        <select
                          name="space"
                          value={entry.space}
                          onChange={(e) => handleInputChange(e, entry.id)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                        >
                          <option value="">Select industry</option>
                          <option value="IT">IT</option>
                          <option value="Testing">Testing</option>
                          <option value="Education & Training">
                            Education & Training
                          </option>
                          <option value="Finance">Finance</option>
                        </select>
                      </div>
                      {validationErrors.space && (
                        <p className="text-sm text-red-600 mt-1">
                          {validationErrors.space}
                        </p>
                      )}
                    </div>

                    {/* Role/Designation */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Role / Designation{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="role"
                        value={entry.role}
                        onChange={(e) => handleInputChange(e, entry.id)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Your job title or designation"
                      />
                      {validationErrors.role && (
                        <p className="text-sm text-red-600 mt-1">
                          {validationErrors.role}
                        </p>
                      )}
                    </div>

                    {/* Work Organization */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Work Organization{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="organization"
                        value={entry.organization}
                        onChange={(e) => handleInputChange(e, entry.id)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Last company / organization name"
                      />
                      {validationErrors.organization && (
                        <p className="text-sm text-red-600 mt-1">
                          {validationErrors.organization}
                        </p>
                      )}
                    </div>
                  </React.Fragment>
                ))}
            </div>
          </div>
        )}
      </div>

      {uploadError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          <p>Error: {uploadError}</p>
        </div>
      )}

      {uploadSuccess && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg">
          <p>Work experience details saved successfully!</p>
        </div>
      )}

      <div className="flex justify-end space-x-3">
        {editMode && (
          <>
            {!isUpdateMode && (
              <button
                type="submit"
                disabled={isUploading}
                className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors flex items-center"
              >
                {isUploading ? "Adding..." : "Save Experience"}
              </button>
            )}
            {isUpdateMode && (
              <>
                <button
                  type="button"
                  disabled={isUpdating}
                  className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors flex items-center"
                  onClick={async () => {
                    // Validate active entry
                    if (!validateActiveEntry()) {
                      console.error("Validation failed");
                      return;
                    }

                    const activeEntry = experienceEntries.find(
                      (entry) => entry.id === activeEntryId
                    );
                    if (activeEntry && currentEntryName) {
                      try {
                        // Update existing experience entry
                        const response = await updateExperienceAPI(
                          activeEntry,
                          currentEntryName
                        );
                        console.log(
                          "Experience updated successfully:",
                          response
                        );

                        // Return to list view
                        setEditMode(false);

                        // Refresh the list
                        await fetchExperienceList();
                      } catch (error) {
                        console.error("Error updating experience:", error);
                      }
                    }
                  }}
                >
                  {isUpdating ? "Updating..." : "Update"}
                </button>
                <button
                  type="button"
                  className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors flex items-center"
                  onClick={() => {
                    // Create a new experience entry
                    addNewExperience();
                    // Reset update mode
                    setIsUpdateMode(false);
                    setCurrentEntryName("");
                  }}
                >
                  Save
                </button>
              </>
            )}
          </>
        )}
        {!editMode && (
          <button
            type="submit"
            disabled={isUploading || isUpdating}
            className={`px-6 py-2 ${
              isUploading || isUpdating
                ? "bg-blue-300"
                : "bg-blue-500 hover:bg-blue-600"
            } text-white font-medium rounded-lg transition-colors flex items-center`}
          >
            {(isUploading || isUpdating) && (
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            )}
            Save Experience
          </button>
        )}
      </div>
    </form>
  );
}
