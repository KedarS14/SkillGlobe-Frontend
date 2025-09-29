"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar,
  BookOpen,
  Award,
  Upload,
  GraduationCap,
  School,
  Plus,
  Pencil,
  Trash2,
  GripVertical,
} from "lucide-react";
// Import directly to avoid type conflicts
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
// Import education store
import { useEducationStore } from "@/store/portfolio/addeducationStore";

// Using wrapper components from dnd-wrapper.tsx

interface EducationEntry {
  id: string;
  educationLevel: string;
  yearOfCompletion: string;
  stream: string;
  score: string;
  university: string;
  certificateFile: File | null;
  certificateFileName?: string;
  name?: string; // Added name property for update functionality
}

interface EducationFormProps {
  onSave?: (data: EducationEntry[]) => void;
  onCancel?: () => void;
  initialData?: EducationEntry[];
}

export default function EducationForm({
  onSave,
  onCancel,
  initialData = [],
}: EducationFormProps) {
  // Initialize state from initialData first, then localStorage as fallback
  const [educationEntries, setEducationEntries] = useState<EducationEntry[]>(
    () => {
      console.log("EducationForm initializing with initialData:", initialData);

      // If we have initialData from API, use it
      if (initialData && initialData.length > 0) {
        console.log("Using initialData from API:", initialData);
        return initialData.map((entry) => ({
          ...entry,
          certificateFile: null, // Files can't be stored in localStorage
        }));
      }

      // Check if we're in a browser environment (not during SSR)
      if (typeof window !== "undefined") {
        try {
          // Try to get saved entries from localStorage
          const savedEntries = localStorage.getItem("educationEntries");
          if (savedEntries) {
            const parsedEntries = JSON.parse(savedEntries);
            // Make sure we have valid data
            if (Array.isArray(parsedEntries) && parsedEntries.length > 0) {
              console.log("Using localStorage data:", parsedEntries);
              // Convert File objects which were serialized to null back to null
              return parsedEntries.map((entry) => ({
                ...entry,
                certificateFile: null, // Files can't be stored in localStorage
              }));
            }
          }
        } catch (error) {
          console.error(
            "Error loading education entries from localStorage:",
            error
          );
        }
      }

      // Fallback to create a new empty entry
      console.log("No data found, creating empty entry");
      return [
        {
          id: crypto.randomUUID(),
          educationLevel: "",
          yearOfCompletion: "",
          stream: "",
          score: "",
          university: "",
          certificateFile: null,
        },
      ];
    }
  );

  const [activeEntryId, setActiveEntryId] = useState<string>("");
  const [editMode, setEditMode] = useState<boolean>(true);
  const [validationErrors, setValidationErrors] = useState<{
    [key: string]: string;
  }>({});
  const [isUpdateMode, setIsUpdateMode] = useState<boolean>(false);
  const [currentEntryName, setCurrentEntryName] = useState<string>("");

  // Save to localStorage whenever educationEntries changes
  useEffect(() => {
    if (typeof window !== "undefined" && educationEntries.length > 0) {
      try {
        // Create a version that's safe to serialize to JSON
        const serializableEntries = educationEntries.map((entry) => {
          // Create a new object without the certificateFile
          const { certificateFile, ...serializableEntry } = entry;
          return serializableEntry;
        });

        localStorage.setItem(
          "educationEntries",
          JSON.stringify(serializableEntries)
        );
      } catch (error) {
        console.error("Error saving education entries to localStorage:", error);
      }
    }
  }, [educationEntries]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
    entryId: string
  ) => {
    const { name, value } = e.target;
    setEducationEntries((prev) =>
      prev.map((entry) =>
        entry.id === entryId ? { ...entry, [name]: value } : entry
      )
    );

    // Clear validation error for this field when user types
    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleCertificateUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    entryId: string
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      setEducationEntries((prev) =>
        prev.map((entry) =>
          entry.id === entryId
            ? {
                ...entry,
                certificateFile: file,
                certificateFileName: file.name,
              }
            : entry
        )
      );
    }
  };

  const addNewEducation = () => {
    const newEntry: EducationEntry = {
      id: crypto.randomUUID(),
      educationLevel: "",
      yearOfCompletion: "",
      stream: "",
      score: "",
      university: "",
      certificateFile: null,
    };

    // setEducationEntries(prev => [newEntry, ...prev]);
    setActiveEntryId(newEntry.id);
    setEducationEntries((prev) => {
      const updated = [newEntry, ...prev];
      return updated;
    });

    setEditMode(true);
  };

  useEffect(() => {
    if (activeEntryId) {
      console.log("Updated activeEntryId:", activeEntryId);
      const entry = educationEntries.find((e) => e.id === activeEntryId);
      if (entry) {
        console.log("Matching entry from educationEntries:", entry);
      } else {
        console.log("No matching entry found yet (state not updated?)");
      }
    }
  }, [activeEntryId, educationEntries]);

  const removeEducation = (entryId: string) => {
    setEducationEntries((prev) => prev.filter((entry) => entry.id !== entryId));

    // If we removed the active entry, set the first remaining entry as active
    if (activeEntryId === entryId) {
      const remainingEntries = educationEntries.filter(
        (entry) => entry.id !== entryId
      );
      if (remainingEntries.length > 0) {
        setActiveEntryId(remainingEntries[0].id);
      } else {
        // If no entries left, add a new empty one
        addNewEducation();
      }
    }
  };

  const editEducation = (entryId: string) => {
    setActiveEntryId(entryId);
    setEditMode(true);
    setValidationErrors({});

    // Check if this is an existing entry from the API
    const entry = educationEntries.find((e) => e.id === entryId);

    // Force update mode to true for all entries from the education list
    // This is a temporary fix until we can properly identify API entries
    if (entry) {
      console.log("Setting update mode to TRUE for entry:", entry);
      setIsUpdateMode(true);
      // Use university as the name if name is not available
      const entryName = entry.name || entry.university;
      setCurrentEntryName(entryName);
    } else {
      console.log("Setting update mode to FALSE");
      setIsUpdateMode(false);
      setCurrentEntryName("");
    }
  };

  const validateActiveEntry = () => {
    const activeEntry = educationEntries.find(
      (entry) => entry.id === activeEntryId
    );
    if (!activeEntry) return false;

    const errors: { [key: string]: string } = {};

    // Check required fields
    if (!activeEntry.educationLevel) {
      errors.educationLevel = "Education level is required";
    }

    if (!activeEntry.yearOfCompletion) {
      errors.yearOfCompletion = "Year of completion is required";
    } else if (!validateYear(activeEntry.yearOfCompletion)) {
      errors.yearOfCompletion = "Year must be 4 digits (e.g., 2020)";
    }

    // Set validation errors
    setValidationErrors(errors);

    // Return true if no errors
    return Object.keys(errors).length === 0;
  };

  // Get education store functions
  const {
    uploadEducation,
    isUploading,
    uploadSuccess,
    uploadError,
    resetUploadState,
    fetchEducationList,
    isFetchingList,
    fetchListError,
    updateEducationAPI,
    isUpdating,
    updateSuccess,
    updateError,
    resetUpdateState,
  } = useEducationStore();

  // Update educationEntries when initialData changes
  useEffect(() => {
    console.log("EducationForm: initialData changed:", initialData);
    if (
      initialData &&
      initialData.length > 0 &&
      educationEntries.length === 0
    ) {
      console.log("Updating educationEntries with new initialData");
      setEducationEntries(
        initialData.map((entry) => ({
          ...entry,
          certificateFile: null,
        }))
      );
      // Set first entry as active if no active entry
      if (!activeEntryId && initialData.length > 0) {
        setActiveEntryId(initialData[0].id);
        setEditMode(false); // Show list view when we have data
      }
    }
  }, [initialData, activeEntryId]);

  useEffect(() => {
    // Reset upload state when component mounts
    resetUploadState();
    resetUpdateState();

    // Set active entry if we have entries but no active entry
    if (educationEntries.length > 0 && !activeEntryId) {
      setActiveEntryId(educationEntries[0].id);
      // If we have data from API, show list view, otherwise show edit mode
      if (initialData && initialData.length > 0) {
        setEditMode(false);
      }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [educationEntries]);

  const handleSubmit = async (e: React.FormEvent) => {
    // Prevent default form submission
    e.preventDefault();
    e.stopPropagation();

    // Reset any previous states
    resetUploadState();
    resetUpdateState();

    // Validate active entry
    if (!validateActiveEntry()) {
      console.error("Validation failed");
      return;
    }

    try {
      // Get active entry
      const activeEntry = educationEntries.find(
        (entry) => entry.id === activeEntryId
      );
      if (!activeEntry) {
        console.error("No active entry found");
        return;
      }

      let response;

      // Check if we're in update mode
      console.log(
        "Before API call - isUpdateMode:",
        isUpdateMode,
        "currentEntryName:",
        currentEntryName
      );

      if (isUpdateMode && currentEntryName) {
        // Update existing education entry
        console.log(
          "Calling updateEducationAPI with:",
          activeEntry,
          currentEntryName
        );
        response = await updateEducationAPI(activeEntry, currentEntryName);
        console.log("Education updated successfully:", response);
      } else {
        // Upload new education data
        console.log("Calling uploadEducation with:", activeEntry);
        response = await uploadEducation(activeEntry);
        console.log("Education added successfully:", response);
      }

      if (response) {
        // Call onSave if provided
        if (onSave) {
          onSave(educationEntries);
        }

        // Set edit mode to false to show the saved entry
        setEditMode(false);

        // Optionally clear localStorage after successful save
        // localStorage.removeItem('educationEntries');
      }
    } catch (error) {
      console.error(
        `Error ${isUpdateMode ? "updating" : "adding"} education:`,
        error
      );
      // Error handling is done by the store
    }

    // Return false to prevent form submission
    return false;
  };

  // Validate year is 4 digits
  const validateYear = (year: string) => {
    return /^\d{4}$/.test(year);
  };

  // Validate score is a number or percentage
  const validateScore = (score: string) => {
    return score === "" || /^(\d+(\.\d+)?|\d+%)$/.test(score);
  };

  // Handle drag end event for reordering education entries
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    if (active.id !== over.id) {
      setEducationEntries((items) => {
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

  // Sortable education item component
  const SortableEducationItem = ({
    entry,
    onEdit,
    onRemove,
  }: {
    entry: EducationEntry;
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
              {entry.educationLevel || "Untitled Education"}
            </h4>
            {(() => {
              const trimmedScore = entry.score
                ? Number(entry.score).toString()
                : "";
              return (
                <p className="text-sm text-gray-600">
                  {entry.university ? `${entry.university}, ` : ""}
                  {entry.yearOfCompletion ? `${entry.yearOfCompletion}` : ""}
                  {entry.stream ? ` - ${entry.stream}` : ""}
                  {trimmedScore ? ` (${trimmedScore})` : ""}
                </p>
              );
            })()}
          </div>
          <div className="flex space-x-3 ml-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => onEdit(entry.id)}
              className="text-blue-600 hover:text-blue-800 underline mr-5"
              aria-label="Edit education entry"
            >
              Edit
              {/* <Pencil size={18} /> */}
            </button>
            {/* <button
              type="button"
              onClick={() => onRemove(entry.id)}
              className="text-red-600 hover:text-red-800"
              aria-label="Remove education entry"
            >
              <Trash2 size={18} />
            </button> */}
          </div>
        </div>
      </div>
    );
  };

  // Debug log for update mode
  useEffect(() => {
    console.log(
      "Current update mode:",
      isUpdateMode,
      "Current entry name:",
      currentEntryName
    );
  }, [isUpdateMode, currentEntryName]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-gray-900">Education Information</h3>
          <button
            type="button"
            onClick={addNewEducation}
            className="flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            <Plus size={16} className="mr-1" /> Add Education
          </button>
        </div>

        {/* Education entries list */}
        {!editMode && (
          <div>
            {isFetchingList && (
              <div className="flex justify-center items-center py-8">
                <svg
                  className="animate-spin h-8 w-8 text-blue-500"
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
                <span className="ml-2 text-gray-600">
                  Loading education list...
                </span>
              </div>
            )}

            {/* {fetchListError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                <p>Error loading education list: {fetchListError}</p>
                <button 
                  onClick={() => fetchEducationList()}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Try Again
                </button>
              </div>
            )} */}

            {!isFetchingList &&
              !fetchListError &&
              educationEntries.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">
                    No education entries found
                  </p>
                  <button
                    type="button"
                    onClick={addNewEducation}
                    className="px-4 py-2 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Add Education
                  </button>
                </div>
              )}

            {!isFetchingList && educationEntries.length > 0 && (
              <div className="mb-6">
                {/* @ts-ignore - Ignoring type error with DndContext */}
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  {/* @ts-ignore - Ignoring type error with SortableContext */}
                  <SortableContext
                    items={educationEntries.map((entry) => entry.id)}
                    strategy={verticalStrategy}
                  >
                    {educationEntries.map((entry) => (
                      <SortableEducationItem
                        key={entry.id}
                        entry={entry}
                        onEdit={editEducation}
                        onRemove={removeEducation}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              </div>
            )}
          </div>
        )}

        {/* Education form */}
        {editMode && activeEntryId && (
          <div>
            {!isFetchingList && educationEntries.length > 0 && (
              <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-200">
                <h4 className="font-medium text-gray-900">
                  {educationEntries.find((e) => e.id === activeEntryId)
                    ?.educationLevel || "New Education"}
                </h4>
                <button
                  type="button"
                  onClick={async () => {
                    // Check if this is a new entry with no data filled
                    const currentEntry = educationEntries.find(
                      (e) => e.id === activeEntryId
                    );
                    const isEmptyEntry =
                      currentEntry &&
                      !currentEntry.educationLevel &&
                      !currentEntry.yearOfCompletion &&
                      !currentEntry.stream &&
                      !currentEntry.score &&
                      !currentEntry.university;

                    // If it's an empty entry, remove it from the list
                    if (isEmptyEntry) {
                      setEducationEntries((prev) =>
                        prev.filter((entry) => entry.id !== activeEntryId)
                      );
                    }

                    // Try to fetch the latest education list from API
                    try {
                      await fetchEducationList();
                    } catch (error) {
                      console.error("Failed to fetch education list:", error);
                      // If API fails, continue using the current list
                    }

                    // Return to list view
                    setEditMode(false);
                  }}
                  className="text-sm text-gray-600 hover:text-gray-800"
                  disabled={isUploading}
                >
                  Back to List
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {educationEntries.map(
                (entry) =>
                  entry.id === activeEntryId && (
                    <React.Fragment key={entry.id}>
                      {/* Education Level */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Education Level{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <GraduationCap
                            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                            size={16}
                          />
                          <select
                            name="educationLevel"
                            value={entry.educationLevel}
                            onChange={(e) => handleInputChange(e, entry.id)}
                            required
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                          >
                            <option value="">Select education level</option>
                            <option value="SSC">SSC</option>
                            <option value="HSC">HSC</option>
                            <option value="Diploma">Diploma</option>
                            <option value="Graduation">Graduation</option>
                            <option value="Post Graduation">
                              Post Graduation
                            </option>
                          </select>
                        </div>
                        {validationErrors.educationLevel ? (
                          <p className="text-xs text-red-500 mt-1">
                            {validationErrors.educationLevel}
                          </p>
                        ) : (
                          <p className="text-xs text-gray-500 mt-1">
                            Latest qualification at top
                          </p>
                        )}
                      </div>

                      {/* Year of Completion */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Year of Completion{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Calendar
                            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                            size={16}
                          />
                          <input
                            type="text"
                            name="yearOfCompletion"
                            value={entry.yearOfCompletion}
                            onChange={(e) => handleInputChange(e, entry.id)}
                            required
                            maxLength={4}
                            pattern="\d{4}"
                            className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                              entry.yearOfCompletion &&
                              !validateYear(entry.yearOfCompletion)
                                ? "border-red-500"
                                : "border-gray-300"
                            }`}
                            placeholder="YYYY"
                          />
                        </div>
                        {validationErrors.yearOfCompletion ? (
                          <p className="text-xs text-red-500 mt-1">
                            {validationErrors.yearOfCompletion}
                          </p>
                        ) : entry.yearOfCompletion &&
                          !validateYear(entry.yearOfCompletion) ? (
                          <p className="text-xs text-red-500 mt-1">
                            Must be 4 digits (e.g., 2020)
                          </p>
                        ) : (
                          <p className="text-xs text-gray-500 mt-1">
                            Must be 4 digits (e.g., 2020)
                          </p>
                        )}
                      </div>

                      {/* Stream */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Stream
                        </label>
                        <div className="relative">
                          <BookOpen
                            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                            size={16}
                          />
                          <input
                            type="text"
                            name="stream"
                            value={entry.stream}
                            onChange={(e) => handleInputChange(e, entry.id)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="E.g., Science, Commerce, IT"
                          />
                        </div>
                      </div>

                      {/* Score */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Score
                        </label>
                        <input
                          type="text"
                          name="score"
                          value={entry.score}
                          onChange={(e) => handleInputChange(e, entry.id)}
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            entry.score && !validateScore(entry.score)
                              ? "border-red-500"
                              : "border-gray-300"
                          }`}
                          placeholder="E.g., 85% or 3.8 CGPA"
                        />
                        {entry.score && !validateScore(entry.score) && (
                          <p className="text-xs text-red-500 mt-1">
                            Enter a valid score (number or percentage)
                          </p>
                        )}
                        {validateScore(entry.score) && (
                          <p className="text-xs text-gray-500 mt-1">
                            %, CGPA or other scoring system
                          </p>
                        )}
                      </div>

                      {/* University/Board */}
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          University/Board
                        </label>
                        <div className="relative">
                          <School
                            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                            size={16}
                          />
                          <input
                            type="text"
                            name="university"
                            value={entry.university}
                            onChange={(e) => handleInputChange(e, entry.id)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Name of University or Board"
                          />
                        </div>
                      </div>

                      {/* Certificate Upload */}
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Certificate Upload
                        </label>

                        {!entry.certificateFileName ? (
                          <label className="block">
                            <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-blue-500 transition-colors cursor-pointer">
                              <Upload
                                className="mx-auto text-gray-400 mb-2"
                                size={20}
                              />
                              <p className="text-sm font-medium text-gray-900">
                                Upload Certificate
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                PDF, JPG, PNG (max 5MB)
                              </p>
                            </div>
                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={(e) =>
                                handleCertificateUpload(e, entry.id)
                              }
                              className="hidden"
                            />
                          </label>
                        ) : (
                          <div className="bg-blue-50 p-3 rounded-lg flex items-center justify-between">
                            <div className="flex items-center">
                              <Award className="text-blue-500 mr-2" size={18} />
                              <div>
                                <p className="text-sm font-medium text-blue-900">
                                  {entry.certificateFileName}
                                </p>
                                <p className="text-xs text-blue-700">
                                  Certificate uploaded successfully
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setEducationEntries((prev) =>
                                  prev.map((e) =>
                                    e.id === entry.id
                                      ? {
                                          ...e,
                                          certificateFile: null,
                                          certificateFileName: undefined,
                                        }
                                      : e
                                  )
                                );
                              }}
                              className="text-sm text-red-600 hover:text-red-800"
                            >
                              Remove
                            </button>
                          </div>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          Upload marksheet, degree certificate, etc.
                        </p>
                      </div>
                    </React.Fragment>
                  )
              )}
            </div>
          </div>
        )}
      </div>

      {/* Upload Status Messages */}
      {(uploadError || updateError) && (
        <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-md">
          Error: {uploadError || updateError}
        </div>
      )}
      {(uploadSuccess || updateSuccess) && (
        <div className="p-3 mb-4 text-sm text-green-700 bg-green-100 rounded-md">
          Education details {updateSuccess ? "updated" : "added"} successfully!
        </div>
      )}
      {(isUploading || isUpdating) && (
        <div className="p-3 mb-4 text-sm text-blue-700 bg-blue-100 rounded-md">
          {isUpdating ? "Updating" : "Uploading"} education details...
        </div>
      )}

      <div className="flex justify-end space-x-3">
        {editMode && (
          <>
            {/* Update button - only shown in update mode */}
            {isUpdateMode && (
              <button
                type="button"
                onClick={() => {
                  if (validateActiveEntry()) {
                    // Reset any previous states
                    resetUploadState();
                    resetUpdateState();

                    try {
                      // Update existing education entry
                      const activeEntry = educationEntries.find(
                        (entry) => entry.id === activeEntryId
                      );
                      if (!activeEntry) {
                        console.error("No active entry found");
                        return;
                      }

                      // For update API, the 'id' in our frontend object corresponds to 'name' in the API
                      // We need to use the entry's id as the name parameter for the update API
                      if (!activeEntry.id) {
                        console.error(
                          "Cannot update: entry does not have an id"
                        );
                        return;
                      }

                      console.log(
                        "Update button clicked with id (used as name for API):",
                        activeEntry.id
                      );

                      updateEducationAPI(activeEntry, activeEntry.id)
                        .then((result) => {
                          if (result) {
                            console.log(
                              "Education updated successfully:",
                              result
                            );
                            // Only navigate back to list view on success
                            setEditMode(false);
                          }
                        })
                        .catch((error) => {
                          console.error("Error updating education:", error);
                        });
                    } catch (error) {
                      console.error("Error updating education:", error);
                      // Stay in edit mode when there's an error
                    }
                  } else {
                    // If validation fails, stay on the form
                    console.error("Validation failed");
                  }
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                disabled={isUpdating}
              >
                {isUpdating ? "Updating..." : "Update"}
              </button>
            )}

            {/* Add button - only shown in add mode */}
            {!isUpdateMode && (
              <button
                type="button"
                onClick={() => {
                  if (validateActiveEntry()) {
                    // Reset any previous states
                    resetUploadState();
                    resetUpdateState();

                    try {
                      // Add new education entry
                      console.log("Add button clicked");
                      const activeEntry = educationEntries.find(
                        (entry) => entry.id === activeEntryId
                      );
                      if (!activeEntry) {
                        console.error("No active entry found");
                        return;
                      }

                      uploadEducation(activeEntry)
                        .then((result) => {
                          if (result) {
                            console.log(
                              "Education added successfully:",
                              result
                            );
                            // Only navigate back to list view on success
                            setEditMode(false);
                          }
                        })
                        .catch((error) => {
                          console.error("Error adding education:", error);
                        });
                    } catch (error) {
                      console.error("Error adding education:", error);
                      // Stay in edit mode when there's an error
                    }
                  } else {
                    // If validation fails, stay on the form
                    console.error("Validation failed");
                  }
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                disabled={isUploading}
              >
                {isUploading ? "Adding..." : "Add"}
              </button>
            )}
          </>
        )}
        {/* Only show the main submit button when in edit mode, not in list view */}
        {/* {editMode && !isUpdateMode && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleSubmit(e as React.FormEvent);
            }}
            className={`px-6 py-2 text-white font-medium rounded-lg transition-colors ${
              isUploading
                ? "bg-blue-400 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600"
            }`}
            disabled={isUploading}
          >
            {isUploading
              ? "Saving..."
              : isUpdating
              ? "Updating..."
              : educationEntries.length === 0
              ? "Skip Education"
              : "Save Education"}
     
          </button>
        )} */}
      </div>
    </form>
  );
}
