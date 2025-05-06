'use client';
import { useState, useEffect, useCallback } from "react";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Dispatch, SetStateAction } from 'react';

// Define a Section type
interface Section {
  name: string;
  duration: number;
}

// Sortable item component for sections
interface SortableSectionItemProps {
  id: string;
  section: Section;
  is_editing: boolean;
  on_edit: () => void;
  on_delete: () => void;
  on_move_up: () => void;
  on_move_down: () => void;
  on_save: () => void;
  on_cancel: () => void;
  edit_name: string;
  edit_duration: string;
  set_edit_name: Dispatch<SetStateAction<string>>;
  set_edit_duration: Dispatch<SetStateAction<string>>;
  is_first: boolean;
  is_last: boolean;
}

function SortableSectionItem({ id, section, is_editing, on_edit, on_delete, on_move_up, on_move_down, on_save, on_cancel, edit_name, edit_duration, set_edit_name, set_edit_duration, is_first, is_last }: SortableSectionItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 'auto',
  };
  return (
    <li
      ref={setNodeRef}
      style={style}
      className="card card-bordered shadow-xl mb-2 bg-base-200 text-base-content"
    >
      {is_editing ? (
        <div className="flex flex-col sm:flex-row sm:items-center w-full space-y-2 sm:space-y-0 sm:space-x-2">
          <input
            type="text"
            value={edit_name}
            onChange={(e) => set_edit_name(e.target.value)}
            className="input input-bordered input-sm w-full"
          />
          <input
            type="number"
            value={edit_duration}
            onChange={(e) => set_edit_duration(e.target.value)}
            className="input input-bordered input-sm w-20"
          />
          <button
            onClick={on_save}
            className="btn btn-success btn-xs"
          >
            Save
          </button>
          <button
            onClick={on_cancel}
            className="btn btn-ghost btn-xs"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="flex flex-row items-center w-full justify-between">
          <div className="flex flex-row items-center flex-1">
            {/* Drag handle icon */}
            <button
              type="button"
              className="btn btn-ghost btn-xs cursor-grab active:cursor-grabbing mr-2"
              {...attributes}
              {...listeners}
              tabIndex={0}
              aria-label="Drag to reorder"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 20 20" stroke="currentColor">
                <circle cx="7" cy="7" r="1.5" />
                <circle cx="7" cy="13" r="1.5" />
                <circle cx="13" cy="7" r="1.5" />
                <circle cx="13" cy="13" r="1.5" />
              </svg>
            </button>
            <span className="flex-1">
              {section.name} ({section.duration} min)
            </span>
          </div>
          <div className="flex space-x-1 mt-2 sm:mt-0">
            <button
              onClick={on_edit}
              className="btn btn-warning btn-xs"
            >
              Edit
            </button>
            <button
              onClick={on_delete}
              className="btn btn-error btn-xs"
            >
              Delete
            </button>
            <button
              onClick={on_move_up}
              className="btn btn-info btn-xs"
              disabled={is_first}
            >
              ↑
            </button>
            <button
              onClick={on_move_down}
              className="btn btn-info btn-xs"
              disabled={is_last}
            >
              ↓
            </button>
          </div>
        </div>
      )}
    </li>
  );
}

export default function StreamTimer() {
  const [sections, setSections] = useState<Section[]>([]);
  const [currentSection, setCurrentSection] = useState<number | null>(null);
  const [time, setTime] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [newSectionName, setNewSectionName] = useState<string>("");
  const [newSectionDuration, setNewSectionDuration] = useState<string>("");
  const [edit_section_index, set_edit_section_index] = useState<number | null>(null);
  const [edit_section_name, set_edit_section_name] = useState<string>("");
  const [edit_section_duration, set_edit_section_duration] = useState<string>("");
  const [share_link, set_share_link] = useState<string>("");
  const [copy_success, set_copy_success] = useState<boolean>(false);
  const [show_toast, set_show_toast] = useState<boolean>(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  // Load sections from localStorage on mount
  useEffect(() => {
    const savedSections = localStorage.getItem("streamSections");
    if (savedSections) {
      setSections(JSON.parse(savedSections));
    }
  }, []);

  // Save sections to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("streamSections", JSON.stringify(sections));
  }, [sections]);

  // Timer logic
  useEffect(() => {
    if (!isRunning || currentSection === null) return;

    const timer = setInterval(() => {
      setTime((prevTime) => {
        const section = sections[currentSection];
        if (prevTime + 1 >= section.duration * 60) {
          // Section finished
          if (currentSection < sections.length - 1) {
            setCurrentSection((prevSection) => prevSection !== null ? prevSection + 1 : 0);
            return 0;
          } else {
            setIsRunning(false);
            return section.duration * 60; // Clamp to max
          }
        }
        return prevTime + 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, currentSection, sections]);

  // Add new section
  const addSection = () => {
    if (newSectionName && newSectionDuration) {
      setSections([
        ...sections,
        { name: newSectionName, duration: parseInt(newSectionDuration) },
      ]);
      setNewSectionName("");
      setNewSectionDuration("");
    }
  };

  // Start timer
  const startTimer = useCallback(() => {
    if (sections.length > 0 && currentSection === null) {
      setCurrentSection(0);
      setTime(0);
      setIsRunning(true);
    } else if (currentSection !== null) {
      setIsRunning(true);
    }
  }, [sections, currentSection]);

  // Pause timer
  const pauseTimer = useCallback(() => setIsRunning(false), []);

  // Reset timer
  const resetTimer = useCallback(() => {
    setIsRunning(false);
    setCurrentSection(null);
    setTime(0);
  }, []);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Edit section handlers
  const start_edit_section = (index: number) => {
    set_edit_section_index(index);
    set_edit_section_name(sections[index].name);
    set_edit_section_duration(sections[index].duration.toString());
  };

  const save_edit_section = (index: number) => {
    if (!edit_section_name || !edit_section_duration) return;
    const updated_sections = sections.map((section, i) =>
      i === index
        ? { name: edit_section_name, duration: parseInt(edit_section_duration) }
        : section
    );
    setSections(updated_sections);
    set_edit_section_index(null);
    set_edit_section_name("");
    set_edit_section_duration("");
  };

  const cancel_edit_section = () => {
    set_edit_section_index(null);
    set_edit_section_name("");
    set_edit_section_duration("");
  };

  // Move section up/down
  const move_section = (index: number, direction: 'up' | 'down') => {
    const new_index = direction === 'up' ? index - 1 : index + 1;
    if (new_index < 0 || new_index >= sections.length) return;
    const updated_sections = [...sections];
    const temp = updated_sections[index];
    updated_sections[index] = updated_sections[new_index];
    updated_sections[new_index] = temp;
    setSections(updated_sections);
  };

  // Keyboard shortcuts: S=start, P=pause, R=reset
  useEffect(() => {
    const handle_keydown = (event: KeyboardEvent) => {
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      if (event.key === 's' || event.key === 'S') {
        startTimer();
      } else if (event.key === 'p' || event.key === 'P') {
        pauseTimer();
      } else if (event.key === 'r' || event.key === 'R') {
        resetTimer();
      }
    };
    window.addEventListener('keydown', handle_keydown);
    return () => window.removeEventListener('keydown', handle_keydown);
  }, [startTimer, pauseTimer, resetTimer, isRunning, sections, currentSection, time]);

  // Generate shareable link
  const generate_share_link = async () => {
    try {
      const base_url = typeof window !== 'undefined' ? window.location.origin : '';
      const response = await fetch("/api/create-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sections }),
      });
      const data = await response.json();
      if (data.token) {
        set_share_link(`${base_url}/display?token=${data.token}`);
        set_copy_success(false);
      } else {
        set_share_link("");
      }
    } catch {
      set_share_link("");
    }
  };

  // Copy link to clipboard
  const copy_to_clipboard = async () => {
    if (share_link) {
      try {
        await navigator.clipboard.writeText(share_link);
        set_copy_success(true);
        set_show_toast(true);
        setTimeout(() => set_show_toast(false), 2000);
        setTimeout(() => set_copy_success(false), 1500);
      } catch {
        set_copy_success(false);
      }
    }
  };

  return (
    <div className="card card-bordered max-w-2xl mx-auto bg-base-200 text-base-content rounded-lg shadow-xl">
      <div className="card-body p-6 text-base-content">
        {/* Section Management */}
        <div className="mb-6">
          <h2 className="card-title mb-2 text-base-content">Manage Sections</h2>
          <div className="flex space-x-2 mb-4">
            <input
              type="text"
              placeholder="Section Name"
              value={newSectionName}
              onChange={(e) => setNewSectionName(e.target.value)}
              className="input input-bordered input-sm w-full"
            />
            <input
              type="number"
              placeholder="Duration (min)"
              value={newSectionDuration}
              onChange={(e) => setNewSectionDuration(e.target.value)}
              className="input input-bordered input-sm w-24"
            />
            <button
              onClick={addSection}
              className="btn btn-primary btn-sm"
            >
              Add
            </button>
          </div>
          {/* Shareable Link Feature */}
          {/* Toast for copy feedback */}
          <div className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-50 transition-opacity duration-500 ${show_toast ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <div className="bg-purple-700 text-white px-6 py-3 rounded-lg shadow-lg font-bold text-lg animate-fade-in-out">
              Link Copied!
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 mb-4">
            <button
              onClick={generate_share_link}
              className="btn btn-sm bg-purple-600 hover:bg-purple-700 text-white border-none"
              type="button"
            >
              Generate Share Link
            </button>
            <input
              type="text"
              readOnly
              value={share_link}
              className="input input-sm bg-gray-100 text-gray-700 w-full sm:w-auto flex-1"
              placeholder="Shareable link will appear here"
            />
            <button
              onClick={copy_to_clipboard}
              className="btn btn-sm bg-gray-400 hover:bg-gray-500 text-white border-none"
              type="button"
              disabled={!share_link}
            >
              {copy_success ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={(event) => {
              const { active, over } = event;
              if (active.id !== over?.id) {
                const oldIndex = sections.findIndex((_, i) => i.toString() === active.id);
                const newIndex = sections.findIndex((_, i) => i.toString() === over?.id);
                setSections((sections) => arrayMove(sections, oldIndex, newIndex));
              }
            }}
          >
            <SortableContext
              items={sections.map((_, i) => i.toString())}
              strategy={verticalListSortingStrategy}
            >
              <ul className="space-y-2">
                {sections.map((section, index) => (
                  <SortableSectionItem
                    key={index}
                    id={index.toString()}
                    section={section}
                    is_editing={edit_section_index === index}
                    on_edit={() => start_edit_section(index)}
                    on_delete={() => setSections(sections.filter((_, i) => i !== index))}
                    on_move_up={() => move_section(index, 'up')}
                    on_move_down={() => move_section(index, 'down')}
                    on_save={() => save_edit_section(index)}
                    on_cancel={cancel_edit_section}
                    edit_name={edit_section_name}
                    edit_duration={edit_section_duration}
                    set_edit_name={set_edit_section_name}
                    set_edit_duration={set_edit_section_duration}
                    is_first={index === 0}
                    is_last={index === sections.length - 1}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        </div>

        {/* Timer Display */}
        <div className="mb-6">
          <h2 className="card-title mb-2 text-base-content">Live Timer</h2>
          <div className="text-4xl font-mono mb-4 text-base-content">
            {currentSection !== null
              ? `${sections[currentSection].name}: ${formatTime(
                  time
                )} / ${formatTime(sections[currentSection].duration * 60)}`
              : "No Section Selected"}
          </div>
          <progress
            className="progress progress-primary w-full h-4"
            value={currentSection !== null ? time : 0}
            max={currentSection !== null ? sections[currentSection].duration * 60 : 1}
          />
        </div>

        {/* Controls */}
        <div className="flex flex-col space-y-2">
          <div className="flex space-x-2 mb-2">
            <span className="text-xs text-base-content flex items-center">
              <kbd className="kbd kbd-xs mr-1">S</kbd>
              Start
            </span>
            <span className="text-xs text-base-content flex items-center">
              <kbd className="kbd kbd-xs mr-1">P</kbd>
              Pause
            </span>
            <span className="text-xs text-base-content flex items-center">
              <kbd className="kbd kbd-xs mr-1">R</kbd>
              Reset
            </span>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={startTimer}
              className="btn btn-success btn-sm"
              disabled={isRunning || sections.length === 0}
            >
              Start
            </button>
            <button
              onClick={pauseTimer}
              className="btn btn-warning btn-sm"
              disabled={!isRunning}
            >
              Pause
            </button>
            <button
              onClick={resetTimer}
              className="btn btn-error btn-sm"
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
